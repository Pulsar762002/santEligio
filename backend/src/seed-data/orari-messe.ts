// Orari delle SS. Messe estratti dal vecchio sito (cartella old/).
// Caricati da seed-contenuti.ts (npm run seed:contenuti), idempotenti per giorno+ora.

import { TipoMessa } from '../orari-messe/schemas/orario-messa.schema';

export interface SeedOrarioMessa {
  giorno: string;
  ora: string;
  tipo: TipoMessa;
  note?: string;
  ordine: number;
}

export const ORARI_MESSE_SEED: SeedOrarioMessa[] = [
  { giorno: 'Lunedì', ora: '18:30', tipo: TipoMessa.FERIALE, ordine: 1 },
  { giorno: 'Martedì', ora: '18:30', tipo: TipoMessa.FERIALE, ordine: 2 },
  { giorno: 'Mercoledì', ora: '18:30', tipo: TipoMessa.FERIALE, ordine: 3 },
  { giorno: 'Giovedì', ora: '08:30', tipo: TipoMessa.FERIALE, ordine: 4 },
  { giorno: 'Venerdì', ora: '18:30', tipo: TipoMessa.FERIALE, ordine: 5 },
  { giorno: 'Sabato e prefestivi', ora: '18:30', tipo: TipoMessa.PREFESTIVA, ordine: 6 },
  { giorno: 'Domenica e festivi', ora: '08:30', tipo: TipoMessa.FESTIVA, ordine: 7 },
  { giorno: 'Domenica e festivi', ora: '11:00', tipo: TipoMessa.FESTIVA, ordine: 8 },
  {
    giorno: 'Domenica e festivi',
    ora: '13:00',
    tipo: TipoMessa.FESTIVA,
    note: 'Santa Messa in lingua inglese (Rosario alle 12:30)',
    ordine: 9,
  },
  { giorno: 'Domenica e festivi', ora: '19:00', tipo: TipoMessa.FESTIVA, ordine: 10 },
];
