// Contenuti statici estratti dal vecchio sito (cartella old/).
// Caricati da seed-contenuti.ts (npm run seed:contenuti), idempotenti per `slug`.
// Il campo `contenuto` è HTML: il frontend lo renderizza in modo sicuro.

import { SezionePagina } from '../pagine/schemas/pagina.schema';

export interface SeedPagina {
  slug: string;
  titolo: string;
  sottotitolo?: string;
  contenuto: string;
  sezione: SezionePagina;
  ordine: number;
}

export const PAGINE_SEED: SeedPagina[] = [
  {
    slug: 'storia-parrocchia',
    titolo: 'Storia della Parrocchia di S. Eligio',
    sezione: SezionePagina.PARROCCHIA,
    ordine: 1,
    contenuto: `
<p>La parrocchia è stata eretta il 25 giugno 1963 con il decreto del Cardinale Vicario Clemente Micara "Succrescente in dies" ed affidata al clero diocesano di Roma. Dal 1968 fino al 2007 è stato parroco il Rev.do Mons. Rino Cunial.</p>
<p>Il territorio, con decreto del Cardinale Vicario Camillo Ruini del 27 febbraio 1995, è stato determinato entro i seguenti nuovi confini: "Via Prenestina - Fosso dell'Osa, fino all'intersezione con Via Carpinone - Via Carpinone - Fosso di Montegiardino per breve tratto - Linea ideale tangente all'abitato di Montegiardino fino ad intersecare il Fosso dei Ponzoni al punto finale della linea ideale proveniente dalla fine di Via della Riserva Nuova - Via della Riserva Nuova fino ad intersecare la Via Prenestina".</p>
<p>Il complesso immobiliare è di proprietà della Pont. Opera per la Preservazione della Fede e la provvista di nuove Chiese in Roma. Il progetto architettonico è di Aldo Aloysi, ed è stato realizzato il 18 giugno 1967.</p>
<p>Il Parroco pro tempore dal 1° Settembre 2020 è il Rev.do Padre Dario Frattini, già membro della Congregazione dei Canonici Regolari dell'Immacolata Concezione.</p>
`.trim(),
  },
  {
    slug: 'santo-patrono',
    titolo: "Sant'Eligio di Noyon",
    sottotitolo: 'Il nostro Patrono',
    sezione: SezionePagina.PARROCCHIA,
    ordine: 2,
    contenuto: `
<p>Sant'Eligio di Noyon (Chaptelat, 588 circa – Noyon, 1º dicembre 660) è stato un orafo e poi alto funzionario della corte dei re merovingi; è venerato come santo dalla Chiesa cattolica. Dalla contrazione del nome francese Éloi nel medioevo in molte città italiane veniva chiamato semplicemente sant'Alo, sant'Alò o anche solo san Lo.</p>
<p>Figlio di Eucherio e Terrigia, era di umili natali e apprese l'arte dell'oreficeria a Limoges presso il monetiere Abbone. Secondo la tradizione, Clotario II gli avrebbe commissionato un trono consegnandogli l'oro necessario per l'opera ed Eligio ne avrebbe realizzati due: fortemente impressionato dalla sua perizia e dalla sua onestà, il Re lo nominò orafo di corte e maestro della zecca.</p>
<p>Sotto il successore di Clotario, Dagoberto I (629 – 639), ricoprì la carica di tesoriere: fu anche incaricato di alcune delicate missioni diplomatiche. Si dedicò incessantemente ad opere di carità in favore dei poveri e dei malati e finanziando il riscatto dei prigionieri: finanziò la costruzione di numerose chiese e nel 632 fondò un monastero a Solignac.</p>
<p>Dopo la morte di Dagoberto I, fu eletto vescovo della diocesi di Tournai e Noyon nel 640 e venne consacrato il 13 maggio 641: si dedicò alla conversione dei pagani ancora presenti nella sua vasta diocesi e promosse il culto dei santi.</p>
<p>È patrono degli orafi, dei numismatici, dei maniscalchi e dei veterinari; avrebbe miracolosamente riattaccato la zampa ad un cavallo. Il Martirologio Romano fissa per la sua memoria liturgica la data del 1º dicembre.</p>
`.trim(),
  },
  {
    slug: 'storico-parroci',
    titolo: 'Elenco dei Parroci succedutisi a S. Eligio',
    sezione: SezionePagina.PARROCCHIA,
    ordine: 3,
    contenuto: `
<ul>
  <li>Monsignore Reverendissimo don Rino Cunial &dagger; (1968 - 2007)</li>
  <li>Molto Reverendo don Joseph Alexander de León (2007 - 2020)</li>
  <li>Reverendo don Duilio Colantoni (Vicario parrocchiale)</li>
  <li>Reverendo don Juan José Arcila Arteaga (Vicario parrocchiale)</li>
  <li>Molto Reverendo Padre Dario Frattini (2020 - ad multos annos feliciter)</li>
</ul>
`.trim(),
  },
  {
    slug: 'parroco',
    titolo: 'Il Parroco',
    sottotitolo: 'Molto Reverendo Padre Dario Frattini',
    sezione: SezionePagina.PARROCO,
    ordine: 1,
    contenuto: `<p>Parroco della Parrocchia di S. Eligio dal 1° settembre 2020, già membro della Congregazione dei Canonici Regolari dell'Immacolata Concezione.</p>`,
  },
  {
    slug: 'biografia-diacono',
    titolo: 'Reverendo Maurizio Fabrizi',
    sottotitolo: 'Biografia del Diacono',
    sezione: SezionePagina.DIACONO,
    ordine: 1,
    contenuto: `
<p>Nato a Roma il 12 febbraio 1952 da famiglia contadina, cattolica praticante, di tipo patriarcale. Diplomato come perito elettrotecnico, dopo il servizio militare, si trasferisce a Torino per lavorare come macchinista presso le Ferrovie dello Stato, dove conosce Filomena. Si sposano a Napoli il 22 aprile 1976; il 28 aprile 1977 nasceva il primo figlio, Andrea; l'8 dicembre 1979 nasceva Alessio e nel 1991 nasceva Chiara.</p>
<p>Nel febbraio 1983 è tornato a vivere a Roma con la famiglia, al Villaggio Prenestino, a pochi passi dalla parrocchia di Sant'Eligio, dove si sono subito inseriti come catechisti ed animatori di oratorio. Qualche tempo dopo, l'allora parroco Monsignor Rino Cunial gli propose il Diaconato permanente e, sotto la guida di Sua Eccellenza Monsignor Luca Brandolini, iniziò il percorso di formazione per il Diaconato, studiando teologia presso gli Istituti Ecclesia Mater e, per la specializzazione in Pastorale Sanitaria, presso il Camillianum.</p>
<p>Il 20 novembre 1993, nella Patriarcale Arcibasilica di San Giovanni in Laterano, per l'imposizione delle mani di Sua Eminenza il Cardinale Camillo Ruini, riceveva la Grazia del Sacro Ordine del Diaconato. Ha prestato servizio presso la cappellania dell'Ospedale "Carlo Forlanini" fino al 2004, e nelle Liturgie del Santo Padre nella Basilica di San Pietro.</p>
<p>Oggi offre il suo servizio nella Liturgia, nella guida dell'Adorazione Eucaristica serale, nella predicazione delle "10 Parole" e dei "7 Segni di Giovanni", nel corso di preparazione al matrimonio e nel corso di Pastorale Sanitaria.</p>
`.trim(),
  },
  {
    slug: 'caritas-profilo',
    titolo: 'Caritas Parrocchiale — Profilo',
    sezione: SezionePagina.CARITAS,
    ordine: 1,
    contenuto: `
<p>La Caritas di Sant'Eligio è un'emanazione della Caritas Diocesana di Roma nella Parrocchia di S. Eligio. La Caritas è un organismo pastorale istituito al fine di promuovere la carità nelle Parrocchie e nelle comunità in tutte le sue forme. Fondata nel 1979 da mons. Luigi Di Liegro, è espressione dell'impegno della Chiesa di Roma nella testimonianza della solidarietà verso le persone svantaggiate.</p>
<p>Le principali finalità della Caritas di Sant'Eligio sono:</p>
<ul>
  <li>Sensibilizzare la comunità degli abitanti del quartiere a porre la carità come motivo centrale della vita umana e della missione della Chiesa.</li>
  <li>Promuovere lo sviluppo del volontariato quale espressione della solidarietà umana, curandone la preparazione e la formazione permanente.</li>
  <li>Studiare i bisogni presenti sul territorio e le loro cause, per stimolare gli interventi delle istituzioni civili.</li>
  <li>Favorire la formazione degli operatori, cristiani e non, con attenzione privilegiata ai più poveri ed emarginati.</li>
  <li>Contribuire allo sviluppo umano e sociale dei migranti.</li>
</ul>
<p>La Caritas di S. Eligio, come Centro di Ascolto, è impegnata nella città di Roma a indirizzare le persone più svantaggiate ai centri di accoglienza, comunità alloggio, case famiglia, mense sociali e presidi sanitari.</p>
<p><strong>Contatti:</strong> tel. 351 605 7145 — caritas@parrocchiasanteligio.it</p>
`.trim(),
  },
  {
    slug: 'caritas-attivita',
    titolo: 'Caritas Parrocchiale — Attività ed iniziative',
    sezione: SezionePagina.CARITAS,
    ordine: 2,
    contenuto: `
<h3>Distribuzione viveri</h3>
<p>Ogni ultimo giovedì del mese ore 16,30 - 19,00. Occorre presentare il tesserino Caritas.</p>
<h3>Distribuzione indumenti</h3>
<p>Ogni giovedì ore 16,30 – 19,00 (escluso l'ultimo giovedì, riservato alla consegna pacchi viveri). Per consegne e donazioni chiamare il 351 605 7145.</p>
<h3>Assistenza legale</h3>
<p>Ogni martedì pomeriggio, con prenotazione.</p>
<h3>Sportello sociale</h3>
<p>Servizio di assistenza e consulenza (mod. 730 e ISEE, indennità di disoccupazione, assegni e bonus famiglie, legge 104, invalidità civile, colf e badanti, ecc.).</p>
<h3>Comunità di lingua inglese / English language community</h3>
<p>Santa Messa in inglese alle ore 13,00 tutte le domeniche e in tutti i giorni festivi; alle ore 12,30 Santo Rosario in lingua inglese. <em>Holy Mass in English at 1.00 PM every Sunday and on all public holidays; Holy Rosary at 12.30 PM.</em></p>
<h3>Visite mediche periodiche</h3>
<p>In collaborazione con l'Associazione "Non ti scordar di me": per gli adulti, una volta al mese, un camper attrezzato a studio medico (medici dell'Ospedale Gemelli); per i bambini, medici dell'Ospedale Bambino Gesù. Su prenotazione.</p>
<h3>Donazione sangue</h3>
<p>In collaborazione con l'Associazione "Carla Sandri" dell'Ospedale S. Giovanni. Ogni quattro mesi, la domenica.</p>
<h3>Ripetizioni per bambini e ragazzi</h3>
<p>Recupero materie scolastiche per elementari e medie, su prenotazione.</p>
<h3>Orientamento al lavoro</h3>
<p>Aiuto nella compilazione del curriculum per richieste di assunzione. Martedì ore 16,30 - 19,00, solo su appuntamento.</p>
<h3>Raccolta medicinali (non scaduti)</h3>
<p>Portati alla Farmacia Caritas di via Marsala per essere consegnati ai malati che non possono permettersi di acquistarli.</p>
`.trim(),
  },
  {
    slug: 'consultorio-progetto',
    titolo: 'Consultorio Familiare "Agape" — Il progetto',
    sottotitolo: 'Un Consultorio a servizio della periferia',
    sezione: SezionePagina.CONSULTORIO,
    ordine: 1,
    contenuto: `
<p>Questo progetto nasce nell'aprile 2022 per dare un sostegno concreto alle famiglie attraverso uno spazio dedicato all'ascolto e all'accoglienza della persona, della coppia e dell'intera famiglia, a conclusione dell'anno Pastorale voluto da Papa Francesco "Famiglia Amoris Laetitia".</p>
<p>Il Consultorio Familiare Agape si rivolge come consultorio socio-educativo a tutti coloro che stanno attraversando un periodo di disagio personale, familiare o relazionale, aiutandoli ad attivare le proprie risorse con il supporto di consulenti familiari® e altri professionisti.</p>
<p>L'11 febbraio 2023 il Consultorio è diventato un'associazione di volontariato formata da un'équipe multidisciplinare. È un ente del Terzo settore, aderisce all'UCIPEM e alla Confederazione Italiana dei Consultori Familiari d'Ispirazione cristiana.</p>
`.trim(),
  },
  {
    slug: 'consultorio-contatti',
    titolo: 'Consultorio Familiare Agape ODV — Contatti',
    sezione: SezionePagina.CONSULTORIO,
    ordine: 2,
    contenuto: `
<p>Si riceve previo appuntamento.</p>
<ul>
  <li>Telefono: 371 565 9649</li>
  <li>Sito: www.consultoriofamiliareagape.it</li>
  <li>E-mail: info@consultoriofamiliareagape.it</li>
  <li>E-mail Direttore: direttore@consultoriofamiliareagape.it</li>
  <li>PEC: consultoriofamiliareagape@pec.it</li>
</ul>
`.trim(),
  },
  {
    slug: 'consiglio-pastorale',
    titolo: 'Consiglio Pastorale Parrocchiale',
    sezione: SezionePagina.ORGANISMI,
    ordine: 1,
    contenuto: `<p>Lunedì 20 gennaio 2025, alle 20,45, si è tenuta la prima seduta del Consiglio Pastorale Parrocchiale.</p>`,
  },
  {
    slug: 'consiglio-affari-economici',
    titolo: 'Consiglio per gli Affari Economici',
    sezione: SezionePagina.ORGANISMI,
    ordine: 2,
    contenuto: `<p>Sono state avviate le procedure per la creazione del nuovo Consiglio per gli Affari Economici.</p>`,
  },
  {
    slug: 'corso-prebattesimale',
    titolo: 'Sacramento del Battesimo',
    sottotitolo: 'Corso di preparazione',
    sezione: SezionePagina.SACRAMENTI,
    ordine: 1,
    contenuto: `<p>La preparazione al Sacramento del Battesimo verrà erogata direttamente da Padre Dario, con tempi e modalità concordati insieme a lui nel momento in cui si stabilirà la data del Battesimo.</p>`,
  },
  {
    slug: 'contatti',
    titolo: 'Contatti',
    sezione: SezionePagina.ALTRO,
    ordine: 1,
    contenuto: `
<p><strong>Parrocchia S. Eligio</strong> — XVIII Prefettura, Settore Est — Diocesi di Roma</p>
<ul>
  <li>Via Fosso dell'Osa, 435 - 00132 Roma (RM)</li>
  <li>Telefono: 06 2261045</li>
  <li>E-mail: info@parrocchiasanteligio.it</li>
  <li>PEC: parrocchia.s.eligio@pec.it</li>
  <li>Codice fiscale: 80175070582</li>
  <li>Partita IVA (dell'ex scuola): 07343301003</li>
</ul>
`.trim(),
  },
  {
    slug: 'orari-servizi',
    titolo: 'Orari di servizio',
    sezione: SezionePagina.ALTRO,
    ordine: 2,
    contenuto: `
<ul>
  <li><strong>Confessioni:</strong> ogni venerdì dalle 16,00 alle 18,00</li>
  <li><strong>Adorazione Eucaristica:</strong> ogni giovedì dalle 9,00 alle 20,45</li>
  <li><strong>Lodi e Vespri:</strong> dal lunedì al venerdì alle 8,30 e alle 19,00</li>
  <li><strong>Ufficio Parrocchiale:</strong> dal lunedì al venerdì dalle 16,30 alle 18,00; il sabato dalle 10,00 alle 12,00</li>
  <li><strong>Giardino di Giada:</strong> dal lunedì al sabato dalle 16,00 alle 19,00</li>
</ul>
`.trim(),
  },
  {
    slug: 'stradario',
    titolo: 'Stradario del territorio parrocchiale',
    sezione: SezionePagina.PARROCCHIA,
    ordine: 4,
    contenuto: `
<ul>
  <li>Via Acciano – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Aielli – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Ateleta – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Balsorano – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Barete – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Barrea – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Borrello – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Bucchianico – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Bugnara – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Canosa Sannita – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Canzano – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Carpinone – 00132 – Lunghezza (RM) ( numeri dispari )</li>
  <li>Via Casacanditella – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Casalanguida – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Castel Frentano – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Castel di Sangro – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Castelmauro – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Cermignano – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Civitella Alfedena – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Collecorvino – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Colledara – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Crecchio – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Crognaleto – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Cugnoli – 00132 – Lunghezza (RM)</li>
  <li>Via Cupello – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Don Pirro Scavizzi – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Duronia – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Fara S. Martino – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Filetto – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Fontecchio – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Frisa – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Furci – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Gambereale – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Gessopalena – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Gissi – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Guardialfiera – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Larino – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Lentella – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Lettopalena – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Lucito – 00132 – Lunghezza (RM)</li>
  <li>Via Macchiagodena – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Mafalda – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Massa d’Albe – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Montagano – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Montaquila – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Montazzoli – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Montefino – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Montelapiano – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Montemitrio – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Notaresco – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Oricola – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Palena – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Pennadomo – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Perano – 00132 – ROMA ( tutti i numeri da 1 a 9, pari dal 10 al 30 )</li>
  <li>Via Pescolanciano – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Pietrabbondante – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Pietranico – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Pizzo Ferrato – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Pollutri – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Prenestina – 00132 – ROMA ( numeri dispari da 1631 a 1791 )</li>
  <li>Via Rapino – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Rocca di Botte – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Rocca di Cambio – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Roccaspinalveti – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Roccavivara – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Roio del Sangro – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Schiavi di Abruzzo – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Sepino – 00132 – Lunghezza (RM)</li>
  <li>Via Sessano – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Tollo – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Treglio – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Vastogirardi – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Villalfonsina – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Villamagna – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via Vinchiaturo – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via del Fosso Scilicino – 00132 – Castelverde di Lunghezza (RM) ( tutti i numeri da 7 a 61 )</li>
  <li>Via del Fosso dell’Osa – 00132 – ROMA ( numeri pari e i dispari fino a 601 )</li>
  <li>Via della Riserva Nuova – 00132 – Castelverde di Lunghezza (RM)</li>
  <li>Via delle Cerquete – 00132 – ROMA ( numeri dispari da 143 in poi, pari da 146 )</li>
</ul>
`.trim(),
  },
];
