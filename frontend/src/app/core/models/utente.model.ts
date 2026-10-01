export type Ruolo = 'admin' | 'responsabile' | 'contributor' | 'utente';

export const RUOLI: { value: Ruolo; label: string; descrizione: string }[] = [
  { value: 'admin', label: 'Admin', descrizione: 'Gestisce tutto il portale, gli utenti e le approvazioni.' },
  { value: 'responsabile', label: 'Responsabile', descrizione: 'Pubblica pagina ed eventi delle sue aree e approva i contributor.' },
  { value: 'contributor', label: 'Contributor', descrizione: 'Propone modifiche nelle sue aree: vanno approvate dal responsabile.' },
  { value: 'utente', label: 'Utente', descrizione: 'Sola lettura: nessun accesso al pannello di amministrazione.' },
];

export const etichettaRuolo = (r: Ruolo) => RUOLI.find((x) => x.value === r)?.label ?? r;

export interface AreaPortale {
  chiave: string;
  nome: string;
  gruppo: string;
  tipo: 'pagina' | 'gruppo' | 'grest';
}

export interface Utente {
  _id: string;
  email: string;
  nome: string;
  ruolo: Ruolo;
  aree: string[];
  attivo: boolean;
  createdAt?: string;
}

export interface UtenteCorrente {
  userId: string;
  email: string;
  nome: string;
  ruolo: Ruolo;
  aree: string[];
  areeDettaglio: AreaPortale[];
}
