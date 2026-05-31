export type AreaGruppo = 'liturgia' | 'catechesi' | 'carita';

export interface Gruppo {
  _id: string;
  nome: string;
  area: AreaGruppo;
  descrizione?: string;
  referente?: string;
  contatto?: string;
  ordine: number;
  pubblicato: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AREA_LABELS: Record<AreaGruppo, string> = {
  liturgia: 'Area Liturgia',
  catechesi: 'Area Catechesi',
  carita: 'Area Carità',
};
