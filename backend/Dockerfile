# ─────────────────────────────────────────────────────────────
# Stage 1 — development
# ─────────────────────────────────────────────────────────────
FROM node:21-alpine AS development

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ─────────────────────────────────────────────────────────────
# Stage 2 — build
# ─────────────────────────────────────────────────────────────
FROM node:21-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 3 — production (immagine minima)
# ─────────────────────────────────────────────────────────────
FROM node:21-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Utente non-root per sicurezza
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /app/uploads && chown appuser:appgroup /app/uploads
USER appuser

EXPOSE 3000
CMD ["node", "dist/main"]
