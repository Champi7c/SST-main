# Guide de Déploiement - Plateforme SST

## Architecture de déploiement

```
┌─────────────────────────────────────────────────────────────┐
│                    NETLIFY (Frontend)                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  React/Vite App (statique)                          │   │
│  │  URL: https://sst-platform.netlify.app              │   │
│  └─────────────────────────────────────────────────────┘   │
│                            │                                │
│                            ▼                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  API Calls → https://sst-backend.railway.app/api   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │    RAILWAY          │
                    │  ┌───────────────┐  │
                    │  │ Backend       │  │
                    │  │ Django/Gunicorn│  │
                    │  └───────────────┘  │
                    │                     │
                    │  ┌───────────────┐  │
                    │  │ MySQL         │  │
                    │  │ (Plugin)      │  │
                    │  └───────────────┘  │
                    └─────────────────────┘
```

---

## PARTIE 1: Déploiement Backend sur Railway

### Étape 1.1: Créer un projet sur Railway

1. **Créer un compte sur Railway**
   - Aller sur https://railway.app
   - S'inscrire avec GitHub

2. **Créer un nouveau projet**
   - Cliquer sur "New Project"
   - Choisir "Deploy from GitHub repo"
   - Sélectionner ce dépôt

### Étape 1.2: Ajouter MySQL

1. **Dans le tableau de bord Railway**
   - Cliquer sur "Add Plugin" ou "+ New Service"
   - Chercher "MySQL"
   - Cliquer sur "Add MySQL"

2. **Noter les informations de connexion**
   - Après création, cliquer sur MySQL service
   - Récupérer `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`
   - Railway configure automatiquement `DATABASE_URL`

### Étape 1.3: Configurer les variables d'environnement

1. **Aller dans Settings → Variables du projet Railway**

2. **Ajouter ces variables:**

```
SECRET_KEY=generer-une-cle-secure-avec-python-c
DEBUG=False
ALLOWED_HOSTS=sst-backend.railway.app,votrefrontend.netlify.app
CORS_ALLOWED_ORIGINS=https://votrefrontend.netlify.app,http://localhost:3000
```

3. **DATABASE_URL est automatiquement configuré par Railway MySQL**

### Étape 1.4: Déployer

1. **Déclencher le déploiement**
   - Railway détecte automatiquement le `Dockerfile`
   - Cliquer sur "Deploy" (ou push sur GitHub)

2. **Vérifier les logs**
   - Aller dans l'onglet "Deployments"
   - Vérifier que gunicorn démarre correctement

3. **Tester l'API**
   - URL: https://sst-backend.railway.app/api/health/
   - Devrait retourner: `{"status": "healthy", ...}`

### Étape 1.5: Appliquer les migrations Django

1. **Via Railway CLI (optionnel)**
   ```bash
   npm i -g @railway/cli
   railway login
   railway link
   railway run python manage.py migrate
   ```

2. **OU créer un superutilisateur**
   ```bash
   railway run python manage.py createsuperuser
   ```

---

## PARTIE 2: Déploiement Frontend sur Netlify

### Étape 2.1: Créer un site sur Netlify

1. **Créer un compte sur Netlify**
   - Aller sur https://netlify.com
   - S'inscrire avec GitHub

2. **Ajouter un nouveau site**
   - Cliquer sur "Add new site"
   - Choisir "Import an existing project"
   - Sélectionner ce dépôt GitHub

### Étape 2.2: Configuration du build

1. **Paramètres de build (auto-détectés):**
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`

2. **Environment variables:**
   - Aller dans "Site settings" → "Environment variables"
   - Ajouter:
   ```
   VITE_API_URL=https://sst-backend.railway.app/api
   ```

### Étape 2.3: Déployer

1. **Déclencher le déploiement**
   - Netlify build automatiquement le frontend
   - Les fichiers statiques sont déployés

2. **Tester le frontend**
   - URL: https://votre-site.netlify.app
   - La page de connexion devrait s'afficher

---

## PARTIE 3: Configuration CORS

### Sur Railway (Backend)

S'assurer que ces variables sont configurées:

```env
CORS_ALLOWED_ORIGINS=https://votrefrontend.netlify.app
```

---

## PARTIE 4: Commandes Utiles

### Mise à jour du déploiement

**Backend (Railway):**
```bash
# Faire un push Git et Railway redéploie automatiquement
git add .
git commit -m "Update"
git push origin main
```

**Frontend (Netlify):**
```bash
# Netlify détecte automatiquement les pushs
cd frontend
npm run build
# Ou faire un push Git
```

### Vérifications post-déploiement

```bash
# Tester l'API
curl https://sst-backend.railway.app/api/health/

# Tester le frontend
curl -I https://votrefrontend.netlify.app

# Tester la connexion
curl -X POST https://sst-backend.railway.app/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"votre-mot-de-passe"}'
```

---

## PARTIE 5: Dépannage

### Problème: CORS errors

**Symptôme:** Le frontend ne peut pas appeler l'API

**Solution:**
1. Vérifier que `CORS_ALLOWED_ORIGINS` inclut l'URL Netlify
2. Redéployer le backend

### Problème: Base de données non connectée

**Symptôme:** Erreur de connexion à la base de données

**Solution:**
1. Vérifier `DATABASE_URL` dans Railway Variables
2. Vérifier les logs Railway pour les erreurs de connexion

### Problème: Static files non chargés

**Symptôme:** CSS/JS manquant en production

**Solution:**
```bash
# Dans Railway, exécuter:
railway run python manage.py collectstatic --noinput
```

### Problème: Health check échoue

**Symptôme:** `/api/health/` retourne une erreur

**Solution:**
1. Vérifier les logs Railway
2. S'assurer que toutes les variables sont configurées

---

## URLs de Production (exemple)

| Service | URL |
|---------|-----|
| Frontend | `https://sst-platform.netlify.app` |
| Backend API | `https://sst-backend.railway.app/api` |
| Admin Django | `https://sst-backend.railway.app/admin` |
| Health Check | `https://sst-backend.railway.app/api/health/` |

---

## Coût Mensuel Estimé

| Service | Plan Gratuit | Limite |
|---------|-------------|--------|
| Netlify | ✅ Inclus | 100GB bandwidth/mois |
| Railway | ✅ $5/mois credit | 500 heures compute |
| MySQL (Railway) | ✅ Inclus dans le tier | 1GB stockage |

**Total estimé: ~$0-5/mois** pour une utilisation modeste

