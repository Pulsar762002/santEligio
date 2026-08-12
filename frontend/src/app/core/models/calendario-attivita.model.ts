export type TipoAttivita = 'messa' | 'evento' | 'catechesi' | 'carita' | 'liturgia' | 'altro';
export type FonteAttivita = 'messa' | 'evento' | 'manuale';

export interface CalendarioAttivita {
  _id: string;
  data: string;
  ora: string;
  titolo: string;
  tipo: TipoAttivita;
  luogo?: string;
  note?: string;
  fonte: FonteAttivita;
  fonteRifId?: string;
  pubblicato: boolean;
  createdAt: string;
}

export const TIPI_ATTIVITA: TipoAttivita[] = ['messa', 'evento', 'catechesi', 'carita', 'liturgia', 'altro'];

export const TIPO_ATTIVITA_LABEL: Record<TipoAttivita, string> = {
  messa: 'Messa',
  evento: 'Evento',
  catechesi: 'Catechesi',
  carita: 'Carità',
  liturgia: 'Liturgia',
  altro: 'Altro',
};

export const FONTE_ATTIVITA_LABEL: Record<FonteAttivita, string> = {
  messa: 'Generato da messa',
  evento: 'Generato da evento',
  manuale: 'Manuale',
};
