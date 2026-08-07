// Configuration sémiologique data-driven pour l'examen clinique.
// Démonstrateur du modèle sur Respiratoire et Cardiovasculaire : chaque appareil
// suit les temps sémiologiques classiques (Inspection → Palpation → Percussion →
// Auscultation), avec localisation/latéralité et génération automatique de phrase.
// Pensé pour être étendu appareil par appareil sans changer l'architecture.

export interface Option {
  key: string
  label: string
}

export const label = (options: Option[], key: string) => options.find((o) => o.key === key)?.label || key
export const labels = (options: Option[], keys: string[]) => keys.map((k) => label(options, k))

// ─── Respiratoire ───────────────────────────────────────────────────────────

export const RESPI_INSPECTION: Option[] = [
  { key: 'tirage', label: 'Tirage' },
  { key: 'battement_ailes_nez', label: 'Battement des ailes du nez' },
  { key: 'cyanose', label: 'Cyanose' },
  { key: 'asymetrie_thoracique', label: 'Asymétrie thoracique' },
  { key: 'deformation_thoracique', label: 'Déformation thoracique' },
  { key: 'muscles_accessoires', label: 'Utilisation des muscles accessoires' },
]

export const RESPI_PALPATION: Option[] = [
  { key: 'vibrations_augmentees', label: 'Vibrations vocales augmentées' },
  { key: 'vibrations_diminuees', label: 'Vibrations vocales diminuées' },
  { key: 'douleur_parietale', label: 'Douleur pariétale' },
  { key: 'crepitation_sous_cutanee', label: 'Crépitation sous-cutanée' },
  { key: 'asymetrie_ampliation', label: 'Asymétrie de l\'ampliation thoracique' },
]

export const RESPI_PERCUSSION: Option[] = [
  { key: 'matite', label: 'Matité' },
  { key: 'hypersonorite', label: 'Hypersonorité' },
  { key: 'tympanisme', label: 'Tympanisme' },
]

export const RESPI_SIGNS: Option[] = [
  { key: 'murmure_diminue', label: 'Murmure vésiculaire diminué' },
  { key: 'murmure_aboli', label: 'Murmure vésiculaire aboli' },
  { key: 'crepitants', label: 'Crépitants' },
  { key: 'sibilants', label: 'Sibilants' },
  { key: 'ronchi', label: 'Ronchi' },
  { key: 'rales_bronchiques', label: 'Râles bronchiques' },
  { key: 'souffle_tubaire', label: 'Souffle tubaire' },
  { key: 'souffle_pleuretique', label: 'Souffle pleurétique' },
  { key: 'souffle_caverneux', label: 'Souffle caverneux' },
  { key: 'frottement_pleural', label: 'Frottement pleural' },
]

export const RESPI_COTE: Option[] = [
  { key: 'droit', label: 'Droit' },
  { key: 'gauche', label: 'Gauche' },
  { key: 'bilateral', label: 'Bilatéral' },
]

export const RESPI_SIEGE: Option[] = [
  { key: 'apical', label: 'Apical' },
  { key: 'sus_claviculaire', label: 'Sus-claviculaire' },
  { key: 'medio_thoracique', label: 'Médio-thoracique' },
  { key: 'basal', label: 'Basal' },
  { key: 'diffus', label: 'Diffus' },
]

export const RESPI_FACE: Option[] = [
  { key: 'anterieur', label: 'Antérieur' },
  { key: 'posterieur', label: 'Postérieur' },
  { key: 'postero_basal', label: 'Postéro-basal' },
  { key: 'axillaire', label: 'Axillaire' },
]

