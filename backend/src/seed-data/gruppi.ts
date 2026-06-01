// Gruppi e movimenti parrocchiali — sezioni delle tre Aree (Liturgia, Carità, Catechesi).
// Caricati da seed-contenuti.ts (npm run seed:contenuti), idempotenti per `nome`.
// Ogni gruppo ha uno slug: la pagina di dettaglio è /gruppi/:area/:slug.
// Il campo `contenuto` (HTML) è opzionale e gestibile da admin.

import { AreaGruppo } from '../gruppi/schemas/gruppo.schema';

export interface SeedGruppo {
  nome: string;
  area: AreaGruppo;
  slug: string;
  ordine: number;
  contenuto?: string;
}

export const GRUPPI_SEED: SeedGruppo[] = [
  // Area Liturgia
  { nome: 'Cenacoli e Gruppo Mariano', area: AreaGruppo.LITURGIA, slug: 'cenacoli-gruppo-mariano', ordine: 1 },
  { nome: 'Coro', area: AreaGruppo.LITURGIA, slug: 'coro', ordine: 2 },
  { nome: 'Decoro e Liturgia', area: AreaGruppo.LITURGIA, slug: 'decoro-liturgia', ordine: 3 },
  { nome: 'Ministri Straordinari', area: AreaGruppo.LITURGIA, slug: 'ministri-straordinari', ordine: 4 },
  { nome: 'Lettori', area: AreaGruppo.LITURGIA, slug: 'lettori', ordine: 5 },

  // Area Carità
  { nome: 'Caritas', area: AreaGruppo.CARITA, slug: 'caritas', ordine: 1 },
  { nome: 'Consultorio Familiare Agape', area: AreaGruppo.CARITA, slug: 'consultorio-familiare-agape', ordine: 2 },
  { nome: 'Festa', area: AreaGruppo.CARITA, slug: 'festa', ordine: 3 },
  { nome: 'Laboratorio Anziani', area: AreaGruppo.CARITA, slug: 'laboratorio-anziani', ordine: 4 },
  { nome: 'Pulizia della Chiesa', area: AreaGruppo.CARITA, slug: 'pulizia-della-chiesa', ordine: 5 },

  // Area Catechesi
  { nome: 'Movimento Familiare Cristiano', area: AreaGruppo.CATECHESI, slug: 'movimento-familiare-cristiano', ordine: 1 },
  { nome: 'Giardino di Giada', area: AreaGruppo.CATECHESI, slug: 'giardino-di-giada', ordine: 2 },
  { nome: 'Giovani', area: AreaGruppo.CATECHESI, slug: 'giovani', ordine: 3 },
];
