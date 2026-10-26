export interface Evento {
  _id: string;
  titolo: string;
  descrizione?: string;
  dataInizio: string;
  dataFine?: string;
  luogo?: string;
  immagine?: string;
  pubblicato: boolean;
  /** Evento importante: card grande in cima a /eventi e in home. */
  inEvidenza?: boolean;
  /** Periodo di visibilità facoltativo (null/assente = nessun limite). */
  visibileDal?: string | null;
  visibileFino?: string | null;
  /** Aree a cui appartiene l'evento (vuoto = eventi storici, gestiti solo dall'admin). */
  aree?: string[];
  createdAt: string;
}
