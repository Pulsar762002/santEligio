# Parrocchia di Sant'Eligio — Sito Web

Stack: **Angular 17** · **NestJS** · **MongoDB 7** · **Nginx** · **Docker Compose** · **TypeScript**

---

## Prerequisiti

- Docker ≥ 24 e Docker Compose v2
- (solo sviluppo locale) Node 21+

---

## Sviluppo locale

### 1. Configura l'ambiente

```bash
git clone <repo>
cd santeligio

cp .env.example .env
# Modifica .env con le credenziali reali
```

### 2. Certificato SSL self-signed (richiesto da nginx anche in dev)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out    nginx/ssl/fullchain.pem \
  -subj   "/CN=localhost"
```

### 3. Genera i lockfile npm (solo al primo clone)

```bash
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..
```

### 4. Avvio

```bash
make dev        # in foreground (Ctrl+C per fermare)
make dev-bg     # in background
```

Servizi disponibili:

| Servizio      | URL                       |
|---------------|---------------------------|
| Frontend      | http://localhost:4200     |
| Backend API   | http://localhost:3000/api |
| Nginx proxy   | http://localhost:8088     |
| Mongo Express | http://localhost:8081     |

---

## Produzione (server VPS)

### 1. Prima installazione

```bash
git clone <repo>
cd santeligio

cp .env.example .env
# Compilare .env con le credenziali di produzione
```

### 2. Certificato SSL (Let's Encrypt)

Il dominio deve già puntare all'IP del server.

```bash
make cert
# oppure: STAGING=1 make cert  (per testare senza consumare rate limit)
```

Lo script:
1. Crea un cert temporaneo per avviare nginx
2. Ottiene il certificato reale da Let's Encrypt via HTTP-01 challenge
3. Ricarica nginx con il cert reale

### 3. Avvio

```bash
make prod
```

### Rinnovo SSL

Il servizio `certbot` rinnova automaticamente ogni 12 ore.  
Dopo ogni rinnovo ricaricare nginx:

```bash
make reload-nginx
```

Per automatizzare il reload, aggiungere al crontab del server:

```bash
# crontab -e
0 3 * * * cd /srv/santeligio && docker compose exec nginx nginx -s reload
```

---

## Struttura del progetto

```
santeligio/
├── frontend/               ← Angular 17 SPA (standalone components, signals)
│   ├── src/app/
│   │   ├── core/           ← servizi, modelli, interceptor, guard
│   │   ├── shared/         ← navbar, footer
│   │   └── pages/          ← home, notizie, eventi, orari-messe, admin
│   └── Dockerfile
├── backend/                ← NestJS API (Mongoose, Passport JWT)
│   ├── src/
│   │   ├── auth/           ← JWT + local strategy
│   │   ├── news/           ← CRUD notizie
│   │   ├── eventi/         ← CRUD eventi
│   │   ├── orari-messe/    ← CRUD orari
│   │   ├── uploads/        ← upload file
│   │   └── users/          ← utenti admin
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── conf.d/santeligio.conf
├── certbot/
│   └── init-letsencrypt.sh ← emissione certificato (prima volta)
├── mongo-init/
│   └── 01-init.js          ← init DB al primo avvio
├── .github/workflows/
│   └── ci-cd.yml           ← CI build + deploy via SSH
├── docker-compose.yml      ← Produzione
├── docker-compose.override.yml ← Sviluppo locale (merge automatico)
├── .env.example
└── Makefile
```

---

## Comandi utili

```bash
make help          # lista tutti i comandi
make logs          # log in tempo reale di tutti i servizi
make logs-backend  # log solo del backend
make logs-nginx    # log solo di nginx
make shell-backend # shell nel container NestJS
make shell-mongo   # mongosh nel container MongoDB
make backup        # backup del database
make reload-nginx  # ricarica nginx (es. dopo rinnovo SSL)
make cert          # emetti certificato Let's Encrypt (prima volta)
make clean-all     # rimuove tutto inclusi i volumi (perde i dati)
```

---

## CI/CD

Pipeline GitHub Actions (`.github/workflows/ci-cd.yml`):

- **Ogni push / PR su `main`**: build backend (TypeScript + test) + build frontend Angular production
- **Push su `main` con CI verde**: deploy via SSH → `git pull` + `docker compose up --build -d`

Secrets da configurare in GitHub (Settings → Secrets → Actions):

| Secret | Descrizione |
|---|---|
| `SSH_HOST` | IP o hostname del server |
| `SSH_USER` | utente SSH |
| `SSH_PRIVATE_KEY` | chiave privata SSH |
| `DEPLOY_PATH` | path assoluto del progetto sul server |
