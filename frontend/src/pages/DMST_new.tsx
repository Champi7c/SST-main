import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TablePagination,
} from '@mui/material'
import { Edit as EditIcon, MedicalServices as MedicalServicesIcon, Print as PrintIcon, PictureAsPdf as PdfIcon, Description as DescriptionIcon, Science as ScienceIcon, WorkspacePremium as CertIcon } from '@mui/icons-material'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

interface DMST {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  agent_age?: number
  agent_direction?: string
  agent_function?: string
  agent_site_name?: string
  allergies?: string
  medical_history?: string
  chronic_diseases?: string
  smoking: boolean
  alcohol: boolean
  drugs: boolean
  habits_notes?: string
  physical_pathologies?: string
  mental_pathologies?: string
  social_pathologies?: string
  hereditary_diseases?: string
  handicap: boolean
  handicap_details?: string
  pregnancy: boolean
  pregnancy_due_date?: string
  current_treatments?: string
  treating_doctors?: string
  working_conditions?: string
  under_surveillance: boolean
  surveillance_type?: string
  observation_date?: string
  observation_direction?: string
  observation_function?: string
  observation_site?: string
  medical_antecedents?: string
  surgical_antecedents?: string
  sport_activity?: boolean
  physical_activity?: boolean
  tobacco?: boolean
  alcohol_obs?: boolean
  coffee?: boolean
  tea?: boolean
  at_mp_nature?: string
  previous_companies?: string
  blood_pressure_systolic?: string
  blood_pressure_diastolic?: string
  temperature?: string
  heart_rate?: string
  dextro_jn?: string
  dextro_pp?: string
  weight?: string
  height?: string
  bmi?: string
  clinical_exam?: string
  medical_conclusion_apte?: boolean
  medical_conclusion_asr?: boolean
  medical_conclusion_aar?: boolean
  medical_conclusion_int?: boolean
  medical_conclusion_ind?: boolean
  education_mhd?: boolean
  education_mhv?: boolean
  education_fdr_cvx?: boolean
  education_ergo?: boolean
  education_spb_psy?: boolean
  education_therapy?: boolean
  education_other?: string
  observer_name?: string
  observation_form_data?: Record<string, unknown>
  visits_count: number
  last_visit_date?: string
  history_count: number
  created_at: string
  updated_at: string
  created_by_name?: string
  updated_by_name?: string
}

interface Visit {
  id: number
  scheduled_date: string
  actual_date?: string
  status: string
  status_display: string
  visit_type_name: string
  diagnosis?: string
  avis?: string
  avis_display?: string
  doctor_name?: string
  nurse_name?: string
}

interface VisitType {
  id: number
  name: string
  code: string
  description?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function DMST() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const [dmst, setDmst] = useState<DMST | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [editMode, setEditMode] = useState(false)
   const [visits, setVisits] = useState<Visit[]>([])
   const [visitsLoading, setVisitsLoading] = useState(false)
   const [visitsError, setVisitsError] = useState('')
   const [visitsPage, setVisitsPage] = useState(0)
   const [visitsRowsPerPage, setVisitsRowsPerPage] = useState(5)
   const [visitsTotalCount, setVisitsTotalCount] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [openVisitDialog, setOpenVisitDialog] = useState(false)
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([])
  const [visitForm, setVisitForm] = useState({
    visit_type: '',
    scheduled_date: '',
    scheduled_time: '',
    reason: '',
  })
  const { hasMedicalAccess, user } = useAuth()
  const emptyCertMed = { conclusion: 'apte', dateExamen: new Date().toISOString().split('T')[0], medecin: '', validiteDate: '', restrictions: '', certificatNo: '' }
  const [certMedDialog, setCertMedDialog] = useState(false)
  const [certMedForm, setCertMedForm] = useState(emptyCertMed)

  const [formData, setFormData] = useState({
    allergies: '',
    medical_history: '',
    chronic_diseases: '',
    smoking: false,
    alcohol: false,
    drugs: false,
    habits_notes: '',
    physical_pathologies: '',
    mental_pathologies: '',
    social_pathologies: '',
    hereditary_diseases: '',
    handicap: false,
    handicap_details: '',
    pregnancy: false,
    pregnancy_due_date: '',
    current_treatments: '',
    treating_doctors: '',
    working_conditions: '',
    under_surveillance: false,
    surveillance_type: '',
    observation_date: '',
    observation_direction: '',
    observation_function: '',
    observation_site: '',
    medical_antecedents: '',
    surgical_antecedents: '',
    sport_activity: false,
    physical_activity: false,
    tobacco: false,
    alcohol_obs: false,
    coffee: false,
    tea: false,
    at_mp_nature: '',
    previous_companies: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    heart_rate: '',
    dextro_jn: '',
    dextro_pp: '',
    weight: '',
    height: '',
    bmi: '',
    clinical_exam: '',
    medical_conclusion_apte: false,
    medical_conclusion_asr: false,
    medical_conclusion_aar: false,
    medical_conclusion_int: false,
    medical_conclusion_ind: false,
    education_mhd: false,
    education_mhv: false,
    education_fdr_cvx: false,
    education_ergo: false,
    education_spb_psy: false,
    education_therapy: false,
    education_other: '',
    observer_name: '',
    observation_form_data: {} as Record<string, unknown>,
  })

  useEffect(() => {
    if (!hasMedicalAccess) {
      setError("Vous n'avez pas accès aux données médicales")
      setLoading(false)
      return
    }
    fetchDMST()
  }, [agentId, hasMedicalAccess])

   useEffect(() => {
     if (dmst && tabValue === 0) {
       fetchVisits(0)
     }
   }, [dmst, tabValue])

   useEffect(() => {
     if (dmst && tabValue === 0) {
       fetchVisits()
     }
   }, [visitsPage, visitsRowsPerPage])

  useEffect(() => {
    fetchVisitTypes()
  }, [])

