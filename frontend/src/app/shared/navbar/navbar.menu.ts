// Struttura dichiarativa della navbar (3 livelli).
// Livello 1: voci principali  ·  Livello 2: sottomenu  ·  Livello 3: sezioni (flyout laterale).
// Le foglie puntano a rotte esistenti: pagine statiche (/p/:slug), gruppi (/gruppi/:area/:slug)
// o pagine dedicate (/eventi, /orari-messe, ...).

export interface MenuLeaf {
  label: string;
  link: string;
}

export interface MenuGroup {
  label: string;
  /** Link diretto (voce senza terzo livello). */
  link?: string;
  /** Sezioni del terzo livello (flyout laterale). */
  children?: MenuLeaf[];
}

export interface MenuEntry {
  label: string;
  /** Link diretto (voce di primo livello senza dropdown). */
  link?: string;
  /** Match esatto della rotta attiva (usato per Home). */
  exact?: boolean;
  /** Sottomenu di secondo livello. */
  children?: MenuGroup[];
}

export const MENU: MenuEntry[] = [
  { label: 'Home', link: '/', exact: true },

  {
    label: "Sant'Eligio",
    children: [
      {
        label: 'La Parrocchia',
        children: [
          { label: 'Storia della Parrocchia', link: '/p/storia-parrocchia' },
          { label: "Sant'Eligio di Noyon", link: '/p/santo-patrono' },
          { label: 'Elenco dei Parroci', link: '/p/storico-parroci' },
        ],
      },
      { label: 'La nuova Chiesa', link: '/p/la-nuova-chiesa' },
      {
        label: 'Spazi Esterni',
        children: [
          { label: 'La mensa', link: '/p/spazi-mensa' },
          { label: 'Il Patio', link: '/p/spazi-patio' },
          { label: 'Il campo di Calcetto', link: '/p/spazi-calcetto' },
        ],
      },
      {
        label: 'Il Territorio',
        children: [
          { label: 'Stradario del territorio', link: '/p/stradario' },
        ],
      },
      {
        label: 'Lavori in Corso',
        children: [
          { label: "L'oratorio", link: '/p/lavori-oratorio' },
          { label: 'Campo Pallacanestro e Pallavolo', link: '/p/lavori-campo' },
          { label: 'Gli Spogliatoi', link: '/p/lavori-spogliatoi' },
        ],
      },
    ],
  },

  {
    label: 'Attività',
    children: [
      {
        label: 'Catechesi',
        children: [
          { label: 'Sacramento del Battesimo', link: '/p/corso-prebattesimale' },
          { label: "Catechismo per l'Iniziazione Cristiana", link: '/p/catechismo-iniziazione-cristiana' },
          { label: 'Sacramento della Cresima', link: '/p/corso-precresima' },
          { label: 'Sacramento del Matrimonio', link: '/p/corso-prematrimoniale' },
        ],
      },
      {
        label: 'Giovani',
        children: [
          { label: 'Gruppo 1', link: '/p/giovani-gruppo-1' },
          { label: 'Gruppo 2', link: '/p/giovani-gruppo-2' },
        ],
      },
      { label: 'Grest', link: '/p/grest' },
    ],
  },

  { label: 'Eventi', link: '/eventi' },

  {
    label: 'Realtà',
    children: [
      {
        label: 'Caritas',
        children: [
          { label: 'Profilo', link: '/p/caritas-profilo' },
          { label: 'Attività ed iniziative', link: '/p/caritas-attivita' },
        ],
      },
      {
        label: 'Consultorio',
        children: [
          { label: 'Il progetto', link: '/p/consultorio-progetto' },
          { label: 'Contatti', link: '/p/consultorio-contatti' },
        ],
      },
    ],
  },

  {
    label: 'Organizzazione',
    children: [
      { label: 'Consiglio Pastorale', link: '/p/consiglio-pastorale' },
      { label: 'Consiglio Affari Economici', link: '/p/consiglio-affari-economici' },
      {
        label: 'Area Liturgia',
        children: [
          { label: 'Cenacoli e Gruppo Mariano', link: '/gruppi/liturgia/cenacoli-gruppo-mariano' },
          { label: 'Coro', link: '/gruppi/liturgia/coro' },
          { label: 'Decoro e Liturgia', link: '/gruppi/liturgia/decoro-liturgia' },
          { label: 'Ministri Straordinari', link: '/gruppi/liturgia/ministri-straordinari' },
          { label: 'Lettori', link: '/gruppi/liturgia/lettori' },
        ],
      },
      {
        label: 'Carità',
        children: [
          { label: 'Caritas', link: '/gruppi/carita/caritas' },
          { label: 'Consultorio Familiare Agape', link: '/gruppi/carita/consultorio-familiare-agape' },
          { label: 'Festa', link: '/gruppi/carita/festa' },
          { label: 'Laboratorio Anziani', link: '/gruppi/carita/laboratorio-anziani' },
          { label: 'Pulizia della Chiesa', link: '/gruppi/carita/pulizia-della-chiesa' },
        ],
      },
      {
        label: 'Catechesi',
        children: [
          { label: 'Movimento Familiare Cristiano', link: '/gruppi/catechesi/movimento-familiare-cristiano' },
          { label: 'Giardino di Giada', link: '/gruppi/catechesi/giardino-di-giada' },
          { label: 'Giovani', link: '/gruppi/catechesi/giovani' },
        ],
      },
    ],
  },

  { label: 'Orari Messe', link: '/orari-messe' },
  { label: 'Galleria', link: '/galleria' },
  { label: 'Contatti', link: '/p/contatti' },
];
