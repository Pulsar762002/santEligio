.PHONY: help dev prod deploy deploy-frontend stop logs shell-backend shell-mongo clean cert reload-nginx

help: ## Mostra questo aiuto
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ── Sviluppo locale ───────────────────────────────────────────
dev: ## Avvia tutti i servizi in modalità sviluppo
	docker compose --profile dev up --build

dev-bg: ## Avvia in background (sviluppo)
	docker compose --profile dev up --build -d

# ── Produzione ────────────────────────────────────────────────
prod: ## Build e avvio in produzione
	docker compose -f docker-compose.yml up --build -d

deploy: ## Deploy completo dietro Nginx host (frontend+backend --no-cache + seed contenuti)
	@echo "==> Build frontend e backend (no cache)..."
	docker compose -f docker-compose.behind-proxy.yml build --no-cache frontend backend
	@echo "==> Stop containers e rimozione volume build..."
	docker compose -f docker-compose.behind-proxy.yml down
	docker volume rm -f santeligio_frontend_build
	@echo "==> Avvio stack..."
	docker compose -f docker-compose.behind-proxy.yml up -d
	@echo "==> Attesa backend pronto..."
	@sleep 5
	@echo "==> Seed contenuti (pagine/gruppi/orari)..."
	docker exec santeligio_backend npm run seed:contenuti
	@echo "==> Deploy completato."

deploy-frontend: ## Rebuild solo il frontend (no cache) senza toccare backend/DB
	@echo "==> Build frontend (no cache)..."
	docker compose -f docker-compose.behind-proxy.yml build --no-cache frontend
	@echo "==> Stop e rimozione container frontend e nginx..."
	docker compose -f docker-compose.behind-proxy.yml stop frontend nginx
	docker compose -f docker-compose.behind-proxy.yml rm -f frontend nginx
	docker volume rm -f santeligio_frontend_build
	@echo "==> Avvio frontend e nginx..."
	docker compose -f docker-compose.behind-proxy.yml up -d frontend nginx
	@echo "==> Deploy frontend completato."

prod-pull: ## Aggiorna immagini e riavvia in produzione
	docker compose -f docker-compose.yml pull
	docker compose -f docker-compose.yml up --build -d

# ── Gestione ──────────────────────────────────────────────────
stop: ## Ferma tutti i container
	docker compose down

logs: ## Mostra i log in tempo reale
	docker compose logs -f

logs-backend: ## Log solo del backend
	docker compose logs -f backend

logs-nginx: ## Log solo di nginx
	docker compose logs -f nginx

# ── Shell interattive ─────────────────────────────────────────
shell-backend: ## Shell nel container backend
	docker compose exec backend sh

shell-mongo: ## Shell MongoDB (mongosh)
	docker compose exec mongo mongosh -u ${MONGO_ROOT_USER} -p ${MONGO_ROOT_PASSWORD} --authenticationDatabase admin santeligio

# ── Backup MongoDB ────────────────────────────────────────────
backup: ## Crea backup del database
	@mkdir -p ./backups
	docker compose exec mongo mongodump \
	  --uri="mongodb://${MONGO_ROOT_USER}:${MONGO_ROOT_PASSWORD}@localhost:27017/santeligio?authSource=admin" \
	  --out=/tmp/backup
	docker compose cp mongo:/tmp/backup ./backups/$(shell date +%Y%m%d_%H%M%S)
	@echo "✅  Backup salvato in ./backups/"

# ── SSL / Certbot ─────────────────────────────────────────────
cert: ## Emetti certificato Let's Encrypt (prima volta, su server produzione)
	@bash certbot/init-letsencrypt.sh

reload-nginx: ## Ricarica nginx (usare dopo ogni rinnovo SSL)
	docker compose exec nginx nginx -s reload

# ── Cleanup ───────────────────────────────────────────────────
clean: ## Rimuove container, network (non i volumi!)
	docker compose down --remove-orphans

clean-all: ## Rimuove tutto inclusi i volumi (⚠️  cancella i dati!)
	docker compose down -v --remove-orphans
