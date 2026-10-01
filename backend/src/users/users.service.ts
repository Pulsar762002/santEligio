import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { isValidObjectId, Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument } from './schemas/user.schema';
import { Ruolo } from '../auth/ruoli';
import { CreaUtenteDto, ModificaUtenteDto } from './dto/utente.dto';
import { AREE } from '../aree/aree.registry';

const PUBBLICO = '-password';

type UtenteLean = { nome?: string; aree?: string[]; attivo?: boolean } & Record<string, unknown>;

/** Gli account creati prima dei ruoli non hanno nome/aree/attivo: valori di default. */
function normalizza<T extends UtenteLean>(u: T) {
  return { ...u, nome: u.nome ?? '', aree: u.aree ?? [], attivo: u.attivo !== false };
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly config: ConfigService,
  ) {}

  /**
   * Account principale (ADMIN_EMAIL, lo stesso creato da `npm run seed`): nessuno
   * può eliminarlo, disattivarlo o cambiargli ruolo. Nome e password restano modificabili.
   */
  private protetto(email: string): boolean {
    const principale = this.config.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    return !!principale && (email ?? '').toLowerCase() === principale;
  }

  findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  findById(id: string): Promise<UserDocument | null> {
    return isValidObjectId(id) ? this.userModel.findById(id) : Promise.resolve(null);
  }

  /** Usato dal seed: crea l'utente con il ruolo indicato (default admin). */
  async create(email: string, password: string, ruolo: Ruolo = 'admin'): Promise<UserDocument> {
    const hash = await bcrypt.hash(password, 10);
    return this.userModel.create({ email, password: hash, ruolo });
  }

  validatePassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  // ── Gestione utenti (solo admin) ──

  async elenco() {
    const utenti = await this.userModel.find().select(PUBBLICO).sort({ ruolo: 1, nome: 1, email: 1 }).lean();
    return utenti.map((u) => ({ ...normalizza(u as UtenteLean), protetto: this.protetto(u.email) }));
  }

  private async pubblico(id: string) {
    const u = await this.userModel.findById(id).select(PUBBLICO).lean();
    return u && { ...normalizza(u as UtenteLean), protetto: this.protetto(u.email) };
  }

  /** Aree coerenti col ruolo: admin/utente nessuna; il Grest non si assegna ai contributor. */
  private normalizzaAree(ruolo: Ruolo, aree: string[] = []): string[] {
    if (ruolo === 'admin' || ruolo === 'utente') return [];
    const uniche = [...new Set(aree)];
    if (ruolo === 'contributor' && uniche.includes('grest')) {
      throw new BadRequestException("L'area Grest si assegna solo ai Responsabili.");
    }
    if (uniche.length === 0) {
      throw new BadRequestException('Responsabili e Contributor devono avere almeno un\'area.');
    }
    return uniche;
  }

  async crea(dto: CreaUtenteDto) {
    const aree = this.normalizzaAree(dto.ruolo, dto.aree);
    try {
      const u = await this.userModel.create({
        email: dto.email.trim().toLowerCase(),
        nome: dto.nome.trim(),
        ruolo: dto.ruolo,
        aree,
        password: await bcrypt.hash(dto.password, 10),
        attivo: true,
      });
      return this.pubblico(u.id);
    } catch (err: any) {
      if (err?.code === 11000) throw new ConflictException('Esiste già un utente con questa email.');
      throw err;
    }
  }

  private async trova(id: string): Promise<UserDocument> {
    const u = await this.findById(id);
    if (!u) throw new NotFoundException('Utente non trovato');
    return u;
  }

  /** Impedisce di restare senza nessun admin attivo. */
  private async verificaAltroAdmin(escludiId: string) {
    const altri = await this.userModel.countDocuments({
      _id: { $ne: escludiId }, ruolo: 'admin', attivo: { $ne: false },
    });
    if (altri === 0) throw new BadRequestException('Deve restare almeno un Admin attivo.');
  }

  async modifica(id: string, dto: ModificaUtenteDto, chiEsegue: string) {
    const u = await this.trova(id);
    const ruolo = dto.ruolo ?? u.ruolo;
    const attivo = dto.attivo ?? u.attivo !== false;
    if (this.protetto(u.email) && (ruolo !== 'admin' || !attivo)) {
      throw new BadRequestException("L'account amministratore principale non può essere disattivato né cambiare ruolo.");
    }
    if (u.ruolo === 'admin' && u.attivo !== false && (ruolo !== 'admin' || !attivo)) {
      if (id === chiEsegue) throw new BadRequestException('Non puoi togliere a te stesso il ruolo di Admin.');
      await this.verificaAltroAdmin(id);
    }
    u.ruolo = ruolo;
    u.attivo = attivo;
    if (dto.nome !== undefined) u.nome = dto.nome.trim();
    u.aree = this.normalizzaAree(ruolo, dto.aree ?? u.aree ?? []);
    await u.save();
    return this.pubblico(id);
  }

  async impostaPassword(id: string, password: string) {
    const u = await this.trova(id);
    u.password = await bcrypt.hash(password, 10);
    await u.save();
    return { ok: true };
  }

  async cambiaPassword(id: string, attuale: string, nuova: string) {
    const u = await this.trova(id);
    if (!(await bcrypt.compare(attuale, u.password))) {
      throw new BadRequestException('La password attuale non è corretta.');
    }
    u.password = await bcrypt.hash(nuova, 10);
    await u.save();
    return { ok: true };
  }

  async elimina(id: string, chiEsegue: string) {
    if (id === chiEsegue) throw new BadRequestException('Non puoi eliminare il tuo account.');
    const u = await this.trova(id);
    if (this.protetto(u.email)) {
      throw new BadRequestException("L'account amministratore principale non può essere eliminato.");
    }
    if (u.ruolo === 'admin' && u.attivo !== false) await this.verificaAltroAdmin(id);
    await u.deleteOne();
    return { ok: true };
  }

  aree() {
    return AREE;
  }
}
