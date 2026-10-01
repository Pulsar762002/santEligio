import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, isValidObjectId, Model } from 'mongoose';
import { Area, AREE, CHIAVI_AREE, trovaArea } from './aree.registry';
import { Proposta, PropostaDocument, StatoProposta } from './schemas/proposta.schema';
import { ContenutoAreaDto } from './dto/contenuto-area.dto';
import { Pagina, PaginaDocument, SezionePagina } from '../pagine/schemas/pagina.schema';
import { Gruppo, GruppoDocument } from '../gruppi/schemas/gruppo.schema';
import { Evento, EventoDocument } from '../eventi/schemas/evento.schema';
import { CreateEventoDto } from '../eventi/dto/create-evento.dto';
import { UpdateEventoDto } from '../eventi/dto/update-evento.dto';
import { UtenteAutenticato, haArea } from '../auth/ruoli';

/** Esito di un salvataggio: applicato subito o in attesa di approvazione. */
export type Esito<T> = { inAttesa: false; risultato: T } | { inAttesa: true; proposta: PropostaDocument };

/** Aree a cui si possono associare eventi (tutte tranne il Grest, che ha il suo portale). */
const AREE_EVENTI = CHIAVI_AREE.filter((k) => trovaArea(k)?.tipo !== 'grest');

const unici = (l: string[]) => [...new Set(l)];

@Injectable()
export class AreeService {
  constructor(
    @InjectModel(Proposta.name) private readonly proposte: Model<PropostaDocument>,
    @InjectModel(Pagina.name) private readonly pagine: Model<PaginaDocument>,
    @InjectModel(Gruppo.name) private readonly gruppi: Model<GruppoDocument>,
    @InjectModel(Evento.name) private readonly eventi: Model<EventoDocument>,
  ) {}

  /** Area esistente, assegnata all'utente e con contenuti (il Grest ha un pannello suo). */
  private areaDiContenuti(chiave: string, u: UtenteAutenticato): Area {
    const area = trovaArea(chiave);
    if (!area) throw new NotFoundException('Area inesistente');
    if (!haArea(u, chiave)) throw new ForbiddenException('Area non assegnata al tuo account.');
    if (area.tipo === 'grest') throw new BadRequestException('Il Grest si gestisce da Admin → Grest.');
    return area;
  }

  /** Approva: admin, o responsabile di almeno una delle aree interessate. */
  private puoApprovare(u: UtenteAutenticato, aree: string[]): boolean {
    return u.ruolo === 'admin' || (u.ruolo === 'responsabile' && aree.some((a) => u.aree.includes(a)));
  }

  private nuovaProposta(u: UtenteAutenticato, p: Partial<Proposta>) {
    return this.proposte.create({ ...p, autoreId: u.userId, autoreNome: u.nome || u.email, stato: 'in_attesa' });
  }

  // ── Elenco aree ──────────────────────────────────────────

  async mie(u: UtenteAutenticato) {
    const aree = u.ruolo === 'admin' ? AREE : AREE.filter((a) => u.aree.includes(a.chiave));
    const chiavi = aree.map((a) => a.chiave);
    const [pagine, gruppi, pendenti, eventi] = await Promise.all([
      this.pagine.find({ slug: { $in: chiavi } }).select('slug titolo pubblicato').lean(),
      this.gruppi.find({ slug: { $in: chiavi } }).select('slug nome pubblicato area').lean(),
      this.proposte.aggregate<{ _id: string; n: number }>([
        { $match: { aree: { $in: chiavi }, stato: 'in_attesa' } },
        { $unwind: '$aree' },
        { $match: { aree: { $in: chiavi } } },
        { $group: { _id: '$aree', n: { $sum: 1 } } },
      ]),
      this.eventi.aggregate<{ _id: string; n: number }>([
        { $match: { aree: { $in: chiavi } } },
        { $unwind: '$aree' },
        { $group: { _id: '$aree', n: { $sum: 1 } } },
      ]),
    ]);
    return aree.map((a) => {
      const p = pagine.find((x) => x.slug === a.chiave);
      const g = gruppi.find((x) => x.slug === a.chiave);
      return {
        ...a,
        esiste: a.tipo === 'grest' || !!(p || g),
        pubblicato: p?.pubblicato ?? g?.pubblicato ?? false,
        link: a.tipo === 'gruppo' && g ? `/gruppi/${g.area}/${a.chiave}` : a.tipo === 'grest' ? '/p/grest' : `/p/${a.chiave}`,
        propostePendenti: pendenti.find((x) => x._id === a.chiave)?.n ?? 0,
        eventi: eventi.find((x) => x._id === a.chiave)?.n ?? 0,
      };
    });
  }

