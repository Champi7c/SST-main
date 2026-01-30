# Conception Django — Modules SST

**Contexte** : Application SST existante (DMST, confidentialité médicale, architecture modulaire).  
**Objectif** : Conception et implémentation des modules Vaccination, Prévention & Évaluation des risques, Formation & Sensibilisation, Reporting & Tableaux de bord, conformes aux cahiers des charges SST.

---

## Vue d’ensemble de l’architecture

```
medical (Agent, DMST, Pathology, …)
    ↑
companies (Company, Site, Service, JobPosition, CompanyMembership)
    ↑
accounts (User, rôles)
    ↑
visits (VisitType, MedicalVisit, VisitConvocation)
accidents (WorkAccident, OccupationalDisease)
vaccination (Vaccine, Vaccination, MedicalSurveillance, …)
prevention (RiskCategory, Risk, PreventiveAction, FIE, FIR, …)
training (TrainingType, Training, EducationalArticle, ArticleRecipient, …)
reporting (vues, exports, indicateurs)
audit (AuditLog, MedicalDataAccess)
```

---

# 1. MODULE VACCINATION

## 1.1 Rôle du module

- Gérer le **référentiel vaccins** et le **calendrier vaccinal** (agent, service, site).
- Assurer le **suivi individuel** : vaccins reçus, dates d’injection, rappels, statut (à jour / en retard).
- Définir les **vaccinations obligatoires** selon le poste et les risques.
- Générer des **alertes** (à échéance, expiré).
- **Historiser** les actes et maintenir les **liaisons** avec Agent, Visite médicale, Surveillance médicale.
- **Restreindre** l’accès aux données au personnel médical.

## 1.2 Modèles principaux

| Modèle | Description |
|--------|-------------|
| **Vaccine** | Référentiel : nom, code, description, `validity_period_months`, actif. Existant. |
| **Vaccination** | Acte de vaccination : agent, vaccin, date d’injection, n° lot, `next_due_date`, `administered_by`, notes. Unicité (agent, vaccin, date). **À ajouter** : FK optionnelle vers `MedicalVisit` (lien avec visite). Existant, à enrichir. |
| **MedicalSurveillance** | Surveillance quinquennale / spécifique / chronique : agent, type, dates, raison, constats, `prescribed_by`. Existant. |
| **VaccineContraindication** | **Nouveau.** Contre-indication par agent : agent, vaccin, raison, date de constat, médecin. Données médicales. |
| **VaccineRequirement** | **Nouveau.** Vaccin obligatoire ou recommandé : vaccin, et soit `job_position` soit `risk_category` (prevention.RiskCategory). Champ `mandatory` (booléen). |
| **VaccinationAlert** | **Nouveau.** Alerte générée : agent, vaccin, type (`due_soon` / `overdue`), `due_date`, `created_at`, `acknowledged`. Permet listing des alertes et envoi de notifications. |

**Historisation** : Les actes sont déjà historisés via `Vaccination` (un enregistrement par injection). Toute création/modification doit être tracée dans `AuditLog` et tout accès aux données médicales dans `MedicalDataAccess`.

## 1.3 Relations entre modèles

- **Vaccination** → Agent, Vaccine, User (`administered_by`), MedicalVisit (optionnel, **à ajouter**).
- **MedicalSurveillance** → Agent, User (`prescribed_by`).
- **VaccineContraindication** → Agent, Vaccine, User.
- **VaccineRequirement** → Vaccine, JobPosition (nullable), RiskCategory (nullable). Contrainte : au moins un des deux renseigné.
- **VaccinationAlert** → Agent, Vaccine. Pas de FK directe vers Vaccination ; dérivé par calcul (dernière vaccination + validité).

## 1.4 Règles métier

1. **Statut vaccin par agent** : à jour si `next_due_date` > aujourd’hui ou si contre-indication ; sinon en retard. Calcul côté service ou property.
2. **Obligatoires** : pour un agent, obligations = VaccineRequirement où `job_position` = poste de l’agent ou `risk_category` ∈ risques exposés (FIE).
3. **Alertes** :  
   - `due_soon` : rappel dans les J jours (paramètre, ex. 30).  
   - `overdue` : `next_due_date` < aujourd’hui.  
   Tâche planifiée ou signal post-save pour recalcul des alertes.
