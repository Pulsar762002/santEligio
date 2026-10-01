import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { isValidObjectId, Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { GrestIscritto, GrestIscrittoDocument } from './schemas/grest-iscritto.schema';
import {
  GrestImpostazioni, GrestImpostazioniDocument, IMPOSTAZIONI_GREST,
} from './schemas/grest-impostazioni.schema';
import { ImpostazioniDto } from './dto/impostazioni.dto';
import { RegistrazioneDto } from './dto/registrazione.dto';
import { IscrizioneDto } from './dto/iscrizione.dto';
import { AutorizzazioneDto } from './dto/autorizzazione.dto';
import { DelegaDto } from './dto/delega.dto';
import { AttivazioneDto, CambioPasswordDto } from './dto/credenziali.dto';
import { GrestMailService } from './grest-mail.service';
import { ModuloGrest } from './grest.constants';

/** Campi mai restituiti al client. */
const PRIVATI = '-password -activationToken -usernameLower';

/** "mario rossi" → "MarioRossi" (stesso algoritmo del vecchio portale). */
export function generaUsername(nome: string, cognome: string): string {
  const camel = (s: string) =>
    s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, '');
  return camel(nome.trim()) + camel(cognome.trim());
}

export function emailDestinatari(i: Pick<GrestIscritto, 'emailPadre' | 'emailMadre'>): string[] {
  return [...new Set([i.emailPadre, i.emailMadre].filter((e) => e && e.includes('@')))];
}

@Injectable()
export class GrestService {
  constructor(
    @InjectModel(GrestIscritto.name) private readonly model: Model<GrestIscrittoDocument>,
    @InjectModel(GrestImpostazioni.name)
    private readonly impostazioniModel: Model<GrestImpostazioniDocument>,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly mail: GrestMailService,
  ) {}

  private get maxIscritti(): number {
    return Number(this.config.get('GREST_MAX_ISCRITTI', 196));
  }

  /** Apertura iscrizioni: scelta dell'admin se presente, altrimenti GREST_ISCRIZIONI_APERTE. */
  private async iscrizioniAperte(): Promise<{ aperte: boolean; fonte: 'admin' | 'env' }> {
    const doc = await this.impostazioniModel.findOne({ chiave: IMPOSTAZIONI_GREST }).lean();
    if (doc) return { aperte: doc.iscrizioniAperte, fonte: 'admin' };
    return { aperte: this.config.get<string>('GREST_ISCRIZIONI_APERTE', 'true') !== 'false', fonte: 'env' };
  }

  private nuovoToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async trova(id: string): Promise<GrestIscrittoDocument> {
    const doc = isValidObjectId(id) ? await this.model.findById(id) : null;
    if (!doc) throw new NotFoundException('Iscritto non trovato');
    return doc;
  }

  // ── Pubblico ──────────────────────────────────────────────

  async stato() {
    const iscritti = await this.model.countDocuments();
    const { aperte } = await this.iscrizioniAperte();
    return {
      anno: this.config.get<string>('GREST_ANNO', '2026'),
      iscrizioniAperte: aperte && iscritti < this.maxIscritti,
      postiEsauriti: iscritti >= this.maxIscritti,
    };
  }

