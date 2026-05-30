#!/bin/bash
# Issuance iniziale certificati Let's Encrypt.
# Eseguire UNA VOLTA sul server prima del primo avvio in produzione.
# Il dominio deve già puntare all'IP del server.
#
# Uso:
#   bash certbot/init-letsencrypt.sh [dominio] [email]
#
# Esempio:
#   bash certbot/init-letsencrypt.sh santeligio.it parrocchia@santeligio.it
#
# Per testare senza consumare rate limit Let's Encrypt:
#   STAGING=1 bash certbot/init-letsencrypt.sh ...

set -e

DOMAIN="${1:-santeligio.it}"
EMAIL="${2:-parrocchia@santeligio.it}"
STAGING="${STAGING:-0}"

DATA_PATH="./data/certbot"
COMPOSE="docker compose -f docker-compose.yml"

# ── 1. Crea certificato dummy per far partire nginx ───────────
echo "[1/4] Creo certificato temporaneo per ${DOMAIN}..."
mkdir -p "${DATA_PATH}/conf/live/${DOMAIN}"
openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
  -keyout "${DATA_PATH}/conf/live/${DOMAIN}/privkey.pem" \
  -out    "${DATA_PATH}/conf/live/${DOMAIN}/fullchain.pem" \
  -subj   "/CN=${DOMAIN}" 2>/dev/null

# ── 2. Avvia nginx con il certificato dummy ───────────────────
echo "[2/4] Avvio nginx..."
$COMPOSE up --force-recreate -d nginx

# ── 3. Ottieni il certificato reale da Let's Encrypt ─────────
echo "[3/4] Richiesta certificato Let's Encrypt per ${DOMAIN}..."

STAGING_ARG=""
[ "${STAGING}" = "1" ] && STAGING_ARG="--staging"

$COMPOSE run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  --email "${EMAIL}" \
  --agree-tos --no-eff-email \
  ${STAGING_ARG} \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}"

# ── 4. Ricarica nginx con il certificato reale ────────────────
echo "[4/4] Ricarico nginx..."
$COMPOSE exec nginx nginx -s reload

echo ""
echo "Certificato emesso per ${DOMAIN} (valido 90 giorni)."
echo "Il rinnovo automatico e' gestito dal servizio certbot (ogni 12h)."
echo "Dopo ogni rinnovo ricaricare nginx: make reload-nginx"
echo ""
echo "Per avviare tutti i servizi in produzione:"
echo "  docker compose -f docker-compose.yml up -d"
