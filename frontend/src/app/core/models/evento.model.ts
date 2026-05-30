export interface Evento {
  _id: string;
  titolo: string;
  descrizione?: string;
  dataInizio: string;
  dataFine?: string;
  luogo?: string;
  pubblicato: boolean;
  createdAt: string;
}
