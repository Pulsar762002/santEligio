# Deploy del portale dietro l'Nginx host (server condiviso con Foundry)

Il server ha già un **Nginx installato sull'host** (apt) che ascolta su 80/443 e
fa da reverse proxy per Foundry e gli altri servizi. Il portale chiesa si aggancia
**dietro** a quell'Nginx: gira come stack Docker isolato, espone il suo Nginx
interno solo su `127.0.0.1:8090`, e l'Nginx host gli inoltra il traffico del
dominio `parrocchiasanteligio.it`.

```
Internet ──443──> Nginx HOST ──┬─ dungeonmasters.duckdns.org → Foundry (com'è)
                               └─ parrocchiasanteligio.it → 127.0.0.1:8090 → stack chiesa
                                                                            (nginx interno → SPA + /api + /uploads)
```

## 1. DNS (Aruba)

Crea i record A verso l'IP pubblico del server:

| Tipo | Nome | Valore |
|------|------|--------|
| A | `parrocchiasanteligio.it` | `<IP_SERVER>` |
| A (o CNAME) | `www` | `<IP_SERVER>` (o `parrocchiasanteligio.it`) |

Verifica con `dig +short parrocchiasanteligio.it` prima di procedere col certificato.

## 2. Stack chiesa sul server

```bash
# clona il repo dove preferisci, es. /srv/santeligio
git clone <repo> /srv/santeligio && cd /srv/santeligio

cp .env.example .env
# Imposta almeno: MONGO_ROOT_PASSWORD, MONGO_APP_PASSWORD,
# JWT_SECRET (>=64 char), ADMIN_EMAIL, ADMIN_PASSWORD

# Avvia lo stack "dietro proxy" (niente 80/443/certbot)
docker compose -f docker-compose.behind-proxy.yml up --build -d

# Primo admin + contenuti dal vecchio sito (idempotenti)
docker compose -f docker-compose.behind-proxy.yml exec backend npm run seed
docker compose -f docker-compose.behind-proxy.yml exec backend npm run seed:contenuti
```

Test locale sul server (deve rispondere l'HTML della SPA):

```bash
curl -I http://127.0.0.1:8090
```

## 3. Vhost nell'Nginx host

L'host usa `sites-available/` + symlink in `sites-enabled/` e **certbot è già
installato** (gli altri siti hanno `/etc/letsencrypt/live/...`). Replichiamo lo
stesso schema usato per Foundry.

Crea `/etc/nginx/sites-available/parrocchiasanteligio` — **solo HTTP**: ci pensa
poi certbot ad aggiungere il blocco 443 e il redirect.

```nginx
server {
    listen 80;
    server_name parrocchiasanteligio.it www.parrocchiasanteligio.it;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/parrocchiasanteligio /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 4. Certificato Let's Encrypt (plugin nginx)

Con il DNS già propagato (passo 1), il plugin nginx converte da sé il vhost in
`listen 443 ssl` + redirect HTTP→HTTPS, esattamente come per Foundry:

```bash
sudo certbot --nginx -d parrocchiasanteligio.it -d www.parrocchiasanteligio.it
sudo nginx -t && sudo systemctl reload nginx
```

A fine procedura il vhost risulterà simile a:

```nginx
server {
    listen 443 ssl http2;
    server_name parrocchiasanteligio.it www.parrocchiasanteligio.it;

    ssl_certificate     /etc/letsencrypt/live/parrocchiasanteligio.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/parrocchiasanteligio.it/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    server_name parrocchiasanteligio.it www.parrocchiasanteligio.it;
    return 301 https://$host$request_uri;
}
```

Il rinnovo automatico è già gestito da certbot sull'host (`certbot.timer`),
quindi **non** serve il container certbot del progetto.

## Note

- Nessun conflitto di porta: lo stack chiesa pubblica solo `127.0.0.1:8090`; DB
  Mongo, backend e frontend restano sulla rete interna `santeligio_net`.
- Grafana usa la 3000 host: il backend chiesa **non** pubblica la 3000 in questo
  compose, quindi convivono.
- Aggiornamenti: `git pull && docker compose -f docker-compose.behind-proxy.yml up --build -d`.
