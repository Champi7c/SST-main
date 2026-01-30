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
2. Se connecter avec les identifiants du super utilisateur créé
3. Le tableau de bord s'affichera

## 📝 Création de données de test

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
