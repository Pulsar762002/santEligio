export type SezionePagina =
  | 'parrocchia'
  | 'parroco'
  | 'diacono'
  | 'caritas'
  | 'consultorio'
  | 'organismi'
  | 'sacramenti'
  | 'gruppi'
  | 'altro';

export interface Pagina {
  _id: string;
  slug: string;
  titolo: string;
  sottotitolo?: string;
  contenuto: string;
  sezione: SezionePagina;
  immagine?: string;
  ordine: number;
  pubblicato: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SEZIONE_LABELS: Record<SezionePagina, string> = {
  parrocchia: 'La Parrocchia',
  parroco: 'Il Parroco',
  diacono: 'Il Diacono',
  caritas: 'Caritas',
  consultorio: 'Consultorio',
  organismi: 'Organismi parrocchiali',
  sacramenti: 'Sacramenti',
  gruppi: 'Gruppi e Movimenti',
  altro: 'Altro',
};
