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
} from '@mui/material'
import { Edit as EditIcon, MedicalServices as MedicalServicesIcon, Print as PrintIcon, PictureAsPdf as PdfIcon, Description as DescriptionIcon, Science as ScienceIcon, WorkspacePremium as CertIcon } from '@mui/icons-material'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

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
    if (dmst && tabValue === 3) {
      fetchVisits()
    }
  }, [dmst, tabValue])

  useEffect(() => {
    fetchVisitTypes()
  }, [])

  const fetchDMST = async () => {
    try {
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

  const fetchVisits = async () => {
    if (!dmst) return
    try {
      const response = await client.get(`/medical/dmst/${dmst.id}/visits/`)
      setVisits(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des visites:', error)
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
    window.print()
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
                  {tabValue === 0 ? 'Remplir la fiche' : 'Modifier'}
                </Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ mr: 1 }}>
                  Imprimer
                </Button>
                <Button variant="outlined" startIcon={<PdfIcon />} onClick={() => showSnackbar('Fonctionnalité en cours de développement', 'success')} color="error">
                  Exporter PDF
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Fiche d'observation" icon={<MedicalServicesIcon />} iconPosition="start" />
          <Tab label="Ordonnance" icon={<DescriptionIcon />} iconPosition="start" />
          <Tab label="Demande d'examen" icon={<ScienceIcon />} iconPosition="start" />
          <Tab label={`Visites (${dmst.visits_count})`} icon={<MedicalServicesIcon />} iconPosition="start" />
          <Tab label="Attestations" icon={<CertIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Fiche d'observation - contenu existant */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                FICHE D'OBSERVATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL
              </Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
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

        <TabPanel value={tabValue} index={2}>
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

        <TabPanel value={tabValue} index={3}>
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
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
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
    </Box>
  )
}