  // ── Contenuto (pagina o gruppo dell'area) ────────────────

  async contenuto(chiave: string, u: UtenteAutenticato) {
    const area = this.areaDiContenuti(chiave, u);
    if (area.tipo === 'gruppo') {
      const g = await this.gruppi.findOne({ slug: chiave }).lean();
      if (!g) throw new NotFoundException('Gruppo non trovato');
      return { esiste: true, titolo: g.nome, sottotitolo: g.descrizione ?? '', contenuto: g.contenuto ?? '', immagine: g.immagine ?? '' };
    }
    const p = await this.pagine.findOne({ slug: chiave }).lean();
    return p
      ? { esiste: true, titolo: p.titolo, sottotitolo: p.sottotitolo ?? '', contenuto: p.contenuto, immagine: p.immagine ?? '' }
      : { esiste: false, titolo: area.nome, sottotitolo: '', contenuto: '', immagine: '' };
  }

  private async applicaContenuto(chiave: string, d: ContenutoAreaDto) {
    const area = trovaArea(chiave)!;
    if (area.tipo === 'gruppo') {
      const g = await this.gruppi.findOneAndUpdate(
        { slug: chiave },
        { $set: { nome: d.titolo, descrizione: d.sottotitolo ?? '', contenuto: d.contenuto, immagine: d.immagine ?? '' } },
        { new: true },
      );
      if (!g) throw new NotFoundException('Gruppo non trovato');
      return g;
    }
    // Pagina: se il menu la prevede ma non esiste ancora, la crea (sezione organismi, pubblicata).
    return this.pagine.findOneAndUpdate(
      { slug: chiave },
      {
        $set: { titolo: d.titolo, sottotitolo: d.sottotitolo ?? '', contenuto: d.contenuto, immagine: d.immagine ?? '' },
        $setOnInsert: { slug: chiave, sezione: SezionePagina.ORGANISMI, ordine: 0, pubblicato: true },
      },
      { new: true, upsert: true },
    );
  }

  async salvaContenuto(chiave: string, d: ContenutoAreaDto, u: UtenteAutenticato): Promise<Esito<unknown>> {
    this.areaDiContenuti(chiave, u);
    if (u.ruolo === 'contributor') {
      const proposta = await this.nuovaProposta(u, {
        tipo: 'contenuto', azione: 'modifica', aree: [chiave], titolo: d.titolo, dati: { ...d },
      });
      return { inAttesa: true, proposta };
    }
    return { inAttesa: false, risultato: await this.applicaContenuto(chiave, d) };
  }

  // ── Eventi (una o più aree per evento) ───────────────────
  // Admin: tutti gli eventi, qualsiasi area. Responsabili/contributor: gli eventi con
  // almeno una delle loro aree; possono aggiungere o togliere solo le proprie aree.

  async eventiGestibili(u: UtenteAutenticato, area?: string) {
    const filtro: FilterQuery<EventoDocument> = {};
    if (u.ruolo !== 'admin') filtro.aree = { $in: u.aree };
    if (area) {
      if (u.ruolo !== 'admin' && !u.aree.includes(area)) throw new ForbiddenException('Area non assegnata al tuo account.');
      filtro.aree = area;
    }
    return this.eventi.find(filtro).sort({ dataInizio: -1 }).lean();
  }

  /** Aree richieste da un non-admin: solo le sue, ammesse per gli eventi. */
  private areeMie(u: UtenteAutenticato, richieste: string[] = []): string[] {
    const non = richieste.filter((a) => !u.aree.includes(a) || !AREE_EVENTI.includes(a));
    if (non.length) throw new ForbiddenException(`Aree non assegnate al tuo account: ${non.join(', ')}`);
    return unici(richieste);
  }

  private async eventoGestibile(id: string, u: UtenteAutenticato) {
    const e = isValidObjectId(id) ? await this.eventi.findById(id) : null;
    if (!e || (u.ruolo !== 'admin' && !(e.aree ?? []).some((a) => u.aree.includes(a)))) {
      throw new NotFoundException('Evento non trovato tra quelli delle tue aree');
    }
    return e;
  }