export function generateRespiratoirePhrase(d: Record<string, unknown>): string {
  const result = d['exam_respiratoire_result']
  if (result === 'normal') {
    return "Murmure vésiculaire présent et symétrique, pas de râles, pas de sibilants, pas de tirage."
  }
  if (result !== 'anormal') return ''

  const parts: string[] = []
  const signs = (d['exam_respiratoire_signs'] as string[]) || []
  if (signs.length) {
    const loc = [
      d['exam_respiratoire_cote'] ? label(RESPI_COTE, d['exam_respiratoire_cote'] as string).toLowerCase() : '',
      ...labels(RESPI_SIEGE, (d['exam_respiratoire_siege'] as string[]) || []).map((s) => s.toLowerCase()),
      ...labels(RESPI_FACE, (d['exam_respiratoire_face'] as string[]) || []).map((s) => s.toLowerCase()),
    ].filter(Boolean)
    parts.push(`${labels(RESPI_SIGNS, signs).join(', ')}${loc.length ? ' ' + loc.join(', ') : ''}.`)
  }
  const insp = labels(RESPI_INSPECTION, (d['exam_respiratoire_inspection'] as string[]) || [])
  if (insp.length) parts.push(`Inspection : ${insp.join(', ')}.`)
  const palp = labels(RESPI_PALPATION, (d['exam_respiratoire_palpation'] as string[]) || [])
  if (palp.length) parts.push(`Palpation : ${palp.join(', ')}.`)
  if (d['exam_respiratoire_percussion']) parts.push(`Percussion : ${label(RESPI_PERCUSSION, d['exam_respiratoire_percussion'] as string)}.`)
  const autre = d['exam_respiratoire_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── Cardiovasculaire ───────────────────────────────────────────────────────

export const CARDIO_INSPECTION: Option[] = [
  { key: 'cyanose', label: 'Cyanose' },
  { key: 'dyspnee', label: 'Dyspnée' },
  { key: 'signes_lutte', label: 'Signes de lutte' },
  { key: 'turgescence_jugulaire', label: 'Turgescence jugulaire' },
  { key: 'oedemes', label: 'Œdèmes' },
  { key: 'circulation_collaterale', label: 'Circulation veineuse collatérale' },
]

export const CARDIO_PALPATION: Option[] = [
  { key: 'choc_pointe_deplace', label: 'Choc de pointe déplacé' },
  { key: 'fremissement', label: 'Frémissement' },
  { key: 'pouls_absents', label: 'Pouls périphériques absents' },
  { key: 'asymetrie_pouls', label: 'Asymétrie des pouls' },
  { key: 'extremites_froides', label: 'Extrémités froides' },
  { key: 'oedemes', label: 'Œdèmes' },
]

export const CARDIO_POULS_TERRITOIRE: Option[] = [
  { key: 'carotidien', label: 'Carotidien' },
  { key: 'humeral', label: 'Huméral' },
  { key: 'radial', label: 'Radial' },
  { key: 'femoral', label: 'Fémoral' },
  { key: 'poplite', label: 'Poplité' },
  { key: 'tibial_posterieur', label: 'Tibial postérieur' },
  { key: 'pedieux', label: 'Pédieux' },
]

export const CARDIO_SIGNS: Option[] = [
  { key: 'rythme_irregulier', label: 'Rythme irrégulier' },
  { key: 'bruit_supplementaire', label: 'Bruit surajouté' },
  { key: 'galop', label: 'Bruit de galop' },
  { key: 'souffle', label: 'Souffle' },
  { key: 'frottement_pericardique', label: 'Frottement péricardique' },
]

export const CARDIO_SOUFFLE_TYPE: Option[] = [
  { key: 'systolique', label: 'Systolique' },
  { key: 'diastolique', label: 'Diastolique' },
  { key: 'continu', label: 'Continu' },
]

export const CARDIO_FOYER: Option[] = [
  { key: 'aortique', label: 'Aortique' },
  { key: 'pulmonaire', label: 'Pulmonaire' },
  { key: 'tricuspide', label: 'Tricuspide' },
  { key: 'mitral', label: 'Mitral' },
  { key: 'aortique_accessoire', label: 'Aortique accessoire' },
]

export function generateCardiovasculairePhrase(d: Record<string, unknown>): string {
  const result = d['exam_cardiovasculaire_result']
  if (result === 'normal') {
    return "Bruits du cœur réguliers, B1 et B2 normaux, pas de souffle, pouls périphériques présents et symétriques."
  }
  if (result !== 'anormal') return ''

  const parts: string[] = []
  const signs = (d['exam_cardiovasculaire_signs'] as string[]) || []
  if (signs.length) {
    let sentence = labels(CARDIO_SIGNS, signs).join(', ')
    if (signs.includes('souffle')) {
      const type = d['exam_cardiovasculaire_souffle_type'] ? label(CARDIO_SOUFFLE_TYPE, d['exam_cardiovasculaire_souffle_type'] as string).toLowerCase() : ''
      const foyer = d['exam_cardiovasculaire_souffle_foyer'] ? `foyer ${label(CARDIO_FOYER, d['exam_cardiovasculaire_souffle_foyer'] as string).toLowerCase()}` : ''
      const irrad = d['exam_cardiovasculaire_souffle_irradiation'] as string
      const details = [type, foyer, irrad ? `irradiation ${irrad}` : ''].filter(Boolean).join(', ')
      if (details) sentence += ` (${details})`
    }
    parts.push(sentence + '.')
  }
  const insp = labels(CARDIO_INSPECTION, (d['exam_cardiovasculaire_inspection'] as string[]) || [])
  if (insp.length) parts.push(`Inspection : ${insp.join(', ')}.`)
  const palp = labels(CARDIO_PALPATION, (d['exam_cardiovasculaire_palpation'] as string[]) || [])
  if (palp.length) parts.push(`Palpation : ${palp.join(', ')}.`)
  const poulsTerritoires = labels(CARDIO_POULS_TERRITOIRE, (d['exam_cardiovasculaire_pouls_territoire'] as string[]) || [])
  if (poulsTerritoires.length) parts.push(`Territoires de pouls concernés : ${poulsTerritoires.join(', ')}.`)
  const autre = d['exam_cardiovasculaire_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── Digestif ───────────────────────────────────────────────────────────────

export const DIGESTIF_INSPECTION: Option[] = [
  { key: 'cicatrice', label: 'Cicatrice' },
  { key: 'distension', label: 'Distension abdominale' },
  { key: 'hernie', label: 'Hernie visible' },
  { key: 'peristaltisme_visible', label: 'Péristaltisme visible' },
]

export const DIGESTIF_PALPATION: Option[] = [
  { key: 'douleur_provoquee', label: 'Douleur provoquée' },
  { key: 'defense', label: 'Défense' },
  { key: 'contracture', label: 'Contracture' },
  { key: 'masse', label: 'Masse palpable' },
  { key: 'hepatomegalie', label: 'Hépatomégalie' },
  { key: 'splenomegalie', label: 'Splénomégalie' },
]

export const DIGESTIF_PERCUSSION: Option[] = [
  { key: 'tympanisme', label: 'Tympanisme' },
  { key: 'matite', label: 'Matité' },
  { key: 'signe_du_flot', label: 'Signe du flot (ascite)' },
]

export const DIGESTIF_SIGNS: Option[] = [
  { key: 'bruits_diminues', label: 'Bruits hydro-aériques diminués' },
  { key: 'bruits_absents', label: 'Bruits hydro-aériques absents' },
  { key: 'bruits_augmentes', label: 'Bruits hydro-aériques augmentés' },
]

export const DIGESTIF_SIEGE: Option[] = [
  { key: 'hypochondre_droit', label: 'Hypochondre droit' },
  { key: 'epigastre', label: 'Épigastre' },
  { key: 'hypochondre_gauche', label: 'Hypochondre gauche' },
  { key: 'flanc_droit', label: 'Flanc droit' },
  { key: 'peri_ombilical', label: 'Péri-ombilical' },
  { key: 'flanc_gauche', label: 'Flanc gauche' },
  { key: 'fosse_iliaque_droite', label: 'Fosse iliaque droite' },
  { key: 'hypogastre', label: 'Hypogastre' },
  { key: 'fosse_iliaque_gauche', label: 'Fosse iliaque gauche' },
]

export function generateDigestifPhrase(d: Record<string, unknown>): string {
  const result = d['exam_digestif_result']
  if (result === 'normal') {
    return "Abdomen souple, indolore, sans masse ni défense, bruits hydro-aériques présents."
  }
  if (result !== 'anormal') return ''
  const parts: string[] = []
  const signs = (d['exam_digestif_signs'] as string[]) || []
  const palp = labels(DIGESTIF_PALPATION, (d['exam_digestif_palpation'] as string[]) || [])
  const siege = labels(DIGESTIF_SIEGE, (d['exam_digestif_siege'] as string[]) || []).map((s) => s.toLowerCase())
  if (palp.length) parts.push(`Palpation : ${palp.join(', ')}${siege.length ? ' (' + siege.join(', ') + ')' : ''}.`)
  if (signs.length) parts.push(`Auscultation : ${labels(DIGESTIF_SIGNS, signs).join(', ')}.`)
  const insp = labels(DIGESTIF_INSPECTION, (d['exam_digestif_inspection'] as string[]) || [])
  if (insp.length) parts.push(`Inspection : ${insp.join(', ')}.`)
  if (d['exam_digestif_percussion']) parts.push(`Percussion : ${label(DIGESTIF_PERCUSSION, d['exam_digestif_percussion'] as string)}.`)
  const autre = d['exam_digestif_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── Ostéo-articulaire ──────────────────────────────────────────────────────

export const OSTEO_INSPECTION: Option[] = [
  { key: 'deformation', label: 'Déformation' },
  { key: 'attitude_antalgique', label: 'Attitude antalgique' },
  { key: 'amyotrophie', label: 'Amyotrophie' },
  { key: 'tumefaction', label: 'Tuméfaction' },
]

export const OSTEO_PALPATION: Option[] = [
  { key: 'douleur_provoquee', label: 'Douleur provoquée' },
  { key: 'chaleur_locale', label: 'Chaleur locale' },
  { key: 'epanchement', label: 'Épanchement / choc rotulien' },
]

export const OSTEO_MOBILITE: Option[] = [
  { key: 'limitation_active', label: 'Limitation de la mobilité active' },
  { key: 'limitation_passive', label: 'Limitation de la mobilité passive' },
  { key: 'laxite', label: 'Laxité' },
  { key: 'craquement', label: 'Craquement' },
]

export const OSTEO_SIGNS: Option[] = [
  { key: 'douleur_mecanique', label: 'Douleur de type mécanique' },
  { key: 'douleur_inflammatoire', label: 'Douleur de type inflammatoire' },
]

export const OSTEO_SIEGE: Option[] = [
  { key: 'rachis_cervical', label: 'Rachis cervical' },
  { key: 'rachis_dorsal', label: 'Rachis dorsal' },
  { key: 'rachis_lombaire', label: 'Rachis lombaire' },
  { key: 'epaule', label: 'Épaule' },
  { key: 'coude', label: 'Coude' },
  { key: 'poignet_main', label: 'Poignet / main' },
  { key: 'hanche', label: 'Hanche' },
  { key: 'genou', label: 'Genou' },
  { key: 'cheville_pied', label: 'Cheville / pied' },
]

export const OSTEO_COTE: Option[] = [
  { key: 'droit', label: 'Droit' },
  { key: 'gauche', label: 'Gauche' },
  { key: 'bilateral', label: 'Bilatéral' },
]

export function generateOsteoarticulairePhrase(d: Record<string, unknown>): string {
  const result = d['exam_osteoarticulaire_result']
  if (result === 'normal') {
    return "Appareil locomoteur sans déformation, articulations souples et indolores, mobilité conservée, pas de tuméfaction."
  }
  if (result !== 'anormal') return ''
  const parts: string[] = []
  const signs = (d['exam_osteoarticulaire_signs'] as string[]) || []
  const siege = [
    d['exam_osteoarticulaire_cote'] ? label(OSTEO_COTE, d['exam_osteoarticulaire_cote'] as string).toLowerCase() : '',
    ...labels(OSTEO_SIEGE, (d['exam_osteoarticulaire_siege'] as string[]) || []).map((s) => s.toLowerCase()),
  ].filter(Boolean)
  if (signs.length) parts.push(`${labels(OSTEO_SIGNS, signs).join(', ')}${siege.length ? ' ' + siege.join(', ') : ''}.`)
  const insp = labels(OSTEO_INSPECTION, (d['exam_osteoarticulaire_inspection'] as string[]) || [])
  if (insp.length) parts.push(`Inspection : ${insp.join(', ')}.`)
  const palp = labels(OSTEO_PALPATION, (d['exam_osteoarticulaire_palpation'] as string[]) || [])
  if (palp.length) parts.push(`Palpation : ${palp.join(', ')}.`)
  const mob = labels(OSTEO_MOBILITE, (d['exam_osteoarticulaire_mobilite'] as string[]) || [])
  if (mob.length) parts.push(`Mobilité : ${mob.join(', ')}.`)
  const autre = d['exam_osteoarticulaire_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── Dermatologique ─────────────────────────────────────────────────────────

export const DERMATO_TYPE_LESION: Option[] = [
  { key: 'macule', label: 'Macule' },
  { key: 'papule', label: 'Papule' },
  { key: 'vesicule', label: 'Vésicule' },
  { key: 'pustule', label: 'Pustule' },
  { key: 'nodule', label: 'Nodule' },
  { key: 'plaque', label: 'Plaque' },
  { key: 'ulceration', label: 'Ulcération' },
  { key: 'erytheme', label: 'Érythème' },
]

export const DERMATO_CARACTERISTIQUES: Option[] = [
  { key: 'prurit', label: 'Prurit associé' },
  { key: 'desquamation', label: 'Desquamation' },
  { key: 'chaleur_locale', label: 'Chaleur locale' },
  { key: 'saignement', label: 'Saignement' },
]

export const DERMATO_SIEGE: Option[] = [
  { key: 'tete_cou', label: 'Tête / cou' },
  { key: 'tronc', label: 'Tronc' },
  { key: 'membre_superieur', label: 'Membre supérieur' },
  { key: 'membre_inferieur', label: 'Membre inférieur' },
  { key: 'plis', label: 'Plis' },
  { key: 'muqueuses', label: 'Muqueuses' },
]

export const DERMATO_COTE: Option[] = [
  { key: 'droit', label: 'Droit' },
  { key: 'gauche', label: 'Gauche' },
  { key: 'bilateral', label: 'Bilatéral' },
]

export function generateDermatologiquePhrase(d: Record<string, unknown>): string {
  const result = d['exam_dermatologique_result']
  if (result === 'normal') {
    return "Peau et phanères sans lésion visible, pas d'éruption ni de prurit."
  }
  if (result !== 'anormal') return ''
  const parts: string[] = []
  const type = (d['exam_dermatologique_type_lesion'] as string[]) || []
  const siege = [
    d['exam_dermatologique_cote'] ? label(DERMATO_COTE, d['exam_dermatologique_cote'] as string).toLowerCase() : '',
    ...labels(DERMATO_SIEGE, (d['exam_dermatologique_siege'] as string[]) || []).map((s) => s.toLowerCase()),
  ].filter(Boolean)
  if (type.length) parts.push(`${labels(DERMATO_TYPE_LESION, type).join(', ')}${siege.length ? ' ' + siege.join(', ') : ''}.`)
  const carac = labels(DERMATO_CARACTERISTIQUES, (d['exam_dermatologique_caracteristiques'] as string[]) || [])
  if (carac.length) parts.push(`${carac.join(', ')}.`)
  const autre = d['exam_dermatologique_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── ORL ────────────────────────────────────────────────────────────────────

export const ORL_OREILLES: Option[] = [
  { key: 'tympan_normal', label: 'Tympan normal' },
  { key: 'tympan_perfore', label: 'Tympan perforé' },
  { key: 'tympan_inflammatoire', label: 'Tympan inflammatoire' },
  { key: 'conduit_obstrue', label: 'Conduit auditif obstrué' },
]

export const ORL_NEZ: Option[] = [
  { key: 'obstruction', label: 'Obstruction nasale' },
  { key: 'douleur_sinusienne', label: 'Douleur à la pression sinusienne' },
  { key: 'rhinorrhee', label: 'Rhinorrhée' },
]

export const ORL_GORGE: Option[] = [
  { key: 'pharynx_inflammatoire', label: 'Pharynx inflammatoire' },
  { key: 'amygdales_hypertrophiees', label: 'Amygdales hypertrophiées' },
  { key: 'amygdales_inflammatoires', label: 'Amygdales inflammatoires' },
]

export const ORL_COTE: Option[] = [
  { key: 'droit', label: 'Droit' },
  { key: 'gauche', label: 'Gauche' },
  { key: 'bilateral', label: 'Bilatéral' },
]

export function generateOrlPhrase(d: Record<string, unknown>): string {
  const result = d['exam_orl_result']
  if (result === 'normal') {
    return "Tympans normaux, fosses nasales libres, pharynx et amygdales sans anomalie."
  }
  if (result !== 'anormal') return ''
  const parts: string[] = []
  const oreilles = (d['exam_orl_oreilles'] as string[]) || []
  const cote = d['exam_orl_cote'] ? label(ORL_COTE, d['exam_orl_cote'] as string).toLowerCase() : ''
  if (oreilles.length) parts.push(`Oreilles : ${labels(ORL_OREILLES, oreilles).join(', ')}${cote ? ' (' + cote + ')' : ''}.`)
  const nez = labels(ORL_NEZ, (d['exam_orl_nez'] as string[]) || [])
  if (nez.length) parts.push(`Nez / sinus : ${nez.join(', ')}.`)
  const gorge = labels(ORL_GORGE, (d['exam_orl_gorge'] as string[]) || [])
  if (gorge.length) parts.push(`Gorge : ${gorge.join(', ')}.`)
  const autre = d['exam_orl_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── Aires ganglionnaires ───────────────────────────────────────────────────

export const GANGLIO_TERRITOIRE: Option[] = [
  { key: 'cervical', label: 'Cervical' },
  { key: 'sous_maxillaire', label: 'Sous-maxillaire' },
  { key: 'axillaire', label: 'Axillaire' },
  { key: 'inguinal', label: 'Inguinal' },
  { key: 'autre_territoire', label: 'Autre territoire' },
]

export const GANGLIO_CARACTERISTIQUES: Option[] = [
  { key: 'taille_augmentee', label: 'Taille augmentée' },
  { key: 'consistance_dure', label: 'Consistance dure' },
  { key: 'consistance_ferme', label: 'Consistance ferme' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'fixe', label: 'Fixe' },
  { key: 'sensible', label: 'Sensible' },
]

export const GANGLIO_COTE: Option[] = [
  { key: 'droit', label: 'Droit' },
  { key: 'gauche', label: 'Gauche' },
  { key: 'bilateral', label: 'Bilatéral' },
]

export function generateGanglionnairePhrase(d: Record<string, unknown>): string {
  const result = d['exam_ganglionnaire_result']
  if (result === 'normal') {
    return "Pas d'adénopathie palpable dans les aires explorées."
  }
  if (result !== 'anormal') return ''
  const parts: string[] = []
  const territoire = labels(GANGLIO_TERRITOIRE, (d['exam_ganglionnaire_territoire'] as string[]) || [])
  const cote = d['exam_ganglionnaire_cote'] ? label(GANGLIO_COTE, d['exam_ganglionnaire_cote'] as string).toLowerCase() : ''
  if (territoire.length) parts.push(`Adénopathie(s) : ${territoire.join(', ')}${cote ? ' (' + cote + ')' : ''}.`)
  const carac = labels(GANGLIO_CARACTERISTIQUES, (d['exam_ganglionnaire_caracteristiques'] as string[]) || [])
  if (carac.length) parts.push(`Caractéristiques : ${carac.join(', ')}.`)
  const autre = d['exam_ganglionnaire_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── Uro-génital ────────────────────────────────────────────────────────────

export const UROGENITAL_SIGNS: Option[] = [
  { key: 'oge_anomalie', label: 'Anomalie des organes génitaux externes' },
  { key: 'contact_lombaire', label: 'Contact lombaire' },
  { key: 'points_ureteraux', label: 'Points urétéraux douloureux' },
  { key: 'globe_vesical', label: 'Globe vésical' },
  { key: 'bourses_masse', label: 'Masse scrotale' },
  { key: 'bourses_douleur', label: 'Douleur scrotale' },
]

export const UROGENITAL_COTE: Option[] = [
  { key: 'droit', label: 'Droit' },
  { key: 'gauche', label: 'Gauche' },
  { key: 'bilateral', label: 'Bilatéral' },
]

export function generateUrogenitalPhrase(d: Record<string, unknown>): string {
  const result = d['exam_urogenital_result']
  if (result === 'normal') {
    return "Organes génitaux externes normaux, pas de contact lombaire, pas de globe vésical."
  }
  if (result !== 'anormal') return ''
  const parts: string[] = []
  const signs = (d['exam_urogenital_signs'] as string[]) || []
  const cote = d['exam_urogenital_cote'] ? label(UROGENITAL_COTE, d['exam_urogenital_cote'] as string).toLowerCase() : ''
  if (signs.length) parts.push(`${labels(UROGENITAL_SIGNS, signs).join(', ')}${cote ? ' (' + cote + ')' : ''}.`)
  const autre = d['exam_urogenital_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── Ophtalmologique ────────────────────────────────────────────────────────

export const OPHTALMO_SIGNS: Option[] = [
  { key: 'conjonctives_anormales', label: 'Conjonctives anormales' },
  { key: 'pupilles_asymetriques', label: 'Pupilles asymétriques' },
  { key: 'reactivite_alteree', label: 'Réactivité photomotrice altérée' },
  { key: 'oculomotricite_anormale', label: 'Oculomotricité anormale' },
]

export const OPHTALMO_COTE: Option[] = [
  { key: 'droit', label: 'Œil droit' },
  { key: 'gauche', label: 'Œil gauche' },
  { key: 'bilateral', label: 'Bilatéral' },
]

export function generateOphtalmologiquePhrase(d: Record<string, unknown>): string {
  const result = d['exam_ophtalmologique_result']
  const acuiteLoin = d['exam_ophtalmologique_acuite_loin'] as string
  const acuitePres = d['exam_ophtalmologique_acuite_pres'] as string
  const acuite = [acuiteLoin ? `acuité de loin ${acuiteLoin}` : '', acuitePres ? `acuité de près ${acuitePres}` : ''].filter(Boolean).join(', ')
  if (result === 'normal') {
    return `Conjonctives normales, pupilles symétriques et réactives, oculomotricité normale.${acuite ? ' ' + acuite.charAt(0).toUpperCase() + acuite.slice(1) + '.' : ''}`
  }
  if (result !== 'anormal') return ''
  const parts: string[] = []
  const signs = (d['exam_ophtalmologique_signs'] as string[]) || []
  const cote = d['exam_ophtalmologique_cote'] ? label(OPHTALMO_COTE, d['exam_ophtalmologique_cote'] as string).toLowerCase() : ''
  if (signs.length) parts.push(`${labels(OPHTALMO_SIGNS, signs).join(', ')}${cote ? ' (' + cote + ')' : ''}.`)
  if (acuite) parts.push(acuite.charAt(0).toUpperCase() + acuite.slice(1) + '.')
  const autre = d['exam_ophtalmologique_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── Gynécologique ──────────────────────────────────────────────────────────
// Examen sensible : pas de cascade de signes, seulement 3 sous-parties
// (Seins / OGE-Spéculum / Toucher vaginal) chacune Normal/Anormal + texte libre.

export function generateGynecologiquePhrase(d: Record<string, unknown>): string {
  const result = d['exam_gynecologique_result']
  if (result === 'normal') {
    return "Seins souples sans masse, OGE et col d'aspect normal, utérus et annexes sans anomalie au toucher vaginal."
  }
  if (result !== 'anormal') return ''
  const parts: string[] = []
  const sous = [
    { key: 'seins', label: 'Seins' },
    { key: 'oge_speculum', label: 'OGE / Spéculum' },
    { key: 'tv', label: 'Toucher vaginal' },
  ]
  sous.forEach((s) => {
    const status = d[`exam_gynecologique_${s.key}_status`]
    if (status === 'anormal') {
      const details = d[`exam_gynecologique_${s.key}_details`] as string
      parts.push(`${s.label} : ${details || 'anomalie constatée'}.`)
    }
  })
  const autre = d['exam_gynecologique_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}

// ─── Neurologique (9 sous-modules) ──────────────────────────────────────────

export const NEURO_CONSCIENCE_NIVEAU: Option[] = [
  { key: 'normale', label: 'Normale' },
  { key: 'obnubilation', label: 'Obnubilation' },
  { key: 'coma', label: 'Coma' },
]

export const NEURO_MOTRICITE_MEMBRES: Option[] = [
  { key: 'msd', label: 'Membre supérieur droit' },
  { key: 'msg', label: 'Membre supérieur gauche' },
  { key: 'mid', label: 'Membre inférieur droit' },
  { key: 'mig', label: 'Membre inférieur gauche' },
]

export const NEURO_TONUS: Option[] = [
  { key: 'normal', label: 'Normal' },
  { key: 'hypertonie', label: 'Hypertonie' },
  { key: 'hypotonie', label: 'Hypotonie' },
]

export const NEURO_REFLEXES: Option[] = [
  { key: 'bicipital', label: 'Bicipital' },
  { key: 'tricipital', label: 'Tricipital' },
  { key: 'rotulien', label: 'Rotulien' },
  { key: 'achilleen', label: 'Achilléen' },
]

export const NEURO_REFLEXE_STATUT: Option[] = [
  { key: 'normal', label: 'Normal' },
  { key: 'vif', label: 'Vif' },
  { key: 'aboli', label: 'Aboli' },
]

export const NEURO_BABINSKI: Option[] = [
  { key: 'flexion', label: 'En flexion (normal)' },
  { key: 'indifferent', label: 'Indifférent' },
  { key: 'babinski', label: 'Babinski (extension)' },
]

export const NEURO_COORDINATION: Option[] = [
  { key: 'doigt_nez', label: 'Épreuve doigt-nez anormale' },
  { key: 'talon_genou', label: 'Épreuve talon-genou anormale' },
  { key: 'romberg', label: 'Romberg positif' },
]

export const NEURO_MARCHE_TYPE: Option[] = [
  { key: 'normale', label: 'Normale' },
  { key: 'ataxique', label: 'Ataxique' },
  { key: 'spastique', label: 'Spastique' },
  { key: 'steppage', label: 'Steppage' },
]

export const NEURO_MENINGES: Option[] = [
  { key: 'raideur_nuque', label: 'Raideur de nuque' },
  { key: 'kernig', label: 'Signe de Kernig' },
  { key: 'brudzinski', label: 'Signe de Brudzinski' },
]

export const NEURO_MODULES: { key: string; label: string }[] = [
  { key: 'conscience', label: 'Conscience' },
  { key: 'orientation', label: 'Orientation et fonctions supérieures' },
  { key: 'motricite', label: 'Motricité' },
  { key: 'sensibilite', label: 'Sensibilité' },
  { key: 'reflexes', label: 'Réflexes' },
  { key: 'coordination', label: 'Coordination' },
  { key: 'nerfs_craniens', label: 'Nerfs crâniens' },
  { key: 'marche', label: 'Marche et équilibre' },
  { key: 'meninges', label: 'Signes méningés' },
]

export function generateNeurologiquePhrase(d: Record<string, unknown>): string {
  const result = d['exam_neurologique_result']
  if (result === 'normal') {
    return "Examen neurologique sans particularité : conscience normale, motricité et sensibilité conservées, réflexes symétriques, coordination normale, pas de signe méningé."
  }
  if (result !== 'anormal') return ''
  const parts: string[] = []

  if (d['exam_neurologique_conscience_examined'] && d['exam_neurologique_conscience_niveau'] && d['exam_neurologique_conscience_niveau'] !== 'normale') {
    parts.push(`Conscience : ${label(NEURO_CONSCIENCE_NIVEAU, d['exam_neurologique_conscience_niveau'] as string).toLowerCase()}.`)
  }
  if (d['exam_neurologique_orientation_examined'] && d['exam_neurologique_orientation_status'] === 'anormal') {
    parts.push(`Fonctions supérieures : ${(d['exam_neurologique_orientation_details'] as string) || 'anomalie constatée'}.`)
  }
  const membres = labels(NEURO_MOTRICITE_MEMBRES, (d['exam_neurologique_motricite_membres'] as string[]) || [])
  const tonus = d['exam_neurologique_motricite_tonus']
  if (d['exam_neurologique_motricite_examined'] && (membres.length || (tonus && tonus !== 'normal'))) {
    const t = tonus && tonus !== 'normal' ? label(NEURO_TONUS, tonus as string).toLowerCase() : ''
    parts.push(`Motricité : ${[membres.length ? `déficit ${membres.join(', ').toLowerCase()}` : '', t].filter(Boolean).join(', ')}.`)
  }
  if (d['exam_neurologique_sensibilite_examined'] && d['exam_neurologique_sensibilite_status'] === 'anormal') {
    parts.push(`Sensibilité : ${(d['exam_neurologique_sensibilite_details'] as string) || 'anomalie constatée'}.`)
  }
  const reflexesAnormaux = NEURO_REFLEXES.map((r) => {
    const v = d[`exam_neurologique_reflexe_${r.key}`]
    return v && v !== 'normal' ? `${r.label.toLowerCase()} ${label(NEURO_REFLEXE_STATUT, v as string).toLowerCase()}` : ''
  }).filter(Boolean)
  const babinski = d['exam_neurologique_reflexes_babinski']
  if (d['exam_neurologique_reflexes_examined'] && (reflexesAnormaux.length || (babinski && babinski !== 'flexion'))) {
    const b = babinski && babinski !== 'flexion' ? label(NEURO_BABINSKI, babinski as string).toLowerCase() : ''
    parts.push(`Réflexes : ${[...reflexesAnormaux, b].filter(Boolean).join(', ')}.`)
  }
  const coord = labels(NEURO_COORDINATION, (d['exam_neurologique_coordination_anomalies'] as string[]) || [])
  if (d['exam_neurologique_coordination_examined'] && coord.length) {
    parts.push(`Coordination : ${coord.join(', ')}.`)
  }
  if (d['exam_neurologique_nerfs_craniens_examined'] && d['exam_neurologique_nerfs_craniens_status'] === 'anormal') {
    parts.push(`Nerfs crâniens : ${(d['exam_neurologique_nerfs_craniens_details'] as string) || 'anomalie constatée'}.`)
  }
  const marcheType = d['exam_neurologique_marche_type']
  if (d['exam_neurologique_marche_examined'] && marcheType && marcheType !== 'normale') {
    parts.push(`Marche : ${label(NEURO_MARCHE_TYPE, marcheType as string).toLowerCase()}.`)
  }
  const meninges = labels(NEURO_MENINGES, (d['exam_neurologique_meninges_signes'] as string[]) || [])
  if (d['exam_neurologique_meninges_examined'] && meninges.length) {
    parts.push(`Signes méningés : ${meninges.join(', ')}.`)
  }
  const autre = d['exam_neurologique_autre'] as string
  if (autre) parts.push(autre)
  return parts.join(' ')
}
