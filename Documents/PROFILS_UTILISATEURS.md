# Profils Utilisateurs - Plateforme SST

## 📋 Liste des Rôles Disponibles

### 1. Super Administrateur (`super_admin`)
- **Description** : Installation du système, configuration globale, sécurité et audits
- **Droits** :
  - Accès complet à toutes les fonctionnalités
  - Gestion des administrateurs
  - Configuration globale
  - Sécurité et audits
  - Accès aux données médicales : ✅ OUI

### 2. Administrateur (`admin`)
- **Description** : Paramétrage fonctionnel, gestion des structures, sites et services
- **Droits** :
  - Paramétrage fonctionnel
  - Gestion des structures, sites et services
  - Gestion des utilisateurs et rôles
  - Accès aux données non médicales
  - Accès aux données médicales : ❌ NON

### 3. Médecin du Travail (`medecin`)
- **Description** : Accès complet aux dossiers médicaux (DMST), visites médicales
- **Droits** :
  - Accès complet aux dossiers médicaux (DMST)
  - Création et suivi des visites médicales
  - Diagnostics, prescriptions, certificats
  - Suivi des pathologies et surveillances médicales
  - Accès aux données médicales : ✅ OUI

### 4. Infirmier SST (`infirmier`)
- **Description** : Enregistrement des constantes, assistance aux visites, vaccinations
- **Droits** :
  - Enregistrement des constantes
  - Assistance aux visites
  - Vaccinations
  - Suivi de surveillance médicale
  - Accès aux données médicales : ✅ OUI

### 5. Consultant SST (`consultant`)
- **Description** : Évaluation des risques professionnels, plans d'actions SST
- **Droits** :
  - Évaluation des risques professionnels
  - Élaboration des plans d'actions SST
  - Suivi des mesures préventives et correctives
  - Accès aux données médicales : ❌ NON

### 6. Ressources Humaines (`rh`)
- **Description** : Accès aux données administratives, réception d'alertes
- **Droits** :
  - Accès aux données administratives des agents
  - Réception d'alertes (accidents, inaptitudes, absences)
  - Aucun accès aux données médicales confidentielles
  - Accès aux données médicales : ❌ NON

### 7. Responsable HSE (`hse`)
- **Description** : Accès aux tableaux de bord et indicateurs, pilotage stratégique
- **Droits** :
  - Accès aux tableaux de bord et indicateurs
  - Rapports consolidés
  - Pilotage stratégique SST
  - Accès aux données médicales : ❌ NON

### 8. Direction Générale (`direction`)
- **Description** : Accès aux tableaux de bord et indicateurs, pilotage stratégique
- **Droits** :
  - Accès aux tableaux de bord et indicateurs
  - Rapports consolidés
  - Pilotage stratégique SST
  - Accès aux données médicales : ❌ NON

## 🔐 Matrice des Permissions

| Fonctionnalité | Super Admin | Admin | Médecin | Infirmier | Consultant | RH | HSE | Direction |
|----------------|-------------|-------|---------|-----------|------------|----|----|-----------|
| Gestion utilisateurs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestion entreprises/sites | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Consultation DMST | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modification DMST | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Visites médicales | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Accidents de travail | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Vaccination | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Prévention/Risques | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Formation | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Reporting | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

## 📝 Commandes Utiles

### Lister tous les utilisateurs
```bash
python manage.py list_users
```

### Créer un utilisateur via l'admin Django
1. Accéder à http://localhost:8000/admin
2. Se connecter avec un super utilisateur
3. Aller dans "Utilisateurs"
4. Cliquer sur "Ajouter un utilisateur"

### Créer un utilisateur via l'API
```bash
curl -X POST http://localhost:8000/api/auth/users/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "medecin1",
    "email": "medecin@example.com",
    "password": "motdepasse123",
    "password_confirm": "motdepasse123",
    "first_name": "Jean",
    "last_name": "Dupont",
    "role": "medecin",
    "phone": "+33123456789"
  }'
```

## 🔑 Accès aux Données Médicales

**Rôles avec accès médical :**
- Super Administrateur
- Médecin du Travail
- Infirmier SST

**Rôles sans accès médical :**
- Administrateur
- Consultant SST
- Ressources Humaines
- Responsable HSE
- Direction Générale

## 📞 Coordonnées des Utilisateurs

Pour voir les coordonnées de tous les utilisateurs enregistrés dans le système, exécutez :

```bash
python manage.py list_users
```

Ou accédez à l'interface d'administration Django :
- URL : http://localhost:8000/admin
- Section : "Utilisateurs"