4. **Calendrier** : vues agrégées par agent, puis par service (via Agent.service), puis par site (via Agent.site). Filtrage par période.
5. **Contre-indication** : si présente, l’agent est exclu des obligations pour ce vaccin et des alertes associées.
6. **Lien visite** : lors d’une visite, le médecin peut enregistrer une vaccination et lier l’acte à la visite (`Vaccination.visit`).

## 1.5 Permissions et accès

- **Données médicales** (Vaccination, MedicalSurveillance, VaccineContraindication) : **personnel médical uniquement** (Médecin, Infirmier SST, Super Admin). `IsMedicalStaff` ou `CanViewMedicalData`.
- **Référentiel** Vaccine, VaccineRequirement : lecture par médical ; édition par Admin / Super Admin (paramétrage).
- **Alertes** : liste des alertes et statistiques agrégées (nombre par site/service) accessibles au médical ; pas de détail nominatif pour non‑médicaux.
- **Traçabilité** : création/modification/suppression de Vaccination, Contraindication → `AuditLog`. Consultation données médicales → `MedicalDataAccess`.

## 1.6 Indicateurs produits

| Indicateur | Définition |
|------------|------------|
| Taux de couverture vaccinale | % d’agents à jour pour les vaccins obligatoires (poste/risques) / agents concernés. |
| Vaccination par vaccin / service / site | Effectifs à jour, en retard, non vaccinés, contre-indiqués. |
| Nombre d’alertes à échéance | Rappels dans les J jours. |
| Nombre d’alertes en retard | Rappels dépassés. |

---

# 2. MODULE PRÉVENTION & ÉVALUATION DES RISQUES

## 2.1 Rôle du module

- **Identifier les dangers** par poste, service, site.
- Réaliser l’**EVRP** (Évaluation des Risques Professionnels) et les **fiches individuelles d’exposition**.
- **Classifier** les risques (physiques, biologiques, chimiques, psychosociaux, ergonomiques).
- **Élaborer et suivre** le plan d’actions SST (préventif, correctif).
- **Lier** obligatoirement avec accidents de travail, maladies professionnelles, visites médicales et surveillance médicale.

## 2.2 Modèles principaux

| Modèle | Description |
|--------|-------------|
| **RiskCategory** | Catégorie de risque : nom, code, description. **À préciser** : type fixe (physique, biologique, chimique, psychosocial, ergonomique) via `category_type` ou jeu de données initial. Existant. |
| **Risk** | Risque professionnel : company, site, service, job_position, category, nom, description, gravité, probabilité, fréquence d’exposition, identifié par, date. Existant. |
| **PreventiveAction** | Action préventive ou corrective : risk, type, titre, description, dates (prévue, échéance, réalisation), statut, responsable, efficacité. Existant. |
| **IndividualExposureSheet (FIE)** | Fiche individuelle d’exposition : agent, période d’exposition, M2M vers Risk. Existant. |
| **IndividualRiskSheet (FIR)** | Fiche individuelle des risques : agent, description des risques, mesures préventives. Existant. |
| **RiskWorkAccidentLink** | **Nouveau.** Liaison Risk ↔ WorkAccident : risk, work_accident, commentaire optionnel. |
| **RiskOccupationalDiseaseLink** | **Nouveau.** Liaison Risk ↔ OccupationalDisease : risk, occupational_disease, commentaire optionnel. |

**Liaison visites / surveillance** :  
- **Visite** : lien logique via Agent (visite d’un agent exposé à des risques). Optionnel : FK `MedicalVisit` → `Risk` (risque à l’origine de la visite) ou table de liaison générique.  
- **Surveillance** : idem via Agent. Les agents sous surveillance (MedicalSurveillance) peuvent avoir une FIE liée aux risques concernés. La « liaison obligatoire » est assurée par la chaîne Agent ↔ FIE ↔ Risk et Agent ↔ Visite / Surveillance.

