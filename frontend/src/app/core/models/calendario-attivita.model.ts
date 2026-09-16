export type TipoAttivita = 'messa' | 'evento' | 'catechesi' | 'carita' | 'liturgia' | 'altro';
export type FonteAttivita = 'messa' | 'evento' | 'manuale';
export type ColoreAttivita = 'nero' | 'rosso' | 'blu' | 'verde' | 'arancione' | 'viola';

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
  colore?: ColoreAttivita;
  grassetto?: boolean;
  corsivo?: boolean;
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

export const COLORI_ATTIVITA: ColoreAttivita[] = ['nero', 'rosso', 'blu', 'verde', 'arancione', 'viola'];

export const COLORE_ATTIVITA_LABEL: Record<ColoreAttivita, string> = {
  nero: 'Nero',
  rosso: 'Rosso',
  blu: 'Blu',
  verde: 'Verde',
  arancione: 'Arancione',
  viola: 'Viola',
};

export const COLORE_ATTIVITA_HEX: Record<ColoreAttivita, string> = {
  nero: '#1a1a1a',
  rosso: '#b91c1c',
  blu: '#1d4ed8',
  verde: '#15803d',
  arancione: '#c2610a',
  viola: '#7c3aed',
};
