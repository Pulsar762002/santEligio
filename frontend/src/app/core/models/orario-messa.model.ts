export type TipoMessa = 'feriale' | 'festiva' | 'prefestiva';

export interface OrarioMessa {
  _id: string;
  giorno: string;
  ora: string;
  tipo: TipoMessa;
  chiesa?: string;
  note?: string;
  attivo: boolean;
  ordine: number;
}
