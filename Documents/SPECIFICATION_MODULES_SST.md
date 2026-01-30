# Spécification détaillée des modules SST

**Contexte** : Application intégrée SST, conforme aux exigences réglementaires, au secret médical et aux bonnes pratiques (CIM-10, EVRP).  
**Référence** : Cahiers des charges SST (Suivi Santé du Personnel / Application Intégrée SST).

---

## 1. MODULE VACCINATION

### 1.1 Objectifs

- Assurer une **gestion complète de la vaccination en santé au travail** (obligations réglementaires, poste, risques).
- Garantir le **suivi des vaccins et rappels** par agent, service, site et structure.
- Produire des **indicateurs de couverture vaccinale** et des **alertes** (échéances, retards).
- Restreindre l’accès aux **données médicales** au personnel médical habilité.

### 1.2 Fonctionnalités clés

| Fonctionnalité | Description |
|----------------|-------------|
| **Calendrier vaccinal** | Vue par agent, service, site, structure ; planification des vaccinations et rappels. |
| **Fiche vaccination par agent** | Vaccins reçus, dates, numéros de lot, rappels, contre-indications, notes. |
| **Référentiel vaccins** | Nom, code, durée de validité, lien éventuel avec poste/risques. |
| **Vaccinations obligatoires** | Règles par poste de travail et par risques professionnels (biologiques, etc.). |
| **Alertes automatiques** | Vaccins à échéance (J-30, J-15, J-7), retards de vaccination, rappels non effectués. |
| **Surveillance médicale** | Suivi quinquennal / spécifique / maladie chronique, dates de révision. |
| **Exports ciblés** | Liste des agents à vacciner, planning par site/service (sans données sensibles pour non-médicaux). |

### 1.3 Acteurs concernés

| Rôle | Droits |
|------|--------|
| **Médecin du travail** | Création/modification fiches vaccination, validation, contre-indications, accès complet. |
| **Infirmier SST** | Saisie vaccinations, rappels, constantes ; pas de modification des contre-indications. |
| **Super administrateur** | Accès technique et fonctionnel complet. |
| **Admin, RH, HSE, Direction, Consultant** | ❌ Aucun accès aux données médicales de vaccination. |

### 1.4 Données manipulées

| Entité | Champs principaux | Règles |
|--------|-------------------|--------|
| **Vaccine** | name, code, description, validity_period_months, is_active | Référentiel paramétrable. |
| **Vaccination** | agent, vaccine, vaccination_date, batch_number, next_due_date, administered_by, notes | Unicité (agent, vaccin, date). |
| **MedicalSurveillance** | agent, surveillance_type, start_date, next_review_date, reason, medical_findings, prescribed_by | Types : quinquennale, spécifique, chronique. |
| **Agent** | Via medical.Agent (company, site, service, job_position) | Agrégation par structure. |

*À prévoir en paramétrage* : lien **Vaccin ↔ Poste** et **Vaccin ↔ Risque** pour obligatoire/ Recommandé.

### 1.5 Règles de sécurité et de confidentialité

- **Secret médical** : Données vaccination et surveillance = données de santé ; accès réservé au personnel médical (Médecin, Infirmier SST, Super Admin).
- **Traçabilité** : Chaque création/modification enregistrée (utilisateur, horodatage) ; accès aux données médicales tracés via `MedicalDataAccess` (audit).
- **RGPD** : Finalité explicite (suivi vaccinal SST), durée de conservation définie, droits des personnes respectés.
- **Échanges** : Pas d’export de données individuelles médicales vers RH/Direction/HSE ; uniquement indicateurs agrégés (taux, alertes quantitatives).

### 1.6 Indicateurs de performance

| Indicateur | Formule / définition |
|------------|----------------------|
| **Taux de couverture vaccinale** | % d’agents à jour pour les vaccins obligatoires (par poste/risque) sur les agents concernés. |
| **Vaccination par vaccin** | Nombre d’agents à jour / en retard / non vaccinés par vaccin. |
| **Vaccination par service / site** | Même logique, agrégée par service puis par site. |
| **Alertes à échéance** | Nombre de rappels dans les 30 jours ; nombre de retards. |
| **Taux de conformité** | % d’agents conformes aux obligations vaccinales du poste. |

---

