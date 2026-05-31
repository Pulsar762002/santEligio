# Analisi del vecchio sito (`old/`)

Snapshot del sito attualmente online **parrocchiasanteligio.it** (site-builder tipo
Jimdo), catturato a gennaio 2026 con "Salva pagina con nome". Per ogni pagina c'è un
file `.html` (~120–200 KB, pieno di boilerplate del builder) e una cartella `_files`
con gli asset (CSS, JS, immagini `.webp`, SVG).

Questo documento riassume **il contenuto da migrare** nel nuovo stack
Angular 17 + NestJS + MongoDB, e la mappatura verso il modello dati.

> I contenuti testuali puliti, pronti per il seed, sono in
> `backend/src/seed-data/` (`pagine.ts`, `gruppi.ts`, `orari-messe.ts`).
> Si caricano con `npm run seed:contenuti` (vedi sotto).

---

## 1. Dati anagrafici (header/footer ripetuti su ogni pagina)

| Campo | Valore |
|---|---|
| Denominazione | Parrocchia S. Eligio — XVIII Prefettura, Settore Est, Diocesi di Roma |
| Indirizzo | Via Fosso dell'Osa, 435 — 00132 Roma (RM) |
| Telefono | 06 2261045 |
| E-mail | info@parrocchiasanteligio.it |
| PEC | parrocchia.s.eligio@pec.it |
| Codice fiscale | 80175070582 |
| Partita IVA (ex scuola) | 07343301003 |
| Caritas | tel. 351 605 7145 · caritas@parrocchiasanteligio.it |
| Consultorio Agape ODV | tel. 371 565 9649 · www.consultoriofamiliareagape.it |

## 2. Orari

### Sante Messe (→ collezione `orari_messe`)

| Giorno | Ora | Tipo |
|---|---|---|
| Lunedì, Martedì, Mercoledì, Venerdì | 18,30 | feriale |
| Giovedì | 8,30 | feriale |
| Sabato e prefestivi | 18,30 | prefestiva |
| Domenica e festivi | 8,30 · 11,00 · 19,00 | festiva |
| Messa in inglese (English-speaking community) | Domenica e festivi 13,00 (Rosario 12,30) | festiva |

### Altri orari di servizio (in homepage come testo libero)

- **Confessioni**: ogni venerdì 16,00–18,00
- **Adorazione Eucaristica**: ogni giovedì 9,00–20,45
- **Lodi e Vespri**: lun–ven 8,30 e 19,00
- **Ufficio parrocchiale**: lun–ven 16,30–18,00, sabato 10,00–12,00
- **Giardino di Giada**: lun–sab 16,00–19,00

> Questi orari non-messa sono salvati come pagina `orari-servizi` (sezione *altro*).

## 3. Mappatura pagine → modello dati

### Pagine statiche (→ collezione `pagine`, nuovo modulo)

| Slug | Sezione | Titolo | Stato originale |
|---|---|---|---|
| `storia-parrocchia` | parrocchia | Storia della Parrocchia di S. Eligio | completo |
| `santo-patrono` | parrocchia | Sant'Eligio di Noyon | completo |
| `storico-parroci` | parrocchia | Elenco dei Parroci | completo |
| `stradario` | parrocchia | Stradario del territorio | completo (~80 vie) |
| `parroco` | parroco | Padre Dario Frattini | intro |
| `biografia-parroco` | parroco | Biografia Parroco | *pagina in costruzione* |
| `biografia-diacono` | diacono | Rev. Maurizio Fabrizi | completo |
| `caritas-profilo` | caritas | Profilo Caritas | completo |
| `caritas-attivita` | caritas | Attività ed iniziative Caritas | completo |
| `caritas-news` | caritas | News Caritas | placeholder |
| `consultorio-progetto` | consultorio | Il progetto (Agape) | completo |
| `consultorio-contatti` | consultorio | Contatti Consultorio | completo |
| `consiglio-pastorale` | organismi | Consiglio Pastorale | breve |
| `consiglio-affari-economici` | organismi | Consiglio Affari Economici | breve |
| `corso-prebattesimale` | sacramenti | Sacramento del Battesimo | completo |
| `contatti` | altro | Contatti | completo |
| `orari-servizi` | altro | Orari di servizio | completo |

> Le 4 pagine *"…nel Codice di Diritto Canonico"* e *"…nel Catechismo della Chiesa
> Cattolica"* (Parroco/Diacono) sono testi canonici generici (CCC nn. 871+, CDC
> can. 273+), 700+ righe l'una. **Non** sono incluse nel seed iniziale: si potranno
> aggiungere come pagine in un secondo momento se ritenute utili.

### Gruppi e movimenti (→ collezione `gruppi`, nuovo modulo)

Tre aree:

- **Liturgia**: Comunità Neocatecumenale, Coro, Liturgia e decoro, Maria Madre del
  Verbo Incarnato, Ministranti, Ministri Straordinari della Comunione, SBM –
  Sognatori di Buona Musica
- **Catechesi**: Educatori gruppi DopoCresima, Famiglie della Catechesi, Genitori
  Battezzati, Gruppo Giovani, Movimento Familiare Cristiano
- **Carità**: Amici per sempre, Caritas, Comitato per la Festa di S. Eligio,
  Consultorio Familiare "Agape ODV", Gruppi per la pulizia, Mamme del Laboratorio,
  Vigilantes del Giardino di Giada

### Eventi / catechesi (→ collezione `eventi`, modulo esistente)

- Catechismo Iniziazione Cristiana, Corso precresima, Corso prematrimoniale: calendari
  dettagliati **dell'anno 2025** (date specifiche, già passate). Utili come *template*,
  non come dati live → da reinserire come eventi reali a inizio anno pastorale.

## 4. Funzionalità dinamiche da ricreare

| Funzione | Stato nel nuovo stack |
|---|---|
| **Intenzioni di preghiera** (form pubblico → offerta in S. Messa) | nuovo modulo `intenzioni-preghiera` (POST pubblico, gestione admin) |
| **Calendario attività** (embed Google Calendar) | da reincorporare nel frontend |
| **Calendario MFC** (embed Google Calendar) | da reincorporare nel frontend |
| **Fotogallery** (insediamento Padre Dario) | usare `uploads` + collezione `media` |
| **Calendario PDF mensile** scaricabile in home | usare `uploads` |

I due embed Google Calendar (URL completi con i calendar-id in base64) sono in
`old/Calendario - parrocchiasanteligio.html` e
`old/Attività ed iniziative MFC - parrocchiasanteligio.html`.

## 5. Gap coperti da questa iterazione

Il backend aveva solo `news`, `eventi`, `orari-messe`, `uploads`. Con questa iterazione
vengono aggiunti i moduli mancanti:

- ✅ `pagine` — contenuti statici (CRUD + lettura per slug)
- ✅ `gruppi` — gruppi e movimenti, raggruppati per area
- ✅ `intenzioni-preghiera` — POST pubblico + gestione protetta

Le collezioni `sacramenti` e `media` esistono già in `mongo-init/01-init.js` ma non
hanno ancora un modulo dedicato: i contenuti dei sacramenti sono per ora gestiti come
`pagine` (sezione *sacramenti*) ed `eventi`.

## 6. Come caricare i contenuti

```bash
make shell-backend
npm run build            # se non già buildato
npm run seed:contenuti   # idempotente: pagine, gruppi, orari messe
```
