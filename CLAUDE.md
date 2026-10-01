# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Parish website for Parrocchia di Sant'Eligio — stack: **Angular 17** (frontend) · **NestJS** (backend API) · **MongoDB 7** · **Nginx** · **Docker Compose** · **TypeScript** throughout.

Both the NestJS backend and Angular frontend are scaffolded and ready.

## Development commands

```bash
# Start full dev stack (hot-reload, all services)
make dev                     # docker compose --profile dev up --build

# Start in background
make dev-bg

# Production build
make prod                    # docker compose -f docker-compose.yml up --build -d

# Logs
make logs                    # all services
make logs-backend

# Backend tests (Jest, no DB — dependencies are mocked)
cd backend && npm test       # run the full suite
cd backend && npm run test:watch

# Interactive shells
make shell-backend           # NestJS container
make shell-mongo             # mongosh in MongoDB container

# Teardown
make stop                    # keep volumes
make clean-all               # ⚠️  deletes volumes/data too
```

### First-time setup

```bash
cp .env.example .env
# Edit .env — MONGO_ROOT_PASSWORD is required (marked :?err)
# For local dev, generate self-signed SSL:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem -out nginx/ssl/fullchain.pem -subj "/CN=localhost"
```

### Create the first admin user

The DB has no admin out of the box. After the backend image is built, seed one (idempotent):

```bash
# set ADMIN_EMAIL / ADMIN_PASSWORD in .env first
make shell-backend
npm run seed            # runs node dist/seed → creates the admin in the `utenti` collection
npm run seed:contenuti  # runs node dist/seed-contenuti → carica pagine/gruppi/orari dal vecchio sito (idempotente)
```

Mongoose collection names are pinned explicitly via `@Schema({ collection: ... })`
(`utenti`, `eventi`, `orari_messe`, `news`, `pagine`, `gruppi`, `intenzioni_preghiera`, `calendario_attivita`, `calendario_intestazioni`, `grest_iscritti`, `grest_impostazioni`, `proposte`) so they match the validators and indexes
declared in `mongo-init/01-init.js`. Do not rely on Mongoose's default pluralization.

## Local dev URLs

| Service        | URL                       |
|----------------|---------------------------|
| Frontend       | http://localhost:4200     |
| Backend API    | http://localhost:3000/api |
| Nginx proxy    | http://localhost:8088     |
| Mongo Express  | http://localhost:8081     |

## Architecture

```
frontend/   ← Angular 17 SPA (standalone components, signals)
backend/    ← NestJS API (Mongoose, Passport JWT)
nginx/      ← Reverse proxy config
mongo-init/ ← DB bootstrap script (runs once on first container start)
```

### Docker Compose — dev vs prod

- `docker-compose.yml` — production only; frontend builds as static files into a shared volume (`frontend_build`) that Nginx serves.
- `docker-compose.override.yml` — automatically merged in development; mounts source directories as volumes for hot-reload (`backend/` → `/app`, `frontend/` → `/app`), exposes ports 3000 and 4200 directly.
- The `dev` profile is required for Mongo Express: `--profile dev`.

### Nginx routing

- `/api/` → proxied to `backend:3000/api/` (with rate limiting)
- `/uploads/` → static files from the `uploads_data` volume (images, PDFs)
- `/` → Angular SPA (`dist/frontend/browser`), with `try_files` SPA fallback

### MongoDB

Database: `santeligio`. The init script (`mongo-init/01-init.js`) creates:
- Application user `santeligio_app` (readWrite on `santeligio` DB) — backend should connect with this user, not root
- Collections with schema validation: `news`, `eventi`
- Plain collections: `orari_messe`, `sacramenti`, `gruppi`, `pagine`, `media`, `utenti`
- Plain collection: `intenzioni_preghiera`
- Plain collection: `calendario_attivita` — calendario mensile delle attività (messe/eventi generati + record manuali)
- Plain collection: `calendario_intestazioni` — titolo/descrizione per mese mostrati nel PDF del calendario (unique `{anno, mese}`)
- Indexes: `news.createdAt`, `news.{categoria,pubblicato}`, `eventi.dataInizio`, `utenti.email` (unique), `pagine.slug` (unique), `pagine.{sezione,ordine}`, `gruppi.{area,ordine}`, `intenzioni_preghiera.createdAt`, `calendario_attivita.data`, `calendario_attivita.{fonte,fonteRifId}`, `calendario_intestazioni.{anno,mese}` (unique)

