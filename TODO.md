# TODO - Ajout Ordonnance et Demande d'examen dans Dossier Médical

## Objectif
Dans la partie Dossier Médical (DMST), avant la visite, ajouter:
1. Ordonnance - pour créer des prescriptions médicales
2. Demande d'examen - pour demander des analyses/laboratoires
3. Impression avec logo pour les deux

## Tâches à effectuer

### 1. DMST.tsx - Ajouter les nouveaux onglets
- [ ] Ajouter Tab "Ordonnance" 
- [ ] Ajouter Tab "Demande d'examen"
- [ ] Ajouter les icônes correspondantes

### 2. DMST.tsx - Formulaire Ordonnance
- [ ] Ajouter champs pour les médicaments prescrits
- [ ] Ajouter champs pour les posologies
- [ ] Ajouter champ pour les instructions particulières

### 3. DMST.tsx - Formulaire Demande d'examen
- [ ] Ajouter types d'examens (biologie, radiologie, etc.)
- [ ] Ajouter champs pour les examens spécifiques
- [ ] Ajouter champ pour les motifs de demande

### 4. DMST.tsx - Impression PDF avec logo
- [ ] Ajouter section d'impression pour ordonnance
- [ ] Ajouter section d'impression pour demande d'examen
- [ ] Implémenter handlePrint et handleExportPDF pour les deux
- [ ] Inclure le logo comme dans les autres impressions

### 5. Sauvegarde des données
- [ ] Utiliser observation_form_data pour stocker les données
- [ ] Ajouter les nouvelles clés dans le formulaire

## Notes
- Les données seront sauvegardées dans le champ observation_form_data du DMST
- Le format d'impression doit être identique aux autres documents (logo COLY)