## 2.3 Relations entre modèles

- **Risk** → Company, Site, Service, JobPosition, RiskCategory, User (`identified_by`).
- **PreventiveAction** → Risk, User (`responsible`, `created_by`).
- **IndividualExposureSheet** → Agent, M2M Risk, User (`created_by`).
- **IndividualRiskSheet** → Agent, User (`created_by`).
- **RiskWorkAccidentLink** → Risk, WorkAccident.
- **RiskOccupationalDiseaseLink** → Risk, OccupationalDisease.

## 2.4 Workflow métier

1. **Identification** : création de Risk par poste / service / site. RiskCategory utilisé pour la classification.
2. **EVRP** : saisie gravité, probabilité, fréquence. Révision périodique (processus métier, pas de statut dédié dans les modèles de base).
3. **FIE** : création par agent, choix des risques exposés (M2M), période d’exposition.
4. **FIR** : synthèse écrite des risques et mesures préventives par agent.
5. **Plan d’actions** : création de PreventiveAction à partir des risques ; suivi des statuts (planifiée → en cours → terminée).
6. **Liaison AT/MP** : lorsqu’un AT ou une MP est déclaré(e), association aux risques pertinents via RiskWorkAccidentLink / RiskOccupationalDiseaseLink.
7. **Visites / Surveillance** : utilisation des risques et FIE pour orienter les visites et la surveillance (logique métier et requêtes), avec liaison explicite optionnelle (FK ou table dédiée) si besoin.

## 2.5 Règles métier

- Au moins un parmi site, service, job_position renseigné pour Risk (ou règles métier équivalentes).
- PreventiveAction : `completed_date` renseigné lorsque statut = terminée.
- FIE : unicité par agent (OneToOne). FIR : idem.

## 2.6 Permissions et accès

- **Consultant SST, HSE, Direction, Admin** : CRUD Risk, PreventiveAction, FIE, FIR (hors données médicales sensibles). Lecture AT/MP liés.
- **Médecin / Infirmier** : lecture des risques, FIE, FIR pour avis médical ; pas de modification EVRP.
- **RH** : accès limité (ex. alertes, pas détail EVRP) selon politique.
- Données FIE/FIR : distinction données « organisationnelles » vs sensibles ; accès selon rôles et audit si besoin.

## 2.7 Indicateurs de prévention

| Indicateur | Définition |
|------------|------------|
| Risques par catégorie | Nombre de risques actifs par RiskCategory (physique, bio, etc.). |
| Risques par gravité / probabilité | Répartition. |
| Taux d’avancement du plan d’actions | % d’actions terminées / (planifiées + en cours + terminées). |
| Actions en retard | Actions avec `due_date` < aujourd’hui et statut ≠ terminée. |
| Couverture FIE/FIR | % d’agents avec FIE et FIR renseignées. |
| Risques liés aux AT/MP | Nombre de risques ayant au moins un AT ou une MP lié(e). |

---

# 3. MODULE FORMATION & SENSIBILISATION

## 3.1 Rôle du module

- Gérer les **formations SST** (SST, incendie, EPI, hygiène & sécurité) et le **suivi des compétences et habilitations**.
- Conserver l’**historique des formations** par agent.
- Gérer l’**éducation sanitaire** : rédaction d’articles, **diffusion ciblée** (tout le personnel, par catégorie, agents sous surveillance).

## 3.2 Modèles principaux

| Modèle | Description |
|--------|-------------|
| **TrainingType** | Référentiel : nom, code, description, `validity_period_months`, actif. Existant. |
| **Training** | Formation suivie : type, agent, dates (début, fin, prochain rappel), statut, organisme, formateur, résultat, n° certificat, `created_by`. Existant. |
| **EducationalArticle** | Article : titre, contenu, thématique, liens, `target_audience` (all, category, surveillance, specific), publié, date de publication, auteur. Existant. |
| **ArticleRecipient** | Destinataire : article, agent, lu, date de lecture. Existant. |
| **TrainingRequirement** | **Nouveau.** Formation obligatoire par poste : training_type, job_position, `mandatory` (booléen). |