The `news` collection uses `categoria` enum: `liturgia | catechismo | caritas | eventi | comunicati`.

### NestJS modules and API

All routes are prefixed with `/api`. GET endpoints are public; write operations require `Authorization: Bearer <token>` **and the admin role** unless the route says otherwise (see **Ruoli e permessi**).

| Module | Routes |
|---|---|
| `auth` | `POST /api/auth/login` → `{ access_token }`; `GET /api/auth/me` (profilo: ruolo, aree), `PUT /api/auth/password` (qualsiasi ruolo) |
| `utenti` | solo admin: `GET/POST /api/utenti`, `PATCH/DELETE /api/utenti/:id`, `PUT /api/utenti/:id/password`, `GET /api/utenti/aree` |
| `aree` | staff: `GET /api/aree` (le mie aree), `GET|PUT /api/aree/:area/contenuto`, `GET|POST /api/aree/:area/eventi`, `PATCH|DELETE /api/aree/:area/eventi/:id`; `GET /api/proposte[?stato=]`, `POST /api/proposte/:id/{approva|rifiuta}` (admin/responsabile) |
| `news` | `GET /api/news[?categoria=&tutti=true]`, `GET /api/news/:id`, `POST/PATCH/DELETE` (JWT) |
| `eventi` | `GET /api/eventi[?tutti=true]`, `GET /api/eventi/prossimi[?limit=5]`, `GET /api/eventi/:id`, `POST/PATCH/DELETE` (JWT) |
| `orari-messe` | `GET /api/orari-messe[?tipo=feriale\|festiva\|prefestiva]`, `GET /api/orari-messe/:id`, `POST/PATCH/DELETE` (JWT) |
| `media` | `POST /api/media` (JWT staff: admin/responsabile/contributor, multipart `file` field) → record Media `{ url, ... }`, `GET /api/media` (JWT), `DELETE /api/media/:id` (JWT) — libreria file; ogni upload è tracciato nella collection `media` e cancellabile (rimuove anche il file dal disco) |
| `stradario` | `GET /api/stradario` (pubblico) — vie del territorio per contrada (collection `stradario`, seed-managed); reso da `/p/stradario` |
| `galleria` | `GET /api/galleria/categorie`, `GET /api/galleria[?categoria=]` (pubblici); `POST/PATCH/DELETE /api/galleria/categorie[/:id]` e `POST/PATCH/DELETE /api/galleria[/:id]` (JWT) — categorie + item foto/video (collections `galleria_categorie`, `galleria`); eliminando una categoria si cancellano i suoi item. Reso da `/galleria` |
| `pagine` | `GET /api/pagine[?sezione=&tutte=true]`, `GET /api/pagine/:slug`, `POST/PATCH/DELETE` (JWT) — contenuti statici |
| `gruppi` | `GET /api/gruppi[?area=liturgia\|catechesi\|carita&tutti=true]`, `GET /api/gruppi/:id`, `POST/PATCH/DELETE` (JWT) |
| `intenzioni-preghiera` | `POST /api/intenzioni-preghiera` (**pubblico**), `GET`, `PATCH /:id` (segna `letta`), `DELETE /:id` (JWT) |
| `calendario-attivita` | `GET /api/calendario-attivita[?anno=&mese=&tutti=true]` (default mese corrente), `GET /api/calendario-attivita/:id`, `POST/PATCH/DELETE` (JWT) — voci manuali; `POST /api/calendario-attivita/genera[?anno=&mese=]` (JWT) — genera additivamente le voci mancanti dalle messe ricorrenti (`orari_messe`) e dagli eventi pubblicati del mese, senza mai sovrascrivere/cancellare voci esistenti. Reso da `/calendario` (pubblico) e `/admin/calendario` |
| `calendario-intestazioni` | `GET /api/calendario-intestazioni[?anno=&mese=]` (pubblico, `null` se assente), `PUT /api/calendario-intestazioni?anno=&mese=` (JWT, body `{ titolo, descrizione }`, upsert; entrambi vuoti = rimozione) — intestazione del mese nel PDF del calendario, subito sotto la riga del mese; editabile in `/admin/calendario` |
| `grest` | Portale iscrizioni Grest per le famiglie (vedi sezione **Grest** sotto) |

