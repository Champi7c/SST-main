# Guide de démarrage rapide - Plateforme SST

## 🚀 Installation rapide

### Prérequis
- Python 3.8+
- Node.js 16+
- npm ou yarn

### Backend (Django)

```bash
# Aller dans le dossier backend
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows:
venv\Scripts\activate
# Sur Linux/Mac:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env (copier depuis .env.example)
# Modifier SECRET_KEY avec une clé sécurisée
# Pour MySQL (sst, port 3308) : renseigner DB_NAME, DB_USER, DB_PASSWORD dans .env,
# puis : pip install PyMySQL && python manage.py migrate

# Appliquer les migrations
python manage.py migrate

# Créer un super utilisateur
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

Le backend sera accessible sur http://localhost:8000

### Frontend (React)

```bash
# Aller dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Le frontend sera accessible sur http://localhost:3000

## 🔑 Première connexion

1. Ouvrir http://localhost:3000
2. **Compte démo** (prérempli) : `demo` / `demo1234` — ou créer un superuser puis l'utiliser
3. Pour créer/réinitialiser le compte démo seul : `python manage.py create_demo_user`
4. **Mode démo sans backend** : cliquer sur « Voir la démo (sans backend) » pour explorer l'interface sans configurer la base de données ni le backend (données fictives)
5. Le tableau de bord s'affichera

## 📝 Création de données de test

### Insérer >20 enregistrements par rubrique (démo)

Après avoir créé un **superuser** (`create_admin` ou `createsuperuser`) :

```bash
cd backend
source venv/bin/activate   # ou venv\Scripts\activate sur Windows
python manage.py seed_data
```

Cela crée des **entreprises**, **sites**, **services**, **postes**, **agents**, **visites médicales**, **accidents de travail**, **maladies professionnelles**, **vaccinations**, **surveillances**, **risques**, **actions préventives**, **FIE/FIR**, **formations**, **articles éducatifs**, etc. (au moins 20 par rubrique).  
**Pour supprimer les anciennes données puis tout réinsérer** (entreprises, noms et prénoms sénégalais, etc.) :

```bash
python manage.py seed_data --flush
```

Utilisez `--force` pour ajouter même si des données existent déjà (sans supprimer).

### Créer une entreprise

Via l'admin Django (http://localhost:8000/admin) ou via l'API:

```bash
curl -X POST http://localhost:8000/api/companies/companies/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Entreprise Test",
    "siret": "12345678901234",
    "address": "123 Rue Test",
    "email": "test@example.com"
  }'
```

### Créer un agent

```bash
curl -X POST http://localhost:8000/api/medical/agents/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matricule": "AG001",
    "first_name": "Jean",
    "last_name": "Dupont",
    "date_of_birth": "1980-01-01",
    "gender": "M",
    "company": 1,
    "hire_date": "2020-01-01"
  }'
```

## ☁️ Hébergement (Cloudflare)

Pour déployer le **frontend** sur **Cloudflare Pages** (backend et base hébergés ailleurs) : voir **`Documents/HEBERGEMENT_CLOUDFLARE.md`**. Le dépôt inclut un workflow GitHub Actions (`.github/workflows/deploy-cloudflare-pages.yml`) pour build + déploiement automatique sur Pages.

## 🎯 Prochaines étapes

1. Configurer les entreprises et sites
2. Créer les utilisateurs avec leurs rôles respectifs
3. Importer les agents
4. Configurer les référentiels (types de visites, vaccins, risques, etc.)
5. Commencer à utiliser les modules fonctionnels

## 📚 Documentation API

L'API REST est documentée automatiquement. Accéder à:
- http://localhost:8000/api/ pour explorer les endpoints

## 🔒 Sécurité

- Ne jamais commiter le fichier `.env`
- Utiliser des mots de passe forts
- En production, configurer HTTPS
- Activer les sauvegardes automatiques
