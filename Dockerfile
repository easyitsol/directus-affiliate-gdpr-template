# 1. Build Phase: Abhängigkeiten installieren
FROM node:24-alpine AS deps
WORKDIR /app

# .dockerignore sorgt dafür, dass nichts Unnötiges kopiert wird
COPY package.json package-lock.json* ./
RUN npm install

# 2. Build Phase: Die Anwendung bauen
FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Stelle sicher, dass die Umgebungsvariable hier verfügbar ist,
# falls sie zur Build-Zeit benötigt wird.
#ENV NEXT_PUBLIC_DIRECTUS_URL=${NEXT_PUBLIC_DIRECTUS_URL}
#ENV DIRECTUS_HOSTNAME=${DIRECTUS_HOSTNAME}

RUN npm run build

# 3. Finale Run Phase: Nur das Nötigste verwenden
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Kopiere den optimierten Standalone-Output
COPY --from=builder /app/.next/standalone ./
# Kopiere die statischen, öffentlichen Assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Der Befehl zum Starten des Standalone-Servers
CMD ["node", "server.js"]