`CategoriaNews` enum: `liturgia \| catechismo \| caritas \| eventi \| comunicati`

`SezionePagina` enum: `parrocchia \| parroco \| diacono \| caritas \| consultorio \| organismi \| sacramenti \| gruppi \| altro`. `AreaGruppo` enum: `liturgia \| catechesi \| carita`.

`TipoAttivita` enum (calendario): `messa \| evento \| catechesi \| carita \| liturgia \| altro`. `FonteAttivita` enum: `messa \| evento \| manuale` — impostata solo dal server, mai dal DTO client.

I contenuti del vecchio sito (`old/`) sono estratti in `src/seed-data/` (`pagine.ts`, `gruppi.ts`, `orari-messe.ts`, `stradario.ts`) e caricati con `npm run seed:contenuti` (idempotente, upsert su slug/nome/ordine/via). Vedi `old/ANALISI.md`.

### Key env vars

| Variable | Notes |
|---|---|
| `MONGO_ROOT_PASSWORD` | Required (`:?err`); root MongoDB password |
| `MONGO_APP_PASSWORD` | Required (`:?err`); used by both the init script (creates `santeligio_app` user) and the backend MONGO_URI |
| `JWT_SECRET` | Must be ≥ 64 chars random string |
| `MONGO_URI` | Auto-set in docker-compose; override only if needed |
| `UPLOAD_MAX_SIZE_MB` | Backend file upload limit |


## Ruoli e permessi

- **Ruoli** (`utenti.ruolo`, `backend/src/auth/ruoli.ts`): `admin` (tutto), `responsabile` (pubblica pagina ed eventi delle sue aree, approva i contributor), `contributor` (propone modifiche alle sue aree: diventano `proposte` da approvare), `utente` (login senza pannello). `utenti.aree` = chiavi di `backend/src/aree/aree.registry.ts` (voci di Organizzazione + `grest`); il Grest si assegna solo ai responsabili.
- **`JwtAuthGuard` è "solo admin" per default**: le rotte aperte ad altri ruoli usano `@Ruoli(...)` e, se serve, `@PerArea('grest')`. `JwtStrategy` rilegge l'utente dal DB a ogni richiesta (ruolo/aree aggiornati, utenti disattivati bloccati subito).
- **Aree**: pagina = `pagine.slug` uguale alla chiave (creata al primo salvataggio, sezione `organismi`); `giardino-di-giada` è un `gruppo`. Gli eventi hanno il campo `area`; le API `/api/aree/:area/...` vedono solo quelli dell'area.
- **Approvazioni**: un contributor che salva crea un documento in `proposte` (`in_attesa`); il sito mostra la versione precedente finché un responsabile dell'area (o un admin) non approva — solo allora la modifica viene applicata. I contributor non eliminano eventi.
- Nessun admin può togliersi il ruolo o eliminarsi e deve restare sempre almeno un admin attivo. `npm run seed` crea l'admin iniziale.
- **Account principale protetto**: l'utente con email `ADMIN_EMAIL` (quello di `npm run seed`) non può essere eliminato, disattivato né cambiare ruolo da nessuno (`UsersService.protetto`); nell'elenco ha `protetto: true` e nessun tasto Elimina. Nome e password restano modificabili.
- **Frontend**: `AuthService.me()` (da `/auth/me`) con `isAdmin/isStaff/puoGestireGrest/puoApprovare`; guard `adminGuard` (solo admin), `staffGuard` (pannello), `grestAdminGuard`, `loggatoGuard`. Pagine `/admin/utenti`, `/admin/aree`, `/admin/aree/:area`, `/admin/approvazioni`, `/profilo`.

## Grest (iscrizioni famiglie)

Portato dal vecchio portale Express+SQLite (`~/portals/grest` sul server) dentro questo progetto.

