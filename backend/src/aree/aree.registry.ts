// Aree assegnabili a Responsabili e Contributor: le voci del sottomenu "Organizzazione"
// (frontend/src/app/shared/navbar/navbar.menu.ts), la pagina Contatti (orari e turni
// della segreteria) e il Grest.
// La chiave è lo slug della pagina (/p/<slug>) o del gruppo (/gruppi/<area>/<slug>).

export type TipoArea = 'pagina' | 'gruppo' | 'grest';

export interface Area {
  chiave: string;
  nome: string;
  /** Gruppo del menu (per l'interfaccia). */
  gruppo: string;
  tipo: TipoArea;
}

export const AREE: Area[] = [
  { chiave: 'consiglio-pastorale', nome: 'Consiglio Pastorale', gruppo: 'Organizzazione', tipo: 'pagina' },
  { chiave: 'consiglio-affari-economici', nome: 'Consiglio Affari Economici', gruppo: 'Organizzazione', tipo: 'pagina' },
  { chiave: 'cenacoli', nome: 'Cenacoli', gruppo: 'Area Liturgia', tipo: 'pagina' },
  { chiave: 'coro', nome: 'Coro', gruppo: 'Area Liturgia', tipo: 'pagina' },
  { chiave: 'decoro-e-liturgia', nome: 'Decoro e Liturgia', gruppo: 'Area Liturgia', tipo: 'pagina' },
  { chiave: 'ministri-straordinari', nome: 'Ministri Straordinari', gruppo: 'Area Liturgia', tipo: 'pagina' },
  { chiave: 'lettori', nome: 'Lettori', gruppo: 'Area Liturgia', tipo: 'pagina' },
  { chiave: 'caritas', nome: 'Caritas', gruppo: 'Carità', tipo: 'pagina' },
  { chiave: 'consultorio-familiare-agape', nome: 'Consultorio Familiare Agape', gruppo: 'Carità', tipo: 'pagina' },
  { chiave: 'festa', nome: 'Festa', gruppo: 'Carità', tipo: 'pagina' },
  { chiave: 'laboratorio-anziani', nome: 'Laboratorio Anziani', gruppo: 'Carità', tipo: 'pagina' },
  { chiave: 'pulizia', nome: 'Pulizia della Chiesa', gruppo: 'Carità', tipo: 'pagina' },
  { chiave: 'movimento-familiare-cristiano', nome: 'Movimento Familiare Cristiano', gruppo: 'Catechesi', tipo: 'pagina' },
  { chiave: 'giardino-di-giada', nome: 'Giardino di Giada', gruppo: 'Catechesi', tipo: 'gruppo' },
  { chiave: 'giovani', nome: 'Giovani', gruppo: 'Catechesi', tipo: 'pagina' },
  { chiave: 'contatti', nome: 'Contatti (orari e turni segreteria)', gruppo: 'Segreteria', tipo: 'pagina' },
  { chiave: 'grest', nome: 'Grest', gruppo: 'Grest', tipo: 'grest' },
];

export const CHIAVI_AREE = AREE.map((a) => a.chiave);

export function trovaArea(chiave: string): Area | undefined {
  return AREE.find((a) => a.chiave === chiave);
}