## 2. MODULE PRÉVENTION & ÉVALUATION DES RISQUES

### 2.1 Objectifs

- Mettre en place une **EVRP** (Évaluation des Risques Professionnels) structurée et traçable.
- Gérer **fiches individuelles d’exposition** et **fiches des risques par poste**.
- Piloter un **plan d’actions SST** (préventif et correctif) et assurer le suivi des mesures.
- Faire le **lien avec accidents, maladies professionnelles et surveillance médicale renforcée**.

### 2.2 Fonctionnalités clés

| Fonctionnalité | Description |
|----------------|-------------|
| **Identification des dangers** | Recensement des dangers par unité de travail (site, service, poste). |
| **Catégories de risques** | Classification : physiques, psychosociaux, biologiques, chimiques, ergonomiques (RiskCategory). |
| **Évaluation des risques** | Par risque : gravité, probabilité, fréquence d’exposition ; identification et date. |
| **Fiche risque par poste** | Risques rattachés au poste (JobPosition) ; synthèse par poste. |
| **Fiche individuelle d’exposition (FIE)** | Période d’exposition, risques exposés (liens vers Risk), par agent. |
| **Fiche individuelle des risques (FIR)** | Description des risques, mesures préventives, par agent. |
| **Plan d’actions SST** | Actions préventives / correctives liées aux risques ; statut, responsable, échéances. |
| **Lien accidents / MP** | Lien fonctionnel Risk ↔ WorkAccident, OccupationalDisease ; contribution à l’analyse. |
| **Lien surveillance renforcée** | Agents exposés à certains risques → orientation vers surveillance spécifique (medical.MedicalSurveillance). |

### 2.3 Acteurs concernés

| Rôle | Droits |
|------|--------|
| **Consultant SST** | EVRP, fiches risques, plan d’actions, suivi mesures ; pas d’accès données médicales. |
| **HSE, Direction** | Consultation indicateurs, rapports, plan d’actions ; pilotage. |
| **Admin** | Paramétrage structures, postes ; pas de données médicales. |
| **Médecin / Infirmier** | Consultation risques pour avis médical, pas de modification EVRP. |
| **RH** | Consultation limitée aux éléments nécessaires (ex. alertes, absences) ; pas d’EVRP détaillée. |

### 2.4 Données manipulées

| Entité | Champs principaux | Règles |
|--------|-------------------|--------|
| **RiskCategory** | name, code, description, is_active | Référentiel (physique, psycho, bio, chimique, ergo). |
| **Risk** | company, site, service, job_position, category, name, description, severity, probability, exposure_frequency, identified_by, identification_date | Risque rattaché à la structure et au poste. |
| **PreventiveAction** | risk, action_type, title, description, planned_date, due_date, completed_date, status, responsible, effectiveness | Préventif / Correctif ; statuts : planifiée, en cours, terminée, annulée. |
| **IndividualExposureSheet** | agent, exposure_period, exposed_risks (M2M) | FIE. |
| **IndividualRiskSheet** | agent, risks_description, preventive_measures | FIR. |

*À prévoir* : Liens explicites Risk ↔ WorkAccident, Risk ↔ OccupationalDisease (ex. clés étrangères ou champs dédiés).

### 2.5 Règles de sécurité et de confidentialité

- **Données non médicales** : EVRP, risques, plan d’actions = accessibles Consultant, HSE, Direction, Admin (selon périmètre).
- **Données médicales** : FIE/FIR peuvent contenir des éléments sensibles ; à traiter selon politique (accès médical si nécessaire, sinon agrégation).
- **Traçabilité** : Modifications sur Risk, PreventiveAction, FIE, FIR tracées (AuditLog).
- **Révision** : Révision périodique de l’EVRP et du plan d’actions (paramétrable).

### 2.6 Indicateurs de performance

| Indicateur | Formule / définition |
|------------|----------------------|
| **Risques par catégorie** | Nombre de risques actifs par RiskCategory (physique, psycho, etc.). |
| **Risques par gravité / probabilité** | Répartition severity × probability. |
| **Taux d’avancement du plan d’actions** | % d’actions terminées / planifiées + en cours. |
| **Actions en retard** | Nombre d’actions dont due_date &lt; aujourd’hui et status ≠ terminée. |
| **Couverture FIE/FIR** | % d’agents avec FIE et FIR renseignées. |
| **Risques liés aux AT/MP** | Nombre de risques associés à au moins un AT ou une MP. |