- **Collection** `grest_iscritti` (schema `backend/src/grest/schemas/grest-iscritto.schema.ts`): un documento per bambino/a = account famiglia, con sottodocumenti `autorizzazione` e `delega`. I nomi dei campi ricalcano le vecchie colonne SQLite (`nomePadre`, `mobilePhonePadre`, ...); `legacyId` = vecchio `users.id`.
- **Auth famiglie separata**: `POST /api/grest/login` firma con `GREST_JWT_SECRET` (o derivato da `JWT_SECRET`) e strategy passport `grest-jwt` (`GrestJwtGuard`). Un token famiglia NON passa `JwtAuthGuard` e viceversa. Password bcrypt; username = CamelCase di nome+cognome del figlio, login case-insensitive (`usernameLower`).
- **Rotte**: pubbliche `GET /api/grest/stato`, `POST /api/grest/registrazione`, `GET|POST /api/grest/attivazione` (link email monouso), `POST /api/grest/login`; famiglia (`GrestJwtGuard`) `GET /api/grest/me`, `PUT /api/grest/me/{iscrizione|autorizzazione|delega|password}`, `GET /api/grest/me/moduli/:modulo` (PDF); admin (`JwtAuthGuard`) `GET /api/grest/admin/iscritti[.csv]`, `GET /api/grest/admin/iscritti/:id[/moduli/:modulo]`, `POST /api/grest/admin/iscritti/:id/link-password`, `DELETE /api/grest/admin/iscritti/:id`, `GET|PUT /api/grest/admin/impostazioni` (apertura iscrizioni).
- **PDF**: i valori dei segnaposto `{{...}}` si leggono dal DB (mai dal client), si compila il `content.xml` dei template `backend/assets/grest/<modulo>_<GREST_ANNO>.odt` e si converte con il servizio **`gotenberg`** (LibreOffice, solo rete interna). Logica di sostituzione = vecchio `generatePDF`, con escape XML.
- **Import dal vecchio DB**: `npm run seed:grest -- export.json` (JSON `{users, autorizzazioni, deleghe}` da `sqlite3 -json`); idempotente su `legacyId`, cifra le vecchie password in chiaro, alla fine riconfronta ogni campo.
- **Frontend**: `/grest/accedi`, `/grest/registrazione`, `/grest/attivazione?token=`, `/grest/area` (`grestGuard`), `/admin/grest`; il riquadro di accesso compare sotto la pagina CMS `/p/grest` (`GrestCtaComponent`). `authInterceptor` manda il token Grest alle chiamate `/grest/` (non `/grest/admin/`) e il token admin a tutto il resto.
- **Gestione**: `/admin/grest` è aperta ad admin e responsabili con area `grest` (`@Ruoli('admin','responsabile') @PerArea('grest')`); i responsabili possono modificare iscrizione/autorizzazione/delega (`PUT /api/grest/admin/iscritti/:id/{iscrizione|autorizzazione|delega}`) ma non le dichiarazioni di consenso della famiglia.
- **Accesso ristretto**: `grest_impostazioni.accessoRistretto` + `grest_iscritti.abilitato` (`PATCH /api/grest/admin/iscritti/:id/abilitato`): se attivo entrano solo gli abilitati; `GrestJwtStrategy` ricontrolla a ogni richiesta.
- **Apertura iscrizioni**: interruttore in `/admin/grest`, salvato nella collection `grest_impostazioni` (documento unico `chiave: 'grest'`); finché l'admin non lo usa vale `GREST_ISCRIZIONI_APERTE`. Il limite `GREST_MAX_ISCRITTI` blocca comunque.
- **Nuova edizione**: aggiornare i template ODT in `backend/assets/grest/`, `GREST_ANNO`, `GREST_MAX_ISCRITTI` e i testi legati all'anno in `frontend/src/app/core/models/grest.model.ts` (`TESTO_USCITA1`, `NOTA_CONSEGNA_DELEGA`).

## SSL / Certbot

- Certificati in `./data/certbot/conf/live/santeligio.it/` (bind mount, escluso da git via `data/`)
- **Prod**: nginx monta `./data/certbot/conf:/etc/letsencrypt` — cert path: `/etc/letsencrypt/live/santeligio.it/`
- **Dev**: l'override monta `./nginx/ssl:/etc/letsencrypt/live/santeligio.it` → stesso nginx.conf funziona in entrambi
- `certbot/init-letsencrypt.sh` — issuance prima volta (crea cert dummy, avvia nginx, ottiene cert reale, reload)
- Il servizio `certbot` in docker-compose rinnova automaticamente ogni 12h; dopo il rinnovo fare `make reload-nginx`
- ACME challenge HTTP-01 servita da nginx su `/var/www/certbot` (volume `./data/certbot/www`)

## CI/CD (GitHub Actions)

