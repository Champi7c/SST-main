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
                <Button variant="outlined" startIcon={<PdfIcon />} onClick={() => showSnackbar('Fonctionnalité en cours de développement', 'info')} color="error">
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

      </Paper>

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
