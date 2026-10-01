import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, isValidObjectId, Model } from 'mongoose';
import { Area, AREE, trovaArea } from './aree.registry';
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

  private puoApprovare(u: UtenteAutenticato, area: string): boolean {
    return u.ruolo === 'admin' || (u.ruolo === 'responsabile' && u.aree.includes(area));
  }

  private nuovaProposta(u: UtenteAutenticato, p: Partial<Proposta>) {
    return this.proposte.create({ ...p, autoreId: u.userId, autoreNome: u.nome || u.email, stato: 'in_attesa' });
  }

  // ── Elenco aree ──────────────────────────────────────────

  async mie(u: UtenteAutenticato) {
    const aree = u.ruolo === 'admin' ? AREE : AREE.filter((a) => u.aree.includes(a.chiave));
    const chiavi = aree.map((a) => a.chiave);
    const [pagine, gruppi, pendenti] = await Promise.all([
      this.pagine.find({ slug: { $in: chiavi } }).select('slug titolo pubblicato').lean(),
      this.gruppi.find({ slug: { $in: chiavi } }).select('slug nome pubblicato area').lean(),
      this.proposte.aggregate<{ _id: string; n: number }>([
        { $match: { area: { $in: chiavi }, stato: 'in_attesa' } },
        { $group: { _id: '$area', n: { $sum: 1 } } },
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
        tipo: 'contenuto', azione: 'modifica', area: chiave, titolo: d.titolo, dati: { ...d },
      });
      return { inAttesa: true, proposta };
    }
    return { inAttesa: false, risultato: await this.applicaContenuto(chiave, d) };
  }

  // ── Eventi dell'area ─────────────────────────────────────

  async eventiArea(chiave: string, u: UtenteAutenticato) {
    this.areaDiContenuti(chiave, u);
    return this.eventi.find({ area: chiave }).sort({ dataInizio: -1 }).lean();
  }

  private async eventoDellArea(chiave: string, id: string) {
    const e = isValidObjectId(id) ? await this.eventi.findById(id) : null;
    if (!e || e.area !== chiave) throw new NotFoundException('Evento non trovato in questa area');
    return e;
  }

  async creaEvento(chiave: string, dto: CreateEventoDto, u: UtenteAutenticato): Promise<Esito<unknown>> {
    this.areaDiContenuti(chiave, u);
    const dati = { ...dto, area: chiave };
    if (u.ruolo === 'contributor') {
      const proposta = await this.nuovaProposta(u, { tipo: 'evento', azione: 'crea', area: chiave, titolo: dto.titolo, dati });
      return { inAttesa: true, proposta };
    }
    return { inAttesa: false, risultato: await this.eventi.create(dati) };
  }

  async modificaEvento(chiave: string, id: string, dto: UpdateEventoDto, u: UtenteAutenticato): Promise<Esito<unknown>> {
    this.areaDiContenuti(chiave, u);
    const e = await this.eventoDellArea(chiave, id);
    const dati = { ...dto, area: chiave };
    if (u.ruolo === 'contributor') {
      const proposta = await this.nuovaProposta(u, {
        tipo: 'evento', azione: 'modifica', area: chiave, eventoId: e.id, titolo: dto.titolo ?? e.titolo, dati,
      });
      return { inAttesa: true, proposta };
    }
    e.set(dati);
    return { inAttesa: false, risultato: await e.save() };
  }

  async eliminaEvento(chiave: string, id: string, u: UtenteAutenticato) {
    this.areaDiContenuti(chiave, u);
    if (u.ruolo === 'contributor') throw new ForbiddenException('I contributor non possono eliminare eventi.');
    const e = await this.eventoDellArea(chiave, id);
    await e.deleteOne();
    return { ok: true };
  }

  // ── Proposte e approvazioni ──────────────────────────────

  /** Admin: tutte; Responsabile: delle sue aree; Contributor: le proprie. */
  proposteVisibili(u: UtenteAutenticato, stato?: StatoProposta) {
    const filtro: FilterQuery<PropostaDocument> = {};
    if (u.ruolo === 'responsabile') filtro.area = { $in: u.aree };
    else if (u.ruolo === 'contributor') filtro.autoreId = u.userId;
    if (stato) filtro.stato = stato;
    return this.proposte.find(filtro).sort({ createdAt: -1 }).limit(200).lean();
  }

  private async propostaDaDecidere(id: string, u: UtenteAutenticato) {
    const p = isValidObjectId(id) ? await this.proposte.findById(id) : null;
    if (!p) throw new NotFoundException('Proposta non trovata');
    if (!this.puoApprovare(u, p.area)) throw new ForbiddenException('Non sei responsabile di questa area.');
    if (p.stato !== 'in_attesa') throw new ConflictException('La proposta è già stata decisa.');
    return p;
  }

  async approva(id: string, u: UtenteAutenticato) {
    const p = await this.propostaDaDecidere(id, u);
    if (p.tipo === 'contenuto') {
      await this.applicaContenuto(p.area, p.dati as unknown as ContenutoAreaDto);
    } else if (p.azione === 'crea') {
      await this.eventi.create({ ...p.dati, area: p.area });
    } else {
      const e = await this.eventoDellArea(p.area, p.eventoId ?? '');
      e.set({ ...p.dati, area: p.area });
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
