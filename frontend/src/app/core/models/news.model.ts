export type CategoriaNews = 'liturgia' | 'catechismo' | 'caritas' | 'eventi' | 'comunicati';

export interface News {
  _id: string;
  titolo: string;
  testo: string;
  categoria?: CategoriaNews;
  pubblicato: boolean;
  immagine?: string;
  createdAt: string;
  updatedAt: string;
}
