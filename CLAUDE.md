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
- Indexes: `news.createdAt`, `news.{categoria,pubblicato}`, `eventi.dataInizio`, `utenti.email` (unique)

The `news` collection uses `categoria` enum: `liturgia | catechismo | caritas | eventi | comunicati`.

### NestJS modules and API

All routes are prefixed with `/api`. GET endpoints are public; write operations require `Authorization: Bearer <token>`.

| Module | Routes |
|---|---|
| `auth` | `POST /api/auth/login` → `{ access_token }` |
| `news` | `GET /api/news[?categoria=&tutti=true]`, `GET /api/news/:id`, `POST/PATCH/DELETE` (JWT) |
| `eventi` | `GET /api/eventi[?tutti=true]`, `GET /api/eventi/prossimi[?limit=5]`, `GET /api/eventi/:id`, `POST/PATCH/DELETE` (JWT) |
| `orari-messe` | `GET /api/orari-messe[?tipo=feriale\|festiva\|prefestiva]`, `GET /api/orari-messe/:id`, `POST/PATCH/DELETE` (JWT) |
| `uploads` | `POST /api/uploads` (JWT, multipart `file` field) → `{ url }` |

`CategoriaNews` enum: `liturgia \| catechismo \| caritas \| eventi \| comunicati`

### Key env vars

| Variable | Notes |
|---|---|
| `MONGO_ROOT_PASSWORD` | Required (`:?err`); root MongoDB password |
| `MONGO_APP_PASSWORD` | Required (`:?err`); used by both the init script (creates `santeligio_app` user) and the backend MONGO_URI |
| `JWT_SECRET` | Must be ≥ 64 chars random string |
| `MONGO_URI` | Auto-set in docker-compose; override only if needed |
| `UPLOAD_MAX_SIZE_MB` | Backend file upload limit |

## SSL / Certbot

- Certificati in `./data/certbot/conf/live/santeligio.it/` (bind mount, escluso da git via `data/`)
- **Prod**: nginx monta `./data/certbot/conf:/etc/letsencrypt` — cert path: `/etc/letsencrypt/live/santeligio.it/`
- **Dev**: l'override monta `./nginx/ssl:/etc/letsencrypt/live/santeligio.it` → stesso nginx.conf funziona in entrambi
- `certbot/init-letsencrypt.sh` — issuance prima volta (crea cert dummy, avvia nginx, ottiene cert reale, reload)
- Il servizio `certbot` in docker-compose rinnova automaticamente ogni 12h; dopo il rinnovo fare `make reload-nginx`
- ACME challenge HTTP-01 servita da nginx su `/var/www/certbot` (volume `./data/certbot/www`)

## CI/CD (GitHub Actions)

Pipeline in `.github/workflows/ci-cd.yml`:

| Job | Trigger | Cosa fa |
|---|---|---|
| `backend` | ogni push / PR su `main` | `npm ci` → `npm run build` → `npm test` |
| `frontend` | ogni push / PR su `main` | `npm ci` → `ng build --configuration production` |
| `deploy` | push su `main` (dopo CI verde) | SSH nel server → `git pull` → `docker compose up --build -d` |

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
| `/eventi` | `EventiComponent` |
| `/orari-messe` | `OrariMesseComponent` — grouped by tipo (festiva / prefestiva / feriale) |
| `/admin/login` | `AdminLoginComponent` |
| `/admin` | `AdminDashboardComponent` — protected by `authGuard` |

## Backend conventions (NestJS)

- Runs on port 3000; all routes prefixed with `/api`
- Uploads stored at `/app/uploads` (mounted as `uploads_data` volume, also shared with Nginx)
- Production image runs as non-root user `appuser`
- `npm run build` → `dist/`, production entry: `node dist/main`
- Dev: `npm run start:dev` (NestJS watch mode)