Repo remoto: `https://github.com/Pulsar762002/santEligio.git` (`origin`, branch `main`).

Pipeline in `.github/workflows/ci-cd.yml`:

| Job | Trigger | Cosa fa |
|---|---|---|
| `backend` | ogni push / PR su `main` | `npm ci` → `npm run build` → `npm test` (68 smoke test) |
| `frontend` | ogni push / PR su `main` | `npm ci` → `ng build --configuration production` |
| `deploy` | push su `main` (dopo CI verde) | SSH nel server → `git checkout main` + `git pull --ff-only` → `docker compose -f docker-compose.behind-proxy.yml up --build -d` (mai `docker-compose.yml`: pubblicherebbe 80/443, già occupate dall'Nginx host) |

**Secrets GitHub da configurare** (Settings → Secrets → Actions):

| Secret | Valore |
|---|---|
| `SSH_HOST` | IP o hostname del server |
| `SSH_USER` | utente SSH |
| `SSH_PRIVATE_KEY` | chiave privata SSH (contenuto di `~/.ssh/id_rsa`) |
| `DEPLOY_PATH` | path assoluto del progetto sul server (es. `/srv/santeligio`) |

Il server deve avere già `.env` e `nginx/ssl/` configurati — il deploy fa solo `git pull` + rebuild.

## Frontend conventions (Angular 17)

- All components are standalone — no NgModule. Import dependencies explicitly per component.
- Use `inject()` in field initializers, not constructor injection.
- Use `toSignal()` from `@angular/core/rxjs-interop` to bridge HTTP observables to signals. Always pass `{ initialValue: [] }` (or a typed default) to avoid `undefined` signal values where the template iterates.
- New control flow: `@if` / `@for` / `@else` — do **not** import `NgIf`/`NgFor`.
- `DatePipe`, `TitleCasePipe` etc. must be listed in each component's `imports` array.
- Global design tokens are CSS custom properties defined in `src/styles.scss` (`--color-primary`, `--font-heading`, etc.).
- `environment.apiUrl` is `http://localhost:3000/api` in dev, `/api` in prod (proxied by Nginx).
- All Angular build tools (`@angular/cli`, `@angular-devkit/build-angular`, `@angular/compiler-cli`) are in `dependencies` (not devDependencies) because the Dockerfile runs `npm ci --omit=dev` before `ng build`. Note: `@angular/build` is Angular 18+; Angular 17 uses `@angular-devkit/build-angular`.

### Frontend routes

| Path | Component |
|---|---|
| `/` | `HomeComponent` — hero + latest 3 news + upcoming 3 events |
| `/notizie` | `NewsListComponent` — filterable by categoria |
| `/notizie/:id` | `NewsDetailComponent` |
| `/eventi` | `EventiComponent` — card eventi cliccabili (passati e futuri) |
| `/eventi/:id` | `EventDetailComponent` — dettaglio singolo evento |
| `/orari-messe` | `OrariMesseComponent` — grouped by tipo (festiva / prefestiva / feriale) |
| `/parrocchia` | `ParrocchiaComponent` — hub: pagine statiche raggruppate per sezione |
| `/parrocchia/:sezione` | `ParrocchiaComponent` — pagine della singola sezione come card (navbar dropdown "La Parrocchia") |
| `/gruppi` | `GruppiComponent` — gruppi e movimenti raggruppati per area |
| `/gruppi/:area` | `GruppiComponent` — gruppi della singola area come card (navbar dropdown "Gruppi") |
| `/galleria` | `GalleriaComponent` — foto/video per categoria; popup con sfondo sfocato (video YouTube/Vimeo via iframe o file via `<video>`) |
| `/intenzioni-preghiera` | `IntenzioniPreghieraComponent` — form pubblico di invio intenzione |
| `/calendario` | `CalendarioComponent` — calendario mensile delle attività, agenda raggruppata per giorno, navigazione mese |
| `/p/stradario` | `StradarioComponent` — vie del territorio raggruppate per contrada (rotta dedicata, prima della generica) |
| `/p/:slug` | `PaginaComponent` — render generico di una pagina statica (HTML via `[innerHTML]`) |
| `/admin/login` | `AdminLoginComponent` |
| `/admin` | `AdminDashboardComponent` — protected by `authGuard` |
| `/admin/calendario` | `AdminCalendarioComponent` — genera/gestisce il calendario mensile delle attività (protected) |
| `/grest/accedi`, `/grest/registrazione`, `/grest/attivazione`, `/grest/area` | Portale famiglie Grest (vedi sezione Grest) |
| `/admin/grest` | `AdminGrestComponent` — iscritti Grest, PDF, CSV, link password, accesso/abilitazioni, modifica dati (admin + responsabili Grest) |
| `/admin/utenti` | `AdminUtentiComponent` — utenti, ruoli e aree (solo admin) |
| `/admin/aree`, `/admin/aree/:area` | aree assegnate: pagina ed eventi (staff) |
| `/admin/approvazioni` | proposte dei contributor da approvare / stato delle proprie (staff) |
| `/profilo` | profilo e cambio password (qualsiasi utente collegato) |

## Backend conventions (NestJS)

- Runs on port 3000; all routes prefixed with `/api`
- Uploads stored at `/app/uploads` (mounted as `uploads_data` volume, also shared with Nginx)
- Production image runs as non-root user `appuser`
- `npm run build` → `dist/`, production entry: `node dist/main`
- Dev: `npm run start:dev` (NestJS watch mode)
- First admin user: `npm run seed` (reads `ADMIN_EMAIL` / `ADMIN_PASSWORD`, idempotent — see First-time setup)

### Testing

- Jest (`*.spec.ts` next to the file under test); run with `npm test`. Requires `@types/jest` (in devDependencies).
- Unit/smoke tests only — Mongoose models and other deps are mocked (`getModelToken`, `useValue`), so **no MongoDB is needed** and the suite runs in seconds. The CI `backend` job runs it on every push/PR.
- Covered: `auth` (incl. ruoli in `JwtAuthGuard`), `utenti`, `aree` (approvazioni), `grest`, `news`, `eventi`, `orari-messe`, `calendario-attivita`, `calendario-intestazioni` (services + controllers). `media` upload is left uncovered (pure Multer config).
- Pattern: build the testing module with `Test.createTestingModule`, inject mocked collaborators, assert the query filter/sort passed to the model and that `NotFoundException` is thrown on missing ids.

## Mobile app (Capacitor)

Same Angular SPA, wrapped natively for Android (and, in future, iOS) via [Capacitor](https://capacitorjs.com). No parallel UI codebase: the app is the production frontend build, pointed at the real API. Public pages only — no admin in the app.

- `frontend/src/environments/environment.capacitor.ts` — sets `apiUrl` to the **absolute** `https://parrocchiasanteligio.it/api` (inside the app there's no same-origin Nginx to resolve `/api` for you).
- `frontend/angular.json` — build configuration `capacitor` (extends `production`, swaps in the environment above via `fileReplacements`).
- `frontend/capacitor.config.ts` — `appId: it.parrocchiasanteligio.app`, `webDir: dist/frontend/browser`.
- `frontend/android/` — native Android project (generated by `npx cap add android`; do not edit generated files except where noted below). Build artifacts, `local.properties`, and the copied web bundle (`app/src/main/assets/public`) are gitignored — regenerate with `cap sync`.
- `frontend/resources/{icon,splash}.png` — source images for `@capacitor/assets` (currently a placeholder crop of `santeligio-patrono.jpg`; replace with a proper square logo when available, then rerun `npx capacitor-assets generate --android`).
- `frontend/android/app/build.gradle` has one hand-added block: excludes `kotlin-stdlib-jdk7`/`-jdk8` (pulled in by `cordova-android` 10.1.1), which otherwise collide with the `kotlin-stdlib` 1.8+ that already bundles them — without it, Gradle fails with duplicate-class errors.
- Backend CORS (`backend/src/main.ts`): the app's WebView calls the API cross-origin, so in production the allow-list includes `https://localhost` and `capacitor://localhost` alongside the real site origins.

Build the app:

```bash
cd frontend
npm run build -- --configuration capacitor   # or: npx ng build --configuration capacitor
npx cap sync android
cd android && ./gradlew assembleDebug        # needs JDK 21 + Android SDK (compileSdk 35)
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

For day-to-day development, open `frontend/android/` in Android Studio (handles the JDK/SDK/emulator for you) rather than driving Gradle by hand. When ready for release, generate a signed AAB from Android Studio (Build → Generate Signed Bundle) — no keystore exists yet in this repo.
