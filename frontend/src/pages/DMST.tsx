import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Autocomplete,
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
import { Edit as EditIcon, MedicalServices as MedicalServicesIcon, Print as PrintIcon, PictureAsPdf as PdfIcon, Description as DescriptionIcon, Science as ScienceIcon } from '@mui/icons-material'
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

// ─── Génération des options pour les constantes vitales ───────────────────────
function vitalOptions(min: number, max: number, step: number, normalMin: number, normalMax: number, critMin: number, critMax: number) {
  const opts: { label: string; color: string }[] = []
  for (let v = min; v <= max + step / 2; v = Math.round((v + step) * 1000) / 1000) {
    const val = Math.round(v * 1000) / 1000
    let color = '#d32f2f' // rouge = hors limites critiques
    if (val >= critMin && val <= critMax) color = '#ed6c02' // orange = critique mais humain
    if (val >= normalMin && val <= normalMax) color = '#2e7d32' // vert = normal
    opts.push({ label: String(val), color })
  }
  return opts
}

const VITALS = {
  temperature:  vitalOptions(25,  45,  0.1, 35.5, 37.5, 32,  40),
  heart_rate:   vitalOptions(20,  220, 1,   60,   100,  40,  150),
  sys:          vitalOptions(50,  250, 1,   90,   140,  70,  180),
  dia:          vitalOptions(30,  150, 1,   60,   90,   40,  110),
  spo2:         vitalOptions(50,  100, 1,   95,   100,  85,  100),
  glycemie:     vitalOptions(0.2, 6,   0.1, 0.7,  1.4,  0.5, 3),
  poids:        vitalOptions(1,   300, 1,   30,   200,  30,  200),
  taille:       vitalOptions(30,  300, 1,   100,  250,  100, 250),
  imc:          vitalOptions(8,   70,  0.1, 18.5, 25,   13,  50),
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
        // Créer un nouveau DMST si inexistant
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

  const handlePrint = () => {
    document.body.removeAttribute('data-print')
    window.print()
  }

  const handlePrintOrdonnance = () => {
    const dateStr = (getObs('ordonnance_date') || formData.observation_date)
      ? new Date(String(getObs('ordonnance_date') || formData.observation_date)).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')
    const logoUrl = window.location.origin + '/coly.png'
    const medicaments = (getObs('ordonnance_medicaments') as string || '').replace(/\n/g, '<br/>')

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Ordonnance</title>
  <style>
    @page { size: 148mm 210mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; width: 148mm; min-height: 210mm; }
    .ordonnance { width: 148mm; min-height: 210mm; background: white; padding: 8px; display: flex; flex-direction: column; font-size: 11px; }
    .header-table { width: 100%; border-collapse: collapse; border-bottom: 2.5px solid #2E75B6; margin-bottom: 6px; }
    .header-table td { vertical-align: middle; padding: 4px; }
    .td-logo { width: 55px; text-align: center; }
    .td-logo img { width: 52px; height: 52px; object-fit: contain; display: block; margin: auto; }
    .td-info { padding-left: 8px; }
    .cabinet-name { font-weight: bold; font-size: 11px; color: #1F4788; }
    .cabinet-sub { font-size: 7.5px; color: #333333; line-height: 1.6; }
    .td-date { text-align: right; vertical-align: middle; padding-right: 4px; white-space: nowrap; font-size: 9px; }
    .patient-fields { font-size: 9.5px; line-height: 1.9; padding: 0 2px; }
    .field-label { font-weight: bold; }
    .title-ordonnance { text-align: center; font-weight: bold; font-size: 16px; color: #1F4788; border: 2px solid #1F4788; background: #E8F0F8; padding: 4px 0 5px 0; margin: 8px 0 0 0; letter-spacing: 1px; }
    .prescription-area { flex: 1; min-height: 95mm; padding: 8px 4px; font-size: 10px; line-height: 1.7; white-space: pre-wrap; }
    .footer-table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    .footer-table td { vertical-align: bottom; padding: 2px; }
    .footer-note { font-size: 8.5px; font-style: italic; color: #666666; width: 60%; }
    .footer-sig { text-align: center; font-size: 9px; }
    .sig-box { border: 1px solid #aaa; height: 45px; width: 90%; margin: 0 auto 4px auto; }
    .sig-label { font-weight: bold; color: #1F4788; text-decoration: underline; }
  </style>
</head>
<body>
<div class="ordonnance">
  <table class="header-table">
    <tbody><tr>
      <td class="td-logo"><img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"></td>
      <td class="td-info">
        <div class="cabinet-name">CABINET MÉDICAL LIONEL</div>
        <div class="cabinet-sub">Autorisation n° : 26JUIL2022*022346<br>RC : SN.THS.2024.A.266<br>NINEA : 010949412</div>
      </td>
      <td class="td-date"><em>Le </em>${dateStr}</td>
    </tr></tbody>
  </table>
  <div class="patient-fields">
    <div><span class="field-label">Prénoms et Nom : </span>${dmst?.agent_name || ''}</div>
    <div>
      <span class="field-label">Matricule : </span>${dmst?.agent_matricule || ''}
      &nbsp;&nbsp;&nbsp;<span class="field-label">Age : </span>${dmst?.agent_age ? dmst.agent_age + ' ans' : ''}
      &nbsp;&nbsp;&nbsp;<span class="field-label">Poids : </span>${formData.weight ? formData.weight + ' kg' : ''}
    </div>
  </div>
  <div class="title-ordonnance">ORDONNANCE</div>
  <div class="prescription-area">
    ${medicaments}
  </div>
  <table class="footer-table">
    <tbody><tr>
      <td class="footer-note"><em>Veuillez ramener l'ordonnance à la prochaine visite</em></td>
      <td class="footer-sig">
        <div class="sig-box"></div>
        <span class="sig-label">Signature et cachet</span>
      </td>
    </tr></tbody>
  </table>
</div>
<script>window.onload = function(){ window.print(); window.onafterprint = function(){ window.close(); }; }</script>
</body></html>`

    const win = window.open('', '_blank', 'width=600,height=800')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  const handlePrintExamen = () => {
    const logoUrl = window.location.origin + '/coly.png'
    const dateStr = (getObs('examen_date') || formData.observation_date)
      ? new Date(String(getObs('examen_date') || formData.observation_date)).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')
    const nom = dmst?.agent_name?.split(' ').slice(-1)[0] || ''
    const prenom = dmst?.agent_name?.split(' ').slice(0, -1).join(' ') || ''
    const makeLines = (text: string, count: number) => {
      const lines = (text || '').split('\n').filter((l: string) => l.trim())
      while (lines.length < count) lines.push('')
      return lines.slice(0, count).map((l: string) => `<input class="content-line" type="text" value="${l.replace(/"/g, '&quot;')}" readonly>`).join('\n      ')
    }
    const examTypes = [
      obs.examen_biologie && 'Biologie / Analyses de sang',
      obs.examen_radiologie && 'Radiologie',
      obs.examen_ecg && 'ECG',
      obs.examen_spiro && 'Spirométrie',
      obs.examen_audiometrie && 'Audiométrie',
      obs.examen_acuite && 'Acuité visuelle',
    ].filter(Boolean).join(', ')
    const examText = [examTypes, getObs('examen_specifique') as string || ''].filter(Boolean).join('\n')

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin d'Examen - Cabinet Médical Lionel</title>
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
    .field-value { flex: 1; border-bottom: 1px dotted #CCCCCC; font-size: 9px; padding: 1px 2px; min-width: 0; }
    .content-section { margin-bottom: 12px; flex: 1; }
    .section-title { font-weight: bold; font-size: 9.5px; color: #1F4788; border-bottom: 1.5px solid #1F4788; padding-bottom: 3px; margin-bottom: 6px; }
    .content-lines { display: flex; flex-direction: column; gap: 6px; }
    .content-line { width: 100%; border: none; border-bottom: 1px dotted #CCCCCC; font-size: 9px; font-family: Arial, sans-serif; color: #222; background: transparent; padding: 3px 2px; min-height: 18px; outline: none; }
    .footer-section { border-top: 1px solid #CCCCCC; padding-top: 6px; margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; font-size: 9px; }
    .footer-prescripteur { text-align: center; font-weight: bold; color: #1F4788; text-decoration: underline; font-size: 9px; padding-top: 35px; }
  </style>
</head>
<body>
<div class="bulletin">
  <table class="header-table">
    <tbody><tr>
      <td class="td-logo"><img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"></td>
      <td class="td-info">
        <div class="cabinet-name">CABINET MÉDICAL LIONEL</div>
        <div class="cabinet-sub">Autorisation n° : 26JUIL2022*022346<br>RC : SN.THS.2024.A.266<br>NINEA : 010949412</div>
      </td>
      <td class="td-date"><em>Le </em>${dateStr}</td>
    </tr></tbody>
  </table>
  <div class="title-bulletin">BULLETIN D'EXAMEN</div>
  <div class="patient-section">
    <div class="field-row"><span class="field-label">Nom :</span><span class="field-value">${nom}</span></div>
    <div class="field-row"><span class="field-label">Prénom :</span><span class="field-value">${prenom}</span></div>
    <div class="field-row">
      <span class="field-label">Age :</span><span class="field-value" style="max-width:55px">${dmst?.agent_age ? dmst.agent_age + ' ans' : ''}</span>
      &nbsp;&nbsp;<span class="field-label">Sexe :</span><span class="field-value" style="max-width:55px">${obs.sex_m ? 'M' : obs.sex_f ? 'F' : ''}</span>
      &nbsp;&nbsp;<span class="field-label">Tél :</span><span class="field-value">${getObs('telephone') as string || ''}</span>
    </div>
  </div>
  <div class="content-section">
    <div class="section-title">1. Examen(s) demandé(s) :</div>
    <div class="content-lines">
      ${makeLines(examText, 5)}
    </div>
  </div>
  <div class="content-section">
    <div class="section-title">2. Renseignements cliniques :</div>
    <div class="content-lines">
      ${makeLines((getObs('examen_motif') as string || '') + (getObs('examen_observations') as string ? '\n' + getObs('examen_observations') : ''), 5)}
    </div>
  </div>
  <div class="footer-section">
    <div class="footer-date"><span class="field-label">Date : </span><span class="field-value" style="width:90px">${dateStr}</span></div>
    <div class="footer-prescripteur">Le Prescripteur</div>
  </div>
</div>
<script>window.onload=function(){ window.print(); window.onafterprint=function(){ window.close(); }; }</script>
</body></html>`

    const win = window.open('', '_blank', 'width=700,height=900')
    if (win) { win.document.write(html); win.document.close() }
  }

  const handlePrintBulletinAnalyses = () => {
    const chk = (key: string) => `<input type="checkbox" ${obs[key] ? 'checked' : ''} disabled>`
    const logoUrl = window.location.origin + '/coly.png'
    const dateStr = formData.observation_date
      ? new Date(String(formData.observation_date)).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')
    const nom = dmst?.agent_name?.split(' ').slice(-1)[0] || ''
    const prenom = dmst?.agent_name?.split(' ').slice(0, -1).join(' ') || ''

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Bulletin d'Analyses - Cabinet Médical Lionel</title>
  <style>
    @page { size: 148mm 210mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; width: 148mm; min-height: 210mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bulletin { width: 148mm; min-height: 210mm; background: white; padding: 8px; display: flex; flex-direction: column; font-size: 10px; }
    .header-table { width: 100%; border-collapse: collapse; border-bottom: 2.5px solid #2E75B6; margin-bottom: 5px; }
    .header-table td { vertical-align: middle; padding: 3px; }
    .td-logo { width: 52px; text-align: center; }
    .td-logo img { width: 50px; height: 50px; object-fit: contain; display: block; margin: auto; }
    .td-info { padding-left: 7px; }
    .cabinet-name { font-weight: bold; font-size: 11px; color: #1F4788; }
    .cabinet-sub { font-size: 7px; color: #333; line-height: 1.6; }
    .td-date { text-align: right; vertical-align: middle; padding-right: 3px; white-space: nowrap; font-size: 8.5px; }
    .td-date em { font-style: italic; }
    .title-bulletin { text-align: center; font-weight: bold; font-size: 13px; color: #1F4788; border: 2px solid #1F4788; background: #E8F0F8; padding: 3px 0 4px 0; margin-bottom: 5px; letter-spacing: 0.5px; }
    .patient-table { width: 100%; border-collapse: collapse; margin-bottom: 5px; font-size: 9px; border: 1px solid #ccc; }
    .patient-table td { padding: 3px 5px; border: 1px solid #ddd; }
    .patient-table .field-label { font-weight: bold; }
    .analyses-table { width: 100%; border-collapse: collapse; flex: 1; font-size: 8.5px; }
    .analyses-table td { border: 1px solid #ccc; padding: 3px 5px; vertical-align: top; }
    .section-header { font-weight: bold; font-size: 8px; color: white; padding: 2px 5px; margin-bottom: 2px; margin-top: 4px; display: block; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-header:first-child { margin-top: 0; }
    .bg-blue-dark { background-color: #1F4788; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bg-blue-mid  { background-color: #2E75B6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bg-red       { background-color: #C41E3A; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .bg-green     { background-color: #2E8B57; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .item { display: flex; align-items: center; padding: 1.5px 0; font-size: 8px; color: #222; gap: 4px; }
    .item input[type="checkbox"] { appearance: none; -webkit-appearance: none; width: 10px; height: 10px; border: 1.5px solid #555; border-radius: 1px; flex-shrink: 0; cursor: default; position: relative; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .item input[type="checkbox"]:checked { background: #1F4788; border-color: #1F4788; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .item input[type="checkbox"]:checked::after { content: ''; position: absolute; left: 1.5px; top: -1px; width: 4px; height: 7px; border: 2px solid white; border-top: none; border-left: none; transform: rotate(45deg); }
    .footer-prescripteur { text-align: right; font-size: 8px; color: #333; border-top: 1px solid #ccc; padding-top: 3px; margin-top: 5px; }
    .footer-prescripteur span { font-weight: bold; color: #1F4788; text-decoration: underline; }
    .prescripteur-box { height: 35px; }
  </style>
</head>
<body>
<div class="bulletin">
  <table class="header-table">
    <tbody><tr>
      <td class="td-logo"><img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"></td>
      <td class="td-info">
        <div class="cabinet-name">CABINET MÉDICAL LIONEL</div>
        <div class="cabinet-sub">Autorisation n° : 26JUIL2022*022346<br>RC : SN.THS.2024.A.266<br>NINEA : 010949412</div>
      </td>
      <td class="td-date"><em>Date : </em>${dateStr}</td>
    </tr></tbody>
  </table>

  <div class="title-bulletin">BULLETIN D'ANALYSES</div>

  <table class="patient-table">
    <tbody>
      <tr>
        <td colspan="2"><span class="field-label">Nom : </span>${nom}</td>
        <td colspan="2"><span class="field-label">Prénom : </span>${prenom}</td>
      </tr>
      <tr>
        <td colspan="2"><span class="field-label">Age : </span>${dmst?.agent_age ? dmst.agent_age + ' ans' : ''}&nbsp;&nbsp;<span class="field-label">Sexe : </span>${getObs('sexe') || ''}</td>
        <td colspan="2"><span class="field-label">Téléphone : </span>${getObs('telephone') || ''}</td>
      </tr>
    </tbody>
  </table>

  <table class="analyses-table">
    <tbody>
    <tr>
      <td style="width:33%">
        <span class="section-header bg-blue-dark">HÉMATOLOGIE</span>
        <div class="item">${chk('ba_nfs')} NFS</div>
        <div class="item">${chk('ba_taux_ret')} Taux Rét.</div>
        <div class="item">${chk('ba_te')} T E</div>
        <div class="item">${chk('ba_vs')} V S</div>
        <div class="item">${chk('ba_gs')} G S</div>
        <div class="item">${chk('ba_rhesus')} Rhesus</div>
        <div class="item">${chk('ba_abo')} ABO</div>
        <div class="item">${chk('ba_rai')} RAI</div>
        <span class="section-header bg-blue-dark">BIOCHIMIE</span>
        <div class="item">${chk('ba_gaj')} G A J</div>
        <div class="item">${chk('ba_gpp')} G P P</div>
        <div class="item">${chk('ba_hba1c')} HbA1c</div>
        <div class="item">${chk('ba_uree')} Urée</div>
        <div class="item">${chk('ba_creat')} Créat</div>
        <div class="item">${chk('ba_acide_urique')} Acide urique</div>
        <div class="item">${chk('ba_psa')} PSA</div>
        <div class="item">${chk('ba_afp')} AFP</div>
        <div class="item">${chk('ba_lipasemie')} Lipasémie</div>
        <div class="item">${chk('ba_electroph_pr')} Electroph. Pr</div>
        <div class="item">${chk('ba_electroph_hb')} Electroph. Hb</div>
        <div class="item">${chk('ba_tsh')} TSH &nbsp; ${chk('ba_t4')} T4</div>
        <div class="item">${chk('ba_pu24')} PU 24</div>
        <div class="item">${chk('ba_micro_albumin')} Micro-albuminurie</div>
      </td>
      <td style="width:34%">
        <span class="section-header bg-blue-dark">B. LIPIDIQUE</span>
        <div class="item">${chk('ba_ch_total')} Ch. total</div>
        <div class="item">${chk('ba_ch_hdl')} Ch. HDL</div>
        <div class="item">${chk('ba_ch_ldl')} Ch. LDL</div>
        <div class="item">${chk('ba_tgl')} TGL</div>
        <span class="section-header bg-blue-mid">IONOGRAMME SANGUIN</span>
        <div class="item">${chk('ba_na')} Na+</div>
        <div class="item">${chk('ba_k')} K+</div>
        <div class="item">${chk('ba_cl')} Cl-</div>
        <div class="item">${chk('ba_calcemie')} Calcémie</div>
        <div class="item">${chk('ba_phosphore')} Phosphore</div>
        <div class="item">${chk('ba_magnesemie')} Magnésémie</div>
        <div class="item">${chk('ba_bicarbonates')} Bicarbonates</div>
        <span class="section-header bg-blue-mid">F. HÉPATIQUE HÉMOSTASE</span>
        <div class="item">${chk('ba_bilirubine')} Bilirubine libre et conjuguée</div>
        <div class="item">${chk('ba_asat_alat')} ASAT ALAT</div>
        <div class="item">${chk('ba_pal')} PAL</div>
        <div class="item">${chk('ba_ggt')} GGT</div>
        <div class="item">${chk('ba_tp')} TP</div>
        <div class="item">${chk('ba_tck')} TCK</div>
        <div class="item">${chk('ba_inr')} INR</div>
        <div class="item">${chk('ba_fibrinogene')} Fibrinogène</div>
      </td>
      <td style="width:33%">
        <span class="section-header bg-red">SÉROLOGIE IMMUNOLOGIE</span>
        <div class="item">${chk('ba_aghbs')} AgHbs</div>
        <div class="item">${chk('ba_bhcg')} B-HCG Plasm.</div>
        <div class="item">${chk('ba_aslo')} ASLO</div>
        <div class="item">${chk('ba_fr')} F. Rhumatoïde</div>
        <div class="item">${chk('ba_widal')} Widal et Félix</div>
        <div class="item">${chk('ba_bw')} BW (TPHA-RPR)</div>
        <div class="item">${chk('ba_crp')} CRP</div>
        <div class="item">${chk('ba_waler_rose')} Waler Rose</div>
        <div class="item">${chk('ba_ac_anti_ccp')} Ac Anti CCP</div>
        <div class="item">${chk('ba_ac_anti_dna')} Ac Anti DNA natif</div>
        <span class="section-header bg-green">BACTÉRIOLOGIE PARASITOLOGIE</span>
        <div class="item">${chk('ba_hemoculture')} Hémoculture</div>
        <div class="item">${chk('ba_goutte_epaisse')} Goutte épaisse</div>
        <div class="item">${chk('ba_frottis')} Frottis sanguin</div>
        <div class="item">${chk('ba_ecbu')} ECBU</div>
        <div class="item">${chk('ba_addis')} Compte d'Addis</div>
        <div class="item">${chk('ba_coproculture')} Coproculture</div>
        <div class="item">${chk('ba_selles_kaop')} Selles KAOP</div>
        <div class="item">${chk('ba_crachats_baar')} Crachats BAAR</div>
      </td>
    </tr>
    <tr>
      <td colspan="3" style="border-top: 1px solid #ccc; padding-top: 4px;">
        <div class="prescripteur-box"></div>
        <div class="footer-prescripteur"><span>Le Prescripteur</span></div>
      </td>
    </tr>
    </tbody>
  </table>
</div>
<script>window.onload=function(){ window.print(); window.onafterprint=function(){ window.close(); }; }</script>
</body></html>`

    const win = window.open('', '_blank', 'width=700,height=900')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  const handlePrintCertificat = () => {
    const logoUrl = window.location.origin + '/coly.png'
    const dateStr = (getObs('cert_date') || formData.observation_date)
      ? new Date(String(getObs('cert_date') || formData.observation_date)).toLocaleDateString('fr-FR')
      : new Date().toLocaleDateString('fr-FR')
    const ville = getObs('cert_ville') as string || 'Dakar'
    const patientFullName = (getObs('cert_patient') as string || dmst?.agent_name || '').trim()
    const medecinName = getObs('cert_medecin') as string || formData.observer_name || ''
    const service = getObs('cert_service') as string || dmst?.agent_direction || ''
    const debut = getObs('cert_debut') as string || ''
    const arretChecked = getObsBool('cert_arret') ? 'checked' : ''
    const arretJours = getObs('cert_arret_jours') as string || ''
    const prolongChecked = getObsBool('cert_prolongation') ? 'checked' : ''
    const prolongJours = getObs('cert_prolongation_jours') as string || ''
    const repriseChecked = getObsBool('cert_reprise') ? 'checked' : ''
    const repriseDate = getObs('cert_reprise_date') as string || ''

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Certificat Médical - Cabinet Médical Lionel</title>
  <style>
    @page { size: 148mm 210mm; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; width: 148mm; min-height: 210mm; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .certificat { width: 148mm; min-height: 210mm; background: white; padding: 8px; display: flex; flex-direction: column; font-size: 10px; }
    .header-table { width: 100%; border-collapse: collapse; border-bottom: 2.5px solid #2E75B6; margin-bottom: 6px; }
    .header-table td { vertical-align: middle; padding: 3px; }
    .td-logo { width: 52px; text-align: center; }
    .td-logo img { width: 50px; height: 50px; object-fit: contain; display: block; margin: auto; }
    .td-info { padding-left: 7px; }
    .cabinet-name { font-weight: bold; font-size: 11px; color: #1F4788; }
    .cabinet-sub { font-size: 7px; color: #333; line-height: 1.6; }
    .td-date { text-align: right; vertical-align: middle; padding-right: 3px; white-space: nowrap; font-size: 8.5px; }
    .td-date em { font-style: italic; }
    .field-inline { border: none; border-bottom: 1px dotted #CCCCCC; outline: none; font-size: 8.5px; font-family: Arial, sans-serif; background: transparent; width: 80px; padding: 0 2px; }
    .title-certificat { text-align: center; font-weight: bold; font-size: 13px; color: #1F4788; border: 2px solid #1F4788; background: #E8F0F8; padding: 4px 0 5px 0; margin-top: 20px; margin-bottom: 14px; letter-spacing: 0.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .body-section { flex: 1; display: flex; flex-direction: column; gap: 10px; font-size: 9.5px; color: #222; padding: 0 2px; }
    .text-block { line-height: 1.8; }
    .field-label { font-weight: bold; }
    .field-input { border: none; border-bottom: 1px dotted #CCCCCC; outline: none; font-size: 9.5px; font-family: Arial, sans-serif; color: #222; background: transparent; padding: 1px 2px; }
    .field-input.wide { width: 100%; display: block; margin-top: 2px; }
    .field-input.medium { width: 140px; }
    .field-input.short { width: 70px; }
    .checkbox-section { background: #F5F5F5; border: 1px solid #ddd; padding: 8px 10px; display: flex; flex-direction: column; gap: 8px; font-size: 9.5px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .check-item { display: flex; align-items: baseline; gap: 6px; cursor: pointer; user-select: none; }
    .check-item input[type="checkbox"] { appearance: none; -webkit-appearance: none; width: 11px; height: 11px; border: 1.5px solid #555; border-radius: 1px; flex-shrink: 0; cursor: pointer; position: relative; background: white; margin-top: 1px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .check-item input[type="checkbox"]:checked { background: #1F4788; border-color: #1F4788; }
    .check-item input[type="checkbox"]:checked::after { content: ''; position: absolute; left: 1.5px; top: -1px; width: 4px; height: 7px; border: 2px solid white; border-top: none; border-left: none; transform: rotate(45deg); }
    .check-label { font-weight: bold; }
    .footer-section { border-top: 1px solid #CCCCCC; padding-top: 6px; margin-top: 10px; display: flex; justify-content: flex-end; }
    .footer-medecin { font-weight: bold; color: #1F4788; text-decoration: underline; font-size: 9px; padding-top: 35px; text-align: center; }
  </style>
</head>
<body>
<div class="certificat">
  <table class="header-table">
    <tbody><tr>
      <td class="td-logo"><img src="${logoUrl}" alt="Logo" onerror="this.style.display='none'"></td>
      <td class="td-info">
        <div class="cabinet-name">CABINET MÉDICAL LIONEL</div>
        <div class="cabinet-sub">Autorisation n° : 26JUIL2022*022346<br>RC : SN.THS.2024.A.266<br>NINEA : 010949412</div>
      </td>
      <td class="td-date">
        <em>Fait à </em><input class="field-inline" type="text" value="${ville}"><em>, le </em><input class="field-inline" type="text" value="${dateStr}">
      </td>
    </tr></tbody>
  </table>
  <div class="title-certificat">CERTIFICAT MÉDICAL</div>
  <div class="body-section">
    <div class="text-block">
      <span>Je soussigné, </span>
      <input class="field-input wide" type="text" value="${medecinName.replace(/"/g, '&quot;')}">
    </div>
    <div class="text-block">
      <span>certifie que la santé de <span class="field-label">M. / Mme / Mle</span> </span>
      <input class="field-input wide" type="text" value="${patientFullName.replace(/"/g, '&quot;')}">
    </div>
    <div class="text-block">
      <span class="field-label">Service : </span>
      <input class="field-input wide" type="text" value="${service.replace(/"/g, '&quot;')}">
    </div>
    <div class="text-block">
      <span>nécessite à compter du </span>
      <input class="field-input medium" type="text" value="${debut.replace(/"/g, '&quot;')}">
    </div>
    <div class="checkbox-section">
      <label class="check-item">
        <input type="checkbox" ${arretChecked}>
        <span><span class="check-label">Un arrêt de travail de </span><input class="field-input short" type="text" value="${arretJours.replace(/"/g, '&quot;')}"> <span class="check-label">jours.</span></span>
      </label>
      <label class="check-item">
        <input type="checkbox" ${prolongChecked}>
        <span><span class="check-label">Une prolongation d'arrêt de travail de </span><input class="field-input short" type="text" value="${prolongJours.replace(/"/g, '&quot;')}"> <span class="check-label">jours.</span></span>
      </label>
      <label class="check-item">
        <input type="checkbox" ${repriseChecked}>
        <span><span class="check-label">Une reprise de travail le </span><input class="field-input medium" type="text" value="${repriseDate.replace(/"/g, '&quot;')}"></span>
      </label>
    </div>
  </div>
  <div class="footer-section">
    <div class="footer-medecin">Le Médecin</div>
  </div>
</div>
<script>window.onload=function(){ window.print(); window.onafterprint=function(){ window.close(); }; }</script>
</body></html>`

    const win = window.open('', '_blank', 'width=700,height=900')
    if (win) { win.document.write(html); win.document.close() }
  }

  const exportSectionToPDF = async (sectionId: string, fileName: string) => {
    const printSection = document.getElementById(sectionId)
    if (!printSection) {
      showSnackbar(`Section d'impression introuvable`, 'error')
      return
    }
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
      await Promise.all(
        Array.from(images).map((img: Element) => {
          const i = img as HTMLImageElement
          if (i.complete && i.naturalHeight !== 0) return Promise.resolve()
          return new Promise((resolve) => {
            i.onload = () => resolve(null)
            i.onerror = () => resolve(null)
            setTimeout(() => resolve(null), 3000)
          })
        })
      )
    }
    await new Promise((r) => setTimeout(r, 300))
    const canvas = await html2canvas(printSection, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: printSection.offsetWidth,
      height: printSection.scrollHeight,
      allowTaint: false,
      onclone: (clonedDoc) => {
        const cloned = clonedDoc.getElementById(sectionId)
        if (cloned) {
          cloned.style.display = 'block'
          cloned.style.visibility = 'visible'
          cloned.style.width = `${widthPx}px`
          cloned.style.padding = `${paddingPx}px`
          cloned.style.backgroundColor = '#ffffff'
        }
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
    const actualWidthPx = widthPx * 2
    const pxToMm = pdfWidth / actualWidthPx
    const imgHeightMm = (canvas.height * pxToMm)
    if (imgHeightMm <= pdfHeight) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMm, undefined, 'FAST')
    } else {
      let remaining = imgHeightMm
      let sourceY = 0
      while (remaining > 0) {
        const pageH = Math.min(pdfHeight, remaining)
        const sourceH = (pageH / imgHeightMm) * canvas.height
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = Math.ceil(sourceH)
        const ctx = pageCanvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceH, 0, 0, canvas.width, sourceH)
          pdf.addImage(pageCanvas.toDataURL('image/png', 1.0), 'PNG', 0, 0, pdfWidth, pageH, undefined, 'FAST')
        }
        sourceY += sourceH
        remaining -= pageH
        if (remaining > 0) pdf.addPage()
      }
    }
    pdf.save(fileName)
    showSnackbar('PDF exporté avec succès', 'success')
  }

  const handleExportPDFOrdonnance = async () => {
    if (!dmst) return
    try {
      showSnackbar('Génération du PDF en cours...', 'success')
      await exportSectionToPDF(
        'print-section-ordonnance',
        `ordonnance_${dmst.agent_matricule}_${new Date().toISOString().split('T')[0]}.pdf`
      )
    } catch (e) {
      showSnackbar(`Erreur PDF: ${e instanceof Error ? e.message : 'Erreur'}`, 'error')
    }
  }

  const handleExportPDFExamen = async () => {
    if (!dmst) return
    try {
      showSnackbar('Génération du PDF en cours...', 'success')
      await exportSectionToPDF(
        'print-section-examen',
        `demande_examen_${dmst.agent_matricule}_${new Date().toISOString().split('T')[0]}.pdf`
      )
    } catch (e) {
      showSnackbar(`Erreur PDF: ${e instanceof Error ? e.message : 'Erreur'}`, 'error')
    }
  }

  const handleExportPDFBulletinAnalyses = async () => {
    if (!dmst) return
    try {
      showSnackbar('Génération du PDF en cours...', 'success')
      await exportSectionToPDF(
        'print-section-bulletin',
        `bulletin_analyses_${dmst.agent_matricule}_${new Date().toISOString().split('T')[0]}.pdf`
      )
    } catch (e) {
      showSnackbar(`Erreur PDF: ${e instanceof Error ? e.message : 'Erreur'}`, 'error')
    }
  }

  const handleExportPDF = async () => {
    if (!dmst) {
      showSnackbar('Aucun DMST disponible', 'error')
      return
    }
    
    try {
      showSnackbar('Génération du PDF en cours...', 'success')
      
      // Rendre la section d'impression visible temporairement
      const printSection = document.getElementById('print-section')
      if (!printSection) {
        showSnackbar('Section d\'impression introuvable', 'error')
        console.error('print-section element not found')
        return
      }

      // Sauvegarder les styles originaux
      const originalDisplay = window.getComputedStyle(printSection).display
      const originalPosition = window.getComputedStyle(printSection).position
      const originalLeft = window.getComputedStyle(printSection).left
      const originalTop = window.getComputedStyle(printSection).top
      const originalWidth = window.getComputedStyle(printSection).width
      const originalZIndex = window.getComputedStyle(printSection).zIndex

      // Afficher temporairement la section avec les EXACTES mêmes dimensions que l'impression
      // Convertir 210mm en pixels (1mm = 3.779527559 pixels à 96 DPI)
      const mmToPx = 3.779527559
      const widthPx = 210 * mmToPx
      const paddingPx = 20 * mmToPx
      
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

      // Attendre un peu pour que le rendu se fasse
      await new Promise(resolve => setTimeout(resolve, 100))

      // Attendre que les images se chargent
      const images = printSection.querySelectorAll('img')
      if (images.length > 0) {
        const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
          if (img.complete && img.naturalHeight !== 0) {
            return Promise.resolve()
          }
          return new Promise((resolve) => {
            img.onload = () => resolve(null)
            img.onerror = () => resolve(null)
            setTimeout(() => resolve(null), 3000) // Timeout après 3 secondes
          })
        })
        await Promise.all(imagePromises)
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('Capture de la section d\'impression...')
      
      // Attendre un peu plus pour que tout soit rendu
      await new Promise(resolve => setTimeout(resolve, 200))

      // Capturer la section avec html2canvas - EXACTEMENT comme l'impression
      const canvas = await html2canvas(printSection, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: printSection.offsetWidth,
        height: printSection.scrollHeight,
        allowTaint: false,
        removeContainer: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // S'assurer que tous les styles sont appliqués dans le clone EXACTEMENT comme l'impression
          const clonedSection = clonedDoc.getElementById('print-section')
          if (clonedSection) {
            clonedSection.style.display = 'block'
            clonedSection.style.visibility = 'visible'
            clonedSection.style.opacity = '1'
            clonedSection.style.width = `${widthPx}px`
            clonedSection.style.minWidth = `${widthPx}px`
            clonedSection.style.maxWidth = `${widthPx}px`
            clonedSection.style.padding = `${paddingPx}px`
            clonedSection.style.margin = '0'
            clonedSection.style.backgroundColor = '#ffffff'
            clonedSection.style.boxSizing = 'border-box'
            
            // S'assurer que toutes les images sont visibles
            const clonedImages = clonedSection.querySelectorAll('img')
            clonedImages.forEach((img: HTMLImageElement) => {
              img.style.display = 'block'
              img.style.visibility = 'visible'
              img.style.opacity = '1'
            })
          }
        },
      })

      console.log('Canvas créé:', canvas.width, 'x', canvas.height)

      // Restaurer les styles originaux
      printSection.style.display = originalDisplay
      printSection.style.position = originalPosition
      printSection.style.left = originalLeft
      printSection.style.top = originalTop
      printSection.style.width = originalWidth
      printSection.style.zIndex = originalZIndex

      // Créer le PDF avec les EXACTES mêmes dimensions que l'impression
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4',
        compress: false
      })
      const pdfWidth = pdf.internal.pageSize.getWidth() // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight() // 297mm
      
      // Le canvas a été créé avec scale 2, donc on doit diviser par 2 pour obtenir les dimensions réelles
      // La largeur du canvas correspond à 210mm (largeur A4)
      // Calculer le ratio de conversion pixel -> mm
      // widthPx = 210mm * mmToPx = largeur réelle en pixels
      const actualWidthPx = widthPx * 2 // scale 2
      const actualHeightPx = canvas.height
      
      // Ratio pour convertir pixels du canvas (avec scale 2) vers mm
      const pxToMm = pdfWidth / actualWidthPx
      
      // Dimensions de l'image en mm
      const imgWidthMm = actualWidthPx * pxToMm
      const imgHeightMm = actualHeightPx * pxToMm

      console.log('Dimensions PDF:', pdfWidth, 'x', pdfHeight, 'mm')
      console.log('Dimensions canvas (scale 2):', canvas.width, 'x', canvas.height, 'px')
      console.log('Dimensions réelles calculées:', imgWidthMm, 'x', imgHeightMm, 'mm')
      console.log('Ratio px->mm:', pxToMm)

      // Si le contenu dépasse une page, ajouter des pages supplémentaires
      let yPosition = 0
      const pageHeight = pdfHeight
      
      if (imgHeightMm <= pageHeight) {
        // Tout tient sur une page - utiliser les dimensions exactes
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm, undefined, 'FAST')
      } else {
        // Plusieurs pages nécessaires
        let remainingHeight = imgHeightMm
        let sourceY = 0
        
        while (remainingHeight > 0) {
          if (yPosition > 0) {
            pdf.addPage()
            yPosition = 0
          }
          
          const pageContentHeight = Math.min(pageHeight, remainingHeight)
          const sourceHeightPx = (pageContentHeight / imgHeightMm) * actualHeightPx
          
          // Créer un canvas temporaire pour cette page
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = Math.ceil(sourceHeightPx)
          const ctx = pageCanvas.getContext('2d')
          
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeightPx, 0, 0, canvas.width, sourceHeightPx)
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
            pdf.addImage(pageImgData, 'PNG', 0, yPosition, imgWidthMm, pageContentHeight, undefined, 'FAST')
          }
          
          sourceY += sourceHeightPx
          remainingHeight -= pageContentHeight
          yPosition += pageContentHeight
        }
      }

      // Sauvegarder le PDF
      const fileName = `fiche_observation_${dmst.agent_matricule}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      console.log('PDF sauvegardé:', fileName)
      showSnackbar('PDF exporté avec succès', 'success')
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      showSnackbar(`Erreur lors de l'export PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error')
    }
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
  // Pour la fiche d'observation, permettre l'édition si l'utilisateur a l'accès médical
  const canEditObservation = hasMedicalAccess

  // Helper pour la fiche d'observation complète (observation_form_data)
  const obs = (formData.observation_form_data || {}) as Record<string, unknown>
  const setObs = (key: string, value: unknown) =>
    setFormData((prev) => ({
      ...prev,
      observation_form_data: { ...(prev.observation_form_data || {}), [key]: value },
    }))
  const getObs = (key: string) => (obs[key] ?? '') as string
  const getObsBool = (key: string) => !!obs[key]
  const getObsNum = (key: string) => (obs[key] !== undefined && obs[key] !== '' ? String(obs[key]) : '')

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
                {tabValue === 1 && (
                  <>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ mr: 1 }}>
                      Imprimer
                    </Button>
                    <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDF} color="error">
                      Exporter PDF
                    </Button>
                  </>
                )}
                {tabValue === 2 && (
                  <>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintOrdonnance} sx={{ mr: 1 }}>
                      Imprimer l'ordonnance
                    </Button>
                    <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDFOrdonnance} color="error">
                      Exporter PDF
                    </Button>
                  </>
                )}
                {tabValue === 3 && (
                  <>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintExamen} sx={{ mr: 1 }}>
                      Imprimer la demande
                    </Button>
                    <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDFExamen} color="error">
                      Exporter PDF
                    </Button>
                  </>
                )}
                {tabValue === 4 && (
                  <>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintBulletinAnalyses} sx={{ mr: 1 }}>
                      Imprimer le bulletin
                    </Button>
                    <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDFBulletinAnalyses} color="error">
                      Exporter PDF
                    </Button>
                  </>
                )}
                {tabValue === 5 && (
                  <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintCertificat}>
                    Imprimer le certificat
                  </Button>
                )}
              </>
            )}
          </Box>
        )}
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} variant="scrollable" scrollButtons="auto">
          <Tab label={`Visites (${dmst.visits_count})`} icon={<MedicalServicesIcon />} iconPosition="start" />
          <Tab label="Fiche d'observation" icon={<MedicalServicesIcon />} iconPosition="start" />
          <Tab label="Ordonnance" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Demande d'examen" icon={<ScienceIcon />} iconPosition="start" />
          <Tab label="Bulletin d'analyses" icon={<ScienceIcon />} iconPosition="start" />
          <Tab label="Certificat médical" icon={<DescriptionIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                FICHE D'OBSERVATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL
              </Typography>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} sx={{ mt: 1, mb: 2 }}>
                <Typography variant="body2">Fait à Dakar, le</Typography>
                <TextField size="small" type="date" value={formData.observation_date || ''} onChange={(e) => setFormData({ ...formData, observation_date: e.target.value })} disabled={!editMode} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                <Typography variant="body2" sx={{ ml: 2 }}>Type de visite :</Typography>
                <FormControlLabel control={<Checkbox checked={getObsBool('visit_type_embauche')} onChange={(e) => setObs('visit_type_embauche', e.target.checked)} disabled={!editMode} />} label="Embauche" />
                <FormControlLabel control={<Checkbox checked={getObsBool('visit_type_periodique')} onChange={(e) => setObs('visit_type_periodique', e.target.checked)} disabled={!editMode} />} label="Périodique" />
                <FormControlLabel control={<Checkbox checked={getObsBool('visit_type_reprise')} onChange={(e) => setObs('visit_type_reprise', e.target.checked)} disabled={!editMode} />} label="Reprise" />
                <TextField size="small" label="Médecin du travail" value={formData.observer_name} onChange={(e) => setFormData({ ...formData, observer_name: e.target.value })} disabled={!editMode} sx={{ minWidth: 220, ml: 2 }} />
              </Box>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            {/* I. IDENTIFICATION DE L'AGENT */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>I. IDENTIFICATION DE L'AGENT</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nom et prénoms" value={dmst.agent_name} disabled InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label="Âge (ans)" value={dmst.agent_age ?? ''} disabled InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Box display="flex" alignItems="center" gap={1} pt={1}>
                <Typography variant="body2">Sexe :</Typography>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('sex_m')} onChange={(e) => { setObs('sex_m', e.target.checked); if (e.target.checked) setObs('sex_f', false) }} disabled={!editMode} />} label="M" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('sex_f')} onChange={(e) => { setObs('sex_f', e.target.checked); if (e.target.checked) setObs('sex_m', false) }} disabled={!editMode} />} label="F" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label="Matricule" value={dmst.agent_matricule} disabled InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Téléphone" value={getObs('telephone')} onChange={(e) => setObs('telephone', e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Direction" value={formData.observation_direction || dmst.agent_direction || ''} onChange={(e) => setFormData({ ...formData, observation_direction: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Site" value={formData.observation_site || dmst.agent_site_name || ''} onChange={(e) => setFormData({ ...formData, observation_site: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Fonction / Poste" value={formData.observation_function || dmst.agent_function || ''} onChange={(e) => setFormData({ ...formData, observation_function: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Ancienneté au poste (ans)" value={getObs('seniority_years')} onChange={(e) => setObs('seniority_years', e.target.value)} disabled={!editMode} />
            </Grid>

            {/* II. ANTÉCÉDENTS ET TERRAINS PARTICULIERS */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>II. ANTÉCÉDENTS ET TERRAINS PARTICULIERS</Typography></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Antécédents médicaux" multiline rows={2} value={formData.medical_antecedents} onChange={(e) => setFormData({ ...formData, medical_antecedents: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Antécédents chirurgicaux" multiline rows={2} value={formData.surgical_antecedents} onChange={(e) => setFormData({ ...formData, surgical_antecedents: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Habitudes de vie :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
                <FormControlLabel control={<Checkbox checked={formData.sport_activity} onChange={(e) => setFormData({ ...formData, sport_activity: e.target.checked })} disabled={!editMode} />} label="Activité sportive" />
                <FormControlLabel control={<Checkbox checked={formData.physical_activity} onChange={(e) => setFormData({ ...formData, physical_activity: e.target.checked })} disabled={!editMode} />} label="Activité physique régulière" />
                <FormControlLabel control={<Checkbox checked={formData.tobacco} onChange={(e) => setFormData({ ...formData, tobacco: e.target.checked })} disabled={!editMode} />} label="Tabac" />
                <TextField size="small" placeholder="/j" value={getObs('tobacco_per_day')} onChange={(e) => setObs('tobacco_per_day', e.target.value)} disabled={!editMode} sx={{ width: 60 }} />
                <FormControlLabel control={<Checkbox checked={formData.alcohol_obs} onChange={(e) => setFormData({ ...formData, alcohol_obs: e.target.checked })} disabled={!editMode} />} label="Alcool" />
                <FormControlLabel control={<Checkbox checked={formData.coffee} onChange={(e) => setFormData({ ...formData, coffee: e.target.checked })} disabled={!editMode} />} label="Café" />
                <FormControlLabel control={<Checkbox checked={formData.tea} onChange={(e) => setFormData({ ...formData, tea: e.target.checked })} disabled={!editMode} />} label="Thé" />
                <TextField size="small" label="Autres" value={getObs('habits_other')} onChange={(e) => setObs('habits_other', e.target.value)} disabled={!editMode} sx={{ minWidth: 180 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Accidents du travail / Maladies professionnelles (12 derniers mois) :</Typography>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('at_mp_no')} onChange={(e) => { setObs('at_mp_no', e.target.checked); if (e.target.checked) setObs('at_mp_yes', false) }} disabled={!editMode} />} label="Non" />
                <FormControlLabel control={<Checkbox checked={getObsBool('at_mp_yes')} onChange={(e) => { setObs('at_mp_yes', e.target.checked); if (e.target.checked) setObs('at_mp_no', false) }} disabled={!editMode} />} label="Oui → Nature :" />
                <TextField fullWidth size="small" value={formData.at_mp_nature} onChange={(e) => setFormData({ ...formData, at_mp_nature: e.target.value })} disabled={!editMode} sx={{ maxWidth: 400 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Entreprises / Postes antérieurs (expositions particulières)" multiline rows={3} value={formData.previous_companies} onChange={(e) => setFormData({ ...formData, previous_companies: e.target.value })} disabled={!editMode} />
            </Grid>

            {/* III. EXPOSITIONS PROFESSIONNELLES */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>III. EXPOSITIONS PROFESSIONNELLES</Typography></Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Risques physiques :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_bruit')} onChange={(e) => setObs('exp_phys_bruit', e.target.checked)} disabled={!editMode} />} label="Bruit (> 85 dB)" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_vibrations')} onChange={(e) => setObs('exp_phys_vibrations', e.target.checked)} disabled={!editMode} />} label="Vibrations" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_chaleur_froid')} onChange={(e) => setObs('exp_phys_chaleur_froid', e.target.checked)} disabled={!editMode} />} label="Chaleur / Froid" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_rayonnements')} onChange={(e) => setObs('exp_phys_rayonnements', e.target.checked)} disabled={!editMode} />} label="Rayonnements" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_ecran')} onChange={(e) => setObs('exp_phys_ecran', e.target.checked)} disabled={!editMode} />} label="Écran > 4h/j" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Risques chimiques et biologiques :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_poussieres')} onChange={(e) => setObs('exp_chim_poussieres', e.target.checked)} disabled={!editMode} />} label="Poussières" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_solvants')} onChange={(e) => setObs('exp_chim_solvants', e.target.checked)} disabled={!editMode} />} label="Solvants" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_cmr')} onChange={(e) => setObs('exp_chim_cmr', e.target.checked)} disabled={!editMode} />} label="CMR" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_biologiques')} onChange={(e) => setObs('exp_chim_biologiques', e.target.checked)} disabled={!editMode} />} label="Agents biologiques" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_gaz')} onChange={(e) => setObs('exp_chim_gaz', e.target.checked)} disabled={!editMode} />} label="Gaz / Fumées" />
              </Box>
              <TextField fullWidth size="small" label="Préciser" value={getObs('exp_chim_preciser')} onChange={(e) => setObs('exp_chim_preciser', e.target.value)} disabled={!editMode} sx={{ mt: 1 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Contraintes biomécaniques :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_bio_port_charges')} onChange={(e) => setObs('exp_bio_port_charges', e.target.checked)} disabled={!editMode} />} label="Port charges > 15 kg" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_bio_gestes_repetitifs')} onChange={(e) => setObs('exp_bio_gestes_repetitifs', e.target.checked)} disabled={!editMode} />} label="Gestes répétitifs" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_bio_postures')} onChange={(e) => setObs('exp_bio_postures', e.target.checked)} disabled={!editMode} />} label="Postures contraignantes" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_bio_station_debout')} onChange={(e) => setObs('exp_bio_station_debout', e.target.checked)} disabled={!editMode} />} label="Station debout prolongée" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Risques psychosociaux :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_stress')} onChange={(e) => setObs('exp_psy_stress', e.target.checked)} disabled={!editMode} />} label="Stress élevé" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_charge_mentale')} onChange={(e) => setObs('exp_psy_charge_mentale', e.target.checked)} disabled={!editMode} />} label="Charge mentale" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_isole')} onChange={(e) => setObs('exp_psy_isole', e.target.checked)} disabled={!editMode} />} label="Travail isolé" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_relations')} onChange={(e) => setObs('exp_psy_relations', e.target.checked)} disabled={!editMode} />} label="Relations difficiles" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_harcelement')} onChange={(e) => setObs('exp_psy_harcelement', e.target.checked)} disabled={!editMode} />} label="Harcèlement" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Organisation du travail :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_org_nuit')} onChange={(e) => setObs('exp_org_nuit', e.target.checked)} disabled={!editMode} />} label="Travail de nuit" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_org_poste')} onChange={(e) => setObs('exp_org_poste', e.target.checked)} disabled={!editMode} />} label="Travail posté (3×8)" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_org_irreguliers')} onChange={(e) => setObs('exp_org_irreguliers', e.target.checked)} disabled={!editMode} />} label="Horaires irréguliers" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_org_astreintes')} onChange={(e) => setObs('exp_org_astreintes', e.target.checked)} disabled={!editMode} />} label="Astreintes" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Équipements de protection (EPI) :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_gants')} onChange={(e) => setObs('epi_gants', e.target.checked)} disabled={!editMode} />} label="Gants" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_masque')} onChange={(e) => setObs('epi_masque', e.target.checked)} disabled={!editMode} />} label="Masque" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_lunettes')} onChange={(e) => setObs('epi_lunettes', e.target.checked)} disabled={!editMode} />} label="Lunettes" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_casque')} onChange={(e) => setObs('epi_casque', e.target.checked)} disabled={!editMode} />} label="Casque" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_auditif')} onChange={(e) => setObs('epi_auditif', e.target.checked)} disabled={!editMode} />} label="Protections auditives" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_chaussures')} onChange={(e) => setObs('epi_chaussures', e.target.checked)} disabled={!editMode} />} label="Chaussures sécurité" />
              </Box>
            </Grid>

            {/* IV. PLAINTES FONCTIONNELLES ACTUELLES */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>IV. PLAINTES FONCTIONNELLES ACTUELLES</Typography></Grid>
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={1}>
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_aucune')} onChange={(e) => setObs('plaintes_aucune', e.target.checked)} disabled={!editMode} />} label="Aucune plainte" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_symptomes')} onChange={(e) => setObs('plaintes_symptomes', e.target.checked)} disabled={!editMode} />} label="Présence de symptômes" />
              </Box>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_douleurs_ms')} onChange={(e) => setObs('plaintes_douleurs_ms', e.target.checked)} disabled={!editMode} />} label="Douleurs musculo-squelettiques" />
                <TextField size="small" label="Localisation" value={getObs('plaintes_douleurs_localisation')} onChange={(e) => setObs('plaintes_douleurs_localisation', e.target.value)} disabled={!editMode} sx={{ width: 200 }} />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_respiratoires')} onChange={(e) => setObs('plaintes_respiratoires', e.target.checked)} disabled={!editMode} />} label="Troubles respiratoires" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_cutanes')} onChange={(e) => setObs('plaintes_cutanes', e.target.checked)} disabled={!editMode} />} label="Troubles cutanés" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_orl')} onChange={(e) => setObs('plaintes_orl', e.target.checked)} disabled={!editMode} />} label="Troubles ORL / Oculaires" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_cephalees')} onChange={(e) => setObs('plaintes_cephalees', e.target.checked)} disabled={!editMode} />} label="Céphalées" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_vertiges')} onChange={(e) => setObs('plaintes_vertiges', e.target.checked)} disabled={!editMode} />} label="Vertiges" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_fatigue')} onChange={(e) => setObs('plaintes_fatigue', e.target.checked)} disabled={!editMode} />} label="Fatigue chronique" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_stress')} onChange={(e) => setObs('plaintes_stress', e.target.checked)} disabled={!editMode} />} label="Stress / Anxiété / Troubles du sommeil" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_digestifs')} onChange={(e) => setObs('plaintes_digestifs', e.target.checked)} disabled={!editMode} />} label="Troubles digestifs" />
              </Box>
              <TextField fullWidth label="Détails / Précisions" multiline rows={2} value={getObs('plaintes_details')} onChange={(e) => setObs('plaintes_details', e.target.value)} disabled={!editMode} sx={{ mt: 1 }} />
            </Grid>

            {/* V. ÉTAT GÉNÉRAL ET CONSTANTES */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>V. ÉTAT GÉNÉRAL ET CONSTANTES</Typography></Grid>
            {/* TA Systolique */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.sys}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={formData.blood_pressure_systolic || ''}
                onInputChange={(_, v) => setFormData(prev => ({ ...prev, blood_pressure_systolic: v }))}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="TA Sys (mmHg)" fullWidth />}
              />
            </Grid>
            {/* TA Diastolique */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.dia}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={formData.blood_pressure_diastolic || ''}
                onInputChange={(_, v) => setFormData(prev => ({ ...prev, blood_pressure_diastolic: v }))}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="TA Dia (mmHg)" fullWidth />}
              />
            </Grid>
            {/* Température */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.temperature}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={formData.temperature || ''}
                onInputChange={(_, v) => setFormData(prev => ({ ...prev, temperature: v }))}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="T° (°C)" fullWidth />}
              />
            </Grid>
            {/* Fréquence cardiaque */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.heart_rate}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={formData.heart_rate || ''}
                onInputChange={(_, v) => setFormData(prev => ({ ...prev, heart_rate: v }))}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="FC (bpm)" fullWidth />}
              />
            </Grid>
            {/* SpO₂ */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.spo2}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={String(getObs('spo2') || '')}
                onInputChange={(_, v) => setObs('spo2', v)}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="SpO₂ (%)" fullWidth />}
              />
            </Grid>
            {/* Dextro à jeun */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.glycemie}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={formData.dextro_jn || ''}
                onInputChange={(_, v) => setFormData(prev => ({ ...prev, dextro_jn: v }))}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="Dextro à jeun (g/L)" fullWidth />}
              />
            </Grid>
            {/* Dextro post-prandial */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.glycemie}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={formData.dextro_pp || ''}
                onInputChange={(_, v) => setFormData(prev => ({ ...prev, dextro_pp: v }))}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="Dextro post-prandial (g/L)" fullWidth />}
              />
            </Grid>
            {/* Poids */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.poids}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={formData.weight || ''}
                onInputChange={(_, v) => { setFormData(prev => { const next = { ...prev, weight: v }; if (v && prev.height) { const h = parseFloat(prev.height) / 100; const w = parseFloat(v); if (h > 0 && w > 0) next.bmi = (w / (h * h)).toFixed(2); } return next }) }}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="Poids (kg)" fullWidth />}
              />
            </Grid>
            {/* Taille */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.taille}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={formData.height || ''}
                onInputChange={(_, v) => { setFormData(prev => { const next = { ...prev, height: v }; if (v && prev.weight) { const h = parseFloat(v) / 100; const w = parseFloat(prev.weight); if (h > 0 && w > 0) next.bmi = (w / (h * h)).toFixed(2); } return next }) }}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="Taille (cm)" fullWidth />}
              />
            </Grid>
            {/* IMC — calculé automatiquement */}
            <Grid item xs={12} sm={2}>
              <Autocomplete
                freeSolo disableClearable disabled={!editMode}
                options={VITALS.imc}
                getOptionLabel={(o) => typeof o === 'string' ? o : o.label}
                value={formData.bmi || ''}
                onInputChange={(_, v) => setFormData(prev => ({ ...prev, bmi: v }))}
                renderOption={(props, o) => <li {...props} style={{ color: o.color, fontWeight: 600 }}>{o.label}</li>}
                renderInput={(params) => <TextField {...params} size="small" label="IMC (kg/m²)" fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="Tour de taille (cm)" value={getObs('tour_taille')} onChange={(e) => setObs('tour_taille', e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="Périmètre ombilical (cm)" value={getObs('perimetre_ombilical')} onChange={(e) => setObs('perimetre_ombilical', e.target.value)} disabled={!editMode} />
            </Grid>

            {/* TEST D'ACUITÉ VISUELLE */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>TEST D'ACUITÉ VISUELLE</Typography></Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 700 }}>
                <Table size="small">
                  <TableHead><TableRow><TableCell></TableCell><TableCell>Acuité OD</TableCell><TableCell>Acuité OG</TableCell><TableCell>Acuité binoculaire</TableCell></TableRow></TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>De loin :</TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_od_loin')} onChange={(e) => setObs('av_od_loin', e.target.value)} disabled={!editMode} /></TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_og_loin')} onChange={(e) => setObs('av_og_loin', e.target.value)} disabled={!editMode} /></TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_bin_loin')} onChange={(e) => setObs('av_bin_loin', e.target.value)} disabled={!editMode} /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>De près :</TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_od_pres')} onChange={(e) => setObs('av_od_pres', e.target.value)} disabled={!editMode} /></TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_og_pres')} onChange={(e) => setObs('av_og_pres', e.target.value)} disabled={!editMode} /></TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_bin_pres')} onChange={(e) => setObs('av_bin_pres', e.target.value)} disabled={!editMode} /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} sx={{ mt: 2 }}>
                <Typography variant="body2">Vision des couleurs :</Typography>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('vision_couleurs_normale')} onChange={(e) => setObs('vision_couleurs_normale', e.target.checked)} disabled={!editMode} />} label="Normale" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('vision_couleurs_daltonisme')} onChange={(e) => setObs('vision_couleurs_daltonisme', e.target.checked)} disabled={!editMode} />} label="Daltonisme" />
                <TextField size="small" placeholder="type" value={getObs('daltonisme_type')} onChange={(e) => setObs('daltonisme_type', e.target.value)} disabled={!editMode} sx={{ width: 120 }} />
                <Typography variant="body2" sx={{ ml: 2 }}>Port de lunettes / lentilles :</Typography>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('lunettes_non')} onChange={(e) => { setObs('lunettes_non', e.target.checked); if (e.target.checked) setObs('lunettes_oui', false) }} disabled={!editMode} />} label="Non" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('lunettes_oui')} onChange={(e) => { setObs('lunettes_oui', e.target.checked); if (e.target.checked) setObs('lunettes_non', false) }} disabled={!editMode} />} label="Oui" />
                <TextField size="small" label="Correction" value={getObs('lunettes_correction')} onChange={(e) => setObs('lunettes_correction', e.target.value)} disabled={!editMode} sx={{ width: 180 }} />
              </Box>
            </Grid>

            {/* VI. EXAMEN CLINIQUE */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>VI. EXAMEN CLINIQUE</Typography></Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>État général :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exam_etat_bon')} onChange={(e) => setObs('exam_etat_bon', e.target.checked)} disabled={!editMode} />} label="Bon" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exam_etat_moyen')} onChange={(e) => setObs('exam_etat_moyen', e.target.checked)} disabled={!editMode} />} label="Moyen" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exam_etat_altere')} onChange={(e) => setObs('exam_etat_altere', e.target.checked)} disabled={!editMode} />} label="Altéré" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Appareil cardiovasculaire :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_normal')} onChange={(e) => setObs('exam_cardio_normal', e.target.checked)} disabled={!editMode} />} label="Normal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_souffle')} onChange={(e) => setObs('exam_cardio_souffle', e.target.checked)} disabled={!editMode} />} label="Souffle cardiaque" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_arythmie')} onChange={(e) => setObs('exam_cardio_arythmie', e.target.checked)} disabled={!editMode} />} label="Arythmie" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_oedemes')} onChange={(e) => setObs('exam_cardio_oedemes', e.target.checked)} disabled={!editMode} />} label="Œdèmes MI" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_varices')} onChange={(e) => setObs('exam_cardio_varices', e.target.checked)} disabled={!editMode} />} label="Varices" />
                <TextField size="small" label="Précisions" value={getObs('exam_cardio_precision')} onChange={(e) => setObs('exam_cardio_precision', e.target.value)} disabled={!editMode} sx={{ minWidth: 200 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Appareil respiratoire :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_normal')} onChange={(e) => setObs('exam_respi_normal', e.target.checked)} disabled={!editMode} />} label="Normal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_sibilants')} onChange={(e) => setObs('exam_respi_sibilants', e.target.checked)} disabled={!editMode} />} label="Sibilants / Wheezing" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_crepitants')} onChange={(e) => setObs('exam_respi_crepitants', e.target.checked)} disabled={!editMode} />} label="Crépitants" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_dyspnee')} onChange={(e) => setObs('exam_respi_dyspnee', e.target.checked)} disabled={!editMode} />} label="Dyspnée" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_cyanose')} onChange={(e) => setObs('exam_respi_cyanose', e.target.checked)} disabled={!editMode} />} label="Cyanose" />
                <TextField size="small" label="Précisions" value={getObs('exam_respi_precision')} onChange={(e) => setObs('exam_respi_precision', e.target.value)} disabled={!editMode} sx={{ minWidth: 200 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Appareil locomoteur (TMS) :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_normal')} onChange={(e) => setObs('exam_loco_normal', e.target.checked)} disabled={!editMode} />} label="Mobilité normale, pas de douleur" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_cervical')} onChange={(e) => setObs('exam_loco_cervical', e.target.checked)} disabled={!editMode} />} label="Rachis cervical" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_dorsal')} onChange={(e) => setObs('exam_loco_dorsal', e.target.checked)} disabled={!editMode} />} label="Rachis dorsal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_lombaire')} onChange={(e) => setObs('exam_loco_lombaire', e.target.checked)} disabled={!editMode} />} label="Rachis lombaire" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_epaule')} onChange={(e) => setObs('exam_loco_epaule', e.target.checked)} disabled={!editMode} />} label="Épaule" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_coude')} onChange={(e) => setObs('exam_loco_coude', e.target.checked)} disabled={!editMode} />} label="Coude" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_poignet')} onChange={(e) => setObs('exam_loco_poignet', e.target.checked)} disabled={!editMode} />} label="Poignet/Main" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_hanche')} onChange={(e) => setObs('exam_loco_hanche', e.target.checked)} disabled={!editMode} />} label="Hanche" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_genou')} onChange={(e) => setObs('exam_loco_genou', e.target.checked)} disabled={!editMode} />} label="Genou" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_cheville')} onChange={(e) => setObs('exam_loco_cheville', e.target.checked)} disabled={!editMode} />} label="Cheville/Pied" />
              </Box>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Typography variant="body2">Tests TMS :</Typography>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_phalen')} onChange={(e) => setObs('exam_loco_phalen', e.target.checked)} disabled={!editMode} />} label="Phalen" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_tinel')} onChange={(e) => setObs('exam_loco_tinel', e.target.checked)} disabled={!editMode} />} label="Tinel" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_lasegue')} onChange={(e) => setObs('exam_loco_lasegue', e.target.checked)} disabled={!editMode} />} label="Lasègue" />
                <TextField size="small" label="Autres" value={getObs('exam_loco_autres')} onChange={(e) => setObs('exam_loco_autres', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Peau et phanères :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_normal')} onChange={(e) => setObs('exam_peau_normal', e.target.checked)} disabled={!editMode} />} label="Normale" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_eczema')} onChange={(e) => setObs('exam_peau_eczema', e.target.checked)} disabled={!editMode} />} label="Eczéma / Dermatite" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_lesions')} onChange={(e) => setObs('exam_peau_lesions', e.target.checked)} disabled={!editMode} />} label="Lésions" />
                <TextField size="small" placeholder="préciser" value={getObs('exam_peau_lesions_preciser')} onChange={(e) => setObs('exam_peau_lesions_preciser', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_prurit')} onChange={(e) => setObs('exam_peau_prurit', e.target.checked)} disabled={!editMode} />} label="Prurit / Sécheresse" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_paleur')} onChange={(e) => setObs('exam_peau_paleur', e.target.checked)} disabled={!editMode} />} label="Pâleur" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_ictere')} onChange={(e) => setObs('exam_peau_ictere', e.target.checked)} disabled={!editMode} />} label="Ictère" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Appareil ORL / Yeux :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_normal')} onChange={(e) => setObs('exam_orl_normal', e.target.checked)} disabled={!editMode} />} label="Normal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_irritation')} onChange={(e) => setObs('exam_orl_irritation', e.target.checked)} disabled={!editMode} />} label="Irritation oculaire" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_conjonctivite')} onChange={(e) => setObs('exam_orl_conjonctivite', e.target.checked)} disabled={!editMode} />} label="Conjonctivite" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_rhinite')} onChange={(e) => setObs('exam_orl_rhinite', e.target.checked)} disabled={!editMode} />} label="Rhinite" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_otite')} onChange={(e) => setObs('exam_orl_otite', e.target.checked)} disabled={!editMode} />} label="Otite / Bouchon cérumen" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_pharyngite')} onChange={(e) => setObs('exam_orl_pharyngite', e.target.checked)} disabled={!editMode} />} label="Pharyngite" />
                <TextField size="small" label="Autres" value={getObs('exam_orl_autres')} onChange={(e) => setObs('exam_orl_autres', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Abdomen :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_souple')} onChange={(e) => setObs('exam_abdomen_souple', e.target.checked)} disabled={!editMode} />} label="Souple, indolore" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_douleur')} onChange={(e) => setObs('exam_abdomen_douleur', e.target.checked)} disabled={!editMode} />} label="Douleur abdominale" />
                <TextField size="small" label="Localisation" value={getObs('exam_abdomen_localisation')} onChange={(e) => setObs('exam_abdomen_localisation', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_hepatomegalie')} onChange={(e) => setObs('exam_abdomen_hepatomegalie', e.target.checked)} disabled={!editMode} />} label="Hépatomégalie" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_masse')} onChange={(e) => setObs('exam_abdomen_masse', e.target.checked)} disabled={!editMode} />} label="Masse palpable" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_cicatrices')} onChange={(e) => setObs('exam_abdomen_cicatrices', e.target.checked)} disabled={!editMode} />} label="Cicatrices chirurgicales" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Système neurologique :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_normal')} onChange={(e) => setObs('exam_neuro_normal', e.target.checked)} disabled={!editMode} />} label="Normal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_paresthesies')} onChange={(e) => setObs('exam_neuro_paresthesies', e.target.checked)} disabled={!editMode} />} label="Paresthésies" />
                <TextField size="small" label="Localisation" value={getObs('exam_neuro_paresthesies_loc')} onChange={(e) => setObs('exam_neuro_paresthesies_loc', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_faiblesse')} onChange={(e) => setObs('exam_neuro_faiblesse', e.target.checked)} disabled={!editMode} />} label="Faiblesse musculaire" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_tremblements')} onChange={(e) => setObs('exam_neuro_tremblements', e.target.checked)} disabled={!editMode} />} label="Tremblements" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_equilibre')} onChange={(e) => setObs('exam_neuro_equilibre', e.target.checked)} disabled={!editMode} />} label="Troubles équilibre / coordination" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>État psychologique :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_normal')} onChange={(e) => setObs('exam_psy_normal', e.target.checked)} disabled={!editMode} />} label="Normal, contact adapté" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_anxiete')} onChange={(e) => setObs('exam_psy_anxiete', e.target.checked)} disabled={!editMode} />} label="Anxiété manifeste" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_depressif')} onChange={(e) => setObs('exam_psy_depressif', e.target.checked)} disabled={!editMode} />} label="Signes dépressifs" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_stress')} onChange={(e) => setObs('exam_psy_stress', e.target.checked)} disabled={!editMode} />} label="Stress élevé" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_fatigue')} onChange={(e) => setObs('exam_psy_fatigue', e.target.checked)} disabled={!editMode} />} label="Fatigue / Épuisement" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_burnout')} onChange={(e) => setObs('exam_psy_burnout', e.target.checked)} disabled={!editMode} />} label="Signes de burn-out" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Synthèse / Observations complémentaires" multiline rows={3} value={formData.clinical_exam} onChange={(e) => setFormData({ ...formData, clinical_exam: e.target.value })} disabled={!editMode} />
            </Grid>

            {/* VII. EXAMENS COMPLÉMENTAIRES */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>VII. EXAMENS COMPLÉMENTAIRES</Typography></Grid>
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_audiometrie')} onChange={(e) => setObs('comp_audiometrie', e.target.checked)} disabled={!editMode} />} label="Audiométrie tonale" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_spiro')} onChange={(e) => setObs('comp_spiro', e.target.checked)} disabled={!editMode} />} label="Spirométrie / EFR" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_ecg')} onChange={(e) => setObs('comp_ecg', e.target.checked)} disabled={!editMode} />} label="ECG" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_radio_thorax')} onChange={(e) => setObs('comp_radio_thorax', e.target.checked)} disabled={!editMode} />} label="Radiographie thoracique" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_acuite')} onChange={(e) => setObs('comp_acuite', e.target.checked)} disabled={!editMode} />} label="Acuité visuelle" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_vision_couleurs')} onChange={(e) => setObs('comp_vision_couleurs', e.target.checked)} disabled={!editMode} />} label="Vision des couleurs" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_bilan_sang')} onChange={(e) => setObs('comp_bilan_sang', e.target.checked)} disabled={!editMode} />} label="Bilan biologique sanguin" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_bilan_hepatique')} onChange={(e) => setObs('comp_bilan_hepatique', e.target.checked)} disabled={!editMode} />} label="Bilan hépatique" />
                <TextField size="small" label="Autres" value={getObs('comp_autres')} onChange={(e) => setObs('comp_autres', e.target.value)} disabled={!editMode} sx={{ minWidth: 200 }} />
              </Box>
              <TextField fullWidth label="Résultats et interprétation" multiline rows={3} value={getObs('comp_resultats')} onChange={(e) => setObs('comp_resultats', e.target.value)} disabled={!editMode} />
            </Grid>

            {/* VIII. CONCLUSION MÉDICALE */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>VIII. CONCLUSION MÉDICALE — AVIS D'APTITUDE</Typography></Grid>
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={2}>
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_apte} onChange={(e) => setFormData({ ...formData, medical_conclusion_apte: e.target.checked })} disabled={!editMode} />} label="APTE (sans restriction)" />
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_asr} onChange={(e) => setFormData({ ...formData, medical_conclusion_asr: e.target.checked })} disabled={!editMode} />} label="ASR (Apte avec Surveillance Renforcée)" />
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_aar} onChange={(e) => setFormData({ ...formData, medical_conclusion_aar: e.target.checked })} disabled={!editMode} />} label="AAR (Apte avec Aménagement / Restrictions)" />
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_int} onChange={(e) => setFormData({ ...formData, medical_conclusion_int: e.target.checked })} disabled={!editMode} />} label="INT (Inapte Temporaire)" />
                <TextField size="small" label="durée" value={getObs('int_duree')} onChange={(e) => setObs('int_duree', e.target.value)} disabled={!editMode} placeholder="durée" sx={{ width: 100 }} />
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_ind} onChange={(e) => setFormData({ ...formData, medical_conclusion_ind: e.target.checked })} disabled={!editMode} />} label="IND (Inapte Définitif)" />
              </Box>
              <TextField fullWidth label="Restrictions / Aménagements si AAR" multiline rows={2} value={getObs('conclusion_restrictions')} onChange={(e) => setObs('conclusion_restrictions', e.target.value)} disabled={!editMode} sx={{ mb: 2 }} />
              <TextField fullWidth label="Recommandations et mesures préventives" multiline rows={2} value={getObs('conclusion_recommendations')} onChange={(e) => setObs('conclusion_recommendations', e.target.value)} disabled={!editMode} />
            </Grid>

            {/* IX. ÉDUCATION THÉRAPEUTIQUE ET SENSIBILISATION */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>IX. ÉDUCATION THÉRAPEUTIQUE ET SENSIBILISATION</Typography></Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Thèmes abordés :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_mhd} onChange={(e) => setFormData({ ...formData, education_mhd: e.target.checked })} disabled={!editMode} />} label="MHD" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_mhv} onChange={(e) => setFormData({ ...formData, education_mhv: e.target.checked })} disabled={!editMode} />} label="MHV" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_fdr_cvx} onChange={(e) => setFormData({ ...formData, education_fdr_cvx: e.target.checked })} disabled={!editMode} />} label="FDR-CVx" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_ergo} onChange={(e) => setFormData({ ...formData, education_ergo: e.target.checked })} disabled={!editMode} />} label="Ergo" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_spb_psy} onChange={(e) => setFormData({ ...formData, education_spb_psy: e.target.checked })} disabled={!editMode} />} label="SPB&Psy" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_therapy} onChange={(e) => setFormData({ ...formData, education_therapy: e.target.checked })} disabled={!editMode} />} label="Thérapie / Suivi médical" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('education_epi')} onChange={(e) => setObs('education_epi', e.target.checked)} disabled={!editMode} />} label="Port des EPI" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('education_tms')} onChange={(e) => setObs('education_tms', e.target.checked)} disabled={!editMode} />} label="Prévention TMS" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('education_stress')} onChange={(e) => setObs('education_stress', e.target.checked)} disabled={!editMode} />} label="Gestion du stress" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('education_sommeil')} onChange={(e) => setObs('education_sommeil', e.target.checked)} disabled={!editMode} />} label="Hygiène du sommeil" />
                <TextField size="small" label="Autres" value={formData.education_other} onChange={(e) => setFormData({ ...formData, education_other: e.target.value })} disabled={!editMode} sx={{ minWidth: 180 }} />
              </Box>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
                <Typography variant="body2" fontWeight="bold">Date prochaine visite :</Typography>
                <TextField size="small" type="date" value={getObs('next_visit_date')} onChange={(e) => setObs('next_visit_date', e.target.value)} disabled={!editMode} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('next_visit_type_periodique')} onChange={(e) => setObs('next_visit_type_periodique', e.target.checked)} disabled={!editMode} />} label="Périodique" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('next_visit_type_surveillance')} onChange={(e) => setObs('next_visit_type_surveillance', e.target.checked)} disabled={!editMode} />} label="Surveillance renforcée" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('next_visit_type_specialisee')} onChange={(e) => setObs('next_visit_type_specialisee', e.target.checked)} disabled={!editMode} />} label="Spécialisée" />
              </Box>
            </Grid>

            {/* Signatures */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="LE MÉDECIN DU TRAVAIL — Signature et cachet" value={formData.observer_name} onChange={(e) => setFormData({ ...formData, observer_name: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Document confidentiel — Secret médical — Article L. 4624-1 du Code du Travail</Typography>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Ordonnance */}
        <TabPanel value={tabValue} index={2}>
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
                placeholder="Liste des médicaments avec posologie (ex : Paracétamol 1000mg - 3×/j pendant 5 jours)"
                value={getObs('ordonnance_medicaments')}
                onChange={(e) => setObs('ordonnance_medicaments', e.target.value)}
                disabled={!editMode}
              />
            </Grid>
          </Grid>
        </TabPanel>

        {/* Onglet Demande d'examen */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ maxWidth: '148mm', mx: 'auto', fontFamily: 'Arial, sans-serif', fontSize: '10px' }}>
            {/* EN-TÊTE */}
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
                  <TextField size="small" label="Date" type="date" value={getObs('examen_date') as string || formData.observation_date || ''} onChange={(e) => setObs('examen_date', e.target.value)} disabled={!editMode} InputLabelProps={{ shrink: true }} sx={{ width: '140px' }} />
                </td>
              </tr></tbody>
            </table>
            {/* TITRE */}
            <Box sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#1F4788', border: '2px solid #1F4788', background: '#E8F0F8', py: '4px', mt: '20px', mb: '12px', letterSpacing: '0.5px' }}>
              BULLETIN D&apos;EXAMEN
            </Box>
            {/* PATIENT */}
            <Box sx={{ border: '1px solid #ccc', p: '7px 9px', mb: '12px', fontSize: '9px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: '7px', gap: '4px' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap' }}>Nom :</Typography>
                <Typography sx={{ fontSize: '9px', borderBottom: '1px dotted #ccc', flex: 1 }}>{dmst.agent_name?.split(' ').slice(-1)[0] || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: '7px', gap: '4px' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap' }}>Prénom :</Typography>
                <Typography sx={{ fontSize: '9px', borderBottom: '1px dotted #ccc', flex: 1 }}>{dmst.agent_name?.split(' ').slice(0, -1).join(' ') || ''}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap' }}>Age :</Typography>
                <Typography sx={{ fontSize: '9px', borderBottom: '1px dotted #ccc', width: '55px' }}>{dmst.agent_age ? `${dmst.agent_age} ans` : ''}</Typography>
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap', ml: 1 }}>Sexe :</Typography>
                <FormControlLabel sx={{ mx: 0 }} control={<Checkbox size="small" checked={getObsBool('sex_m')} onChange={(e) => setObs('sex_m', e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '9px' }}>M</Typography>} />
                <FormControlLabel sx={{ mx: 0 }} control={<Checkbox size="small" checked={getObsBool('sex_f')} onChange={(e) => setObs('sex_f', e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '9px' }}>F</Typography>} />
                <Typography sx={{ fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap', ml: 1 }}>Tél :</Typography>
                <TextField size="small" value={getObs('telephone') as string || ''} onChange={(e) => setObs('telephone', e.target.value)} disabled={!editMode} sx={{ flex: 1 }} inputProps={{ style: { fontSize: '9px', padding: '2px 4px' } }} variant="standard" />
              </Box>
            </Box>
            {/* SECTION 1 */}
            <Box sx={{ mb: '12px' }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '9.5px', color: '#1F4788', borderBottom: '1.5px solid #1F4788', pb: '3px', mb: '6px' }}>1. Examen(s) demandé(s) :</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {[['examen_biologie','Biologie'],['examen_radiologie','Radiologie'],['examen_ecg','ECG'],['examen_spiro','Spirométrie'],['examen_audiometrie','Audiométrie'],['examen_acuite','Acuité visuelle']].map(([k,l]) => (
                  <FormControlLabel key={k} sx={{ my: 0 }} control={<Checkbox size="small" checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '9px' }}>{l}</Typography>} />
                ))}
              </Box>
              <TextField fullWidth multiline rows={3} placeholder="Examens spécifiques..." value={getObs('examen_specifique') as string || ''} onChange={(e) => setObs('examen_specifique', e.target.value)} disabled={!editMode} size="small" inputProps={{ style: { fontSize: '9px' } }} />
            </Box>
            {/* SECTION 2 */}
            <Box sx={{ mb: '12px' }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '9.5px', color: '#1F4788', borderBottom: '1.5px solid #1F4788', pb: '3px', mb: '6px' }}>2. Renseignements cliniques :</Typography>
              <TextField fullWidth multiline rows={3} value={getObs('examen_motif') as string || ''} onChange={(e) => setObs('examen_motif', e.target.value)} disabled={!editMode} size="small" inputProps={{ style: { fontSize: '9px' } }} sx={{ mb: 1 }} />
              <TextField fullWidth multiline rows={2} placeholder="Observations cliniques..." value={getObs('examen_observations') as string || ''} onChange={(e) => setObs('examen_observations', e.target.value)} disabled={!editMode} size="small" inputProps={{ style: { fontSize: '9px' } }} />
            </Box>
            {/* PIED */}
            <Box sx={{ borderTop: '1px solid #ccc', pt: '6px', mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <Typography sx={{ fontSize: '9px', fontWeight: 'bold' }}>Date : {(getObs('examen_date') || formData.observation_date) ? new Date(String(getObs('examen_date') || formData.observation_date)).toLocaleDateString('fr-FR') : ''}</Typography>
              <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: '#1F4788', textDecoration: 'underline', pt: '35px' }}>Le Prescripteur</Typography>
            </Box>
          </Box>
        </TabPanel>

        {/* Onglet Bulletin d'analyses */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ maxWidth: '148mm', mx: 'auto', fontFamily: 'Arial, sans-serif', fontSize: '10px' }}>
            {/* EN-TÊTE */}
            <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2.5px solid #2E75B6', marginBottom: '5px' }}>
              <tbody><tr>
                <td style={{ width: '52px', textAlign: 'center', padding: '3px', verticalAlign: 'middle' }}>
                  <img src="/coly.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain', display: 'block', margin: 'auto' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                </td>
                <td style={{ paddingLeft: '7px', verticalAlign: 'middle' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1F4788' }}>CABINET MÉDICAL LIONEL</div>
                  <div style={{ fontSize: '7px', color: '#333', lineHeight: 1.6 }}>Autorisation n° : 26JUIL2022*022346<br />RC : SN.THS.2024.A.266<br />NINEA : 010949412</div>
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '3px' }}>
                  <TextField size="small" label="Date" type="date" value={getObs('ba_date') as string || formData.observation_date || ''} onChange={(e) => setObs('ba_date', e.target.value)} disabled={!editMode} InputLabelProps={{ shrink: true }} sx={{ width: '140px' }} />
                </td>
              </tr></tbody>
            </table>
            {/* TITRE */}
            <Box sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#1F4788', border: '2px solid #1F4788', background: '#E8F0F8', py: '3px', mb: '5px', letterSpacing: '0.5px' }}>
              BULLETIN D&apos;ANALYSES
            </Box>
            {/* PATIENT */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px', fontSize: '9px', border: '1px solid #ccc' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}><strong>Nom : </strong>{dmst.agent_name?.split(' ').slice(-1)[0] || ''}</td>
                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}><strong>Prénom : </strong>{dmst.agent_name?.split(' ').slice(0, -1).join(' ') || ''}</td>
                </tr>
                <tr>
                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>
                    <strong>Age : </strong>{dmst.agent_age ? `${dmst.agent_age} ans` : ''}&nbsp;&nbsp;
                    <strong>Sexe : </strong>
                    <FormControlLabel sx={{ mx: 0 }} control={<Checkbox size="small" checked={getObsBool('sex_m')} onChange={(e) => setObs('sex_m', e.target.checked)} disabled={!editMode} />} label="M" />
                    <FormControlLabel sx={{ mx: 0 }} control={<Checkbox size="small" checked={getObsBool('sex_f')} onChange={(e) => setObs('sex_f', e.target.checked)} disabled={!editMode} />} label="F" />
                  </td>
                  <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}>
                    <TextField size="small" label="Téléphone" value={getObs('telephone') as string || ''} onChange={(e) => setObs('telephone', e.target.value)} disabled={!editMode} sx={{ width: '160px' }} inputProps={{ style: { fontSize: '8px', padding: '3px 6px' } }} InputLabelProps={{ style: { fontSize: '8px' } }} />
                  </td>
                </tr>
              </tbody>
            </table>
            {/* TABLEAU ANALYSES */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8.5px' }}>
              <tbody>
                <tr>
                  {/* COL 1 */}
                  <td style={{ border: '1px solid #ccc', padding: '3px 5px', verticalAlign: 'top', width: '33%' }}>
                    <Box sx={{ background: '#1F4788', color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mb: '2px', textAlign: 'center' }}>HÉMATOLOGIE</Box>
                    {[['ba_nfs','NFS'],['ba_taux_ret','Taux Rét.'],['ba_te','T E'],['ba_vs','V S'],['ba_gs','G S'],['ba_rhesus','Rhesus'],['ba_abo','ABO'],['ba_rai','RAI']].map(([k,l]) => (
                      <FormControlLabel key={k} sx={{ display: 'flex', ml: 0, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>{l}</Typography>} />
                    ))}
                    <Box sx={{ background: '#1F4788', color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mt: '4px', mb: '2px', textAlign: 'center' }}>BIOCHIMIE</Box>
                    {[['ba_gaj','G A J'],['ba_gpp','G P P'],['ba_hba1c','HbA1c'],['ba_uree','Urée'],['ba_creat','Créat'],['ba_acide_urique','Acide urique'],['ba_psa','PSA'],['ba_afp','AFP'],['ba_lipasemie','Lipasémie'],['ba_electroph_pr','Electroph. Pr'],['ba_electroph_hb','Electroph. Hb']].map(([k,l]) => (
                      <FormControlLabel key={k} sx={{ display: 'flex', ml: 0, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>{l}</Typography>} />
                    ))}
                    <Box sx={{ display: 'flex' }}>
                      <FormControlLabel sx={{ ml: 0, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool('ba_tsh')} onChange={(e) => setObs('ba_tsh', e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>TSH</Typography>} />
                      <FormControlLabel sx={{ ml: 1, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool('ba_t4')} onChange={(e) => setObs('ba_t4', e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>T4</Typography>} />
                    </Box>
                    {[['ba_pu24','PU 24'],['ba_micro_albumin','Micro-albuminurie']].map(([k,l]) => (
                      <FormControlLabel key={k} sx={{ display: 'flex', ml: 0, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>{l}</Typography>} />
                    ))}
                  </td>
                  {/* COL 2 */}
                  <td style={{ border: '1px solid #ccc', padding: '3px 5px', verticalAlign: 'top', width: '34%' }}>
                    <Box sx={{ background: '#1F4788', color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mb: '2px', textAlign: 'center' }}>B. LIPIDIQUE</Box>
                    {[['ba_ch_total','Ch. total'],['ba_ch_hdl','Ch. HDL'],['ba_ch_ldl','Ch. LDL'],['ba_tgl','TGL']].map(([k,l]) => (
                      <FormControlLabel key={k} sx={{ display: 'flex', ml: 0, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>{l}</Typography>} />
                    ))}
                    <Box sx={{ background: '#2E75B6', color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mt: '4px', mb: '2px', textAlign: 'center' }}>IONOGRAMME SANGUIN</Box>
                    {[['ba_na','Na+'],['ba_k','K+'],['ba_cl','Cl-'],['ba_calcemie','Calcémie'],['ba_phosphore','Phosphore'],['ba_magnesemie','Magnésémie'],['ba_bicarbonates','Bicarbonates']].map(([k,l]) => (
                      <FormControlLabel key={k} sx={{ display: 'flex', ml: 0, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>{l}</Typography>} />
                    ))}
                    <Box sx={{ background: '#2E75B6', color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mt: '4px', mb: '2px', textAlign: 'center' }}>F. HÉPATIQUE HÉMOSTASE</Box>
                    {[['ba_bilirubine','Bilirubine libre et conjuguée'],['ba_asat_alat','ASAT ALAT'],['ba_pal','PAL'],['ba_ggt','GGT'],['ba_tp','TP'],['ba_tck','TCK'],['ba_inr','INR'],['ba_fibrinogene','Fibrinogène']].map(([k,l]) => (
                      <FormControlLabel key={k} sx={{ display: 'flex', ml: 0, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>{l}</Typography>} />
                    ))}
                  </td>
                  {/* COL 3 */}
                  <td style={{ border: '1px solid #ccc', padding: '3px 5px', verticalAlign: 'top', width: '33%' }}>
                    <Box sx={{ background: '#C41E3A', color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mb: '2px', textAlign: 'center' }}>SÉROLOGIE IMMUNOLOGIE</Box>
                    {[['ba_aghbs','AgHbs'],['ba_bhcg','B-HCG Plasm.'],['ba_aslo','ASLO'],['ba_fr','F. Rhumatoïde'],['ba_widal','Widal et Félix'],['ba_bw','BW (TPHA-RPR)'],['ba_crp','CRP'],['ba_waler_rose','Waler Rose'],['ba_ac_anti_ccp','Ac Anti CCP'],['ba_ac_anti_dna','Ac Anti DNA natif']].map(([k,l]) => (
                      <FormControlLabel key={k} sx={{ display: 'flex', ml: 0, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>{l}</Typography>} />
                    ))}
                    <Box sx={{ background: '#2E8B57', color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mt: '4px', mb: '2px', textAlign: 'center' }}>BACTÉRIOLOGIE PARASITOLOGIE</Box>
                    {[['ba_hemoculture','Hémoculture'],['ba_goutte_epaisse','Goutte épaisse'],['ba_frottis','Frottis sanguin'],['ba_ecbu','ECBU'],['ba_addis',"Compte d'Addis"],['ba_coproculture','Coproculture'],['ba_selles_kaop','Selles KAOP'],['ba_crachats_baar','Crachats BAAR']].map(([k,l]) => (
                      <FormControlLabel key={k} sx={{ display: 'flex', ml: 0, my: 0, height: '20px' }} control={<Checkbox size="small" sx={{ p: '1px' }} checked={getObsBool(k)} onChange={(e) => setObs(k, e.target.checked)} disabled={!editMode} />} label={<Typography sx={{ fontSize: '8px' }}>{l}</Typography>} />
                    ))}
                  </td>
                </tr>
                <tr>
                  <td colSpan={3} style={{ border: '1px solid #ccc', padding: '4px 5px' }}>
                    <Box sx={{ height: '35px' }} />
                    <Typography sx={{ textAlign: 'right', fontSize: '8px', color: '#1F4788', fontWeight: 'bold', textDecoration: 'underline' }}>Le Prescripteur</Typography>
                  </td>
                </tr>
              </tbody>
            </table>
          </Box>
        </TabPanel>

        {/* Onglet Certificat médical */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ maxWidth: '560px', mx: 'auto' }}>
            <Grid container spacing={2}>
              {/* Date et ville */}
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Ville" value={getObs('cert_ville') as string || 'Dakar'} onChange={(e) => setObs('cert_ville', e.target.value)} disabled={!editMode} />
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth size="small" label="Date" type="date" value={getObs('cert_date') as string || formData.observation_date || ''} onChange={(e) => setObs('cert_date', e.target.value)} disabled={!editMode} InputLabelProps={{ shrink: true }} />
              </Grid>
              {/* Médecin */}
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Je soussigné (nom du médecin)" value={getObs('cert_medecin') as string || formData.observer_name || ''} onChange={(e) => setObs('cert_medecin', e.target.value)} disabled={!editMode} />
              </Grid>
              {/* Patient */}
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Nom complet du patient (M. / Mme / Mle)" value={getObs('cert_patient') as string || dmst.agent_name || ''} onChange={(e) => setObs('cert_patient', e.target.value)} disabled={!editMode} />
              </Grid>
              {/* Service */}
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Service" value={getObs('cert_service') as string || dmst.agent_direction || ''} onChange={(e) => setObs('cert_service', e.target.value)} disabled={!editMode} />
              </Grid>
              {/* Début */}
              <Grid item xs={12}>
                <TextField fullWidth size="small" label="Nécessite à compter du" value={getObs('cert_debut') as string || ''} onChange={(e) => setObs('cert_debut', e.target.value)} disabled={!editMode} placeholder="ex: 01/01/2025" />
              </Grid>
              {/* Cases à cocher */}
              <Grid item xs={12}>
                <Box sx={{ background: '#F5F5F5', border: '1px solid #ddd', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                      control={<Checkbox size="small" checked={getObsBool('cert_arret')} onChange={(e) => setObs('cert_arret', e.target.checked)} disabled={!editMode} />}
                      label={<Typography sx={{ fontWeight: 'bold', fontSize: '13px' }}>Un arrêt de travail de</Typography>}
                      sx={{ mr: 0 }}
                    />
                    <TextField size="small" sx={{ width: '80px' }} value={getObs('cert_arret_jours') as string || ''} onChange={(e) => setObs('cert_arret_jours', e.target.value)} disabled={!editMode} placeholder="nbr" inputProps={{ style: { textAlign: 'center' } }} />
                    <Typography sx={{ fontWeight: 'bold' }}>jours.</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                      control={<Checkbox size="small" checked={getObsBool('cert_prolongation')} onChange={(e) => setObs('cert_prolongation', e.target.checked)} disabled={!editMode} />}
                      label={<Typography sx={{ fontWeight: 'bold', fontSize: '13px' }}>Une prolongation d'arrêt de travail de</Typography>}
                      sx={{ mr: 0 }}
                    />
                    <TextField size="small" sx={{ width: '80px' }} value={getObs('cert_prolongation_jours') as string || ''} onChange={(e) => setObs('cert_prolongation_jours', e.target.value)} disabled={!editMode} placeholder="nbr" inputProps={{ style: { textAlign: 'center' } }} />
                    <Typography sx={{ fontWeight: 'bold' }}>jours.</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControlLabel
                      control={<Checkbox size="small" checked={getObsBool('cert_reprise')} onChange={(e) => setObs('cert_reprise', e.target.checked)} disabled={!editMode} />}
                      label={<Typography sx={{ fontWeight: 'bold', fontSize: '13px' }}>Une reprise de travail le</Typography>}
                      sx={{ mr: 0 }}
                    />
                    <TextField size="small" sx={{ width: '140px' }} value={getObs('cert_reprise_date') as string || ''} onChange={(e) => setObs('cert_reprise_date', e.target.value)} disabled={!editMode} placeholder="date" />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>
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
        </TabPanel>

      </Paper>

      {/* Dialog Programmer une visite */}
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

      {/* Section d'impression cachée */}
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
        
        {/* EN-TÊTE style bulletin */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2.5px solid #2E75B6', marginBottom: '10px' }}>
          <tbody><tr>
            <td style={{ width: '52px', textAlign: 'center', padding: '3px', verticalAlign: 'middle' }}>
              <img src="/coly.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain', display: 'block', margin: 'auto' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </td>
            <td style={{ paddingLeft: '7px', verticalAlign: 'middle' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1F4788' }}>CABINET MÉDICAL LIONEL</div>
              <div style={{ fontSize: '7px', color: '#333', lineHeight: 1.6 }}>Autorisation n° : 26JUIL2022*022346<br />RC : SN.THS.2024.A.266<br />NINEA : 010949412</div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '3px', whiteSpace: 'nowrap', fontSize: '8.5px' }}>
              <em>Le </em>{formData.observation_date ? new Date(formData.observation_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}
            </td>
          </tr></tbody>
        </table>
        {/* TITRE */}
        <Box sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#1F4788', border: '2px solid #1F4788', background: '#E8F0F8', py: '4px', mt: '20px', mb: '12px', letterSpacing: '0.5px' }}>
          FICHE D'OBSERVATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL
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

      {/* Section d'impression Ordonnance — format ordonnance.html */}
      <Box
        id="print-section-ordonnance"
        className="print-section"
        sx={{
          display: 'none',
          width: '148mm',
          minHeight: '210mm',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '11px',
          flexDirection: 'column',
          p: '8px',
          '@media print': {
            display: 'flex !important',
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 9999,
          },
        }}
      >
        {/* EN-TÊTE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2.5px solid #2E75B6', marginBottom: '6px' }}>
          <tbody>
            <tr>
              <td style={{ width: '55px', textAlign: 'center', padding: '4px', verticalAlign: 'middle' }}>
                <img src="/coly.png" alt="Logo" style={{ width: '52px', height: '52px', objectFit: 'contain', display: 'block', margin: 'auto' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </td>
              <td style={{ paddingLeft: '8px', verticalAlign: 'middle' }}>
                <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1F4788' }}>CABINET MÉDICAL LIONEL</div>
                <div style={{ fontSize: '7.5px', color: '#333333', lineHeight: 1.6 }}>
                  Autorisation n° : 26JUIL2022*022346<br />
                  RC : SN.THS.2024.A.266<br />
                  NINEA : 010949412
                </div>
              </td>
              <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '4px', whiteSpace: 'nowrap', fontSize: '9px' }}>
                <em>Le </em>
                {(getObs('ordonnance_date') || formData.observation_date)
                  ? new Date(String(getObs('ordonnance_date') || formData.observation_date)).toLocaleDateString('fr-FR')
                  : new Date().toLocaleDateString('fr-FR')}
              </td>
            </tr>
          </tbody>
        </table>

        {/* CHAMPS PATIENT */}
        <div style={{ fontSize: '9.5px', lineHeight: 1.9, padding: '0 2px' }}>
          <div><strong>Prénoms et Nom : </strong>{dmst.agent_name || <span style={{ color: '#CCCCCC' }}>{'......................................................'}</span>}</div>
          <div>
            <strong>Matricule : </strong>{dmst.agent_matricule || <span style={{ color: '#CCCCCC' }}>{'...................'}</span>}
            &nbsp;&nbsp;&nbsp;<strong>Age : </strong>{dmst.agent_age ? `${dmst.agent_age} ans` : <span style={{ color: '#CCCCCC' }}>{'............'}</span>}
            &nbsp;&nbsp;&nbsp;<strong>Poids : </strong>{formData.weight ? `${formData.weight} kg` : <span style={{ color: '#CCCCCC' }}>{'............'}</span>}
          </div>
        </div>

        {/* TITRE ORDONNANCE */}
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '16px', color: '#1F4788', border: '2px solid #1F4788', background: '#E8F0F8', padding: '4px 0 5px 0', margin: '8px 0 0 0', letterSpacing: '1px' }}>
          ORDONNANCE
        </div>

        {/* ZONE PRESCRIPTION */}
        <div style={{ flex: 1, minHeight: '95mm', padding: '8px 4px', whiteSpace: 'pre-wrap', fontSize: '10px', lineHeight: 1.7 }}>
          {getObs('ordonnance_medicaments') || ''}
        </div>

        {/* PIED DE PAGE */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '6px' }}>
          <tbody>
            <tr>
              <td style={{ verticalAlign: 'bottom', padding: '2px', width: '60%', fontSize: '8.5px', fontStyle: 'italic', color: '#666666' }}>
                <em>Veuillez ramener l'ordonnance à la prochaine visite</em>
              </td>
              <td style={{ verticalAlign: 'bottom', textAlign: 'center', fontSize: '9px' }}>
                <div style={{ border: '1px solid #aaa', height: '45px', width: '90%', margin: '0 auto 4px auto' }}></div>
                <strong style={{ color: '#1F4788', textDecoration: 'underline' }}>Signature et cachet</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </Box>

      {/* Section d'impression Demande d'examen — format bulletin_examens.html */}
      <Box
        id="print-section-examen"
        className="print-section"
        sx={{
          display: 'none',
          width: '148mm',
          minHeight: '210mm',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          flexDirection: 'column',
          p: '8px',
          '@media print': {
            display: 'flex !important',
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 9999,
          },
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2.5px solid #2E75B6', marginBottom: '10px' }}>
          <tbody><tr>
            <td style={{ width: '52px', textAlign: 'center', padding: '3px', verticalAlign: 'middle' }}>
              <img src="/coly.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain', display: 'block', margin: 'auto' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </td>
            <td style={{ paddingLeft: '7px', verticalAlign: 'middle' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1F4788' }}>CABINET MÉDICAL LIONEL</div>
              <div style={{ fontSize: '7px', color: '#333', lineHeight: 1.6 }}>Autorisation n° : 26JUIL2022*022346<br />RC : SN.THS.2024.A.266<br />NINEA : 010949412</div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '3px', whiteSpace: 'nowrap', fontSize: '8.5px' }}>
              <em>Le </em>{(getObs('examen_date') || formData.observation_date) ? new Date(String(getObs('examen_date') || formData.observation_date)).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}
            </td>
          </tr></tbody>
        </table>
        <Box sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#1F4788', border: '2px solid #1F4788', background: '#E8F0F8', py: '4px', mt: '20px', mb: '12px' }}>BULLETIN D&apos;EXAMEN</Box>
        <Box sx={{ border: '1px solid #ccc', p: '7px 9px', mb: '12px', fontSize: '9px' }}>
          {[['Nom', dmst.agent_name?.split(' ').slice(-1)[0] || ''], ['Prénom', dmst.agent_name?.split(' ').slice(0, -1).join(' ') || '']].map(([l, v]) => (
            <Box key={l} sx={{ display: 'flex', alignItems: 'baseline', mb: '7px', gap: '4px' }}>
              <Typography sx={{ fontWeight: 'bold', fontSize: '9px', whiteSpace: 'nowrap' }}>{l} :</Typography>
              <Box sx={{ flex: 1, borderBottom: '1px dotted #ccc', fontSize: '9px', p: '1px 2px' }}>{v}</Box>
            </Box>
          ))}
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <Typography sx={{ fontWeight: 'bold', fontSize: '9px' }}>Age :</Typography>
            <Box sx={{ width: '55px', borderBottom: '1px dotted #ccc', fontSize: '9px', p: '1px 2px' }}>{dmst.agent_age ? `${dmst.agent_age} ans` : ''}</Box>
            <Typography sx={{ fontWeight: 'bold', fontSize: '9px', ml: 1 }}>Sexe :</Typography>
            <Box sx={{ width: '55px', borderBottom: '1px dotted #ccc', fontSize: '9px', p: '1px 2px' }}>{obs.sex_m ? 'M' : obs.sex_f ? 'F' : ''}</Box>
            <Typography sx={{ fontWeight: 'bold', fontSize: '9px', ml: 1 }}>Tél :</Typography>
            <Box sx={{ flex: 1, borderBottom: '1px dotted #ccc', fontSize: '9px', p: '1px 2px' }}>{getObs('telephone') as string || ''}</Box>
          </Box>
        </Box>
        {/* Section 1 */}
        <Box sx={{ mb: '12px', flex: 1 }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '9.5px', color: '#1F4788', borderBottom: '1.5px solid #1F4788', pb: '3px', mb: '6px' }}>1. Examen(s) demandé(s) :</Typography>
          {[[obs.examen_biologie && 'Biologie / Analyses de sang', obs.examen_radiologie && 'Radiologie', obs.examen_ecg && 'ECG', obs.examen_spiro && 'Spirométrie', obs.examen_audiometrie && 'Audiométrie', obs.examen_acuite && 'Acuité visuelle'].filter(Boolean).join(', '), getObs('examen_specifique') as string || ''].filter(Boolean).join('\n').split('\n').concat(['','','','','']).slice(0,5).map((line, i) => (
            <Box key={i} sx={{ borderBottom: '1px dotted #ccc', fontSize: '9px', p: '3px 2px', minHeight: '18px', mb: '6px' }}>{line}</Box>
          ))}
        </Box>
        {/* Section 2 */}
        <Box sx={{ mb: '12px', flex: 1 }}>
          <Typography sx={{ fontWeight: 'bold', fontSize: '9.5px', color: '#1F4788', borderBottom: '1.5px solid #1F4788', pb: '3px', mb: '6px' }}>2. Renseignements cliniques :</Typography>
          {[(getObs('examen_motif') as string || ''), (getObs('examen_observations') as string || '')].filter(Boolean).join('\n').split('\n').concat(['','','','','']).slice(0,5).map((line, i) => (
            <Box key={i} sx={{ borderBottom: '1px dotted #ccc', fontSize: '9px', p: '3px 2px', minHeight: '18px', mb: '6px' }}>{line}</Box>
          ))}
        </Box>
        {/* Pied */}
        <Box sx={{ borderTop: '1px solid #ccc', pt: '6px', mt: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <Typography sx={{ fontSize: '9px' }}><strong>Date : </strong>{(getObs('examen_date') || formData.observation_date) ? new Date(String(getObs('examen_date') || formData.observation_date)).toLocaleDateString('fr-FR') : ''}</Typography>
          <Typography sx={{ fontSize: '9px', fontWeight: 'bold', color: '#1F4788', textDecoration: 'underline', pt: '35px' }}>Le Prescripteur</Typography>
        </Box>
      </Box>

      {/* Section d'impression Bulletin d'analyses — format bulletin_analyses.html */}
      <Box
        id="print-section-bulletin"
        className="print-section"
        sx={{
          display: 'none',
          width: '148mm',
          minHeight: '210mm',
          backgroundColor: '#ffffff',
          fontFamily: 'Arial, sans-serif',
          fontSize: '10px',
          flexDirection: 'column',
          p: '8px',
          '@media print': {
            display: 'flex !important',
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 9999,
          },
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2.5px solid #2E75B6', marginBottom: '5px' }}>
          <tbody><tr>
            <td style={{ width: '52px', textAlign: 'center', padding: '3px', verticalAlign: 'middle' }}>
              <img src="/coly.png" alt="Logo" style={{ width: '50px', height: '50px', objectFit: 'contain', display: 'block', margin: 'auto' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            </td>
            <td style={{ paddingLeft: '7px', verticalAlign: 'middle' }}>
              <div style={{ fontWeight: 'bold', fontSize: '11px', color: '#1F4788' }}>CABINET MÉDICAL LIONEL</div>
              <div style={{ fontSize: '7px', color: '#333', lineHeight: 1.6 }}>Autorisation n° : 26JUIL2022*022346<br />RC : SN.THS.2024.A.266<br />NINEA : 010949412</div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'middle', paddingRight: '3px', whiteSpace: 'nowrap', fontSize: '8.5px' }}>
              <em>Date : </em>{formData.observation_date ? new Date(String(formData.observation_date)).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}
            </td>
          </tr></tbody>
        </table>
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#1F4788', border: '2px solid #1F4788', background: '#E8F0F8', padding: '3px 0 4px 0', marginBottom: '5px', letterSpacing: '0.5px' }}>BULLETIN D&apos;ANALYSES</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px', fontSize: '9px', border: '1px solid #ccc' }}>
          <tbody>
            <tr>
              <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}><strong>Nom : </strong>{dmst.agent_name?.split(' ').slice(-1)[0] || ''}</td>
              <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}><strong>Prénom : </strong>{dmst.agent_name?.split(' ').slice(0, -1).join(' ') || ''}</td>
            </tr>
            <tr>
              <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}><strong>Age : </strong>{dmst.agent_age ? `${dmst.agent_age} ans` : ''}&nbsp;&nbsp;<strong>Sexe : </strong>{obs.sex_m ? 'M' : obs.sex_f ? 'F' : ''}</td>
              <td style={{ padding: '3px 5px', border: '1px solid #ddd' }}><strong>Téléphone : </strong>{getObs('telephone') as string || ''}</td>
            </tr>
          </tbody>
        </table>
        <table style={{ width: '100%', borderCollapse: 'collapse', flex: 1, fontSize: '8.5px' }}>
          <tbody>
            <tr>
              {/* Col 1 */}
              <td style={{ border: '1px solid #ccc', padding: '3px 5px', verticalAlign: 'top', width: '33%' }}>
                {[{ t: 'HÉMATOLOGIE', bg: '#1F4788', items: [['ba_nfs','NFS'],['ba_taux_ret','Taux Rét.'],['ba_te','T E'],['ba_vs','V S'],['ba_gs','G S'],['ba_rhesus','Rhesus'],['ba_abo','ABO'],['ba_rai','RAI']] }, { t: 'BIOCHIMIE', bg: '#1F4788', items: [['ba_gaj','G A J'],['ba_gpp','G P P'],['ba_hba1c','HbA1c'],['ba_uree','Urée'],['ba_creat','Créat'],['ba_acide_urique','Acide urique'],['ba_psa','PSA'],['ba_afp','AFP'],['ba_lipasemie','Lipasémie'],['ba_electroph_pr','Electroph. Pr'],['ba_electroph_hb','Electroph. Hb'],['ba_tsh','TSH'],['ba_pu24','PU 24'],['ba_micro_albumin','Micro-albuminurie']] }].map((sec) => (
                  <Box key={sec.t}>
                    <Box sx={{ background: sec.bg, color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mt: '4px', mb: '2px' }}>{sec.t}</Box>
                    {sec.items.map(([k, l]) => k === 'ba_tsh' ? (
                      <Typography key={k} sx={{ fontSize: '8px', lineHeight: 1.65, py: '1.5px' }}>{obs['ba_tsh'] ? '☑' : '☐'} TSH &nbsp; {obs['ba_t4'] ? '☑' : '☐'} T4</Typography>
                    ) : (
                      <Typography key={k} sx={{ fontSize: '8px', lineHeight: 1.65, py: '1.5px' }}>{obs[k] ? '☑' : '☐'} {l}</Typography>
                    ))}
                  </Box>
                ))}
              </td>
              {/* Col 2 */}
              <td style={{ border: '1px solid #ccc', padding: '3px 5px', verticalAlign: 'top', width: '34%' }}>
                {[{ t: 'B. LIPIDIQUE', bg: '#1F4788', items: [['ba_ch_total','Ch. total'],['ba_ch_hdl','Ch. HDL'],['ba_ch_ldl','Ch. LDL'],['ba_tgl','TGL']] }, { t: 'IONOGRAMME SANGUIN', bg: '#2E75B6', items: [['ba_na','Na+'],['ba_k','K+'],['ba_cl','Cl-'],['ba_calcemie','Calcémie'],['ba_phosphore','Phosphore'],['ba_magnesemie','Magnésémie'],['ba_bicarbonates','Bicarbonates']] }, { t: 'F. HÉPATIQUE HÉMOSTASE', bg: '#2E75B6', items: [['ba_bilirubine','Bilirubine libre et conjuguée'],['ba_asat_alat','ASAT ALAT'],['ba_pal','PAL'],['ba_ggt','GGT'],['ba_tp','TP'],['ba_tck','TCK'],['ba_inr','INR'],['ba_fibrinogene','Fibrinogène']] }].map((sec) => (
                  <Box key={sec.t}>
                    <Box sx={{ background: sec.bg, color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mt: '4px', mb: '2px' }}>{sec.t}</Box>
                    {sec.items.map(([k, l]) => (
                      <Typography key={k} sx={{ fontSize: '8px', lineHeight: 1.65, py: '1.5px' }}>{obs[k] ? '☑' : '☐'} {l}</Typography>
                    ))}
                  </Box>
                ))}
              </td>
              {/* Col 3 */}
              <td style={{ border: '1px solid #ccc', padding: '3px 5px', verticalAlign: 'top', width: '33%' }}>
                {[{ t: 'SÉROLOGIE IMMUNOLOGIE', bg: '#C41E3A', items: [['ba_aghbs','AgHbs'],['ba_bhcg','B-HCG Plasm.'],['ba_aslo','ASLO'],['ba_fr','F. Rhumatoïde'],['ba_widal','Widal et Félix'],['ba_bw','BW (TPHA-RPR)'],['ba_crp','CRP'],['ba_waler_rose','Waler Rose'],['ba_ac_anti_ccp','Ac Anti CCP'],['ba_ac_anti_dna','Ac Anti DNA natif']] }, { t: 'BACTÉRIOLOGIE PARASITOLOGIE', bg: '#2E8B57', items: [['ba_hemoculture','Hémoculture'],['ba_goutte_epaisse','Goutte épaisse'],['ba_frottis','Frottis sanguin'],['ba_ecbu','ECBU'],['ba_addis',"Compte d'Addis"],['ba_coproculture','Coproculture'],['ba_selles_kaop','Selles KAOP'],['ba_crachats_baar','Crachats BAAR']] }].map((sec) => (
                  <Box key={sec.t}>
                    <Box sx={{ background: sec.bg, color: 'white', fontWeight: 'bold', fontSize: '8px', p: '2px 5px', mt: '4px', mb: '2px' }}>{sec.t}</Box>
                    {sec.items.map(([k, l]) => (
                      <Typography key={k} sx={{ fontSize: '8px', lineHeight: 1.65, py: '1.5px' }}>{obs[k] ? '☑' : '☐'} {l}</Typography>
                    ))}
                  </Box>
                ))}
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ border: '1px solid #ccc', borderTop: '1px solid #ccc', padding: '4px 5px' }}>
                <div style={{ height: '35px' }}></div>
                <div style={{ textAlign: 'right', fontSize: '8px', color: '#333' }}><strong style={{ color: '#1F4788', textDecoration: 'underline' }}>Le Prescripteur</strong></div>
              </td>
            </tr>
          </tbody>
        </table>
      </Box>
    </Box>
  )
}
