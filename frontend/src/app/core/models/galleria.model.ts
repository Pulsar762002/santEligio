export interface GalleriaCategoria {
  _id: string;
  nome: string;
  slug: string;
  ordine: number;
}

export type TipoMedia = 'foto' | 'video';

export interface GalleriaItem {
  _id: string;
  categoria: string; // slug categoria
  tipo: TipoMedia;
  url: string;
  titolo?: string;
  ordine: number;
}