  async creaEvento(dto: CreateEventoDto, u: UtenteAutenticato): Promise<Esito<unknown>> {
    let aree = unici(dto.aree ?? []);
    if (u.ruolo !== 'admin') {
      aree = this.areeMie(u, aree);
      if (!aree.length) throw new BadRequestException("Scegli almeno una delle tue aree per l'evento.");
    } else if (aree.some((a) => !AREE_EVENTI.includes(a))) {
      throw new BadRequestException('Area non valida per gli eventi.');
    }
    const dati = { ...dto, aree };
    if (u.ruolo === 'contributor') {
      const proposta = await this.nuovaProposta(u, { tipo: 'evento', azione: 'crea', aree, titolo: dto.titolo, dati });
      return { inAttesa: true, proposta };
    }
    return { inAttesa: false, risultato: await this.eventi.create(dati) };
  }

  async modificaEvento(id: string, dto: UpdateEventoDto, u: UtenteAutenticato): Promise<Esito<unknown>> {
    const e = await this.eventoGestibile(id, u);
    const attuali = e.aree ?? [];
    let aree = attuali;
    if (dto.aree !== undefined) {
      if (u.ruolo === 'admin') {
        aree = unici(dto.aree);
      } else {
        // le aree degli altri restano; le proprie si aggiungono/tolgono liberamente
        const mie = this.areeMie(u, dto.aree);
        aree = unici([...attuali.filter((a) => !u.aree.includes(a)), ...mie]);
        if (!aree.length) throw new BadRequestException("L'evento deve restare associato ad almeno un'area.");
      }
    }
    const dati = { ...dto, aree };
    if (u.ruolo === 'contributor') {
      const coinvolte = unici([...attuali, ...aree].filter((a) => u.aree.includes(a)));
      const proposta = await this.nuovaProposta(u, {
        tipo: 'evento', azione: 'modifica', aree: coinvolte, eventoId: e.id, titolo: dto.titolo ?? e.titolo, dati,
      });
      return { inAttesa: true, proposta };
    }
    e.set(dati);
    return { inAttesa: false, risultato: await e.save() };
  }

  /** Admin sempre; responsabile solo se l'evento appartiene esclusivamente alle sue aree. */
  async eliminaEvento(id: string, u: UtenteAutenticato) {
    if (u.ruolo === 'contributor') throw new ForbiddenException('I contributor non possono eliminare eventi.');
    const e = await this.eventoGestibile(id, u);
    if (u.ruolo !== 'admin' && !(e.aree ?? []).every((a) => u.aree.includes(a))) {
      throw new ForbiddenException("L'evento è condiviso con aree non tue: chiedi all'amministratore.");
    }
    await e.deleteOne();
    return { ok: true };
  }

  // ── Proposte e approvazioni ──────────────────────────────

  /** Admin: tutte; Responsabile: delle sue aree; Contributor: le proprie. */
  proposteVisibili(u: UtenteAutenticato, stato?: StatoProposta) {
    const filtro: FilterQuery<PropostaDocument> = {};
    if (u.ruolo === 'responsabile') filtro.aree = { $in: u.aree };
    else if (u.ruolo === 'contributor') filtro.autoreId = u.userId;
    if (stato) filtro.stato = stato;
    return this.proposte.find(filtro).sort({ createdAt: -1 }).limit(200).lean();
  }

  private async propostaDaDecidere(id: string, u: UtenteAutenticato) {
    const p = isValidObjectId(id) ? await this.proposte.findById(id) : null;
    if (!p) throw new NotFoundException('Proposta non trovata');
    if (!this.puoApprovare(u, p.aree)) throw new ForbiddenException('Non sei responsabile di questa area.');
    if (p.stato !== 'in_attesa') throw new ConflictException('La proposta è già stata decisa.');
    return p;
  }

  async approva(id: string, u: UtenteAutenticato) {
    const p = await this.propostaDaDecidere(id, u);
    if (p.tipo === 'contenuto') {
      await this.applicaContenuto(p.aree[0], p.dati as unknown as ContenutoAreaDto);
    } else if (p.azione === 'crea') {
      await this.eventi.create({ ...p.dati });
    } else {
      const e = isValidObjectId(p.eventoId ?? '') ? await this.eventi.findById(p.eventoId) : null;
      if (!e) throw new NotFoundException("L'evento della proposta non esiste più.");
      e.set({ ...p.dati });
      await e.save();
    }
    p.stato = 'approvata';
    p.decisoDa = u.nome || u.email;
    p.decisoIl = new Date();
    return p.save();
  }

  async rifiuta(id: string, nota: string | undefined, u: UtenteAutenticato) {
    const p = await this.propostaDaDecidere(id, u);
    p.stato = 'rifiutata';
    p.nota = nota?.trim() ?? '';
    p.decisoDa = u.nome || u.email;
    p.decisoIl = new Date();
    return p.save();
  }
}
