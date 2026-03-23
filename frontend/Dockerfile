# ── Stage 1 : Build React ──────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
RUN npm ci

# Variables d'environnement de build
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Copier le code source et builder
COPY . .
RUN npm run build

# ── Stage 2 : Servir avec Nginx ────────────────────────────────────────────
FROM nginx:1.25-alpine

# Copier le build React
COPY --from=builder /app/dist /usr/share/nginx/html

# Copier la config Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Supprimer la config par défaut
RUN rm -f /etc/nginx/conf.d/default.conf.bak

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