## 3.3 Relations entre modèles

- **Training** → TrainingType, Agent, User (`created_by`).
- **EducationalArticle** → User (`author`).
- **ArticleRecipient** → EducationalArticle, Agent.
- **TrainingRequirement** → TrainingType, JobPosition.

## 3.4 Règles métier

1. **Validité / expiration** :  
   - Valide si `status` = terminée et `next_due_date` > aujourd’hui.  
   - `next_due_date` = `end_date` + `validity_period_months` (TrainingType). Saisie manuelle ou calcul à la clôture de la formation.
2. **Habilitations** : pour un agent, formations requises = TrainingRequirement où `job_position` = poste de l’agent. Conformité = toutes les formations obligatoires valides.
3. **Diffusion** :  
   - `all` : tous les agents actifs.  
   - `category` : filtrage par `professional_category` (Agent) ou autre critère.  
   - `surveillance` : agents avec MedicalSurveillance active.  
   - `specific` : liste explicite de destinataires (ArticleRecipient).  
   Lors de la publication, création des ArticleRecipient selon la cible.

## 3.5 Permissions et accès

- **Admin, Consultant, HSE, Direction, Médecin, Infirmier** : gestion formations et articles selon matrice (PROFILS_UTILISATEURS).
- **RH** : pas d’accès direct standard ; alertes formations possibles.
- Référentiel TrainingType, TrainingRequirement : paramétrage par Admin / Super Admin.

## 3.6 Indicateurs de couverture formation

| Indicateur | Définition |
|------------|------------|
| Taux de formation | % d’agents ayant au moins une formation à jour par type (sur les concernés). |
| Taux de couverture des habilitations | % d’agents conformes aux formations obligatoires du poste. |
| Formations à échéance | Nombre de formations avec `next_due_date` dans les J jours. |
| Formations expirées | `next_due_date` < aujourd’hui. |
| Taux de lecture des articles | % de destinataires ayant « lu » par article ou par campagne. |

---

# 4. MODULE REPORTING & TABLEAUX DE BORD

## 4.1 Rôle du module

- **Pilotage stratégique SST** : tableaux de bord globaux, par entreprise, par site, par service.
- **Indicateurs clés** : taux de vaccination, agents sous surveillance, AT, MP, formations valides.
- **Filtrage** par période.
- **Export** PDF et Excel.
- **Accès différencié** selon profil : Direction Générale, RH, Responsable HSE, Médecin (vue complète).

## 4.2 Modèles principaux

- Pas de **modèles métier** dédiés. Le reporting s’appuie sur des **vues** (API ou Django views) et **services** qui agrègent les données des autres apps.
- **Optionnel** : modèle `ReportExecution` ou `DashboardExport` pour tracer les exports (qui, quand, périmètre) si besoin d’audit renforcé.

## 4.3 Sources de données (relations utilisées)

- **Agent** : effectifs, filtres company / site / service.
- **MedicalVisit** : visites, statuts, décisions (agrégats).
- **Vaccination, MedicalSurveillance** : couverture, alertes, effectifs sous surveillance (agrégats).
- **WorkAccident, OccupationalDisease** : AT, MP, arrêts, taux.
- **Training** : formations, validité, habilitations.
- **Risk, PreventiveAction** : indicateurs prévention.

## 4.4 Règles métier

- **Filtrage** : tout indicateur peut être restreint par période (start_date, end_date), company, site, service. Respect du périmètre utilisateur (CompanyMembership).
- **Secret médical** : pas de données médicales **nominatives** pour DG, RH, HSE. Agrégats uniquement (taux, effectifs). Médecin : vue complète (agrégats + accès aux données médicales via ses droits existants).
- **Exports** : PDF (rapports synthétiques), Excel (données agrégées, listes non médicales). Traçabilité des exports (AuditLog, action `export`).

## 4.5 Permissions et accès

