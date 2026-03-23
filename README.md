# Plateforme SST — Santé et Sécurité au Travail

Plateforme de gestion médicale et de prévention en milieu professionnel, conçue pour les services de santé au travail.

---

## Stack technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18, TypeScript, Material-UI 5, Vite |
| **Backend** | Django 4.2, Django REST Framework, JWT |
| **Base de données** | SQLite (dev) / PostgreSQL ou MySQL (prod) |
| **PDF / Export** | jsPDF, html2canvas, ReportLab |
| **Tâches async** | Celery + Redis |
| **Déploiement** | Gunicorn, Docker |

---

## Modules principaux

### Dossier Médical (DMST)
- Dossier médical de santé au travail par agent
- Fiche d'observation (constantes, antécédents, examen clinique)
- Ordonnance (format A5, impression)
- Demande d'examen
- Bulletin d'analyses (hématologie, biochimie, sérologie…)
- Certificat médical
- Conclusion médicale (apte, inapte, surveillance)

### Gestion des Agents
- Annuaire des employés avec archivage
- Profils : matricule, direction, fonction, site
- Historique médical complet

### Visites médicales
- Programmation et suivi des visites
- Visites périodiques, d'embauche, de reprise

### Accidents du travail / Maladies professionnelles
- Déclaration et suivi AT/MP
- Analyse des incidents

### Vaccination
- Carnet de vaccination par agent
- Suivi des rappels et couvertures vaccinales

### Prévention & Risques (EVRP)
- Évaluation des risques professionnels
- Plans d'actions et mesures de prévention

### Formation
- Gestion des formations et habilitations
- Suivi des programmes éducatifs

### Consultation en ligne
- Création de salles de visioconférence (Jitsi Meet)
- Partage de liens de consultation
- Historique des consultations

### Reporting & Statistiques
- Tableaux de bord et KPIs
- Export Excel / PDF

### Administration
- Gestion des utilisateurs et rôles
- Configuration des entreprises, sites et services
- Journal d'audit et traçabilité des accès

---

## Rôles utilisateurs

| Rôle | Accès |
|------|-------|
| Super Admin | Accès complet |
| Administrateur | Gestion plateforme |
| Médecin | Dossiers médicaux + prescriptions |
| Infirmier(e) | Constantes + soins |
| Consultant HSE | Prévention + risques |
| RH | Agents + formations |
| Responsable HSE | EVRP + accidents |
| Direction | Reporting |

---

## Installation rapide

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows : venv\Scripts\activate
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

L'application est disponible sur `http://localhost:5173`
L'API backend tourne sur `http://localhost:8000`

---

## Structure du projet

```
SST-main/
├── frontend/
│   ├── src/
│   │   ├── pages/          # Pages de l'application
│   │   ├── components/     # Composants réutilisables
│   │   ├── contexts/       # AuthContext
│   │   ├── api/            # Client Axios
│   │   └── print.css       # Styles d'impression
│   └── vite.config.ts
├── backend/
│   ├── accounts/           # Authentification & utilisateurs
│   ├── companies/          # Entreprises, sites, services
│   ├── medical/            # Agents, DMST, consultations
│   ├── visits/             # Visites médicales
│   ├── accidents/          # AT/MP
│   ├── vaccination/        # Vaccination
│   ├── prevention/         # EVRP & prévention
│   ├── training/           # Formations
│   ├── reporting/          # Statistiques
│   ├── consultations/      # Consultations en ligne
│   └── audit/              # Journal d'audit
└── Documents/              # Documentation détaillée
```

---

## Documentation complète

Disponible dans le dossier `/Documents/` :

- `QUICKSTART.md` — Guide de démarrage rapide
- `PROFILS_UTILISATEURS.md` — Détail des rôles et permissions
- `SPECIFICATION_MODULES_SST.md` — Spécifications fonctionnelles
- `DEPLOYMENT_GUIDE.md` — Guide de déploiement en production
- `TROUBLESHOOTING.md` — Résolution des problèmes courants

---

## Sécurité

- Authentification JWT (access + refresh tokens)
- Contrôle d'accès basé sur les rôles (RBAC)
- Accès aux données médicales restreint au personnel autorisé
- Journal d'audit pour la traçabilité
- Conformité aux exigences de confidentialité médicale

---

## Docker & Déploiement

### Ports utilisés

| Service | Port hôte | Port container |
|---------|-----------|----------------|
| Frontend (Nginx) | **2000** | 80 |
| phpMyAdmin | **2001** | 80 |
| MySQL | interne | 3306 |
| Backend (API) | interne | 8000 |

### Démarrage local (développement)

```bash
# 1. Copier et remplir le fichier .env
cp .env.example .env
# Éditer .env avec vos valeurs

# 2. Lancer tous les containers
docker compose up -d --build

# 3. Accès
# Frontend : http://localhost:2000
# phpMyAdmin : http://localhost:2001
```

### Déploiement sur le serveur (72.62.29.141)

```bash
# Sur le serveur — première fois
mkdir ~/sst && cd ~/sst
git clone <votre-repo> .
cp .env.example .env
nano .env   # remplir les valeurs de production

docker compose -f docker-compose.prod.yml up -d
```

### GitHub Actions CI/CD

**Secrets à configurer** dans `GitHub → Settings → Secrets and variables → Actions` :

| Secret | Description |
|--------|-------------|
| `DOCKER_USERNAME` | Votre nom d'utilisateur Docker Hub |
| `DOCKER_PASSWORD` | Votre token Docker Hub |
| `SSH_HOST` | IP du serveur : `72.62.29.141` |
| `SSH_USER` | Utilisateur SSH (ex: `ubuntu`, `root`) |
| `SSH_PRIVATE_KEY` | Clé SSH privée pour se connecter au serveur |

**Pipeline automatique** : chaque push sur `main` →
1. Build images frontend + backend
2. Push vers Docker Hub
3. SSH → pull + restart sur le serveur

### Structure Docker

```
SST-main/
├── frontend/
│   ├── Dockerfile          # Multi-stage build (Node → Nginx)
│   ├── nginx.conf          # Config Nginx (proxy /api/ → backend)
│   └── .dockerignore
├── backend/
│   ├── Dockerfile          # Python + Gunicorn
│   ├── entrypoint.sh       # Wait MySQL → migrate → collectstatic
│   └── .dockerignore
├── docker-compose.yml      # Dev local (build depuis sources)
├── docker-compose.prod.yml # Production (images Docker Hub)
├── .env.example            # Template des variables d'environnement
└── .github/workflows/
    └── deploy.yml          # Pipeline CI/CD GitHub Actions
```