  async registra(dto: RegistrazioneDto) {
    if (!(await this.iscrizioniAperte()).aperte) {
      throw new ForbiddenException('Le iscrizioni al Grest sono chiuse.');
    }
    if ((await this.model.countDocuments()) >= this.maxIscritti) {
      throw new ForbiddenException('Limite massimo di iscritti raggiunto.');
    }
    const padreOk = dto.nomePadre && dto.cognomePadre && dto.emailPadre && dto.mobilePhonePadre;
    const madreOk = dto.nomeMadre && dto.cognomeMadre && dto.emailMadre && dto.mobilePhoneMadre;
    if (!padreOk && !madreOk) {
      throw new BadRequestException(
        'Inserisci nome, cognome, email e cellulare di almeno uno dei due genitori.',
      );
    }

    const username = generaUsername(dto.nomeFiglio, dto.cognomeFiglio);
    if (!username) throw new BadRequestException('Nome e cognome del figlio non validi.');
    const token = this.nuovoToken();
    let iscritto: GrestIscrittoDocument;
    try {
      iscritto = await this.model.create({
        ...dto,
        username,
        usernameLower: username.toLowerCase(),
        attivo: false,
        activationToken: token,
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException(
          `Risulta già un iscritto ${dto.nomeFiglio} ${dto.cognomeFiglio}. ` +
            'Se avete già un account accedete, altrimenti contattate la parrocchia.',
        );
      }
      throw err;
    }

    const emailInviata = await this.mail.inviaLink(emailDestinatari(iscritto), iscritto, token, 'attivazione');
    return { username, emailInviata };
  }

  async infoAttivazione(token: string) {
    const i = token ? await this.model.findOne({ activationToken: token }) : null;
    if (!i) throw new NotFoundException('Link non valido o già utilizzato.');
    return { username: i.username, nomeFiglio: i.nomeFiglio, attivo: i.attivo };
  }

  /** Attivazione o reimpostazione password dal link email (il token vale una volta). */
  async attiva(dto: AttivazioneDto) {
    const i = await this.model.findOne({ activationToken: dto.token });
    if (!i) throw new BadRequestException('Link non valido o già utilizzato.');
    i.password = await bcrypt.hash(dto.password, 10);
    i.attivo = true;
    i.activationToken = undefined;
    await i.save();
    return { username: i.username };
  }

  async login(username: string, password: string) {
    const i = await this.model.findOne({ usernameLower: username.trim().toLowerCase() });
    const ok = !!i && i.attivo && !!i.password && (await bcrypt.compare(password, i.password));
    if (!ok) throw new UnauthorizedException('Nome utente o password non corretti.');
    const access_token = this.jwt.sign({ sub: i.id, username: i.username, tipo: 'grest' });
    return { access_token, username: i.username };
  }

  // ── Area famiglia ─────────────────────────────────────────

  async me(id: string) {
    const i = isValidObjectId(id) ? await this.model.findById(id).select(PRIVATI).lean() : null;
    if (!i) throw new NotFoundException('Iscritto non trovato');
    return i;
  }

  async aggiornaIscrizione(id: string, dto: IscrizioneDto) {
    const i = await this.trova(id);
    i.set({ ...dto });
    await i.save();
    return this.me(id);
  }

  async aggiornaAutorizzazione(id: string, dto: AutorizzazioneDto) {
    const i = await this.trova(id);
    i.autorizzazione = { ...dto, dichiarazione8: false, autorizzazione5: false };
    await i.save();
    return this.me(id);
  }

  async aggiornaDelega(id: string, dto: DelegaDto) {
    const i = await this.trova(id);
    i.delega = {
      delegati: dto.delegati.map(({ nome, cognome, tipoDocumento, numeroDocumento }) => ({
        nome: nome.trim(), cognome: cognome.trim(), tipoDocumento, numeroDocumento: numeroDocumento.trim(),
      })),
      consenso: dto.consenso,
    };
    await i.save();
    return this.me(id);
  }

  async cambiaPassword(id: string, dto: CambioPasswordDto) {
    const i = await this.trova(id);
    if (!i.password || !(await bcrypt.compare(dto.attuale, i.password))) {
      throw new BadRequestException('La password attuale non è corretta.');
    }
    i.password = await bcrypt.hash(dto.nuova, 10);
    await i.save();
    return { ok: true };
  }

  /** Iscritto completo per generare un PDF, dopo aver verificato che il modulo sia compilato. */
  async perModulo(id: string, modulo: ModuloGrest): Promise<GrestIscritto> {
    const i = (await this.trova(id)).toObject();
    const pronto =
      modulo === 'iscrizione' ? i.consenso
      : modulo === 'autorizzazione' ? !!i.autorizzazione
      : (i.delega?.delegati?.length ?? 0) > 0;
    if (!pronto) {
      throw new ConflictException(`Compila e salva il modulo di ${modulo} prima di scaricarlo.`);
    }
    return i;
  }

  // ── Amministrazione (admin del portale) ───────────────────

  async impostazioni() {
    const { aperte, fonte } = await this.iscrizioniAperte();
    return {
      iscrizioniAperte: aperte,
      fonte,
      iscritti: await this.model.countDocuments(),
      maxIscritti: this.maxIscritti,
    };
  }

  async aggiornaImpostazioni(dto: ImpostazioniDto) {
    await this.impostazioniModel.updateOne(
      { chiave: IMPOSTAZIONI_GREST },
      { $set: { iscrizioniAperte: dto.iscrizioniAperte } },
      { upsert: true },
    );
    return this.impostazioni();
  }

  elenco() {
    return this.model.find().select(PRIVATI).sort({ cognomeFiglio: 1, nomeFiglio: 1 }).lean();
  }

  async dettaglio(id: string) {
    return this.me(id);
  }

  async elimina(id: string) {
    const i = await this.trova(id);
    await i.deleteOne();
    return { ok: true };
  }

  /** Nuovo link via email per attivare l'account o scegliere una nuova password. */
  async inviaLinkPassword(id: string) {
    const i = await this.trova(id);
    const destinatari = emailDestinatari(i);
    if (destinatari.length === 0) throw new BadRequestException("L'iscritto non ha email registrate.");
    const token = this.nuovoToken();
    i.activationToken = token;
    await i.save();
    const inviata = await this.mail.inviaLink(destinatari, i, token, i.attivo ? 'reimpostazione' : 'attivazione');
    return { inviata, destinatari, link: this.mail.linkAttivazione(token) };
  }
}
