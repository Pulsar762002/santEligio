import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GrestIscrittoDocument = GrestIscritto & Document;

// Modulo di autorizzazione. I nomi ricalcano le colonne della tabella
// `autorizzazioneUtente` del vecchio portale (SQLite), corretto solo il refuso
// "dihiarazione" → "dichiarazione". Significato (= testo mostrato nel form):
//   dichiarazione1  problemi di salute            dichiarazione5  assistenza individuale continua
//   dichiarazione2  allergie (+ allergie)         dichiarazione6  consapevole: no somministrazione medicinali
//   dichiarazione3  intolleranze (+ intolleranze) dichiarazione7  consapevole artt. 75-76 DPR 445/2000
//   dichiarazione4  certificazione L. 104/1992    dichiarazione8  non usata (sempre false)
//   autorizzazione1 uscita con tutore/delegato    autorizzazione3 attività interne/esterne e uscite
//   autorizzazione2 foto e pubblicazione          autorizzazione4 intervento emergenza sanitaria
//   autorizzazione5 non usata (sempre false)
@Schema({ _id: false })
export class GrestAutorizzazione {
  @Prop({ default: false }) dichiarazione1: boolean;
  @Prop({ default: false }) dichiarazione2: boolean;
  @Prop({ default: false }) dichiarazione3: boolean;
  @Prop({ default: false }) dichiarazione4: boolean;
  @Prop({ default: false }) dichiarazione5: boolean;
  @Prop({ default: false }) dichiarazione6: boolean;
  @Prop({ default: false }) dichiarazione7: boolean;
  @Prop({ default: false }) dichiarazione8: boolean;
  @Prop({ default: '' }) allergie: string;
  @Prop({ default: '' }) intolleranze: string;
  @Prop({ default: false }) autorizzazione1: boolean;
  @Prop({ default: false }) autorizzazione2: boolean;
  @Prop({ default: false }) autorizzazione3: boolean;
  @Prop({ default: false }) autorizzazione4: boolean;
  @Prop({ default: false }) autorizzazione5: boolean;
  @Prop({ default: false }) consenso: boolean;
}

@Schema({ _id: false })
export class GrestDelegato {
  // Obbligatori lato DTO; qui ammessi vuoti per non scartare righe storiche incomplete.
  @Prop({ default: '' }) nome: string;
  @Prop({ default: '' }) cognome: string;
  @Prop({ default: '' }) tipoDocumento: string;
  @Prop({ default: '' }) numeroDocumento: string;
}

// Modulo di delega: da 1 a 4 delegati (tabella `delegaUtente`, colonne
// nomeDelegatoN / cognomeDelegatoN / documentoDelegatoN / numeroDocumentoDelegatoN).
@Schema({ _id: false })
export class GrestDelega {
  @Prop({ type: [SchemaFactory.createForClass(GrestDelegato)], default: [] })
  delegati: GrestDelegato[];

  @Prop({ default: false }) consenso: boolean;
}

// Un iscritto = un account famiglia per un figlio (tabella `users` del vecchio portale).
// Lo username è generato da nome+cognome del figlio (es. "MarioRossi") e non cambia più.
@Schema({ timestamps: true, collection: 'grest_iscritti' })
export class GrestIscritto {
  /** `users.id` nel vecchio database SQLite (assente per le iscrizioni nuove). */
  @Prop({ unique: true, sparse: true })
  legacyId?: number;

  @Prop({ required: true, unique: true })
  username: string;

  /** username in minuscolo: il login non distingue maiuscole/minuscole. */
  @Prop({ required: true, unique: true })
  usernameLower: string;

  /** Hash bcrypt; assente finché l'account non è attivato. */
  @Prop()
  password?: string;

  @Prop({ default: false })
  attivo: boolean;

  /** Ammesso al portale quando l'accesso è ristretto (impostazioni.accessoRistretto). */
  @Prop({ default: false })
  abilitato: boolean;

  /** Token del link di attivazione / reimpostazione password inviato via email. */
  @Prop({ index: true, sparse: true })
  activationToken?: string;

  @Prop({ default: '' }) nomePadre: string;
  @Prop({ default: '' }) cognomePadre: string;
  @Prop({ default: '' }) emailPadre: string;
  @Prop({ default: '' }) mobilePhonePadre: string;
  @Prop({ default: '' }) nomeMadre: string;
  @Prop({ default: '' }) cognomeMadre: string;
  @Prop({ default: '' }) emailMadre: string;
  @Prop({ default: '' }) mobilePhoneMadre: string;

  @Prop({ required: true }) nomeFiglio: string;
  @Prop({ required: true }) cognomeFiglio: string;
  @Prop({ default: '' }) natoA: string;
  /** Data di nascita gg/mm/aaaa (formato del vecchio portale, usato nei PDF). */
  @Prop({ default: '' }) natoIl: string;
  @Prop({ default: '' }) residenteA: string;
  @Prop({ default: '' }) via: string;

  /** Iscrizione al catechismo (1° anno comunione, ..., Esterno). */
  @Prop({ default: '' }) annoCatechismo: string;
  /** Classe frequentata. */
  @Prop({ default: '' }) annoElementari: string;
  @Prop({ default: '' }) taglia: string;
  @Prop({ default: '' }) altroContatto: string;
  @Prop({ default: '' }) mobilePhoneAltro: string;
  @Prop({ default: '' }) altroDaSegnalare: string;

  /** Uscita a pagamento; null = modulo d'iscrizione mai compilato. */
  @Prop({ type: Boolean, default: null })
  uscita1: boolean | null;

  @Prop({ default: false }) uscita2: boolean;

  /** Dichiarazione di responsabilità genitoriale del modulo d'iscrizione. */
  @Prop({ default: false }) consenso: boolean;

  @Prop({ type: SchemaFactory.createForClass(GrestAutorizzazione), default: null })
  autorizzazione: GrestAutorizzazione | null;

  @Prop({ type: SchemaFactory.createForClass(GrestDelega), default: null })
  delega: GrestDelega | null;

  /**
   * Richiesta della famiglia di cancellare account e dati (obbligo Google Play per le app
   * con registrazione). La cancellazione vera la esegue un responsabile da Admin → Grest.
   */
  @Prop({ type: Date, default: null })
  cancellazioneRichiesta: Date | null;

  @Prop({ default: '' })
  cancellazioneMotivo: string;
}

export const GrestIscrittoSchema = SchemaFactory.createForClass(GrestIscritto);
