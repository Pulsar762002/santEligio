# ─────────────────────────────────────────────────────────────
# Stage 1 — development (usato da docker-compose.override.yml)
# ─────────────────────────────────────────────────────────────
FROM node:21-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 4200
CMD ["npm", "run", "start", "--", "--host", "0.0.0.0", "--poll", "2000"]

# ─────────────────────────────────────────────────────────────
# Stage 2 — build (produce /app/dist)
# ─────────────────────────────────────────────────────────────
FROM node:21-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
RUN npm run build -- --configuration production

# ─────────────────────────────────────────────────────────────
# Stage 3 — final (solo il dist, copiato nel volume da nginx)
# ─────────────────────────────────────────────────────────────
FROM alpine:3.19 AS builder-export

WORKDIR /app/dist/frontend/browser
COPY --from=build /app/dist/frontend/browser .
