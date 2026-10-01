// Portale Grest: iscritto = account famiglia per un figlio (vedi backend/src/grest).

export interface GrestAutorizzazione {
  dichiarazione1: boolean; // problemi di salute
  dichiarazione2: boolean; // allergie
  dichiarazione3: boolean; // intolleranze alimentari
  dichiarazione4: boolean; // L. 104/1992
  dichiarazione5: boolean; // assistenza individuale continua
  dichiarazione6: boolean; // presa visione: niente medicinali
  dichiarazione7: boolean; // artt. 75 e 76 DPR 445/2000
  allergie: string;
  intolleranze: string;
  autorizzazione1: boolean; // uscita con tutore/delegato
  autorizzazione2: boolean; // foto e pubblicazione
  autorizzazione3: boolean; // attività e uscite
  autorizzazione4: boolean; // emergenza sanitaria
  consenso: boolean;
}

export interface GrestDelegato {
  nome: string;
  cognome: string;
  tipoDocumento: string;
  numeroDocumento: string;
}

export interface GrestDelega {
  delegati: GrestDelegato[];
  consenso: boolean;
}

export interface GrestDatiFamiglia {
  nomePadre: string;
  cognomePadre: string;
  emailPadre: string;
  mobilePhonePadre: string;
  nomeMadre: string;
  cognomeMadre: string;
  emailMadre: string;
  mobilePhoneMadre: string;
  nomeFiglio: string;
  cognomeFiglio: string;
  natoA: string;
  natoIl: string;
  residenteA: string;
  via: string;
}

export interface GrestIscrizione extends GrestDatiFamiglia {
  annoCatechismo: string;
  annoElementari: string;
  taglia: string;
  altroContatto: string;
  mobilePhoneAltro: string;
  altroDaSegnalare: string;
  uscita1: boolean | null;
  consenso: boolean;
}

export interface GrestIscritto extends GrestIscrizione {
  _id: string;
  legacyId?: number;
  username: string;
  attivo: boolean;
  autorizzazione: GrestAutorizzazione | null;
  delega: GrestDelega | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GrestStato {
  anno: string;
  iscrizioniAperte: boolean;
  postiEsauriti: boolean;
}

export interface GrestImpostazioni {
  iscrizioniAperte: boolean;
  /** 'admin' = scelta salvata dal pannello, 'env' = valore iniziale da .env */
  fonte: 'admin' | 'env';
  iscritti: number;
  maxIscritti: number;
}

export type ModuloGrest = 'iscrizione' | 'autorizzazione' | 'delega';

export const ANNI_CATECHISMO: { value: string; label: string }[] = [
  { value: '1° anno comunione', label: '1° anno comunione' },
  { value: '2° anno comunione', label: '2° anno comunione' },
  { value: '1° anno cresima', label: '1° anno cresima' },
  // valore storico salvato nel DB, mostrato corretto
  { value: 'Fatellino/Sorellina', label: 'Fratellino/Sorellina' },
  { value: 'Esterno', label: 'Esterno' },
];

export const TAGLIE: { value: string; label: string }[] = [
  { value: '6-7', label: '6-7 anni' },
  { value: '8-9', label: '8-9 anni' },
  { value: '10-11', label: '10-11 anni' },
  { value: '12-13', label: '12-13 anni' },
  { value: '14-15', label: '14-15 anni' },
  { value: 'XS', label: 'XS adulto' },
  { value: 'S', label: 'S adulto' },
  { value: 'M', label: 'M adulto' },
];

export const TIPI_DOCUMENTO = ["Carta d'Identita", 'Passaporto', 'Patente di guida'];

/** Messaggio leggibile da un errore HTTP di NestJS (message stringa o array). */
export function messaggioErrore(err: any, fallback: string): string {
  const m = err?.error?.message;
  return Array.isArray(m) ? m.join('. ') : typeof m === 'string' && m ? m : fallback;
}

// Testi legati all'edizione corrente (da aggiornare insieme ai template ODT e a GREST_ANNO).
export const TESTO_USCITA1 = 'La Mieleria nel Bosco di Montelivata l’11/06 o il 18/06/2026 (€ 30)';
export const NOTA_CONSEGNA_DELEGA =
  'I documenti del delegante e dei delegati andranno consegnati in cartaceo il 28 e 29 marzo insieme al modulo firmato.';
export const TESTO_RESPONSABILITA =
  'Il sottoscritto, consapevole delle conseguenze amministrative e penali per chi rilascia dichiarazioni ' +
  'non corrispondenti a verità, ai sensi del DPR 445/2000, dichiara di aver effettuato la scelta/richiesta ' +
  'in osservanza sulla responsabilità genitoriale di cui agli artt. 316, 337 ter e 337 quater del codice ' +
  'civile, che richiedono il consenso di entrambi i genitori.';