---

## 3. MODULE FORMATION & SENSIBILISATION

### 3.1 Objectifs

- Centraliser la **gestion des formations SST** (SST, incendie, EPI, hygiène-sécurité, etc.).
- Suivre **compétences et habilitations** par agent et assurer un **historique** des formations.
- Gérer des **articles d’éducation sanitaire** (rédaction, thématiques, diffusion ciblée).
- Produire des **indicateurs** (taux de formation, couverture des habilitations).

### 3.2 Fonctionnalités clés

| Fonctionnalité | Description |
|----------------|-------------|
| **Référentiel types de formation** | SST, Incendie, EPI, Hygiène et sécurité, etc. ; durée de validité (mois). |
| **Formations par agent** | Date début/fin, prochain rappel, organisme, formateur, résultat, n° certificat. |
| **Historique formations** | Liste chronologique des formations par agent ; statuts : planifiée, en cours, terminée, annulée. |
| **Habilitations** | Synthèse des formations requises par poste (à paramétrer) vs formations réalisées. |
| **Articles éducatifs** | Titre, contenu, thématique, liens ; statut publié, date de publication. |
| **Diffusion ciblée** | Public : tous, par catégorie, agents sous surveillance, agents spécifiques (ArticleRecipient). |
| **Suivi lecture** | Marquage “lu” et date de lecture par destinataire. |

### 3.3 Acteurs concernés

| Rôle | Droits |
|------|--------|
| **Admin, Consultant, HSE, Direction** | Gestion formations (saisie, planification), articles, diffusion ; consultation indicateurs. |
| **Médecin / Infirmier** | Consultation formations, articles ; peut contribuer à l’éducation sanitaire (rédaction si prévu). |
| **RH** | Pas d’accès direct selon matrice ; réception possible d’alertes (formations à renouveler). |
| **Super Admin** | Accès complet. |

### 3.4 Données manipulées

| Entité | Champs principaux | Règles |
|--------|-------------------|--------|
| **TrainingType** | name, code, description, validity_period_months, is_active | Référentiel. |
| **Training** | training_type, agent, start_date, end_date, next_due_date, status, training_organization, trainer_name, result, certificate_number, created_by | Un historique par formation. |
| **EducationalArticle** | title, content, theme, target_audience, is_published, published_date, author | Ciblage : all, category, surveillance, specific. |
| **ArticleRecipient** | article, agent, read, read_date | Destinataires et suivi de lecture. |

*À prévoir* : Lien **TrainingType ↔ JobPosition** (formations obligatoires par poste) pour habilitations.

### 3.5 Règles de sécurité et de confidentialité

- **Formations** : Données en principe non médicales ; accès selon rôles (Admin, Consultant, HSE, Direction, Médecin, Infirmier).
- **Articles** : Contenu potentiellement sensible ; contrôler selon thématique (sanitaire vs général).
- **Traçabilité** : Création/modification formations et articles ; consultation ciblée si besoin (AuditLog).
- **Diffusion** : Respect du public cible ; pas de diffusion de données médicales dans les articles.

### 3.6 Indicateurs de performance

| Indicateur | Formule / définition |
|------------|----------------------|
| **Taux de formation** | % d’agents ayant au moins une formation à jour (par type) sur les agents concernés. |
| **Taux de couverture habilitations** | % d’agents conformes aux formations obligatoires du poste. |
| **Formations à échéance** | Nombre de formations dont next_due_date dans les X jours (paramétrable). |
| **Formations par type / service / site** | Répartition et effectifs formés. |
| **Taux de lecture des articles** | % de destinataires ayant “lu” par article ou par campagne. |

---

## 4. MODULE REPORTING & TABLEAUX DE BORD

### 4.1 Objectifs

- Offrir un **pilotage stratégique SST** via tableaux de bord dynamiques (global, entreprise, site, service).
- Centraliser des **indicateurs clés** : visites, vaccination, AT, MP, surveillance, formations.
- Permettre **visualisations** (graphiques, comparaisons) et **exports** (PDF, Excel).
- Assurer un **accès différencié** selon les profils (DG, RH, HSE, Médecins).

