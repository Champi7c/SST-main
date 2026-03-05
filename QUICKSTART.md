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
# MySQL (base sst_coly, port 3306) : .env est déjà configuré avec USE_MYSQL=True, DB_NAME=sst_coly.
# Vérifier que MySQL/phpMyAdmin tourne sur le port 3306, puis :

# Appliquer les migrations (crée les tables dans sst_coly)
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
2. Se connecter avec le compte créé via `python manage.py createsuperuser`
3. Le tableau de bord s'affichera

## 📝 Données et contenu

Les données (entreprises, agents, visites, etc.) se créent via l’interface (http://localhost:3000) ou l’admin Django (http://localhost:8000/admin). Aucune commande de données de test n’est fournie.

Pour supprimer toutes les données fictives en gardant les utilisateurs : `python manage.py flush_fake_data` (répondre `oui` pour confirmer).

Pour importer la liste des entreprises (EIFFAGE, CRBC, CDE, etc.) : `python manage.py load_entreprises`. Option `--force` pour mettre à jour téléphone/email/adresse des entreprises déjà présentes.

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
