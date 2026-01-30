# Plateforme SST - Santé et Sécurité au Travail

Plateforme web professionnelle, sécurisée et évolutive de gestion de la Santé et Sécurité au Travail (SST) destinée aux Cabinets Médical LIONEL et LIONEL SST.

## 🏗️ Architecture

- **Backend**: Django REST Framework
- **Frontend**: React + TypeScript + Material-UI
- **Base de données**: SQLite (développement) / PostgreSQL (production)

## 📦 Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔐 Profils utilisateurs

1. **Super Administrateur**: Installation, configuration globale, sécurité
2. **Administrateur**: Paramétrage fonctionnel, gestion des structures
3. **Médecin du Travail**: Accès complet aux DMST, visites médicales
4. **Infirmier SST**: Enregistrement constantes, assistance visites
5. **Consultant SST**: Évaluation risques, plans d'actions
6. **Ressources Humaines**: Données administratives, alertes
7. **Responsable HSE / Direction**: Tableaux de bord, rapports

## 📋 Modules

- ✅ Tableau de bord global
- ✅ Dossier Médical en Santé au Travail (DMST)
- ✅ Gestion des visites médicales
- ✅ Accidents de travail & maladies professionnelles
- ✅ Vaccination & surveillance médicale
- ✅ Prévention & évaluation des risques (EVRP)
- ✅ Formation & éducation sanitaire
- ✅ Reporting & indicateurs
- ✅ Paramétrage & référentiels
- ✅ Audit & traçabilité

## 🔒 Sécurité

- Respect strict du secret médical
- Cloisonnement des données médicales
- Journalisation des accès
- Traçabilité complète
- Authentification JWT

## 📝 Variables d'environnement

Créer un fichier `.env` dans le dossier `backend` (ou copier `.env.example`):

```
SECRET_KEY=votre-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

### MySQL (base `sst`, port 3308, phpMyAdmin)

Pour utiliser MySQL au lieu de SQLite, définir dans `.env` :

```
DB_NAME=sst
DB_HOST=127.0.0.1
DB_PORT=3308
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
```

Puis : `pip install PyMySQL` et `python manage.py migrate`.

## 🚀 Déploiement

Voir la documentation de déploiement pour les instructions de mise en production.