### 4.2 Fonctionnalités clés

| Fonctionnalité | Description |
|----------------|-------------|
| **Tableaux de bord dynamiques** | Filtres par période, entreprise, site, service ; vues globales ou ciblées. |
| **Indicateurs visites** | Total, réalisées, programmées, absents ; taux de réalisation ; agents vus. |
| **Indicateurs vaccination** | Taux de couverture, rappels à échéance, retards (agrégés, sans détail médical). |
| **Indicateurs AT/MP** | Nombre d’AT, arrêts, jours d’arrêt ; MP déclarées/reconnues ; taux de fréquence/gravité. |
| **Surveillance médicale** | Effectifs sous surveillance (quinquennale, spécifique, chronique). |
| **Indicateurs formations** | Taux de formation, habilitations, formations à échéance. |
| **Répartition site / service** | Effectifs, visites, AT, etc. par site et par service. |
| **Exports** | PDF (rapports), Excel (données agrégées, listes non médicales). |
| **Accès par profil** | DG, RH, HSE : indicateurs autorisés ; Médecins : indicateurs + données médicales agrégées si pertinent. |

### 4.3 Acteurs concernés

| Rôle | Droits |
|------|--------|
| **Direction, HSE** | Tous les indicateurs non médicaux ; exports ; tableaux de bord stratégiques. |
| **RH** | Indicateurs RH (alertes, absences, visites réalisées en quantité) ; pas de détail médical. |
| **Médecin, Infirmier** | Tableaux de bord incluant indicateurs médicaux agrégés (vaccination, surveillance, etc.). |
| **Consultant, Admin** | Selon périmètre métier (prévention, formations, paramétrage). |
| **Super Admin** | Accès complet. |

### 4.4 Données manipulées

| Source | Usage |
|--------|--------|
| **Agent** | Effectifs, filtres company/site/service. |
| **MedicalVisit** | Visites, statuts, décisions (agrégés). |
| **Vaccination, MedicalSurveillance** | Couverture, échéances (agrégés). |
| **WorkAccident, OccupationalDisease** | AT, MP, arrêts, taux. |
| **Training** | Formations, habilitations. |
| **Risk, PreventiveAction** | Risques, plan d’actions (reporting prévention). |

*Aucune donnée médicale nominative* dans les exports pour non-médicaux ; agrégats et listes anonymisées uniquement.

### 4.5 Règles de sécurité et de confidentialité

- **Secret médical** : Pas de détail médical nominatif pour DG, RH, HSE ; indicateurs agrégés uniquement.
- **RGPD** : Exports limités au besoin ; pas de ré-identification inutile.
- **Traçabilité** : Exports et consultations de rapports tracés (AuditLog, type “export”).
- **Filtrage** : Respect du périmètre entreprise/site/service selon droits de l’utilisateur (CompanyMembership).

### 4.6 Indicateurs de performance

| Indicateur | Formule / définition |
|------------|----------------------|
| **Taux de réalisation des visites** | Visites réalisées / visites programmées (période). |
| **Taux de couverture vaccinale** | Défini dans module Vaccination ; repris en reporting. |
| **Taux de fréquence AT** | (Nombre AT / Heures travaillées) × 1 000 000. |
| **Taux de gravité** | (Jours d’arrêt / Heures travaillées) × 1 000. |
| **Effectifs sous surveillance** | Nombre d’agents avec surveillance active. |
| **Taux de formation / habilitations** | Définis dans module Formation ; repris en reporting. |

---

## 5. MODULE PARAMÉTRAGE & ADMINISTRATION

### 5.1 Objectifs

- Assurer la **gestion multi-entreprises et multi-sites** (structures, services, postes).
- Maintenir les **référentiels** : visites, vaccins, risques, pathologies (CIM-10), fonctions et postes.
- Gérer **utilisateurs, profils, rôles et droits d’accès**.
- Garantir **sécurité, confidentialité, traçabilité** et **paramétrage des alertes/notifications**.

### 5.2 Fonctionnalités clés

