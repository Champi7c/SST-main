# Hébergement Plateforme SST avec Cloudflare

Ce guide décrit comment héberger la **Plateforme SST** en tirant parti de **Cloudflare** pour le frontend, et quelles sont les **limites** pour le backend et la base de données.

---

## Ce que Cloudflare peut héberger

| Composant | Cloudflare | Détails |
|-----------|------------|--------|
| **Frontend (React/Vite)** | Oui | **Cloudflare Pages** – déploiement du build statique, CDN global, HTTPS |
| **Backend (Django)** | Non | Workers exécutent du JS/Python limité (FastAPI, etc.), pas Django |
| **Base de données (MySQL/PostgreSQL)** | Non | **D1** est SQLite-like et prévu pour Workers ; pas de MySQL/PostgreSQL managé |

---

## Architecture recommandée

- **Frontend** → **Cloudflare Pages** (ce dépôt inclut un workflow GitHub Actions pour déployer).
- **Backend Django** → Hébergé ailleurs : **Railway**, **Render**, **Fly.io**, **DigitalOcean App Platform**, etc.
- **Base de données** → PostgreSQL ou MySQL managé par le même hébergeur (Railway Postgres, Render Postgres, Neon, Supabase, PlanetScale, etc.) ou fournisseur externe.

Le frontend sur Pages appelle l’API du backend via l’URL configurée (`VITE_API_URL`).

---

## 1. Frontend sur Cloudflare Pages

### Prérequis

- Compte **Cloudflare**.
- Depôt GitHub du projet.

### Option A : Déploiement via GitHub Actions (recommandé)

Le dépôt contient un workflow **Deploy Frontend → Cloudflare Pages** (voir [§ Workflow GitHub](#workflow-github)).

1. Créer un **token API** Cloudflare avec la permission **Account → Cloudflare Pages → Edit**  
   [Créer un token](https://dash.cloudflare.com/profile/api-tokens) → Custom token → Permissions: Account, Cloudflare Pages, Edit.

2. Récupérer l’**Account ID** : Dashboard Cloudflare → vue d’ensemble d’un site (ou Pages) → colonne droite, section API.

3. Dans le dépôt GitHub : **Settings → Secrets and variables → Actions** :
   - `CLOUDFLARE_API_TOKEN` : valeur du token.
   - `CLOUDFLARE_ACCOUNT_ID` : valeur de l’Account ID.
   - `VITE_API_URL` : URL de base de l’API backend (ex. `https://votre-backend.up.railway.app/api`). **À définir une fois le backend déployé.**

4. Créer un **projet Pages** (vide) dans Cloudflare :
   - **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
   - Choisir le dépôt, puis **Create project** (sans build). On utilisera uniquement le **Direct Upload** via le workflow.

5. Noter le **nom du projet** (ex. `sst-platform`) et l’utiliser dans le workflow (variable `CLOUDFLARE_PAGES_PROJECT_NAME` ou équivalent).

6. À chaque push sur la branche configurée (ex. `main`), le workflow build le frontend et déploie le dossier `frontend/dist` sur Pages.

### Option B : Cloudflare Pages + Git (sans Actions)

1. **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → sélectionner le dépôt.
2. **Build settings** :
   - **Framework preset** : None (ou Vite si disponible).
   - **Root directory** : `frontend`.
   - **Build command** : `npm run build`.
   - **Build output directory** : `dist`.
3. **Environment variables** : ajouter `VITE_API_URL` = `https://votre-backend..../api`.
4. Déployer. Les prochains pushes sur la branche branch déclencheront un build et un déploiement.

### Build frontend et variable d’API

Le frontend utilise `VITE_API_URL` au moment du **build**. En local, défaut = `http://localhost:8000/api`.

- En **prod** : définir `VITE_API_URL` (Actions ou Pages) avec l’URL réelle du backend, **sans** slash final (ex. `https://api.example.com/api`).

---

## 2. Backend Django (hors Cloudflare)

Django **ne peut pas** tourner sur Cloudflare Workers. Il faut l’héberger sur une plateforme qui exécute du Python (WSGI/ASGI).

### Exemples rapides

- **Railway** : [railway.app](https://railway.app) – déploiement depuis GitHub, PostgreSQL managé, variables d’env.
- **Render** : [render.com](https://render.com) – Web Service + PostgreSQL.
- **Fly.io** : [fly.io](https://fly.io) – app Python dans un container, base externe ou volume.

### Configuration backend pour la prod

À adapter selon l’hébergeur. En général :

- **`ALLOWED_HOSTS`** : inclure le domaine du backend (ex. `votre-backend.up.railway.app`).
- **`CORS_ALLOWED_ORIGINS`** : origines autorisées pour CORS, séparées par des virgules. Inclure l’URL du frontend sur Pages (ex. `https://votre-projet.pages.dev`). Défini dans `backend/.env` ; voir `backend/.env.example`.
- **Base de données** : `DATABASE_URL` ou `DB_*` selon votre configuration (PostgreSQL recommandé en prod).
- **`SECRET_KEY`** : valeur robuste et secrète.
- **`DEBUG=False`** en production.

Le fichier `backend/.env.example` et la doc **TROUBLESHOOTING** décrivent les variables utilisées.

---

## 3. Base de données (hors Cloudflare)

- **Cloudflare D1** : prévu pour Workers, format SQLite ; **pas** utilisé par Django dans ce projet.
- Utiliser une base **PostgreSQL** ou **MySQL** chez votre hébergeur (Railway, Render, etc.) ou un service managé (Neon, Supabase, PlanetScale).

Configurez les variables `DB_*` ou `DATABASE_URL` conformément à votre hébergeur et au `settings.py`.

---

## 4. Workflow GitHub (déploiement frontend → Pages)

Le workflow **Deploy Frontend → Cloudflare Pages** (`.github/workflows/deploy-cloudflare-pages.yml`) :

1. Se déclenche sur **push** sur `main` ou manuellement (**workflow_dispatch**).
2. Installe les deps Node dans `frontend`, lance `npm run build` avec `VITE_API_URL`.
3. Déploie le contenu de `frontend/dist` vers Cloudflare Pages via **Wrangler** (`pages deploy`).

### Secrets et variables à configurer (GitHub → Settings → Secrets and variables → Actions)

| Nom | Type | Description |
|-----|------|-------------|
| `CLOUDFLARE_API_TOKEN` | Secret | Token API Cloudflare (Permissions : Account, Cloudflare Pages, Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Account ID Cloudflare (dashboard → Overview → API) |
| `VITE_API_URL` | Secret | URL de base de l’API (ex. `https://votre-backend.up.railway.app/api`). **Obligatoire** pour que le frontend appelle le bon backend en prod. |
| `CLOUDFLARE_PAGES_PROJECT_NAME` | Variable | Nom du projet Pages (ex. `sst-platform`). Défaut dans le workflow : `sst-platform` si non défini. |

Créer d’abord un projet **Pages** vide (Connect to Git → dépôt → Create), ou le premier déploiement peut le créer selon la config Wrangler.

---

## 5. Résumé

- **Frontend** : Cloudflare Pages (workflow fourni ou connect Git).
- **Backend** : hébergement Python (Railway, Render, Fly.io, etc.).
- **Base de données** : PostgreSQL/MySQL chez l’hébergeur ou service managé.

Une fois le backend et la base déployés, configurez `VITE_API_URL` et CORS, puis déployez le frontend sur Pages. L’application sera servie par Cloudflare tout en utilisant un backend et une base **hors** Cloudflare.
