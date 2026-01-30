# Rapport de conformité – Cahiers des charges SST

**Références** : `SPECIFICATION_MODULES_SST.md`, `CONCEPTION_DJANGO_MODULES_SST.md` (Cahiers des charges Suivi Santé du Personnel / Application Intégrée SST).

**Périmètre** : Modules Vaccination, Prévention, Formation, Reporting, Paramètres (frontend + backend existant).

---

## 1. MODULE VACCINATION

### ✅ Conforme

| Exigence | Statut | Implémentation |
|----------|--------|----------------|
| Accès données médicales réservé au personnel médical | ✅ | `hasMedicalAccess` (Médecin, Infirmier, Super Admin) ; message « Accès réservé » pour les autres. |
| Fiche vaccination : vaccins reçus, dates, rappels, notes | ✅ | Liste vaccinations (agent, vaccin, date, rappel, statut) ; formulaire avec n° lot, notes. |
| Référentiel vaccins (nom, code, validité) | ✅ | Onglet Vaccins ; paramétrage dans Paramètres. |
| Surveillance médicale (quinquennale, spécifique, etc.) | ✅ | Onglet Surveillances ; types, dates, revue. |
| Indicateurs : rappels à échéance | ✅ | Cartes « Rappels à échéance », « Surveillances actives ». |
| Filtrage par structure (entreprise) | ✅ | Filtre entreprise sur vaccinations et surveillances. |
| Enregistrement vaccination (personnel médical) | ✅ | Bouton + formulaire (agent, vaccin, date, rappel, lot, notes). |

### ⚠️ Partiel ou absent

| Exigence | Statut | Commentaire |
|----------|--------|-------------|
| **Calendrier** par service / site / structure | ✅ | Filtres entreprise, site, service sur vaccinations, surveillances, alertes, contre-indications. |
| **Contre-indications** (VaccineContraindication) | ✅ | API `contraindications` ; onglet Contre-indications + formulaire (médecin). |
| **Vaccinations obligatoires** (VaccineRequirement par poste/risque) | ✅ | API `requirements` ; Paramètres > Référentiels « Vaccinations obligatoires » (list + add). |
| **Alertes automatiques** (J-30, J-15, J-7, retards) | ✅ | API `alerts` ; onglet Alertes + prise en compte (acknowledge). |
| **Exports ciblés** (liste agents à vacciner, planning par site/service) | ⚠️ | Exports Reporting généraux (PDF/Excel) ; pas d’export dédié vaccination. |
| **Fiche vaccination par agent** (vue détaillée par agent) | ⚠️ | Liste + filtres ; pas de fiche dédiée par agent. |
| **Distinction Médecin / Infirmier** (infirmier : pas de modification des contre-indications) | ❌ | Non implémenté ; les deux ont les mêmes actions. |

---

## 2. MODULE PRÉVENTION & ÉVALUATION DES RISQUES

### ✅ Conforme

| Exigence | Statut | Implémentation |
|----------|--------|----------------|
| Catégories de risques (physique, psycho, bio, chimique, ergo) | ✅ | RiskCategory avec `category_type` ; paramétrage. |
| Identification des risques (structure, poste, gravité, probabilité) | ✅ | Création risque (company, site, service, category, severity, probability). |
| Fiche individuelle d’exposition (FIE) | ✅ | Liste + création (agent, période, risques exposés M2M). |
| Fiche individuelle des risques (FIR) | ✅ | Liste + création (agent, description, mesures préventives). |
| Plan d’actions SST (préventif / correctif) | ✅ | Actions liées aux risques ; statuts ; création. |
| Indicateurs synthétiques (risques, actions, FIE, FIR) | ✅ | Cartes récapitulatives. |
| Lien Risk ↔ AT / MP | ✅ | Modèles RiskWorkAccidentLink, RiskOccupationalDiseaseLink (backend). |

### ⚠️ Partiel ou absent

| Exigence | Statut | Commentaire |
|----------|--------|-------------|
| **Rôles** : Consultant SST « Complet » sur prévention | ✅ | **Corrigé** : `canManage` = super_admin, admin, consultant, hse, direction. |
| **Médecin / Infirmier** : lecture seule (pas de modification EVRP) | ⚠️ | Actuellement médical peut créer ; spec : consultation uniquement. |
| **RH** : accès limité (alertes, pas détail EVRP) | ⚠️ | Actuellement RH peut tout gérer si `canManage` ; à restreindre selon spec. |
| **Fiche risque par poste** (synthèse risques par JobPosition) | ✅ | Onglet « Risques par poste » ; regroupement par poste. |
| **Indicateurs** : risques par catégorie, gravité/probabilité, taux avancement plan, actions en retard, couverture FIE/FIR | ✅ | API `prevention/indicators/` ; section Indicateurs (taux avancement, retard, couverture FIE/FIR, risques AT/MP, tableau risques par catégorie). |
| **Lien surveillance renforcée** (risques → orientation surveillance) | ⚠️ | Logique métier côté backend ; pas d’UI dédiée. |

---

## 3. MODULE FORMATION & SENSIBILISATION

### ✅ Conforme

| Exigence | Statut | Implémentation |
|----------|--------|----------------|
| Référentiel types de formation (SST, incendie, EPI, etc.) | ✅ | Liste ; paramétrage dans Paramètres. |
| Formations par agent (dates, rappel, statut, organisme, certificat) | ✅ | Liste + création (agent, type, dates, statut, organisme, formateur, résultat, n° certificat). |
| Historique formations (planifiée, en cours, terminée, annulée) | ✅ | Liste avec statuts ; filtre par statut. |
| Articles d’éducation sanitaire (titre, contenu, thématique, public cible) | ✅ | Liste + création (titre, contenu, thème, target_audience, is_published). |
| Indicateurs : formations, terminées, rappels à échéance | ✅ | Cartes récapitulatives. |