| Fonctionnalité | Description |
|----------------|-------------|
| **Multi-entreprises / multi-sites** | Company, Site, Service ; hiérarchie et statut actif/inactif. |
| **Postes de travail** | JobPosition (nom, code, description) par entreprise ; lien avec risques et formations. |
| **Référentiel types de visites** | VisitType (nom, code, description) pour visites médicales. |
| **Référentiel vaccins** | Vaccine (nom, code, validité) ; lien poste/risque pour obligatoire (à implémenter). |
| **Référentiel risques** | RiskCategory ; classification physique, psycho, bio, chimique, ergo. |
| **Référentiel pathologies** | CIM-10 (medical.Pathology) ; usage DMST, visites, MP. |
| **Utilisateurs et rôles** | User (accounts) ; rôles : super_admin, admin, medecin, infirmier, consultant, rh, hse, direction. |
| **Droits d’accès** | Permissions par rôle (IsMedicalStaff, IsSuperAdminOrAdmin, etc.) ; matrice PROFILS_UTILISATEURS. |
| **Appartenance entreprises** | CompanyMembership (user, company, site, is_primary) ; périmètre données. |
| **Logs et audits** | AuditLog (create, update, delete, view, export, login, logout) ; MedicalDataAccess pour accès médec. |
| **Alertes et notifications** | Paramétrage des seuils (vaccination, formations, visites) et des destinataires (RH, HSE, Direction). |

### 5.3 Acteurs concernés

| Rôle | Droits |
|------|--------|
| **Super administrateur** | Paramétrage complet, utilisateurs, sécurité, audits. |
| **Administrateur** | Structures, référentiels, utilisateurs ; pas de données médicales. |
| **Autres rôles** | Aucune gestion du paramétrage global ; accès selon permissions. |

### 5.4 Données manipulées

| Domaine | Entités |
|---------|--------|
| **Structures** | Company, Site, Service, JobPosition, CompanyMembership. |
| **Référentiels** | VisitType, Vaccine, RiskCategory, Pathology (CIM-10), TrainingType. |
| **Utilisateurs** | User (AUTH_USER_MODEL), rôles, permissions. |
| **Audit** | AuditLog, MedicalDataAccess. |
| **Paramétrage** | Configurations alertes (à modéliser : seuils, canaux, destinataires). |

### 5.5 Règles de sécurité et de confidentialité

- **Confidentialité données médicales** : Accès strictement limité (Médecin, Infirmier, Super Admin) ; traçabilité via MedicalDataAccess.
- **Traçabilité** : Toutes les actions sensibles (paramétrage, gestion utilisateurs, accès médec) en AuditLog.
- **Sécurité** : Authentification JWT ; politique mots de passe (voir SECURITE_MOTS_DE_PASSE) ; pas de stockage de secrets en clair.
- **RGPD** : Finalités documentées ; durées de conservation ; droits des personnes (accès, rectification, effacement).

### 5.6 Indicateurs de performance

| Indicateur | Formule / définition |
|------------|----------------------|
| **Utilisation des référentiels** | Nombre d’entités (visites, vaccins, risques, etc.) liées à chaque valeur de référentiel. |
| **Activité des utilisateurs** | Nombre d’actions par rôle/période (connexions, créations, modifications). |
| **Accès données médicales** | Nombre d’accès par utilisateur et par type de donnée (MedicalDataAccess). |
| **Alertes émises** | Volume d’alertes par type (vaccination, formation, visite, AT) et par période. |

---

## Synthèse des rôles et des modules

| Module | Super Admin | Admin | Médecin | Infirmier | Consultant | RH | HSE | Direction |
|--------|-------------|-------|---------|-----------|------------|----|----|-----------|
| **Vaccination** | ✅ Complet | ❌ | ✅ Complet | ✅ Saisie | ❌ | ❌ | ❌ | ❌ |
| **Prévention / Risques** | ✅ | ✅ | ✅ Lecture | ✅ Lecture | ✅ Complet | ✅ Limité | ✅ | ✅ |
| **Formation** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Reporting** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Paramétrage** | ✅ | ✅ Struct. | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*« Lecture » = consultation sans modification. « Limité » = selon matrice (ex. alertes uniquement).*

---

## Références projet

- **Profils** : `PROFILS_UTILISATEURS.md`
- **Sécurité** : `SECURITE_MOTS_DE_PASSE.md`
- **Audit** : `audit.models` (AuditLog, MedicalDataAccess)
- **Permissions** : `accounts.permissions` (IsMedicalStaff, IsSuperAdminOrAdmin, etc.)
