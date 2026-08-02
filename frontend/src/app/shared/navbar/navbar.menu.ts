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
          { label: 'Magnifica Umanitas', link: '/p/magnifica-umanitas' },
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
          { label: 'Cenacoli', link: '/p/cenacoli' },
          { label: 'Coro', link: '/p/coro' },
          { label: 'Decoro e Liturgia', link: '/p/decoro-e-liturgia ' },
          { label: 'Ministri Straordinari', link: '/p/ministri-straordinari' },
          { label: 'Lettori', link: '/p/lettori' },
        ],
      },
      {
        label: 'Carità',
        children: [
          { label: 'Caritas', link: '/p/caritas' },
          { label: 'Consultorio Familiare Agape', link: '/p/consultorio-familiare-agape' },
          { label: 'Festa', link: '/p/festa' },
          { label: 'Laboratorio Anziani', link: '/p/laboratorio-anziani' },
          { label: 'Pulizia della Chiesa', link: '/p/pulizia' },
        ],
      },
      {
        label: 'Catechesi',
        children: [
          { label: 'Movimento Familiare Cristiano', link: '/p/movimento-familiare-cristiano' },
          { label: 'Giardino di Giada', link: '/gruppi/catechesi/giardino-di-giada' },
          { label: 'Giovani', link: '/p/giovani' },
        ],
      },
    ],
  },

  { label: 'Orari Messe', link: '/orari-messe' },
  { label: 'Galleria', link: '/galleria' },
  { label: 'Contatti', link: '/p/contatti' },
];