### ⚠️ Partiel ou absent

| Exigence | Statut | Commentaire |
|----------|--------|-------------|
| **Rôles** : Admin, Consultant, HSE, Direction en « gestion » | ✅ | **Corrigé** : `canManage` = super_admin, admin, consultant, hse, direction. |
| **Habilitations** (TrainingRequirement par poste) | ✅ | API `training/requirements` ; onglet Habilitations (list + add, admin). |
| **Diffusion ciblée** (all, surveillance) | ✅ | « Publier » appelle `articles/:id/publish/` ; création ArticleRecipient (all ou surveillance). |
| **Suivi lecture** (ArticleRecipient : lu, date) | ✅ | Dialogue Destinataires par article ; « Marquer lu » (PATCH). |
| **Indicateurs** : taux formation, couverture habilitations, etc. | ⚠️ | Comptages simples ; indicateurs détaillés à enrichir. |

---

## 4. MODULE REPORTING & TABLEAUX DE BORD

### ✅ Conforme

| Exigence | Statut | Implémentation |
|----------|--------|----------------|
| Tableaux de bord dynamiques (période, entreprise, site, service) | ✅ | Filtres start/end, company, site, service. |
| Indicateurs : visites, vaccination, AT, surveillance, formations | ✅ | Stats dashboard (agents, visites, réalisées, programmées, taux, accidents, arrêts, surveillance, alertes vaccination, formations valides/expirées). |
| Répartition par site / service | ✅ | Tableaux by_site, by_service. |
| Exports PDF et Excel | ✅ | Boutons Export PDF / Excel avec même périmètre que les filtres. |
| Accès par profil (IsReportingProfile) | ✅ | Backend : Direction, RH, HSE, Médecin, Admin, Super Admin, Consultant. |

### ✅ Corrigé (vérification 2025-01)

| Exigence | Statut | Commentaire |
|----------|--------|-------------|
| **Indicateurs SST** (taux fréquence, taux gravité) | ✅ | Affichés dans Reporting (taux fréquence, gravité, accidents, jours d’arrêt). |
| **Rapport état de santé** (Médecin / Infirmier) | ✅ | Section « État de santé » dans Reporting, réservée au personnel médical (DMST, surveillance, pathologies, handicap, grossesses). |

### ⚠️ Partiel ou absent

| Exigence | Statut | Commentaire |
|----------|--------|-------------|
| **Graphiques / visualisations** | ✅ | BarChart indicateurs clés ; PieChart répartition par site (effectifs). |
| **Accès différencié** (RH limité, Médecin vue complète) | ⚠️ | Backend `IsMedicalReportingProfile` pour health-status ; frontend ne propose pas de vue « santé » réservée au médical. |
| **Traçabilité des exports** (AuditLog) | ⚠️ | À vérifier côté backend (action `export`). |

---

## 5. MODULE PARAMÉTRAGE & ADMINISTRATION

### ✅ Conforme

| Exigence | Statut | Implémentation |
|----------|--------|----------------|
| Référentiels : Vaccins, Types formation, Catégories risques | ✅ | Page Paramètres > Référentiels (liste + ajout). |
| Mon compte (utilisateur connecté) | ✅ | Onglet « Mon compte » (nom, identifiant, email, rôle). |
| Gestion utilisateurs / rôles | ✅ | Via Django admin (hors Paramètres). |

### ⚠️ Partiel ou absent

| Exigence | Statut | Commentaire |
|----------|--------|-------------|
| **Rôles** : Paramétrage = Super Admin + Admin uniquement | ✅ | **Corrigé** : gestion des référentiels limitée à `canManageUsers` (super_admin, admin) ; HSE retiré. |
| **Structures** (Company, Site, Service) | ✅ | Tab « Structures » : listes Companies, Sites, Services, Job positions. |
| **Postes** (JobPosition), **Types de visites** (VisitType) | ✅ | Structures (postes) ; Référentiels « Types de visites » (list + add). |
| **Pathologies CIM-10** | ✅ | Référentiels « Pathologies » (liste lecture seule). |
| **Logs / audits, alertes et notifications** | ⚠️ | Backend uniquement ; pas d’UI Paramètres. |

---

## 6. SYNTHÈSE DES ACTIONS PRIORITAIRES

1. **Rôles et permissions (frontend)** — ✅ **Appliquées**  
   - **Prévention** : `canManage` = super_admin, admin, consultant, hse, direction.  
   - **Formation** : idem.  
   - **Paramètres** : référentiels = super_admin, admin uniquement.

2. **Reporting** — ✅ **Appliquées**  
   - Indicateurs SST (taux fréquence, gravité, accidents, jours d’arrêt) affichés.  
   - Section « État de santé » (health-status) pour le personnel médical.

3. **Vaccination (évolutions)**  
   - Exposer **contre-indications** et **vaccinations obligatoires** (API + UI) si besoin métier.  
   - Liste ou section **« Alertes vaccination »** (VaccinationAlert) dans le module.

4. **Formation (évolutions)**  
   - **Habilitations** (TrainingRequirement) : API + UI.  
   - **Destinataires / suivi lecture** (ArticleRecipient) dans l’UI.

5. **Prévention (évolutions)**  
   - Indicateurs détaillés (risques par catégorie, avancement plan, etc.).  
   - Restriction RH (consultation limitée) et Médical (lecture seule EVRP) selon spec.

---

*Rapport généré pour vérification de conformité aux cahiers des charges SST.*