  const fetchDMST = async () => {
    try {
      setLoading(true)
      setError('')
      setDmst(null)
      const response = await client.get(`/medical/dmst/?agent=${agentId}`)
      if (response.data.results && response.data.results.length > 0) {
        const dmstData = response.data.results[0]
        setDmst(dmstData)
        setFormData({
          allergies: dmstData.allergies || '',
          medical_history: dmstData.medical_history || '',
          chronic_diseases: dmstData.chronic_diseases || '',
          smoking: dmstData.smoking || false,
          alcohol: dmstData.alcohol || false,
          drugs: dmstData.drugs || false,
          habits_notes: dmstData.habits_notes || '',
          physical_pathologies: dmstData.physical_pathologies || '',
          mental_pathologies: dmstData.mental_pathologies || '',
          social_pathologies: dmstData.social_pathologies || '',
          hereditary_diseases: dmstData.hereditary_diseases || '',
          handicap: dmstData.handicap || false,
          handicap_details: dmstData.handicap_details || '',
          pregnancy: dmstData.pregnancy || false,
          pregnancy_due_date: dmstData.pregnancy_due_date || '',
          current_treatments: dmstData.current_treatments || '',
          treating_doctors: dmstData.treating_doctors || '',
          working_conditions: dmstData.working_conditions || '',
          under_surveillance: dmstData.under_surveillance || false,
          surveillance_type: dmstData.surveillance_type || '',
          observation_date: dmstData.observation_date || '',
          observation_direction: dmstData.observation_direction || dmstData.agent_direction || '',
          observation_function: dmstData.observation_function || dmstData.agent_function || '',
          observation_site: dmstData.observation_site || dmstData.agent_site_name || '',
          medical_antecedents: dmstData.medical_antecedents || '',
          surgical_antecedents: dmstData.surgical_antecedents || '',
          sport_activity: dmstData.sport_activity || false,
          physical_activity: dmstData.physical_activity || false,
          tobacco: dmstData.tobacco || false,
          alcohol_obs: dmstData.alcohol_obs || false,
          coffee: dmstData.coffee || false,
          tea: dmstData.tea || false,
          at_mp_nature: dmstData.at_mp_nature || '',
          previous_companies: dmstData.previous_companies || '',
          blood_pressure_systolic: dmstData.blood_pressure_systolic || '',
          blood_pressure_diastolic: dmstData.blood_pressure_diastolic || '',
          temperature: dmstData.temperature || '',
          heart_rate: dmstData.heart_rate || '',
          dextro_jn: dmstData.dextro_jn || '',
          dextro_pp: dmstData.dextro_pp || '',
          weight: dmstData.weight ? String(dmstData.weight) : '',
          height: dmstData.height ? String(dmstData.height) : '',
          bmi: dmstData.bmi ? String(dmstData.bmi) : '',
          clinical_exam: dmstData.clinical_exam || '',
          medical_conclusion_apte: dmstData.medical_conclusion_apte || false,
          medical_conclusion_asr: dmstData.medical_conclusion_asr || false,
          medical_conclusion_aar: dmstData.medical_conclusion_aar || false,
          medical_conclusion_int: dmstData.medical_conclusion_int || false,
          medical_conclusion_ind: dmstData.medical_conclusion_ind || false,
          education_mhd: dmstData.education_mhd || false,
          education_mhv: dmstData.education_mhv || false,
          education_fdr_cvx: dmstData.education_fdr_cvx || false,
          education_ergo: dmstData.education_ergo || false,
          education_spb_psy: dmstData.education_spb_psy || false,
          education_therapy: dmstData.education_therapy || false,
          education_other: dmstData.education_other || '',
          observer_name: dmstData.observer_name || '',
          observation_form_data: dmstData.observation_form_data || {},
        })
      } else {
        setError('DMST non trouvé. Voulez-vous le créer ?')
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors du chargement du DMST')
    } finally {
      setLoading(false)
    }
  }

   const fetchVisits = async (pageOverride?: number) => {
     if (!dmst) return
     try {
       setVisitsLoading(true)
       setVisitsError('')
       const fetchPage = pageOverride !== undefined ? pageOverride : visitsPage
       const params: Record<string, string | number> = {
         page: fetchPage + 1,
         page_size: visitsRowsPerPage,
         ordering: '-scheduled_date'
       }
       const response = await client.get(`/medical/dmst/${dmst.id}/visits/`, { params })
       const data = response.data
       
       if (Array.isArray(data)) {
         setVisits(data)
         setVisitsTotalCount(data.length)
       } else if (data.results) {
         setVisits(data.results)
         setVisitsTotalCount(data.count || 0)
       }
     } catch (error: any) {
       console.error('Erreur lors du chargement des visites:', error)
       setVisitsError('Erreur lors du chargement des visites')
     } finally {
       setVisitsLoading(false)
     }
   }

  const fetchVisitTypes = async () => {
    try {
      const response = await client.get('/visits/types/')
      setVisitTypes(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des types de visites:', error)
    }
  }

  const handleOpenVisitDialog = () => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().slice(0, 5)
    setVisitForm({
      visit_type: '',
      scheduled_date: dateStr,
      scheduled_time: timeStr,
      reason: '',
    })
    setOpenVisitDialog(true)
  }

  const handleSubmitVisit = async () => {
    if (!dmst || !visitForm.visit_type || !visitForm.scheduled_date || !visitForm.scheduled_time) {
      setSnackbar({ open: true, message: 'Veuillez remplir tous les champs obligatoires', severity: 'error' })
      return
    }

    try {
      const scheduledDateTime = `${visitForm.scheduled_date}T${visitForm.scheduled_time}:00`
      await client.post('/visits/visits/', {
        agent: parseInt(agentId!),
        visit_type: parseInt(visitForm.visit_type),
        scheduled_date: scheduledDateTime,
        reason: visitForm.reason || null,
        status: 'scheduled',
      })
      setSnackbar({ open: true, message: 'Visite programmée avec succès', severity: 'success' })
      setOpenVisitDialog(false)
      fetchVisits()
    } catch (error: any) {
      console.error('Erreur lors de la programmation de la visite:', error)
      const errorMessage = getApiErrorMessage(error) || 'Erreur lors de la programmation de la visite'
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
    }
  }

  const buildDMSTPayload = () => {
    return {
      allergies: formData.allergies?.trim() || null,
      medical_history: formData.medical_history?.trim() || null,
      chronic_diseases: formData.chronic_diseases?.trim() || null,
      smoking: formData.smoking,
      alcohol: formData.alcohol,
      drugs: formData.drugs,
      habits_notes: formData.habits_notes?.trim() || null,
      physical_pathologies: formData.physical_pathologies?.trim() || null,
      mental_pathologies: formData.mental_pathologies?.trim() || null,
      social_pathologies: formData.social_pathologies?.trim() || null,
      hereditary_diseases: formData.hereditary_diseases?.trim() || null,
      handicap: formData.handicap,
      handicap_details: formData.handicap_details?.trim() || null,
      pregnancy: formData.pregnancy,
      pregnancy_due_date: formData.pregnancy_due_date?.trim() || null,
      current_treatments: formData.current_treatments?.trim() || null,
      treating_doctors: formData.treating_doctors?.trim() || null,
      working_conditions: formData.working_conditions?.trim() || null,
      under_surveillance: formData.under_surveillance,
      surveillance_type: formData.surveillance_type?.trim() || null,
      observation_date: formData.observation_date?.trim() || null,
      observation_direction: formData.observation_direction?.trim() || null,
      observation_function: formData.observation_function?.trim() || null,
      observation_site: formData.observation_site?.trim() || null,
      medical_antecedents: formData.medical_antecedents?.trim() || null,
      surgical_antecedents: formData.surgical_antecedents?.trim() || null,
      sport_activity: formData.sport_activity,
      physical_activity: formData.physical_activity,
      tobacco: formData.tobacco,
      alcohol_obs: formData.alcohol_obs,
      coffee: formData.coffee,
      tea: formData.tea,
      at_mp_nature: formData.at_mp_nature?.trim() || null,
      previous_companies: formData.previous_companies?.trim() || null,
      blood_pressure_systolic: formData.blood_pressure_systolic?.trim() || null,
      blood_pressure_diastolic: formData.blood_pressure_diastolic?.trim() || null,
      temperature: formData.temperature?.trim() || null,
      heart_rate: formData.heart_rate?.trim() || null,
      dextro_jn: formData.dextro_jn?.trim() || null,
      dextro_pp: formData.dextro_pp?.trim() || null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      bmi: formData.bmi ? parseFloat(formData.bmi) : null,
      clinical_exam: formData.clinical_exam?.trim() || null,
      medical_conclusion_apte: formData.medical_conclusion_apte,
      medical_conclusion_asr: formData.medical_conclusion_asr,
      medical_conclusion_aar: formData.medical_conclusion_aar,
      medical_conclusion_int: formData.medical_conclusion_int,
      medical_conclusion_ind: formData.medical_conclusion_ind,
      education_mhd: formData.education_mhd,
      education_mhv: formData.education_mhv,
      education_fdr_cvx: formData.education_fdr_cvx,
      education_ergo: formData.education_ergo,
      education_spb_psy: formData.education_spb_psy,
      education_therapy: formData.education_therapy,
      education_other: formData.education_other?.trim() || null,
      observer_name: formData.observer_name?.trim() || null,
      observation_form_data: formData.observation_form_data && Object.keys(formData.observation_form_data).length > 0 ? formData.observation_form_data : null,
    }
  }

  const handlePrintFiche = () => {
    if (!dmst) return
    const logoOrigin = window.location.origin
    const o = (formData.observation_form_data || {}) as Record<string, unknown>
    const val = (key: string) => String(o[key] || '')
    const dateStr = formData.observation_date ? new Date(formData.observation_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')
    const visitType = [o.visit_type_embauche && 'Embauche', o.visit_type_periodique && 'Périodique', o.visit_type_reprise && 'Reprise'].filter(Boolean).join(', ') || '-'

    const section = (title: string) => `<div class="section-title">${title}</div>`
    const row = (label: string, value: string) => `<div class="row"><span class="label">${label}</span><span class="value">${value || '—'}</span></div>`

    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"/>
  <title>Fiche d'observation – ${dmst.agent_name}</title>
  <style>
    @page { size: A4; margin: 15mm 20mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #222; background: #fff; }
    .header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
    .header img { width: 70px; height: auto; flex-shrink: 0; }
    .header-title { flex: 1; background: #0D47A1; color: white; text-align: center; font-weight: bold; font-size: 14px; border-radius: 40px; padding: 10px 16px; }
    .header-date { text-align: right; font-size: 10px; min-width: 130px; line-height: 1.6; }
    .section-title { background: #0D47A1; color: white; font-weight: bold; font-size: 11px; padding: 4px 8px; margin: 10px 0 6px; border-radius: 2px; }
    .row { display: flex; gap: 4px; margin-bottom: 3px; font-size: 10.5px; }
    .label { font-weight: bold; white-space: nowrap; }
    .value { color: #333; }
    .row-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 12px; margin-bottom: 4px; }
    .row-grid3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 2px 12px; margin-bottom: 4px; }
    .constantes { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; margin-bottom: 6px; }
    .const-item { border: 1px solid #ccc; border-radius: 3px; padding: 3px 5px; text-align: center; font-size: 10px; }
    .const-label { font-weight: bold; color: #555; font-size: 9px; }
    .const-val { font-size: 11px; }
    .acuity-table { width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10px; }
    .acuity-table th, .acuity-table td { border: 1px solid #ccc; padding: 3px 6px; text-align: center; }
    .acuity-table th { background: #e8f0fe; font-weight: bold; }
    .text-block { background: #f9f9f9; border-left: 3px solid #0D47A1; padding: 5px 8px; font-size: 10.5px; margin-bottom: 6px; white-space: pre-wrap; min-height: 24px; }
    .conclusion { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 6px; }
    .conclusion-item { border: 2px solid #0D47A1; border-radius: 20px; padding: 4px 14px; font-weight: bold; font-size: 11px; color: #0D47A1; }
    .conclusion-item.active { background: #0D47A1; color: white; }
    .signatures { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 12px; border-top: 1px solid #ccc; }
    .sig-box { width: 45%; text-align: center; font-size: 10px; }
    .sig-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 6px 0; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <img src="${logoOrigin}/coly.png" alt="Logo" onerror="this.style.display='none'" />
    <div class="header-title">FICHE D'OBSERVATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL</div>
    <div class="header-date">
      Fait à Dakar, le ${dateStr}<br/>
      Type : ${visitType}<br/>
      Médecin : ${formData.observer_name || '—'}
    </div>
  </div>

  ${section('I. IDENTIFICATION DE L\'AGENT')}
  <div class="row-grid">
    ${row('Nom et prénoms :', dmst.agent_name)}
    ${row('Matricule :', dmst.agent_matricule)}
    ${row('Âge :', `${dmst.agent_age ?? '—'} ans`)}
    ${row('Sexe :', o.sex_m ? 'M' : o.sex_f ? 'F' : '—')}
    ${row('Téléphone :', val('telephone'))}
    ${row('Direction :', formData.observation_direction || dmst.agent_direction || '—')}
    ${row('Site :', formData.observation_site || dmst.agent_site_name || '—')}
    ${row('Fonction / Poste :', formData.observation_function || dmst.agent_function || '—')}
    ${row('Ancienneté au poste :', `${val('seniority_years')} ans`)}
  </div>

  ${section('II. ANTÉCÉDENTS ET TERRAINS PARTICULIERS')}
  <div class="row-grid">
    ${row('Antécédents médicaux :', formData.medical_antecedents || '—')}
    ${row('Antécédents chirurgicaux :', formData.surgical_antecedents || '—')}
  </div>
  ${row('Habitudes de vie :', [formData.sport_activity && 'Activité sportive', formData.physical_activity && 'Activité physique', formData.tobacco && `Tabac (${val('tobacco_per_day')}/j)`, formData.alcohol_obs && 'Alcool', formData.coffee && 'Café', formData.tea && 'Thé', val('habits_other')].filter(Boolean).join(' — ') || 'Aucune')}
  ${row('AT/MP (12 derniers mois) :', o.at_mp_no ? 'Non' : o.at_mp_yes ? `Oui → Nature : ${formData.at_mp_nature || ''}` : '—')}
  ${row('Entreprises / Postes antérieurs :', formData.previous_companies || '—')}

  ${section('III. EXPOSITIONS PROFESSIONNELLES')}
  ${row('Risques physiques :', [o.exp_phys_bruit && 'Bruit (>85dB)', o.exp_phys_vibrations && 'Vibrations', o.exp_phys_chaleur_froid && 'Chaleur/Froid', o.exp_phys_rayonnements && 'Rayonnements', o.exp_phys_ecran && 'Écran >4h/j'].filter(Boolean).join(', ') || '-')}
  ${row('Chimiques/biologiques :', [o.exp_chim_poussieres && 'Poussières', o.exp_chim_solvants && 'Solvants', o.exp_chim_cmr && 'CMR', o.exp_chim_biologiques && 'Agents biologiques', o.exp_chim_gaz && 'Gaz/Fumées'].filter(Boolean).join(', ') + (val('exp_chim_preciser') ? ' — ' + val('exp_chim_preciser') : '') || '-')}
  ${row('Biomécaniques :', [o.exp_bio_port_charges && 'Port charges >15kg', o.exp_bio_gestes_repetitifs && 'Gestes répétitifs', o.exp_bio_postures && 'Postures contraignantes', o.exp_bio_station_debout && 'Station debout prolongée'].filter(Boolean).join(', ') || '-')}
  ${row('Psychosociaux :', [o.exp_psy_stress && 'Stress', o.exp_psy_charge_mentale && 'Charge mentale', o.exp_psy_isole && 'Travail isolé', o.exp_psy_relations && 'Relations difficiles', o.exp_psy_harcelement && 'Harcèlement'].filter(Boolean).join(', ') || '-')}
  ${row('Organisation du travail :', [o.exp_org_nuit && 'Travail de nuit', o.exp_org_poste && 'Travail posté (3×8)', o.exp_org_irreguliers && 'Horaires irréguliers', o.exp_org_astreintes && 'Astreintes'].filter(Boolean).join(', ') || '-')}
  ${row('EPI :', [o.epi_gants && 'Gants', o.epi_masque && 'Masque', o.epi_lunettes && 'Lunettes', o.epi_casque && 'Casque', o.epi_auditif && 'Prot. auditives', o.epi_chaussures && 'Chaussures sécurité'].filter(Boolean).join(', ') || '-')}

  ${section('IV. PLAINTES FONCTIONNELLES ACTUELLES')}
  <div class="text-block">${o.plaintes_aucune ? 'Aucune plainte' : [o.plaintes_douleurs_ms && `Douleurs MS (${val('plaintes_douleurs_localisation')})`, o.plaintes_respiratoires && 'Troubles respiratoires', o.plaintes_cutanes && 'Troubles cutanés', o.plaintes_orl && 'ORL/Oculaires', o.plaintes_cephalees && 'Céphalées', o.plaintes_vertiges && 'Vertiges', o.plaintes_fatigue && 'Fatigue chronique', o.plaintes_stress && 'Stress/Anxiété/Sommeil', o.plaintes_digestifs && 'Troubles digestifs'].filter(Boolean).join(' ; ') || '-'}${val('plaintes_details') ? '\n' + val('plaintes_details') : ''}</div>

  ${section('V. ÉTAT GÉNÉRAL ET CONSTANTES')}
  <div class="constantes">
    <div class="const-item"><div class="const-label">TA (mmHg)</div><div class="const-val">${formData.blood_pressure_systolic || '—'}/${formData.blood_pressure_diastolic || '—'}</div></div>
    <div class="const-item"><div class="const-label">T° (°C)</div><div class="const-val">${formData.temperature || '—'}</div></div>
    <div class="const-item"><div class="const-label">FC (/min)</div><div class="const-val">${formData.heart_rate || '—'}</div></div>
    <div class="const-item"><div class="const-label">Poids (kg)</div><div class="const-val">${formData.weight || '—'}</div></div>
    <div class="const-item"><div class="const-label">Taille (cm)</div><div class="const-val">${formData.height || '—'}</div></div>
    <div class="const-item"><div class="const-label">IMC (kg/m²)</div><div class="const-val">${formData.bmi || '—'}</div></div>
    <div class="const-item"><div class="const-label">Tour taille (cm)</div><div class="const-val">${val('tour_taille') || '—'}</div></div>
    <div class="const-item"><div class="const-label">Pér. ombilical (cm)</div><div class="const-val">${val('perimetre_ombilical') || '—'}</div></div>
    <div class="const-item"><div class="const-label">SpO₂ (%)</div><div class="const-val">${val('spo2') || '—'}</div></div>
    <div class="const-item"><div class="const-label">Dextro jn (g/L)</div><div class="const-val">${formData.dextro_jn || '—'}</div></div>
    <div class="const-item"><div class="const-label">Dextro pp (g/L)</div><div class="const-val">${formData.dextro_pp || '—'}</div></div>
  </div>
  <table class="acuity-table">
    <thead><tr><th></th><th>Acuité OD</th><th>Acuité OG</th><th>Acuité binoculaire</th></tr></thead>
    <tbody>
      <tr><td>De loin</td><td>${val('av_od_loin') || '—'}/10</td><td>${val('av_og_loin') || '—'}/10</td><td>${val('av_bin_loin') || '—'}/10</td></tr>
      <tr><td>De près</td><td>${val('av_od_pres') || '—'}/10</td><td>${val('av_og_pres') || '—'}/10</td><td>${val('av_bin_pres') || '—'}/10</td></tr>
    </tbody>
  </table>
  ${row('Vision des couleurs :', o.vision_couleurs_normale ? 'Normale' : o.vision_couleurs_daltonisme ? `Daltonisme (${val('daltonisme_type')})` : '—')}
  ${row('Lunettes / lentilles :', o.lunettes_oui ? `Oui — ${val('lunettes_correction')}` : o.lunettes_non ? 'Non' : '—')}

  ${section('VI. EXAMEN CLINIQUE')}
  ${row('État général :', [o.exam_etat_bon && 'Bon', o.exam_etat_moyen && 'Moyen', o.exam_etat_altere && 'Altéré'].filter(Boolean).join(', ') || '—')}
  <div class="text-block">${formData.clinical_exam || '—'}</div>

  ${section('VII. EXAMENS COMPLÉMENTAIRES')}
  ${row('Examens :', [o.comp_audiometrie && 'Audiométrie', o.comp_spiro && 'Spirométrie/EFR', o.comp_ecg && 'ECG', o.comp_radio_thorax && 'Radio thorax', o.comp_acuite && 'Acuité visuelle', o.comp_vision_couleurs && 'Vision couleurs', o.comp_bilan_sang && 'Bilan biologique', o.comp_bilan_hepatique && 'Bilan hépatique', val('comp_autres')].filter(Boolean).join(' ; ') || '-')}
  <div class="text-block">${val('comp_resultats') || '—'}</div>

  ${section('VIII. CONCLUSION MÉDICALE — AVIS D\'APTITUDE')}
  <div class="conclusion">
    <div class="conclusion-item ${formData.medical_conclusion_apte ? 'active' : ''}">${formData.medical_conclusion_apte ? '☑' : '☐'} APTE</div>
    <div class="conclusion-item ${formData.medical_conclusion_asr ? 'active' : ''}">${formData.medical_conclusion_asr ? '☑' : '☐'} ASR</div>
    <div class="conclusion-item ${formData.medical_conclusion_aar ? 'active' : ''}">${formData.medical_conclusion_aar ? '☑' : '☐'} AAR</div>
    <div class="conclusion-item ${formData.medical_conclusion_int ? 'active' : ''}">${formData.medical_conclusion_int ? '☑' : '☐'} INT${formData.medical_conclusion_int ? ` (durée : ${val('int_duree')})` : ''}</div>
    <div class="conclusion-item ${formData.medical_conclusion_ind ? 'active' : ''}">${formData.medical_conclusion_ind ? '☑' : '☐'} IND</div>
  </div>
  ${val('conclusion_restrictions') ? row('Restrictions / Aménagements :', val('conclusion_restrictions')) : ''}
  ${val('conclusion_recommendations') ? row('Recommandations :', val('conclusion_recommendations')) : ''}

  ${section('IX. ÉDUCATION THÉRAPEUTIQUE ET SENSIBILISATION')}
  ${row('Thèmes :', [formData.education_mhd && 'MHD', formData.education_mhv && 'MHV', formData.education_fdr_cvx && 'FDR-CVx', formData.education_ergo && 'Ergo', formData.education_spb_psy && 'SPB&Psy', formData.education_therapy && 'Thérapie', o.education_epi && 'Port EPI', o.education_tms && 'Prévention TMS', o.education_stress && 'Gestion stress', o.education_sommeil && 'Hygiène sommeil', formData.education_other].filter(Boolean).join(', ') || 'Aucun')}
  ${row('Prochaine visite :', `${val('next_visit_date') ? new Date(val('next_visit_date')).toLocaleDateString('fr-FR') : '—'} — ${[o.next_visit_type_periodique && 'Périodique', o.next_visit_type_surveillance && 'Surveillance renforcée', o.next_visit_type_specialisee && 'Spécialisée'].filter(Boolean).join(', ') || '-'}`)}

  <div class="signatures">
    <div class="sig-box"><div class="sig-line">L'AGENT — Signature (pour information)</div></div>
    <div class="sig-box">
      <div>${formData.observer_name || ''}</div>
      <div class="sig-line">LE MÉDECIN DU TRAVAIL — Signature et cachet</div>
    </div>
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`

    const win = window.open('', '_blank', 'width=900,height=1100')
    if (win) { win.document.write(html); win.document.close() }
  }

  const handlePrint = () => {
    if (tabValue === 1) {
      handlePrintFiche()
    } else {
      window.print()
    }
  }

  const exportSectionToPDF = async (sectionId: string, fileName: string) => {
    const printSection = document.getElementById(sectionId)
    if (!printSection) { showSnackbar(`Section d'impression introuvable`, 'error'); return }
    const mmToPx = 3.779527559
    const widthPx = 210 * mmToPx
    const paddingPx = 20 * mmToPx
    const orig = {
      display: window.getComputedStyle(printSection).display,
      position: window.getComputedStyle(printSection).position,
      left: window.getComputedStyle(printSection).left,
      top: window.getComputedStyle(printSection).top,
      width: window.getComputedStyle(printSection).width,
      zIndex: window.getComputedStyle(printSection).zIndex,
    }
    printSection.style.display = 'block'
    printSection.style.position = 'fixed'
    printSection.style.left = '0'
    printSection.style.top = '0'
    printSection.style.width = `${widthPx}px`
    printSection.style.minWidth = `${widthPx}px`
    printSection.style.maxWidth = `${widthPx}px`
    printSection.style.padding = `${paddingPx}px`
    printSection.style.margin = '0'
    printSection.style.zIndex = '9999'
    printSection.style.backgroundColor = '#ffffff'
    printSection.style.boxSizing = 'border-box'
    await new Promise((r) => setTimeout(r, 100))
    const images = printSection.querySelectorAll('img')
    if (images.length > 0) {
      await Promise.all(Array.from(images).map((img: Element) => {
        const i = img as HTMLImageElement
        if (i.complete && i.naturalHeight !== 0) return Promise.resolve()
        return new Promise((resolve) => { i.onload = () => resolve(null); i.onerror = () => resolve(null); setTimeout(() => resolve(null), 3000) })
      }))
    }
    await new Promise((r) => setTimeout(r, 300))
    const canvas = await html2canvas(printSection, {
      scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff',
      width: printSection.offsetWidth, height: printSection.scrollHeight, allowTaint: false,
      onclone: (clonedDoc) => {
        const cloned = clonedDoc.getElementById(sectionId)
        if (cloned) { cloned.style.display = 'block'; cloned.style.visibility = 'visible'; cloned.style.width = `${widthPx}px`; cloned.style.padding = `${paddingPx}px`; cloned.style.backgroundColor = '#ffffff' }
      },
    })
    printSection.style.display = orig.display
    printSection.style.position = orig.position
    printSection.style.left = orig.left
    printSection.style.top = orig.top
    printSection.style.width = orig.width
    printSection.style.zIndex = orig.zIndex
    const imgData = canvas.toDataURL('image/png', 1.0)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const pxToMm = pdfWidth / (widthPx * 2)
    const imgHeightMm = canvas.height * pxToMm
    if (imgHeightMm <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMm, undefined, 'FAST')
    } else {
      let remaining = imgHeightMm; let sourceY = 0
      while (remaining > 0) {
        const pageH = Math.min(pdfHeight, remaining)
        const sourceH = (pageH / imgHeightMm) * canvas.height
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width; pageCanvas.height = Math.ceil(sourceH)
        const ctx = pageCanvas.getContext('2d')
        if (ctx) { ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH); pdf.addImage(pageCanvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, pdfWidth, pageH, undefined, 'FAST') }
        sourceY += sourceH; remaining -= pageH
        if (remaining > 0) pdf.addPage()
      }
    }
    pdf.save(fileName)
    showSnackbar('PDF exporté avec succès', 'success')
  }

  const handleExportPDF = async () => {
    if (!dmst) return
    try {
      showSnackbar('Génération du PDF en cours...', 'success')
      await exportSectionToPDF('print-section', `fiche_observation_${dmst.agent_matricule}_${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (e) {
      showSnackbar(`Erreur PDF: ${e instanceof Error ? e.message : 'Erreur'}`, 'error')
    }
  }

  const conclusionLabel = (c: string) => {
    switch (c) {
      case 'apte': return 'APTE AU POSTE DE TRAVAIL'
      case 'asr': return 'APTE SOUS RÉSERVE'
      case 'aar': return 'APTE AVEC AMÉNAGEMENT'
      case 'int': return 'INAPTE TEMPORAIRE'
      case 'ind': return 'INAPTE DÉFINITIF'
      default: return c
    }
  }

  const conclusionColor = (c: string) => {
    switch (c) {
      case 'apte': return '#2e7d32'
      case 'asr': return '#f57c00'
      case 'aar': return '#1976d2'
      case 'int': return '#c62828'
      case 'ind': return '#b71c1c'
      default: return '#333'
    }
  }

  const handlePrintAptitudeCert = (form: typeof emptyCertMed) => {
    if (!dmst) return
    const logoOrigin = window.location.origin
    const color = conclusionColor(form.conclusion)
    const label = conclusionLabel(form.conclusion)

    const detailRow = (label: string, value: string) =>
      `<div class="detail-item"><div class="detail-label">${label}</div><div>${value}</div></div>`

    const details = [
      detailRow("Date d'examen", form.dateExamen ? new Date(form.dateExamen).toLocaleDateString('fr-FR') : '–'),
      form.validiteDate ? detailRow("Valide jusqu'au", new Date(form.validiteDate).toLocaleDateString('fr-FR')) : '',
      form.medecin ? detailRow('Médecin du travail', form.medecin) : '',
      dmst.agent_direction ? detailRow('Direction', dmst.agent_direction) : '',
      dmst.agent_function ? detailRow('Fonction', dmst.agent_function) : '',
      dmst.agent_site_name ? detailRow('Site', dmst.agent_site_name) : '',
    ].filter(Boolean).join('')

    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8" />
  <title>Attestation d'aptitude – ${dmst.agent_name}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: Georgia, serif; margin: 0; background: #fff; color: #222; }
    .cert-container { max-width: 680px; margin: 20px auto; border: 3px double #1976d2; padding: 48px; position: relative; }
    h1 { text-align: center; text-transform: uppercase; letter-spacing: 3px; font-size: 26px; color: #1976d2; margin: 0 0 6px; }
    .subtitle { text-align: center; font-size: 13px; color: #888; margin-bottom: 32px; }
    .certify-text { text-align: center; font-size: 16px; margin-bottom: 12px; }
    .name-wrap { text-align: center; margin-bottom: 20px; }
    .name { font-size: 26px; font-weight: bold; border-bottom: 2px solid #1976d2; padding: 0 24px 6px; }
    .training-name { text-align: center; font-size: 19px; font-style: italic; color: ${color}; font-weight: bold; letter-spacing: 2px; margin: 16px 0 28px; padding: 12px; border: 2px solid ${color}; border-radius: 6px; background: ${color}11; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 0 32px; }
    .detail-item { background: #f7f7f7; padding: 10px 14px; border-radius: 4px; border-left: 3px solid #1976d2; font-size: 14px; }
    .detail-label { font-weight: bold; color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
    .restrictions { background: #fff8e1; border-left: 3px solid #f57c00; padding: 12px 14px; border-radius: 4px; margin: 0 0 24px; font-size: 14px; }
    .signature-area { display: flex; justify-content: space-between; margin-top: 48px; }
    .signature-box { text-align: center; width: 40%; }
    .signature-line { border-top: 1px solid #555; padding-top: 8px; font-size: 12px; color: #555; }
    .cert-number { text-align: center; font-size: 11px; color: #aaa; margin-top: 24px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="cert-container">
    <div style="position:absolute;top:10px;left:10px;right:10px;bottom:10px;border:1px solid #90caf9;pointer-events:none;"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
      <img src="${logoOrigin}/coly.png" alt="Logo" style="height:80px;object-fit:contain;" />
      <div style="text-align:right;font-size:12px;color:#555;">
        <div style="font-weight:bold;font-size:15px;color:#1976d2;">SERVICE DE SANTÉ AU TRAVAIL</div>
        <div>Département Hygiène, Sécurité et Environnement</div>
      </div>
    </div>
    <hr style="border:none;border-top:2px solid #1976d2;margin-bottom:28px;" />
    <h1>Attestation d'Aptitude Médicale au Travail</h1>
    <div class="subtitle">Service de Santé au Travail</div>
    <div class="certify-text">La présente attestation certifie que</div>
    <div class="name-wrap"><span class="name">${dmst.agent_name}</span></div>
    ${dmst.agent_matricule ? `<div class="certify-text" style="font-size:13px;color:#666;">Matricule : ${dmst.agent_matricule}</div>` : ''}
    <div class="certify-text">est déclaré(e)</div>
    <div class="training-name">${label}</div>
    ${form.restrictions ? `<div class="restrictions"><strong style="color:#f57c00;">Restrictions / Observations :</strong><br/>${form.restrictions}</div>` : ''}
    <div class="details">${details}</div>
    <div class="signature-area">
      <div class="signature-box">
        <div class="signature-line">Le Médecin du Travail<br/>${form.medecin || '..............................'}</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Cachet du Service de Santé au Travail</div>
      </div>
    </div>
    ${form.certificatNo ? `<div class="cert-number">N° Attestation : ${form.certificatNo}</div>` : ''}
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`

    const win = window.open('', '_blank', 'width=820,height=950')
    if (win) { win.document.write(html); win.document.close() }
  }

  const handlePrintBulletinAnalyses = () => {
    if (!dmst) return
    const logoOrigin = window.location.origin
    const obsData = (formData.observation_form_data || {}) as Record<string, unknown>
    const chk = (key: string) => obsData[key] ? '&#9745;' : '&#9744;'
    const dateStr = (obsData['ba_date'] || formData.observation_date)
      ? new Date(String(obsData['ba_date'] || formData.observation_date)).toLocaleDateString('fr-FR')
      : '...........................'
    const sexe = obsData['sex_m'] ? 'M' : obsData['sex_f'] ? 'F' : '............'
    const tel = (obsData['telephone'] as string) || '..............................'
    const nameParts = dmst.agent_name ? dmst.agent_name.split(' ') : []
    const nom = nameParts[0] || '.....................................'
    const prenom = nameParts.slice(1).join(' ') || '...............................'

    const secHdr = (titre: string, bg: string) =>
      `<div style="background:${bg};color:white;text-align:center;font-weight:bold;font-size:10px;padding:3px 6px;border:2px solid ${bg};margin-bottom:4px">${titre}</div>`

    const items = (pairs: [string,string][]) =>
      pairs.map(([k,l]) => `<div style="font-size:10px;line-height:1.65">${chk(k)} ${l}</div>`).join('')

    const buildPage = () => `
      <div style="border:1px solid #ccc;padding:8px">
        <table style="width:100%;border-collapse:collapse;border-bottom:3px solid #2E75B6;margin-bottom:6px">
          <tr>
            <td style="width:90px;padding:4px"><img src="${logoOrigin}/coly.png" height="70" onerror="this.style.display='none'"/></td>
            <td style="padding:4px 10px">
              <div style="font-weight:bold;color:#1F4788;font-size:13px">CABINET MÉDICAL LIONEL</div>
              <div style="font-size:10px;color:#333">Autorisation n° : 26JUIL2022*022346</div>
              <div style="font-size:10px;color:#333">RC : SN.THS.2024.A.266 &nbsp;|&nbsp; NINEA : 010949412</div>
              <div style="font-size:11px;margin-top:4px"><strong>Date :</strong> ${dateStr}</div>
            </td>
          </tr>
        </table>
        <div style="text-align:center;font-weight:bold;color:#1F4788;font-size:16px;margin:6px 0">BULLETIN D'ANALYSES</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:6px">
          <tr>
            <td style="background:#E8F0F8;border:1px solid #ccc;padding:4px 6px;font-size:10px"><strong>Nom :</strong> ${nom}</td>
            <td style="background:#E8F0F8;border:1px solid #ccc;padding:4px 6px;font-size:10px"><strong>Prénom :</strong> ${prenom}</td>
          </tr>
          <tr>
            <td style="background:#E8F0F8;border:1px solid #ccc;padding:4px 6px;font-size:10px"><strong>Âge :</strong> ${dmst.agent_age ?? '............'} &nbsp;&nbsp; <strong>Sexe :</strong> ${sexe}</td>
            <td style="background:#E8F0F8;border:1px solid #ccc;padding:4px 6px;font-size:10px"><strong>Téléphone :</strong> ${tel}</td>
          </tr>
        </table>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="width:33%;vertical-align:top;padding-right:4px">
              ${secHdr('HÉMATOLOGIE','#1F4788')}
              ${items([['ba_nfs','NFS'],['ba_taux_ret','Taux Rét.'],['ba_te','T E'],['ba_vs','V S'],['ba_gs','G S'],['ba_rhesus','Rhesus'],['ba_abo','ABO'],['ba_rai','RAI']])}
              <div style="margin-top:6px"></div>
              ${secHdr('BIOCHIMIE','#1F4788')}
              ${items([['ba_gaj','G A J'],['ba_gpp','G P P'],['ba_hba1c','HbA1c'],['ba_uree','Urée'],['ba_creat','Créat'],['ba_acide_urique','Acide urique'],['ba_psa','PSA'],['ba_afp','AFP'],['ba_lipasemie','Lipasémie'],['ba_electroph_pr','Electroph. Pr'],['ba_electroph_hb','Electroph. Hb']])}
              <div style="display:flex;font-size:10px;line-height:1.65">${chk('ba_tsh')} TSH &nbsp;&nbsp; ${chk('ba_t4')} T4</div>
              ${items([['ba_pu24','PU 24'],['ba_micro_albumin','Micro-albuminurie']])}
            </td>
            <td style="width:33%;vertical-align:top;padding:0 4px">
              ${secHdr('B. LIPIDIQUE','#1F4788')}
              ${items([['ba_ch_total','Ch. total'],['ba_ch_hdl','Ch. HDL'],['ba_ch_ldl','Ch. LDL'],['ba_tgl','TGL']])}
              <div style="margin-top:6px"></div>
              ${secHdr('IONOGRAMME SANGUIN','#2E75B6')}
              <div style="display:flex;font-size:10px;line-height:1.65">${chk('ba_na')} Na+ &nbsp; ${chk('ba_k')} K+ &nbsp; ${chk('ba_cl')} Cl-</div>
              ${items([['ba_calcemie','Calcémie'],['ba_phosphore','Phosphore'],['ba_magnesemie','Magnésémie'],['ba_bicarbonates','Bicarbonates']])}
              <div style="margin-top:6px"></div>
              ${secHdr('F. HÉPATIQUE HÉMOSTASE','#C41E3A')}
              ${items([['ba_bilirubine','Bilirubine libre et conjuguée'],['ba_asat_alat','ASAT ALAT'],['ba_pal','PAL'],['ba_ggt','GGT'],['ba_tp','TP'],['ba_tck','TCK'],['ba_inr','INR'],['ba_fibrinogene','Fibrinogène']])}
              <div style="text-align:right;font-size:9px;margin-top:8px;text-decoration:underline">Le Prescripteur</div>
            </td>
            <td style="width:33%;vertical-align:top;padding-left:4px">
              ${secHdr('SÉROLOGIE IMMUNOLOGIE','#8B4513')}
              ${items([['ba_aghbs','AgHbs'],['ba_bhcg','B-HCG Plasm.'],['ba_aslo','ASLO'],['ba_f_rhumatoide','F. Rhumatoïde'],['ba_widal','Widal et Félix'],['ba_bw','BW (TPHA-RPR)'],['ba_crp','CRP'],['ba_waler_rose','Waler Rose'],['ba_anti_ccp','Ac Anti CCP'],['ba_anti_dna','Ac Anti DNA natif']])}
              <div style="margin-top:6px"></div>
              ${secHdr('BACTÉRIOLOGIE PARASITOLOGIE','#2E8B57')}
              ${items([['ba_hemoculture','Hémoculture'],['ba_goutte_epaisse','Goutte épaisse'],['ba_frottis','Frottis sanguin'],['ba_ecbu','ECBU'],['ba_addis',"Compte d'Addis"],['ba_coproculture','Coproculture'],['ba_selles_kaop','Selles KAOP'],['ba_crachats_baar','Crachats BAAR']])}
            </td>
          </tr>
        </table>
      </div>`

    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8"/>
  <title>Bulletin d'analyses – ${dmst.agent_name}</title>
  <style>
    @page { size: A3 landscape; margin: 10mm; }
    body { font-family: Arial, sans-serif; margin: 0; }
    .outer { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="outer">
    <div>${buildPage()}</div>
    <div>${buildPage()}</div>
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`

    const win = window.open('', '_blank', 'width=1200,height=900')
    if (win) { win.document.write(html); win.document.close() }
  }

  const handlePrintCertificat = () => {
    if (!dmst) return
    const logoUrl = window.location.origin + '/coly.png'
    const obsData = (formData.observation_form_data || {}) as Record<string, unknown>
    const dateStr = (obsData['cert_date'] || formData.observation_date)
      ? new Date(String(obsData['cert_date'] || formData.observation_date)).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')
    const nom = dmst.agent_name?.split(' ').slice(-1)[0] || ''
    const prenom = dmst.agent_name?.split(' ').slice(0, -1).join(' ') || ''

    const html = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><title>Certificat Médical</title>
<style>
  @page { size: 148mm 210mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; width: 148mm; min-height: 210mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .bulletin { width: 148mm; min-height: 210mm; background: white; padding: 8px; display: flex; flex-direction: column; font-size: 10px; }
  .header-table { width: 100%; border-collapse: collapse; border-bottom: 2.5px solid #2E75B6; margin-bottom: 10px; }
  .header-table td { vertical-align: middle; padding: 3px; }
  .td-logo { width: 52px; text-align: center; }
  .td-logo img { width: 50px; height: 50px; object-fit: contain; display: block; margin: auto; }
  .td-info { padding-left: 7px; }
  .cabinet-name { font-weight: bold; font-size: 11px; color: #1F4788; }
  .cabinet-sub { font-size: 7px; color: #333; line-height: 1.6; }
  .td-date { text-align: right; vertical-align: middle; padding-right: 3px; white-space: nowrap; font-size: 8.5px; }
  .title-bulletin { text-align: center; font-weight: bold; font-size: 13px; color: #1F4788; border: 2px solid #1F4788; background: #E8F0F8; padding: 4px 0 5px 0; margin-top: 20px; margin-bottom: 12px; letter-spacing: 0.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .patient-section { border: 1px solid #CCCCCC; padding: 7px 9px; margin-bottom: 12px; font-size: 9px; }
  .field-row { display: flex; align-items: baseline; margin-bottom: 7px; gap: 4px; }
  .field-row:last-child { margin-bottom: 0; }
  .field-label { font-weight: bold; white-space: nowrap; color: #222; }
  .field-value { flex: 1; border-bottom: 1px dotted #CCCCCC; font-size: 9px; padding: 1px 2px; }
  .content-section { margin-bottom: 12px; }
  .section-title { font-weight: bold; font-size: 9.5px; color: #1F4788; border-bottom: 1.5px solid #1F4788; padding-bottom: 3px; margin-bottom: 6px; }
  .content-text { font-size: 9px; line-height: 1.7; white-space: pre-wrap; padding: 4px 2px; border-bottom: 1px dotted #ccc; min-height: 40px; }
  .footer-section { border-top: 1px solid #CCCCCC; padding-top: 6px; margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; }
  .footer-prescripteur { text-align: center; font-weight: bold; color: #1F4788; text-decoration: underline; font-size: 9px; padding-top: 35px; }
</style></head>
<body><div class="bulletin">
  <table class="header-table"><tbody><tr>
    <td class="td-logo"><img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"></td>
    <td class="td-info">
      <div class="cabinet-name">CABINET MÉDICAL LIONEL</div>
      <div class="cabinet-sub">Autorisation n° : 26JUIL2022*022346<br>RC : SN.THS.2024.A.266<br>NINEA : 010949412</div>
    </td>
    <td class="td-date"><em>Le </em>${dateStr}</td>
  </tr></tbody></table>
  <div class="title-bulletin">CERTIFICAT MÉDICAL</div>
  <div class="patient-section">
    <div class="field-row"><span class="field-label">Nom :</span><span class="field-value">${nom}</span>&nbsp;&nbsp;<span class="field-label">Prénom :</span><span class="field-value">${prenom}</span></div>
    <div class="field-row">
      <span class="field-label">Age :</span><span class="field-value" style="max-width:55px">${dmst.agent_age ? dmst.agent_age + ' ans' : ''}</span>
      &nbsp;&nbsp;<span class="field-label">Sexe :</span><span class="field-value" style="max-width:40px">${obsData['sex_m'] ? 'M' : obsData['sex_f'] ? 'F' : ''}</span>
      &nbsp;&nbsp;<span class="field-label">Tél :</span><span class="field-value">${obsData['telephone'] as string || ''}</span>
    </div>
  </div>
  <div class="content-section">
    <div class="section-title">Je soussigné(e), Médecin, certifie avoir examiné :</div>
    <div class="content-text">${((obsData['cert_observations'] as string) || '').replace(/\n/g, '<br>')}</div>
  </div>
  <div class="content-section">
    <div class="section-title">Conclusion :</div>
    <div class="content-text">${((obsData['cert_conclusion'] as string) || '').replace(/\n/g, '<br>')}</div>
  </div>
  <div class="content-section">
    <div class="section-title">Ce certificat est délivré pour :</div>
    <div class="content-text">${((obsData['cert_usage'] as string) || 'servir et valoir ce que de droit').replace(/\n/g, '<br>')}</div>
  </div>
  <div class="footer-section">
    <div><span class="field-label">Fait à Dakar, le </span>${dateStr}</div>
    <div class="footer-prescripteur">Le Médecin</div>
  </div>
</div>
<script>window.onload=function(){ window.print(); window.onafterprint=function(){ window.close(); }; }</script>
</body></html>`

    const win = window.open('', '_blank', 'width=700,height=900')
    if (win) { win.document.write(html); win.document.close() }
  }

  const handleSave = async () => {
    if (!dmst) return
    try {
      await client.put(`/medical/dmst/${dmst.id}/`, {
        ...buildDMSTPayload(),
        agent: dmst.agent,
      })
      showSnackbar('DMST modifié avec succès', 'success')
      setEditMode(false)
      fetchDMST()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleCreateDMST = async () => {
    const aid = agentId ? parseInt(agentId, 10) : NaN
    if (!Number.isFinite(aid)) {
      showSnackbar('Agent invalide.', 'error')
      return
    }
    try {
      const response = await client.post('/medical/dmst/', {
        ...buildDMSTPayload(),
        agent: aid,
      })
      setDmst(response.data)
      showSnackbar('DMST créé avec succès', 'success')
      setError('')
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const canEdit = user?.role ? ['super_admin', 'medecin', 'infirmier'].includes(user.role) : false
  const canEditObservation = hasMedicalAccess

  const obs = (formData.observation_form_data || {}) as Record<string, unknown>
  const setObs = (key: string, value: unknown) =>
    setFormData((prev) => ({
      ...prev,
      observation_form_data: { ...(prev.observation_form_data || {}), [key]: value },
    }))
  const getObs = (key: string) => (obs[key] ?? '') as string
  const getObsBool = (key: string) => !!obs[key]

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error && !dmst) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dossier Médical en Santé au Travail
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        {canEdit && (
          <Button variant="contained" onClick={handleCreateDMST}>
            Créer le DMST
          </Button>
        )}
      </Box>
    )
  }

  if (!dmst) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dossier Médical en Santé au Travail
        </Typography>
        <Alert severity="info">Aucun DMST trouvé.</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dossier Médical en Santé au Travail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agent: {dmst.agent_name} ({dmst.agent_matricule})
          </Typography>
        </Box>
        {(canEdit || canEditObservation) && (
          <Box>
            {editMode ? (
              <>
                <Button variant="outlined" onClick={() => { setEditMode(false); fetchDMST() }} sx={{ mr: 1 }}>
                  Annuler
                </Button>
                <Button variant="contained" onClick={handleSave}>
                  Enregistrer
                </Button>
              </>
            ) : (
              <>
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditMode(true)} sx={{ mr: 1 }}>
                  {tabValue === 1 ? 'Remplir la fiche' : 'Modifier'}
                </Button>
                {tabValue === 4 ? (
                  <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintBulletinAnalyses} sx={{ mr: 1 }}>
                    Imprimer le bulletin
                  </Button>
                ) : tabValue === 6 ? (
                  <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintCertificat} sx={{ mr: 1 }}>
                    Imprimer le certificat
                  </Button>
                ) : (
                  <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ mr: 1 }}>
                    Imprimer
                  </Button>
                )}
                <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDF} color="error">
                  Exporter PDF
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label={`Visites (${dmst.visits_count})`} icon={<MedicalServicesIcon />} iconPosition="start" />
          <Tab label="Fiche d'observation" icon={<MedicalServicesIcon />} iconPosition="start" />
          <Tab label="Ordonnance" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Demande d'examen" icon={<ScienceIcon />} iconPosition="start" />
          <Tab label="Bulletin d'analyses" icon={<ScienceIcon />} iconPosition="start" />
          <Tab label="Attestations" icon={<CertIcon />} iconPosition="start" />
          <Tab label="Certificat médical" icon={<DescriptionIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={1}>
          {/* Fiche d'observation - contenu existant */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                FICHE D'OBSERVATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Onglet Ordonnance */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                ORDONNANCE MÉDICALE
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={getObs('ordonnance_date') || formData.observation_date || ''}
                onChange={(e) => setObs('ordonnance_date', e.target.value)}
                disabled={!editMode}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Médecin"
                value={getObs('ordonnance_medecin') || formData.observer_name || ''}
                onChange={(e) => setObs('ordonnance_medecin', e.target.value)}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Médicaments prescrits"
                multiline
                rows={6}
                placeholder="列出所有开具的药物及其剂量和用法&#10;例：&#10;1. 阿莫西林 500mg - 每日3次&#10;2. 对乙酰氨基酚 1000mg - 必要时服用"
                value={getObs('ordonnance_medicaments')}
                onChange={(e) => setObs('ordonnance_medicaments', e.target.value)}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions particulières"
                multiline
                rows={3}
                value={getObs('ordonnance_instructions')}
                onChange={(e) => setObs('ordonnance_instructions', e.target.value)}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Suivi recommandé"
                multiline
                rows={2}
                value={getObs('ordonnance_suivi')}
                onChange={(e) => setObs('ordonnance_suivi', e.target.value)}
                disabled={!editMode}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Onglet Demande d'examen */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                DEMANDE D'EXAMEN MÉDICAL
              </Typography>
              <Divider sx={{ mb: 3 }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={getObs('examen_date') || formData.observation_date || ''}
                onChange={(e) => setObs('examen_date', e.target.value)}
                disabled={!editMode}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Médecin demandeur"
                value={getObs('examen_medecin') || formData.observer_name || ''}
                onChange={(e) => setObs('examen_medecin', e.target.value)}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Types d'examens demandés :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('examen_biologie')} onChange={(e) => setObs('examen_biologie', e.target.checked)} disabled={!editMode} />} label="Biologie / Analyses de sang" />
                <FormControlLabel control={<Checkbox checked={getObsBool('examen_radiologie')} onChange={(e) => setObs('examen_radiologie', e.target.checked)} disabled={!editMode} />} label="Radiologie" />
                <FormControlLabel control={<Checkbox checked={getObsBool('examen_ecg')} onChange={(e) => setObs('examen_ecg', e.target.checked)} disabled={!editMode} />} label="ECG" />
                <FormControlLabel control={<Checkbox checked={getObsBool('examen_spiro')} onChange={(e) => setObs('examen_spiro', e.target.checked)} disabled={!editMode} />} label="Spirométrie" />
                <FormControlLabel control={<Checkbox checked={getObsBool('examen_audiometrie')} onChange={(e) => setObs('examen_audiometrie', e.target.checked)} disabled={!editMode} />} label="Audiométrie" />
                <FormControlLabel control={<Checkbox checked={getObsBool('examen_acuite')} onChange={(e) => setObs('examen_acuite', e.target.checked)} disabled={!editMode} />} label="Acuité visuelle" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Examens spécifiques demandés"
                multiline
                rows={3}
                placeholder="描述所需的特定检查&#10;例：血常规、肝功能、胸部X光等"
                value={getObs('examen_specifique')}
                onChange={(e) => setObs('examen_specifique', e.target.value)}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motif de la demande"
                multiline
                rows={3}
                value={getObs('examen_motif')}
                onChange={(e) => setObs('examen_motif', e.target.value)}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observations cliniques"
                multiline
                rows={2}
                value={getObs('examen_observations')}
                onChange={(e) => setObs('examen_observations', e.target.value)}
                disabled={!editMode}
              />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MedicalServicesIcon />}
              onClick={handleOpenVisitDialog}
            >
              Programmer une visite
            </Button>
          </Box>
          <Box>
            {visitsLoading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                <CircularProgress size={24} />
              </Box>
            ) : visitsError ? (
              <Alert severity="error" sx={{ mb: 2 }}>{visitsError}</Alert>
            ) : (
              <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Diagnostic</TableCell>
                    <TableCell>Avis</TableCell>
                    <TableCell>Médecin</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Aucune visite médicale enregistrée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    visits.map((visit) => (
                      <TableRow key={visit.id}>
                        <TableCell>{new Date(visit.scheduled_date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{visit.visit_type_name}</TableCell>
                        <TableCell>
                          <Chip label={visit.status_display} size="small" color={visit.status === 'completed' ? 'success' : 'default'} />
                        </TableCell>
                        <TableCell>{visit.diagnosis || '-'}</TableCell>
                        <TableCell>{visit.avis_display || '-'}</TableCell>
                        <TableCell>{visit.doctor_name || '-'}</TableCell>
                        <TableCell>
                          <Button size="small" onClick={() => navigate(`/visits/${visit.id}`)}>
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={visitsTotalCount}
                rowsPerPage={visitsRowsPerPage}
                page={visitsPage}
                onPageChange={(_, newPage) => setVisitsPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setVisitsRowsPerPage(parseInt(e.target.value, 10))
                  setVisitsPage(0)
                }}
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                labelRowsPerPage="Lignes par page:"
              />
            </Box>
              </>
            )}
          </Box>
        </TabPanel>

        {/* Onglet Bulletin d'analyses */}
        <TabPanel value={tabValue} index={4}>
          {/* En-tête patient */}
          <Box sx={{ mb: 2, p: 1.5, border: '1px solid #ccc', borderRadius: 1, backgroundColor: '#E8F0F8' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={2}>
                <TextField fullWidth size="small" label="Date" type="date" value={getObs('ba_date') || formData.observation_date || ''} onChange={(e) => setObs('ba_date', e.target.value)} disabled={!editMode} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField fullWidth size="small" label="Nom et prénoms" value={dmst.agent_name} disabled InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={1}>
                <TextField fullWidth size="small" label="Âge" value={dmst.agent_age ?? ''} disabled InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Box display="flex" alignItems="center">
                  <Typography variant="body2" sx={{ mr: 0.5 }}>Sexe :</Typography>
                  <FormControlLabel control={<Checkbox size="small" checked={getObsBool('sex_m')} disabled />} label="M" />
                  <FormControlLabel control={<Checkbox size="small" checked={getObsBool('sex_f')} disabled />} label="F" />
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField fullWidth size="small" label="Téléphone" value={getObs('telephone')} disabled InputProps={{ readOnly: true }} />
              </Grid>
            </Grid>
          </Box>
          {/* 3 colonnes d'analyses */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1.5 }}>
            {/* Colonne 1 : HÉMATOLOGIE + BIOCHIMIE */}
            <Box>
              <Box sx={{ backgroundColor: '#1F4788', color: 'white', py: 0.5, px: 1, mb: 0.5, textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>HÉMATOLOGIE</Box>
              {[['ba_nfs','NFS'],['ba_taux_ret','Taux Rét.'],['ba_te','T E'],['ba_vs','V S'],['ba_gs','G S'],['ba_rhesus','Rhesus'],['ba_abo','ABO'],['ba_rai','RAI']].map(([k,l]) => (
                <FormControlLabel key={k} sx={{ display: 'block', ml: 0, my: 0.25 }} control={<Checkbox size="small" checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">{l}</Typography>} />
              ))}
              <Box sx={{ backgroundColor: '#1F4788', color: 'white', py: 0.5, px: 1, mt: 1, mb: 0.5, textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>BIOCHIMIE</Box>
              {[['ba_gaj','G A J'],['ba_gpp','G P P'],['ba_hba1c','HbA1c'],['ba_uree','Urée'],['ba_creat','Créat'],['ba_acide_urique','Acide urique'],['ba_psa','PSA'],['ba_afp','AFP'],['ba_lipasemie','Lipasémie'],['ba_electroph_pr','Electroph. Pr'],['ba_electroph_hb','Electroph. Hb']].map(([k,l]) => (
                <FormControlLabel key={k} sx={{ display: 'block', ml: 0, my: 0.25 }} control={<Checkbox size="small" checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">{l}</Typography>} />
              ))}
              <Box display="flex">
                <FormControlLabel sx={{ my: 0.25 }} control={<Checkbox size="small" checked={getObsBool('ba_tsh')} onChange={(e) => setObs('ba_tsh', e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">TSH</Typography>} />
                <FormControlLabel sx={{ my: 0.25 }} control={<Checkbox size="small" checked={getObsBool('ba_t4')} onChange={(e) => setObs('ba_t4', e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">T4</Typography>} />
              </Box>
              {[['ba_pu24','PU 24'],['ba_micro_albumin','Micro-albuminurie']].map(([k,l]) => (
                <FormControlLabel key={k} sx={{ display: 'block', ml: 0, my: 0.25 }} control={<Checkbox size="small" checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">{l}</Typography>} />
              ))}
            </Box>
            {/* Colonne 2 : B. LIPIDIQUE + IONOGRAMME + F. HÉPATIQUE HÉMOSTASE */}
            <Box>
              <Box sx={{ backgroundColor: '#1F4788', color: 'white', py: 0.5, px: 1, mb: 0.5, textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>B. LIPIDIQUE</Box>
              {[['ba_ch_total','Ch. total'],['ba_ch_hdl','Ch. HDL'],['ba_ch_ldl','Ch. LDL'],['ba_tgl','TGL']].map(([k,l]) => (
                <FormControlLabel key={k} sx={{ display: 'block', ml: 0, my: 0.25 }} control={<Checkbox size="small" checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">{l}</Typography>} />
              ))}
              <Box sx={{ backgroundColor: '#2E75B6', color: 'white', py: 0.5, px: 1, mt: 1, mb: 0.5, textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>IONOGRAMME SANGUIN</Box>
              <Box display="flex">
                <FormControlLabel sx={{ my: 0.25 }} control={<Checkbox size="small" checked={getObsBool('ba_na')} onChange={(e) => setObs('ba_na', e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">Na+</Typography>} />
                <FormControlLabel sx={{ my: 0.25 }} control={<Checkbox size="small" checked={getObsBool('ba_k')} onChange={(e) => setObs('ba_k', e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">K+</Typography>} />
                <FormControlLabel sx={{ my: 0.25 }} control={<Checkbox size="small" checked={getObsBool('ba_cl')} onChange={(e) => setObs('ba_cl', e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">Cl-</Typography>} />
              </Box>
              {[['ba_calcemie','Calcémie'],['ba_phosphore','Phosphore'],['ba_magnesemie','Magnésémie'],['ba_bicarbonates','Bicarbonates']].map(([k,l]) => (
                <FormControlLabel key={k} sx={{ display: 'block', ml: 0, my: 0.25 }} control={<Checkbox size="small" checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">{l}</Typography>} />
              ))}
              <Box sx={{ backgroundColor: '#C41E3A', color: 'white', py: 0.5, px: 1, mt: 1, mb: 0.5, textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>F. HÉPATIQUE HÉMOSTASE</Box>
              {[['ba_bilirubine','Bilirubine libre et conjuguée'],['ba_asat_alat','ASAT ALAT'],['ba_pal','PAL'],['ba_ggt','GGT'],['ba_tp','TP'],['ba_tck','TCK'],['ba_inr','INR'],['ba_fibrinogene','Fibrinogène']].map(([k,l]) => (
                <FormControlLabel key={k} sx={{ display: 'block', ml: 0, my: 0.25 }} control={<Checkbox size="small" checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">{l}</Typography>} />
              ))}
            </Box>
            {/* Colonne 3 : SÉROLOGIE IMMUNOLOGIE + BACTÉRIOLOGIE PARASITOLOGIE */}
            <Box>
              <Box sx={{ backgroundColor: '#8B4513', color: 'white', py: 0.5, px: 1, mb: 0.5, textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>SÉROLOGIE IMMUNOLOGIE</Box>
              {[['ba_aghbs','AgHbs'],['ba_bhcg','B-HCG Plasm.'],['ba_aslo','ASLO'],['ba_f_rhumatoide','F. Rhumatoïde'],['ba_widal','Widal et Félix'],['ba_bw','BW (TPHA-RPR)'],['ba_crp','CRP'],['ba_waler_rose','Waler Rose'],['ba_anti_ccp','Ac Anti CCP'],['ba_anti_dna','Ac Anti DNA natif']].map(([k,l]) => (
                <FormControlLabel key={k} sx={{ display: 'block', ml: 0, my: 0.25 }} control={<Checkbox size="small" checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">{l}</Typography>} />
              ))}
              <Box sx={{ backgroundColor: '#2E8B57', color: 'white', py: 0.5, px: 1, mt: 1, mb: 0.5, textAlign: 'center', fontWeight: 'bold', fontSize: '12px' }}>BACTÉRIOLOGIE PARASITOLOGIE</Box>
              {[['ba_hemoculture','Hémoculture'],['ba_goutte_epaisse','Goutte épaisse'],['ba_frottis','Frottis sanguin'],['ba_ecbu','ECBU'],['ba_addis',"Compte d'Addis"],['ba_coproculture','Coproculture'],['ba_selles_kaop','Selles KAOP'],['ba_crachats_baar','Crachats BAAR']].map(([k,l]) => (
                <FormControlLabel key={k} sx={{ display: 'block', ml: 0, my: 0.25 }} control={<Checkbox size="small" checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography variant="body2">{l}</Typography>} />
              ))}
            </Box>
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={5}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6">Attestations d'aptitude médicale au travail</Typography>
            <Button
              variant="contained"
              startIcon={<CertIcon />}
              onClick={() => {
                setCertMedForm({
                  ...emptyCertMed,
                  dateExamen: formData.observation_date || new Date().toISOString().split('T')[0],
                  medecin: formData.observer_name || '',
                  conclusion: formData.medical_conclusion_apte ? 'apte'
                    : formData.medical_conclusion_asr ? 'asr'
                    : formData.medical_conclusion_aar ? 'aar'
                    : formData.medical_conclusion_int ? 'int'
                    : formData.medical_conclusion_ind ? 'ind'
                    : 'apte',
                })
                setCertMedDialog(true)
              }}
            >
              Générer une attestation
            </Button>
          </Box>
          <Alert severity="info" sx={{ mb: 2 }}>
            Les données sont pré-remplies depuis la fiche d'observation. Vous pouvez les modifier avant d'imprimer.
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Agent :</strong> {dmst.agent_name} ({dmst.agent_matricule})</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Direction :</strong> {dmst.agent_direction || '–'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Fonction :</strong> {dmst.agent_function || '–'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Site :</strong> {dmst.agent_site_name || '–'}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography variant="body2"><strong>Dernière visite :</strong> {dmst.last_visit_date ? new Date(dmst.last_visit_date).toLocaleDateString('fr-FR') : '–'}</Typography></Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Conclusion actuelle :</strong>{' '}
                {formData.medical_conclusion_apte ? 'Apte'
                  : formData.medical_conclusion_asr ? 'Apte sous réserve'
                  : formData.medical_conclusion_aar ? 'Apte avec aménagement'
                  : formData.medical_conclusion_int ? 'Inapte temporaire'
                  : formData.medical_conclusion_ind ? 'Inapte définitif'
                  : '–'}
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Certificat médical */}
        <TabPanel value={tabValue} index={6}>
          <Box sx={{ maxWidth: '148mm', mx: 'auto', fontFamily: 'Arial, sans-serif', fontSize: '10px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2.5px solid #2E75B6', marginBottom: '10px' }}>
              <tbody><tr>
                <td style={{ width: '52px', textAlign: 'center', padding: '3px', verticalAlign: 'middle' }}>
                  <img src="/coly.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain', display: 'block', margin: 'auto' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </td>
                <td style={{ paddingLeft: '7px', verticalAlign: 'middle' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1F4788' }}>CABINET MÉDICAL LIONEL</div>
                  <div style={{ fontSize: '7px', color: '#333', lineHeight: 1.6 }}>Autorisation n° : 26JUIL2022*022346<br />RC : SN.THS.2024.A.266<br />NINEA : 010949412</div>
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '3px' }}>
                  <TextField size="small" label="Date" type="date" value={(formData.observation_form_data as Record<string,unknown>)?.['cert_date'] as string || formData.observation_date || ''} onChange={(e) => setObs('cert_date', e.target.value)} disabled={!editMode} InputLabelProps={{ shrink: true }} sx={{ width: '140px' }} />
                </td>
              </tr></tbody>
            </table>
            <Box sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#1F4788', border: '2px solid #1F4788', background: '#E8F0F8', py: '4px', mt: '20px', mb: '12px', letterSpacing: '0.5px' }}>
              CERTIFICAT MÉDICAL
            </Box>
            <Box sx={{ border: '1px solid #ccc', p: '7px 9px', mb: '12px', fontSize: '9px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: '7px', gap: '4px' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap' }}>Nom :</Typography>
                <Typography sx={{ fontSize: '9px', borderBottom: '1px dotted #ccc', flex: 1 }}>{dmst.agent_name?.split(' ').slice(-1)[0] || ''}</Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap', ml: 2 }}>Prénom :</Typography>
                <Typography sx={{ fontSize: '9px', borderBottom: '1px dotted #ccc', flex: 1 }}>{dmst.agent_name?.split(' ').slice(0, -1).join(' ') || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px' }}>Age :</Typography>
                <Typography sx={{ fontSize: '9px', borderBottom: '1px dotted #ccc', width: '55px' }}>{dmst.agent_age ? `${dmst.agent_age} ans` : ''}</Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px', ml: 1 }}>Sexe :</Typography>
                <FormControlLabel sx={{ mx: 0 }} control={<Checkbox size="small" checked={!!((formData.observation_form_data as Record<string,unknown>)?.['sex_m'])} onChange={(e) => setObs('sex_m', e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '9px' }}>M</Typography>} />
                <FormControlLabel sx={{ mx: 0 }} control={<Checkbox size="small" checked={!!((formData.observation_form_data as Record<string,unknown>)?.['sex_f'])} onChange={(e) => setObs('sex_f', e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '9px' }}>F</Typography>} />
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px', ml: 1 }}>Tél :</Typography>
                <TextField size="small" value={(formData.observation_form_data as Record<string,unknown>)?.['telephone'] as string || ''} onChange={(e) => setObs('telephone', e.target.value)} disabled={!editMode} sx={{ flex: 1 }} inputProps={{ style: { fontSize: '9px', padding: '2px 4px' } }} variant="standard" />
              </Box>
            </Box>
            <Box sx={{ mb: '12px' }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '9.5px', color: '#1F4788', borderBottom: '1.5px solid #1F4788', pb: '3px', mb: '6px' }}>Je soussigné(e), Médecin, certifie avoir examiné :</Typography>
              <TextField fullWidth multiline rows={3} placeholder="Observations cliniques..." value={(formData.observation_form_data as Record<string,unknown>)?.['cert_observations'] as string || ''} onChange={(e) => setObs('cert_observations', e.target.value)} disabled={!editMode} size="small" inputProps={{ style: { fontSize: '9px' } }} />
            </Box>
            <Box sx={{ mb: '12px' }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '9.5px', color: '#1F4788', borderBottom: '1.5px solid #1F4788', pb: '3px', mb: '6px' }}>Conclusion :</Typography>
              <TextField fullWidth multiline rows={4} placeholder="Conclusion médicale..." value={(formData.observation_form_data as Record<string,unknown>)?.['cert_conclusion'] as string || ''} onChange={(e) => setObs('cert_conclusion', e.target.value)} disabled={!editMode} size="small" inputProps={{ style: { fontSize: '9px' } }} />
            </Box>
            <Box sx={{ mb: '12px' }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '9.5px', color: '#1F4788', borderBottom: '1.5px solid #1F4788', pb: '3px', mb: '6px' }}>Ce certificat est délivré pour :</Typography>
              <TextField fullWidth multiline rows={2} placeholder="servir et valoir ce que de droit..." value={(formData.observation_form_data as Record<string,unknown>)?.['cert_usage'] as string || ''} onChange={(e) => setObs('cert_usage', e.target.value)} disabled={!editMode} size="small" inputProps={{ style: { fontSize: '9px' } }} />
            </Box>
            <Box sx={{ borderTop: '1px solid #ccc', pt: '6px', mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>
                Fait à Dakar, le {((formData.observation_form_data as Record<string,unknown>)?.['cert_date'] || formData.observation_date) ? new Date(String((formData.observation_form_data as Record<string,unknown>)?.['cert_date'] || formData.observation_date)).toLocaleDateString('fr-FR') : ''}
              </Typography>
              <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: '#1F4788', textDecoration: 'underline', pt: '35px' }}>Le Médecin</Typography>
            </Box>
          </Box>
        </TabPanel>

      </Paper>

      <Dialog open={certMedDialog} onClose={() => setCertMedDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <CertIcon color="primary" />
          Attestation d'aptitude médicale au travail
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ minHeight: 560 }}>
            {/* Formulaire */}
            <Grid item xs={12} md={4} sx={{ p: 3, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', overflowY: 'auto' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Informations</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Conclusion médicale</InputLabel>
                    <Select value={certMedForm.conclusion} onChange={(e) => setCertMedForm({ ...certMedForm, conclusion: e.target.value })} label="Conclusion médicale">
                      <MenuItem value="apte">Apte au poste de travail</MenuItem>
                      <MenuItem value="asr">Apte sous réserve</MenuItem>
                      <MenuItem value="aar">Apte avec aménagement</MenuItem>
                      <MenuItem value="int">Inapte temporaire</MenuItem>
                      <MenuItem value="ind">Inapte définitif</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Date d'examen" type="date" value={certMedForm.dateExamen} onChange={(e) => setCertMedForm({ ...certMedForm, dateExamen: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Médecin du travail" value={certMedForm.medecin} onChange={(e) => setCertMedForm({ ...certMedForm, medecin: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Valide jusqu'au" type="date" value={certMedForm.validiteDate} onChange={(e) => setCertMedForm({ ...certMedForm, validiteDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Restrictions / Observations" multiline rows={3} value={certMedForm.restrictions} onChange={(e) => setCertMedForm({ ...certMedForm, restrictions: e.target.value })} placeholder="Ex : Éviter le port de charges lourdes..." />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="N° Attestation" value={certMedForm.certificatNo} onChange={(e) => setCertMedForm({ ...certMedForm, certificatNo: e.target.value })} />
                </Grid>
              </Grid>
            </Grid>

            {/* Aperçu live */}
            <Grid item xs={12} md={8} sx={{ p: 3, bgcolor: '#e8e8e8', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto' }}>
              <Box sx={{ transform: 'scale(0.73)', transformOrigin: 'top center', width: '680px', flexShrink: 0 }}>
                <Box sx={{ bgcolor: '#fff', border: '3px double #1976d2', p: '44px', fontFamily: 'Georgia, serif', position: 'relative' }}>
                  <Box sx={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, border: '1px solid #90caf9', pointerEvents: 'none' }} />
                  {/* Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box component="img" src="/coly.png" alt="Logo" sx={{ height: 68, objectFit: 'contain' }} />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: 14, color: '#1976d2' }}>SERVICE DE SANTÉ AU TRAVAIL</Typography>
                      <Typography sx={{ fontSize: 11, color: '#555' }}>Département Hygiène, Sécurité et Environnement</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ borderColor: '#1976d2', borderWidth: 2, mb: 3 }} />
                  <Typography sx={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: 3, fontSize: 20, fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                    Attestation d'Aptitude Médicale au Travail
                  </Typography>
                  <Typography sx={{ textAlign: 'center', fontSize: 12, color: '#888', mb: 3 }}>Service de Santé au Travail</Typography>
                  <Typography sx={{ textAlign: 'center', fontSize: 14, mb: 1.5 }}>Le médecin du travail soussigné certifie que</Typography>
                  <Box sx={{ textAlign: 'center', mb: 1.5 }}>
                    <Typography component="span" sx={{ fontSize: 24, fontWeight: 'bold', borderBottom: '2px solid #1976d2', px: 3, pb: 0.5, display: 'inline-block' }}>
                      {dmst.agent_name}
                    </Typography>
                  </Box>
                  {dmst.agent_matricule && <Typography sx={{ textAlign: 'center', fontSize: 12, color: '#666', mb: 0.5 }}>Matricule : {dmst.agent_matricule}</Typography>}
                  {dmst.agent_direction && <Typography sx={{ textAlign: 'center', fontSize: 12, color: '#666', mb: 2 }}>Direction : {dmst.agent_direction}{dmst.agent_function ? ` — Fonction : ${dmst.agent_function}` : ''}</Typography>}
                  {/* Conclusion */}
                  <Box sx={{ textAlign: 'center', my: 2.5, p: 2, border: `2px solid ${conclusionColor(certMedForm.conclusion)}`, borderRadius: 1, bgcolor: `${conclusionColor(certMedForm.conclusion)}11` }}>
                    <Typography sx={{ fontSize: 12, color: '#666', mb: 0.5 }}>est déclaré(e)</Typography>
                    <Typography sx={{ fontSize: 20, fontWeight: 'bold', color: conclusionColor(certMedForm.conclusion), letterSpacing: 2 }}>
                      {conclusionLabel(certMedForm.conclusion)}
                    </Typography>
                  </Box>
                  {certMedForm.restrictions && (
                    <Box sx={{ bgcolor: '#fff8e1', borderLeft: '3px solid #f57c00', p: 1.5, borderRadius: 1, mb: 2 }}>
                      <Typography sx={{ fontSize: 12, fontWeight: 'bold', color: '#f57c00', mb: 0.3 }}>Restrictions / Observations :</Typography>
                      <Typography sx={{ fontSize: 13 }}>{certMedForm.restrictions}</Typography>
                    </Box>
                  )}
                  <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    {[
                      { label: "Date d'examen", val: certMedForm.dateExamen ? new Date(certMedForm.dateExamen).toLocaleDateString('fr-FR') : '' },
                      { label: "Valide jusqu'au", val: certMedForm.validiteDate ? new Date(certMedForm.validiteDate).toLocaleDateString('fr-FR') : '' },
                      { label: 'Médecin du travail', val: certMedForm.medecin },
                      { label: 'Site', val: dmst.agent_site_name || '' },
                    ].filter((i) => i.val).map((item) => (
                      <Grid item xs={6} key={item.label}>
                        <Box sx={{ bgcolor: '#f7f7f7', p: 1.2, borderRadius: 1, borderLeft: '3px solid #1976d2' }}>
                          <Typography sx={{ fontSize: 10, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', mb: 0.2 }}>{item.label}</Typography>
                          <Typography sx={{ fontSize: 13 }}>{item.val}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
                    <Box sx={{ width: '42%', textAlign: 'center' }}>
                      <Divider sx={{ borderColor: '#555', mb: 1 }} />
                      <Typography sx={{ fontSize: 11, color: '#555' }}>Le Médecin du Travail<br />{certMedForm.medecin || '..............................'}</Typography>
                    </Box>
                    <Box sx={{ width: '42%', textAlign: 'center' }}>
                      <Divider sx={{ borderColor: '#555', mb: 1 }} />
                      <Typography sx={{ fontSize: 11, color: '#555' }}>Cachet du Service de Santé au Travail</Typography>
                    </Box>
                  </Box>
                  {certMedForm.certificatNo && (
                    <Typography sx={{ textAlign: 'center', fontSize: 10, color: '#aaa', mt: 2.5 }}>N° Attestation : {certMedForm.certificatNo}</Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
          <Button onClick={() => setCertMedDialog(false)}>Annuler</Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => { handlePrintAptitudeCert(certMedForm); setCertMedDialog(false) }}>
            Imprimer cette attestation
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openVisitDialog} onClose={() => setOpenVisitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Programmer une visite médicale</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Type de visite *</InputLabel>
                <Select
                  value={visitForm.visit_type}
                  onChange={(e) => setVisitForm({ ...visitForm, visit_type: e.target.value })}
                  label="Type de visite *"
                >
                  {visitTypes.map((vt) => (
                    <MenuItem key={vt.id} value={String(vt.id)}>{vt.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date *"
                type="date"
                value={visitForm.scheduled_date}
                onChange={(e) => setVisitForm({ ...visitForm, scheduled_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heure *"
                type="time"
                value={visitForm.scheduled_time}
                onChange={(e) => setVisitForm({ ...visitForm, scheduled_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Raison de la visite"
                multiline
                rows={3}
                value={visitForm.reason}
                onChange={(e) => setVisitForm({ ...visitForm, reason: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVisitDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSubmitVisit}
            disabled={!visitForm.visit_type || !visitForm.scheduled_date || !visitForm.scheduled_time}
          >
            Programmer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Section d'impression cachée — Fiche d'observation A4 */}
      {dmst && (
        <Box
          id="print-section"
          className="print-section"
          sx={{
            display: 'none',
            width: '210mm',
            padding: '20mm',
            backgroundColor: '#ffffff',
            '@media print': {
              display: 'block !important',
              padding: '20mm',
              position: 'absolute',
              left: 0,
              top: 0,
              width: '100%',
              zIndex: 9999,
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Box sx={{ flex: '0 0 80px', mr: 2, display: 'flex', alignItems: 'center' }}>
              <img
                src="/coly.png"
                alt="Logo"
                style={{ width: '80px', height: 'auto', maxWidth: '80px' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </Box>
            <Box sx={{ flex: 1, backgroundColor: '#0D47A1', color: 'white', padding: '10px 20px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px', borderRadius: '50px', minHeight: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              FICHE D'OBSERVATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL
            </Box>
            <Box sx={{ flex: '0 0 140px', textAlign: 'right', ml: 2 }}>
              <Typography variant="body2">Fait à Dakar, le {formData.observation_date ? new Date(formData.observation_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</Typography>
              <Typography variant="body2">Type : {[obs.visit_type_embauche && 'Embauche', obs.visit_type_periodique && 'Périodique', obs.visit_type_reprise && 'Reprise'].filter(Boolean).join(', ') || '-'}</Typography>
              <Typography variant="body2">Médecin : {formData.observer_name || ''}</Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>I. IDENTIFICATION DE L'AGENT</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography><strong>Nom et prénoms :</strong> {dmst.agent_name}</Typography></Grid>
              <Grid item xs={2}><Typography><strong>Âge :</strong> {dmst.agent_age ?? ''} ans</Typography></Grid>
              <Grid item xs={2}><Typography><strong>Sexe :</strong> {obs.sex_m ? 'M' : obs.sex_f ? 'F' : ''}</Typography></Grid>
              <Grid item xs={2}><Typography><strong>Matricule :</strong> {dmst.agent_matricule}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>Téléphone :</strong> {String(obs.telephone || '')}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>Direction :</strong> {formData.observation_direction || dmst.agent_direction || ''}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>Site :</strong> {formData.observation_site || dmst.agent_site_name || ''}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>Fonction / Poste :</strong> {formData.observation_function || dmst.agent_function || ''}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>Ancienneté au poste :</strong> {String(obs.seniority_years || '')} ans</Typography></Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>II. ANTÉCÉDENTS ET TERRAINS PARTICULIERS</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}><Typography><strong>Antécédents médicaux :</strong> {formData.medical_antecedents || ''}</Typography></Grid>
              <Grid item xs={6}><Typography><strong>Antécédents chirurgicaux :</strong> {formData.surgical_antecedents || ''}</Typography></Grid>
              <Grid item xs={12}>
                <Typography><strong>Habitudes de vie :</strong> {[formData.sport_activity && 'Activité sportive', formData.physical_activity && 'Activité physique régulière', formData.tobacco && `Tabac (${obs.tobacco_per_day || ''}/j)`, formData.alcohol_obs && 'Alcool', formData.coffee && 'Café', formData.tea && 'Thé', obs.habits_other].filter(Boolean).join(' — ') || 'Aucune'}</Typography>
              </Grid>
              <Grid item xs={12}><Typography><strong>AT/MP (12 derniers mois) :</strong> {obs.at_mp_no ? 'Non' : obs.at_mp_yes ? `Oui → Nature : ${formData.at_mp_nature || ''}` : ''}</Typography></Grid>
              <Grid item xs={12}><Typography><strong>Entreprises / Postes antérieurs :</strong> {formData.previous_companies || ''}</Typography></Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>III. EXPOSITIONS PROFESSIONNELLES</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}><strong>Risques physiques :</strong> {[obs.exp_phys_bruit && 'Bruit', obs.exp_phys_vibrations && 'Vibrations', obs.exp_phys_chaleur_froid && 'Chaleur/Froid', obs.exp_phys_rayonnements && 'Rayonnements', obs.exp_phys_ecran && 'Écran >4h/j'].filter(Boolean).join(', ') || '-'}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}><strong>Chimiques/biologiques :</strong> {[obs.exp_chim_poussieres && 'Poussières', obs.exp_chim_solvants && 'Solvants', obs.exp_chim_cmr && 'CMR', obs.exp_chim_biologiques && 'Agents biologiques', obs.exp_chim_gaz && 'Gaz/Fumées'].filter(Boolean).join(', ') || '-'} {obs.exp_chim_preciser ? ` — ${obs.exp_chim_preciser}` : ''}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}><strong>Biomécaniques :</strong> {[obs.exp_bio_port_charges && 'Port charges', obs.exp_bio_gestes_repetitifs && 'Gestes répétitifs', obs.exp_bio_postures && 'Postures', obs.exp_bio_station_debout && 'Station debout'].filter(Boolean).join(', ') || '-'}</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}><strong>Psychosociaux :</strong> {[obs.exp_psy_stress && 'Stress', obs.exp_psy_charge_mentale && 'Charge mentale', obs.exp_psy_isole && 'Travail isolé', obs.exp_psy_relations && 'Relations difficiles', obs.exp_psy_harcelement && 'Harcèlement'].filter(Boolean).join(', ') || '-'}</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}><strong>EPI :</strong> {[obs.epi_gants && 'Gants', obs.epi_masque && 'Masque', obs.epi_lunettes && 'Lunettes', obs.epi_casque && 'Casque', obs.epi_auditif && 'Protections auditives', obs.epi_chaussures && 'Chaussures sécurité'].filter(Boolean).join(', ') || '-'}</Typography>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>IV. PLAINTES FONCTIONNELLES ACTUELLES</Typography>
            <Typography sx={{ mb: 2 }}>{obs.plaintes_aucune ? 'Aucune plainte' : [obs.plaintes_douleurs_ms && `Douleurs MS (${obs.plaintes_douleurs_localisation || ''})`, obs.plaintes_respiratoires && 'Troubles respiratoires', obs.plaintes_cutanes && 'Troubles cutanés', obs.plaintes_orl && 'ORL/Oculaires', obs.plaintes_cephalees && 'Céphalées', obs.plaintes_vertiges && 'Vertiges', obs.plaintes_fatigue && 'Fatigue chronique', obs.plaintes_stress && 'Stress/Anxiété/Sommeil', obs.plaintes_digestifs && 'Troubles digestifs'].filter(Boolean).join(' ; ') || '-'} {obs.plaintes_details ? ` — ${obs.plaintes_details}` : ''}</Typography>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>V. ÉTAT GÉNÉRAL ET CONSTANTES</Typography>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={3}><Typography><strong>TA :</strong> {formData.blood_pressure_systolic || ''}/{formData.blood_pressure_diastolic || ''} mmHg</Typography></Grid>
              <Grid item xs={2}><Typography><strong>T° :</strong> {formData.temperature || ''} °C</Typography></Grid>
              <Grid item xs={2}><Typography><strong>FC :</strong> {formData.heart_rate || ''} /min</Typography></Grid>
              <Grid item xs={2}><Typography><strong>Poids :</strong> {formData.weight || ''} kg</Typography></Grid>
              <Grid item xs={2}><Typography><strong>Taille :</strong> {formData.height || ''} cm</Typography></Grid>
              <Grid item xs={2}><Typography><strong>IMC :</strong> {formData.bmi || ''} kg/m²</Typography></Grid>
              <Grid item xs={2}><Typography><strong>Tour de taille :</strong> {String(obs.tour_taille || '')} cm</Typography></Grid>
              <Grid item xs={2}><Typography><strong>Périmètre ombilical :</strong> {String(obs.perimetre_ombilical || '')} cm</Typography></Grid>
              <Grid item xs={2}><Typography><strong>SpO₂ :</strong> {String(obs.spo2 || '')} %</Typography></Grid>
              <Grid item xs={2}><Typography><strong>Dextro (jn) :</strong> {formData.dextro_jn || ''} g/L</Typography></Grid>
              <Grid item xs={2}><Typography><strong>Dextro (pp) :</strong> {formData.dextro_pp || ''} g/L</Typography></Grid>
            </Grid>
            <Typography variant="body2" gutterBottom><strong>Acuité visuelle :</strong> OD loin {String(obs.av_od_loin || '')}/10, près {String(obs.av_od_pres || '')}/10 — OG loin {String(obs.av_og_loin || '')}/10, près {String(obs.av_og_pres || '')}/10 — Binoculaire loin {String(obs.av_bin_loin || '')}/10, près {String(obs.av_bin_pres || '')}/10. Vision des couleurs : {obs.vision_couleurs_normale ? 'Normale' : obs.vision_couleurs_daltonisme ? `Daltonisme (${obs.daltonisme_type || ''})` : '-'}. Lunettes/lentilles : {obs.lunettes_oui ? `Oui — ${obs.lunettes_correction || ''}` : obs.lunettes_non ? 'Non' : '-'}</Typography>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>VI. EXAMEN CLINIQUE</Typography>
            <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{formData.clinical_exam || ''}</Typography>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>VII. EXAMENS COMPLÉMENTAIRES</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>{[obs.comp_audiometrie && 'Audiométrie tonale', obs.comp_spiro && 'Spirométrie/EFR', obs.comp_ecg && 'ECG', obs.comp_radio_thorax && 'Radiographie thoracique', obs.comp_acuite && 'Acuité visuelle', obs.comp_vision_couleurs && 'Vision des couleurs', obs.comp_bilan_sang && 'Bilan biologique', obs.comp_bilan_hepatique && 'Bilan hépatique', obs.comp_autres].filter(Boolean).join(' ; ') || '-'}</Typography>
            <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{String(obs.comp_resultats || '')}</Typography>

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>VIII. CONCLUSION MÉDICALE — AVIS D'APTITUDE</Typography>
            <Typography sx={{ mb: 1 }}>{[formData.medical_conclusion_apte && 'APTE', formData.medical_conclusion_asr && 'ASR', formData.medical_conclusion_aar && 'AAR', formData.medical_conclusion_int && `INT (durée : ${obs.int_duree || ''})`, formData.medical_conclusion_ind && 'IND'].filter(Boolean).join('  ') || 'Aucun'}</Typography>
            {!!obs.conclusion_restrictions && <Typography sx={{ mb: 1 }}><strong>Restrictions / Aménagements :</strong> {String(obs.conclusion_restrictions)}</Typography>}
            {!!obs.conclusion_recommendations && <Typography sx={{ mb: 2 }}><strong>Recommandations :</strong> {String(obs.conclusion_recommendations)}</Typography>}

            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" fontWeight="bold" gutterBottom>IX. ÉDUCATION THÉRAPEUTIQUE ET SENSIBILISATION</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}><strong>Thèmes :</strong> {[formData.education_mhd && 'MHD', formData.education_mhv && 'MHV', formData.education_fdr_cvx && 'FDR-CVx', formData.education_ergo && 'Ergo', formData.education_spb_psy && 'SPB&Psy', formData.education_therapy && 'Thérapie', obs.education_epi && 'Port EPI', obs.education_tms && 'Prévention TMS', obs.education_stress && 'Gestion stress', obs.education_sommeil && 'Hygiène sommeil', formData.education_other].filter(Boolean).join(', ') || 'Aucun'}</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}><strong>Date prochaine visite :</strong> {obs.next_visit_date ? new Date(String(obs.next_visit_date)).toLocaleDateString('fr-FR') : ''} — Type : {[obs.next_visit_type_periodique && 'Périodique', obs.next_visit_type_surveillance && 'Surveillance renforcée', obs.next_visit_type_specialisee && 'Spécialisée'].filter(Boolean).join(', ') || '-'}</Typography>

            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #ccc' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 2 }}>
                <Box><Typography variant="body2"><strong>L'AGENT — Signature (pour information)</strong></Typography></Box>
                <Box sx={{ textAlign: 'right', minWidth: '250px' }}>
                  <Typography variant="body2" sx={{ mb: 1 }}><strong>LE MÉDECIN DU TRAVAIL — Signature et cachet</strong></Typography>
                  <Typography variant="body2">{formData.observer_name || ''}</Typography>
                  <Box sx={{ mt: 2, height: '40px', borderBottom: '1px solid #000', width: '200px', mx: 'auto' }} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  )
}
