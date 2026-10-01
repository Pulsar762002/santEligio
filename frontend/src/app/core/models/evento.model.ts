export interface Evento {
  _id: string;
  titolo: string;
  descrizione?: string;
  dataInizio: string;
  dataFine?: string;
  luogo?: string;
  immagine?: string;
  pubblicato: boolean;
  /** Aree a cui appartiene l'evento (vuoto = eventi storici, gestiti solo dall'admin). */
  aree?: string[];
  createdAt: string;
}
