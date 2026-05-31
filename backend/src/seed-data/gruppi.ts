// Gruppi e movimenti parrocchiali estratti dal vecchio sito (cartella old/).
// Caricati da seed-contenuti.ts (npm run seed:contenuti), idempotenti per `nome`.

import { AreaGruppo } from '../gruppi/schemas/gruppo.schema';

export interface SeedGruppo {
  nome: string;
  area: AreaGruppo;
  ordine: number;
}

export const GRUPPI_SEED: SeedGruppo[] = [
  // Area Liturgia
  { nome: 'Comunità Neocatecumenale', area: AreaGruppo.LITURGIA, ordine: 1 },
  { nome: 'Coro', area: AreaGruppo.LITURGIA, ordine: 2 },
  { nome: 'Liturgia e decoro', area: AreaGruppo.LITURGIA, ordine: 3 },
  { nome: 'Maria Madre del Verbo Incarnato', area: AreaGruppo.LITURGIA, ordine: 4 },
  { nome: 'Ministranti', area: AreaGruppo.LITURGIA, ordine: 5 },
  { nome: 'Ministri Straordinari della Comunione', area: AreaGruppo.LITURGIA, ordine: 6 },
  { nome: 'SBM - Sognatori di Buona Musica', area: AreaGruppo.LITURGIA, ordine: 7 },

  // Area Catechesi
  { nome: 'Educatori gruppi DopoCresima', area: AreaGruppo.CATECHESI, ordine: 1 },
  { nome: 'Famiglie della Catechesi', area: AreaGruppo.CATECHESI, ordine: 2 },
  { nome: 'Genitori Battezzati', area: AreaGruppo.CATECHESI, ordine: 3 },
  { nome: 'Gruppo Giovani', area: AreaGruppo.CATECHESI, ordine: 4 },
  { nome: 'Movimento Familiare Cristiano', area: AreaGruppo.CATECHESI, ordine: 5 },

  // Area Carità
  { nome: 'Amici per sempre', area: AreaGruppo.CARITA, ordine: 1 },
  { nome: 'Caritas', area: AreaGruppo.CARITA, ordine: 2 },
  { nome: 'Comitato per la Festa di S. Eligio', area: AreaGruppo.CARITA, ordine: 3 },
  { nome: 'Consultorio Familiare "Agape ODV"', area: AreaGruppo.CARITA, ordine: 4 },
  {
    nome: 'Gruppi per la pulizia della chiesa e degli ambienti parrocchiali',
    area: AreaGruppo.CARITA,
    ordine: 5,
  },
  { nome: 'Mamme del Laboratorio', area: AreaGruppo.CARITA, ordine: 6 },
  { nome: 'Vigilantes del Giardino di Giada', area: AreaGruppo.CARITA, ordine: 7 },
];