| Profil | Droits |
|--------|--------|
| **Direction Générale** | Tableaux de bord, indicateurs non médicaux, exports. |
| **RH** | Indicateurs RH (alertes, visites en volume, formations à échéance), pas de détail médical. |
| **Responsable HSE** | Tous les indicateurs non médicaux, prévention, AT/MP, formations, exports. |
| **Médecin** | Vue complète : indicateurs + accès aux données médicales (DMST, visites, vaccination, surveillance) selon permissions existantes. |

Implémentation : permissions Django (ou DRF) par vue / endpoint, selon `user.role` (direction, rh, hse, medecin, etc.).

## 4.6 Indicateurs produits

| Indicateur | Définition |
|------------|------------|
| Taux de vaccination | Défini dans module Vaccination ; exposé en reporting. |
| Agents sous surveillance | Effectifs avec surveillance active (MedicalSurveillance). |
| Accidents de travail | Nombre, par type, par gravité, avec/sans arrêt, jours d’arrêt. |
| Maladies professionnelles | Nombre, par statut (suspectée, déclarée, reconnue, rejetée). |
| Formations valides | Effectifs à jour par type ; taux de couverture habilitations. |
| Visites | Réalisées, programmées, absents, taux de réalisation. |
| Taux de fréquence / gravité | Selon formules standards (heures travaillées, etc.). |

---

# 5. SÉCURITÉ & RÈGLES TRANSVERSALES

## 5.1 Secret médical

- **Données médicales** : DMST, visites, vaccinations, surveillances, contre-indications, diagnostics, prescriptions, etc.
- **Accès** : Médecin, Infirmier SST, Super Admin uniquement. Utiliser `IsMedicalStaff` / `CanViewMedicalData` sur toutes les vues concernées.
- **Reporting** : aucun nominatif médical pour DG, RH, HSE ; indicateurs agrégés uniquement.

## 5.2 Séparation données médicales / non médicales

- **Médical** : vaccination (actes, contre-indications), surveillance, DMST, visites (détail), pathologies.
- **Non médical** : structures, postes, risques, plan d’actions, formations (hors contexte médical), indicateurs agrégés, alertes quantitatives.

## 5.3 Permissions Django par rôle

- **Médecin, Infirmier** : `has_medical_access` (accounts.User). Permission `IsMedicalStaff`.
- **RH** : pas d’accès médical ; reporting limité (alertes, volumes).
- **HSE, DG** : reporting, prévention, indicateurs ; pas de détail médical.
- **Admin, Super Admin** : paramétrage, utilisateurs ; Super Admin + accès médical si besoin.
- **Consultant SST** : prévention, formations ; pas d’accès médical.

Vérifier `user.role` dans les vues et sérialiseurs pour filtrer les champs ou les querysets (ex. masquer données médicales aux non‑médicaux).

## 5.4 Traçabilité des actions sensibles

- **AuditLog** : création, modification, suppression, export. Utiliser `ContentType` + `object_id` pour lier à l’entité concernée. Enregistrer `user`, `action_type`, `model_name`, `changes` (JSON), `ip_address`, `user_agent`, `timestamp`.
- **MedicalDataAccess** : à chaque consultation de données médicales (DMST, visite, vaccination, etc.), créer un enregistrement : user, agent, type de donnée, raison optionnelle, timestamp.
- Intégrer l’appel à l’audit dans les vues ou via signals (post_save, etc.) pour les modèles sensibles.

---

# 6. Synthèse des écarts à l’existant

| Module | À ajouter / modifier |
|--------|----------------------|
| **Vaccination** | VaccineContraindication, VaccineRequirement, VaccinationAlert ; FK `visit` sur Vaccination ; logique alertes, statut à jour/retard ; permissions par vue. |
| **Prévention** | RiskCategory : type (physique, bio, etc.) ; RiskWorkAccidentLink, RiskOccupationalDiseaseLink ; workflow et indicateurs. |
| **Formation** | TrainingRequirement ; logique validité / expiration ; règles de diffusion ciblée ; indicateurs. |
| **Reporting** | Permissions par profil (DG, RH, HSE, Médecin) ; exports PDF / Excel ; indicateurs vaccination + formations valides ; traçabilité exports. |

---

**Document de conception** — Prêt pour implémentation dans l’application SST existante.
