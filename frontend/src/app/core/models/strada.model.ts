export type Contrada = 'La Contessa' | 'Il Mericaio' | "L'Ovile" | 'Le Botti';

export const CONTRADE: Contrada[] = ['La Contessa', 'Il Mericaio', "L'Ovile", 'Le Botti'];

export interface Strada {
  _id: string;
  contrada: Contrada;
  via: string;
  ordine: number;
}
