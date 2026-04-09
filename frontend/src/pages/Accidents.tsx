import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Alert,
  Snackbar,
  FormControlLabel,
  Checkbox,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Print as PrintIcon,
} from '@mui/icons-material'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

interface WorkAccident {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  agent_company: string
  agent_site?: string
  agent_service?: string
  accident_type: string
  accident_type_display: string
  accident_date: string
  location: string
  mechanism: string
  description: string
  return_to_work_date?: string
  ipp?: number
  severity: string
  severity_display: string
  status: string
  status_display: string
  work_stoppage: boolean
  work_stoppage_days?: number
  medical_care: boolean
  hospitalization: boolean
  root_causes?: string
  contributing_factors?: string
  corrective_actions?: string
  preventive_actions?: string
  alert_rh: boolean
  alert_direction: boolean
  alert_hse: boolean
  declared_by_name?: string
  closed_by_name?: string
  closed_date?: string
}

interface OccupationalDisease {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  agent_company: string
  disease_type: string
  disease_type_display: string
  disease_name: string
  table_number?: number
  first_symptoms_date: string
  diagnosis_date?: string
  status: string
  status_display: string
  return_delay?: number
  exposure_start_date?: string
  exposure_end_date?: string
  exposure_duration_days?: number
  exposure_factors?: string
  medical_follow_up?: string
  treatment?: string
  recognition_date?: string
  recognition_number?: string
  declared_by_name?: string
}

interface Agent {
  id: number
  matricule: string
  full_name: string
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function Accidents() {
  const [tabValue, setTabValue] = useState(0)
  const [accidents, setAccidents] = useState<WorkAccident[]>([])
  const [diseases, setDiseases] = useState<OccupationalDisease[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [openDiseaseDialog, setOpenDiseaseDialog] = useState(false)
  const [openViewDiseaseDialog, setOpenViewDiseaseDialog] = useState(false)
  const [editingAccident, setEditingAccident] = useState<WorkAccident | null>(null)
  const [viewingAccident, setViewingAccident] = useState<WorkAccident | null>(null)
  const [viewingDisease, setViewingDisease] = useState<OccupationalDisease | null>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const { user } = useAuth()

  const [agents, setAgents] = useState<Agent[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const [formData, setFormData] = useState({
    agent: '',
    accident_type: 'work',
    accident_date: '',
    accident_time: '',
    location: '',
    mechanism: '',
    description: '',
    return_to_work_date: '',
    ipp: '',
    severity: 'light',
    work_stoppage: false,
    work_stoppage_days: '',
    medical_care: false,
    hospitalization: false,
    root_causes: '',
    contributing_factors: '',
    corrective_actions: '',
    preventive_actions: '',
  })

  const [diseaseFormData, setDiseaseFormData] = useState({
    agent: '',
    disease_type: 'mp',
    disease_name: '',
    table_number: '',
    first_symptoms_date: '',
    diagnosis_date: '',
    status: 'declared',
    return_delay: '',
    exposure_start_date: '',
    exposure_end_date: '',
    exposure_factors: '',
    medical_follow_up: '',
    treatment: '',
    recognition_date: '',
    recognition_number: '',
  })

  useEffect(() => {
    fetchAccidents()
    fetchDiseases()
    fetchAgents()
    fetchStatistics()
  }, [statusFilter, severityFilter])

  const fetchAccidents = async () => {
    try {
      const params: any = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (severityFilter !== 'all') params.severity = severityFilter
      const response = await client.get('/accidents/work-accidents/', { params })
      setAccidents(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des accidents:', error)
      showSnackbar('Erreur lors du chargement des accidents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchDiseases = async () => {
    try {
      const response = await client.get('/accidents/occupational-diseases/')
      setDiseases(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des maladies:', error)
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await client.get('/medical/agents/?is_active=true')
      const data = response.data.results || response.data
      setAgents(data.filter((a: any) => !a.is_archived))
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await client.get('/accidents/work-accidents/statistics/')
      setStatistics(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    }
  }

  const handleOpenDialog = (accident?: WorkAccident) => {
    if (accident) {
      setEditingAccident(accident)
      const accidentDate = new Date(accident.accident_date)
      setFormData({
        agent: accident.agent.toString(),
        accident_type: accident.accident_type,
        accident_date: accidentDate.toISOString().split('T')[0],
        accident_time: accidentDate.toTimeString().slice(0, 5),
        location: accident.location,
        mechanism: accident.mechanism,
        description: accident.description,
        return_to_work_date: accident.return_to_work_date || '',
        ipp: accident.ipp != null ? String(accident.ipp) : '',
        severity: accident.severity,
        work_stoppage: accident.work_stoppage,
        work_stoppage_days: accident.work_stoppage_days?.toString() || '',
        medical_care: accident.medical_care,
        hospitalization: accident.hospitalization,
        root_causes: accident.root_causes || '',
        contributing_factors: accident.contributing_factors || '',
        corrective_actions: accident.corrective_actions || '',
        preventive_actions: accident.preventive_actions || '',
      })
    } else {
      setEditingAccident(null)
      setFormData({
        agent: '',
        accident_type: 'work',
        accident_date: '',
        accident_time: '',
        location: '',
        mechanism: '',
        description: '',
        return_to_work_date: '',
        ipp: '',
        severity: 'light',
        work_stoppage: false,
        work_stoppage_days: '',
        medical_care: false,
        hospitalization: false,
        root_causes: '',
        contributing_factors: '',
        corrective_actions: '',
        preventive_actions: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingAccident(null)
  }

  const handleViewAccident = (accident: WorkAccident) => {
    setViewingAccident(accident)
    setOpenViewDialog(true)
  }

  const handleSubmit = async () => {
    const agentId = formData.agent ? parseInt(formData.agent, 10) : NaN
    if (!Number.isFinite(agentId) || !formData.accident_date?.trim() || !formData.location?.trim() || !formData.mechanism?.trim() || !formData.description?.trim()) {
      showSnackbar('Veuillez remplir agent, date, lieu, mécanisme et description.', 'error')
      return
    }
    const time = formData.accident_time?.trim() || '09:00'
    const accidentDateTime = `${formData.accident_date}T${time}:00`
    try {
      const data: Record<string, unknown> = {
        agent: agentId,
        accident_type: formData.accident_type,
        accident_date: accidentDateTime,
        location: formData.location.trim(),
        mechanism: formData.mechanism.trim(),
        description: formData.description.trim(),
        return_to_work_date: formData.return_to_work_date?.trim() || null,
        ipp: formData.ipp !== '' ? Math.min(100, Math.max(0, parseInt(formData.ipp, 10) || 0)) : null,
        severity: formData.severity,
        work_stoppage: formData.work_stoppage,
        work_stoppage_days: formData.work_stoppage_days ? parseInt(formData.work_stoppage_days, 10) : null,
        medical_care: formData.medical_care,
        hospitalization: formData.hospitalization,
        root_causes: formData.root_causes?.trim() || null,
        contributing_factors: formData.contributing_factors?.trim() || null,
        corrective_actions: formData.corrective_actions?.trim() || null,
        preventive_actions: formData.preventive_actions?.trim() || null,
      }

      if (editingAccident) {
        await client.put(`/accidents/work-accidents/${editingAccident.id}/`, data)
        showSnackbar('Accident modifié avec succès', 'success')
        handleCloseDialog()
      } else {
        await client.post('/accidents/work-accidents/', data)
        showSnackbar('Accident déclaré avec succès', 'success')
        handleCloseDialog()
      }
      fetchAccidents()
      fetchStatistics()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleCloseAccident = async (accident: WorkAccident) => {
    try {
      await client.post(`/accidents/work-accidents/${accident.id}/close/`)
      showSnackbar('Accident clôturé', 'success')
      fetchAccidents()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleDeleteAccident = async (accident: WorkAccident) => {
    if (!window.confirm(`Supprimer l'accident du ${new Date(accident.accident_date).toLocaleDateString('fr-FR')} (${accident.agent_name}) ?`)) return
    try {
      await client.delete(`/accidents/work-accidents/${accident.id}/`)
      showSnackbar('Accident supprimé', 'success')
      fetchAccidents()
      fetchStatistics()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleSubmitDisease = async () => {
    const agentId = diseaseFormData.agent ? parseInt(diseaseFormData.agent, 10) : NaN
    if (!Number.isFinite(agentId) || !diseaseFormData.disease_name?.trim() || !diseaseFormData.first_symptoms_date?.trim()) {
      showSnackbar('Veuillez remplir agent, désignation maladie et date des premiers symptômes.', 'error')
      return
    }
    try {
      const data: Record<string, unknown> = {
        agent: agentId,
        disease_type: diseaseFormData.disease_type,
        disease_name: diseaseFormData.disease_name.trim(),
        table_number: diseaseFormData.table_number !== '' ? Math.min(100, Math.max(1, parseInt(diseaseFormData.table_number, 10) || 1)) : null,
        first_symptoms_date: diseaseFormData.first_symptoms_date,
        diagnosis_date: diseaseFormData.diagnosis_date || null,
        status: diseaseFormData.status,
        return_delay: diseaseFormData.return_delay !== '' ? Math.min(100, Math.max(0, parseInt(diseaseFormData.return_delay, 10) || 0)) : null,
        exposure_start_date: diseaseFormData.exposure_start_date?.trim() || null,
        exposure_end_date: diseaseFormData.exposure_end_date?.trim() || null,
        exposure_factors: diseaseFormData.exposure_factors?.trim() || null,
        medical_follow_up: diseaseFormData.medical_follow_up?.trim() || null,
        treatment: diseaseFormData.treatment?.trim() || null,
        recognition_date: diseaseFormData.recognition_date || null,
        recognition_number: diseaseFormData.recognition_number?.trim() || null,
      }

      await client.post('/accidents/occupational-diseases/', data)
      showSnackbar('Maladie professionnelle déclarée avec succès', 'success')
      setOpenDiseaseDialog(false)
      setDiseaseFormData({
        agent: '',
        disease_type: 'mp',
        disease_name: '',
        table_number: '',
        first_symptoms_date: '',
        diagnosis_date: '',
        status: 'declared',
        return_delay: '',
        exposure_start_date: '',
        exposure_end_date: '',
        exposure_factors: '',
        medical_follow_up: '',
        treatment: '',
        recognition_date: '',
        recognition_number: '',
      })
      fetchDiseases()
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

  const handleViewDisease = (disease: OccupationalDisease) => {
    setViewingDisease(disease)
    setOpenViewDiseaseDialog(true)
  }

  const handlePrintATMP = () => {
    window.print()
  }

  const PRINT_SECTION_ID = 'print-section-atmp-mp'
  const handleExportPDFATMP = async () => {
    if (!viewingAccident && !viewingDisease) {
      showSnackbar('Aucun élément à exporter', 'error')
      return
    }
    try {
      showSnackbar('Génération du PDF en cours...', 'success')
      const printSection = document.getElementById(PRINT_SECTION_ID)
      if (!printSection) {
        showSnackbar("Section d'impression introuvable", 'error')
        return
      }
      const mmToPx = 3.779527559
      const widthPx = 210 * mmToPx
      const paddingPx = 20 * mmToPx
      const orig = {
        display: printSection.style.display,
        position: printSection.style.position,
        left: printSection.style.left,
        top: printSection.style.top,
        width: printSection.style.width,
        zIndex: printSection.style.zIndex,
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
      await new Promise((r) => setTimeout(r, 150))
      const images = printSection.querySelectorAll('img')
      if (images.length > 0) {
        await Promise.all(
          Array.from(images).map(
            (img: HTMLImageElement) =>
              new Promise<void>((resolve) => {
                if (img.complete && img.naturalHeight !== 0) {
                  resolve()
                  return
                }
                img.onload = () => resolve()
                img.onerror = () => resolve()
                setTimeout(() => resolve(), 3000)
              })
          )
        )
      }
      await new Promise((r) => setTimeout(r, 400))
      const canvas = await html2canvas(printSection, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: printSection.offsetWidth,
        height: printSection.scrollHeight,
        allowTaint: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const cloned = clonedDoc.getElementById(PRINT_SECTION_ID)
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
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })
      const pdfWidth = 210
      const pdfHeight = 297
      const actualWidthPx = canvas.width
      const actualHeightPx = canvas.height
      const pxToMm = pdfWidth / actualWidthPx
      const imgWidthMm = actualWidthPx * pxToMm
      const imgHeightMm = actualHeightPx * pxToMm
      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm, undefined, 'FAST')
      } else {
        let remainingHeight = imgHeightMm
        let sourceY = 0
        while (remainingHeight > 0) {
          const pageContentHeight = Math.min(pdfHeight, remainingHeight)
          const sourceHeightPx = (pageContentHeight / imgHeightMm) * actualHeightPx
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = Math.ceil(sourceHeightPx)
          const ctx = pageCanvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeightPx, 0, 0, canvas.width, sourceHeightPx)
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
            pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidthMm, pageContentHeight, undefined, 'FAST')
          }
          sourceY += sourceHeightPx
          remainingHeight -= pageContentHeight
          if (remainingHeight > 0) pdf.addPage()
        }
      }
      const prefix = (openViewDiseaseDialog && viewingDisease)
        ? `maladie_${viewingDisease.agent_matricule}_${viewingDisease.first_symptoms_date?.slice(0, 10)}`
        : viewingAccident
          ? `accident_${viewingAccident.agent_matricule}_${viewingAccident.accident_date?.slice(0, 10)}`
          : 'atmp'
      pdf.save(`${prefix}_${new Date().toISOString().split('T')[0]}.pdf`)
      showSnackbar('PDF exporté avec succès', 'success')
    } catch (error) {
      console.error(error)
      showSnackbar(`Erreur export PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error')
    }
  }

  const canManage = user?.role ? ['super_admin', 'medecin', 'infirmier', 'rh', 'hse'].includes(user.role) : false

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'fatal': return 'error'
      case 'severe': return 'error'
      case 'moderate': return 'warning'
      case 'light': return 'info'
      default: return 'default'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'success'
      case 'investigating': return 'warning'
      case 'declared': return 'info'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">ATMP (Accidents de travail & Maladies professionnelles)</Typography>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/bareme-reference-indemnisation.pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Barème de référence d&apos;indemnisation (PDF)
          </Button>
          {canManage && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Déclarer un accident
            </Button>
          )}
        </Box>
      </Box>

      {/* Statistiques */}
      {statistics && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Total</Typography>
                <Typography variant="h4">{statistics.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Avec arrêt</Typography>
                <Typography variant="h4">{statistics.with_work_stoppage}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>En investigation</Typography>
                <Typography variant="h4">{statistics.by_status?.investigating || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>Graves</Typography>
                <Typography variant="h4">{statistics.by_severity?.severe || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="ATMP" />
          <Tab label="Maladies professionnelles" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/bareme-reference-indemnisation.pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Barème de référence d&apos;indemnisation (PDF)
              </Button>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Statut</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Statut">
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="declared">Déclaré</MenuItem>
                  <MenuItem value="investigating">En investigation</MenuItem>
                  <MenuItem value="closed">Clôturé</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Gravité</InputLabel>
                <Select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} label="Gravité">
                  <MenuItem value="all">Toutes</MenuItem>
                  <MenuItem value="light">Léger</MenuItem>
                  <MenuItem value="moderate">Modéré</MenuItem>
                  <MenuItem value="severe">Grave</MenuItem>
                  <MenuItem value="fatal">Mortel</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {canManage && (
              <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Déclarer un accident
              </Button>
            )}
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Agent</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Lieu</TableCell>
                  <TableCell>Gravité</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Arrêt</TableCell>
                  <TableCell>Alertes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accidents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucun accident trouvé
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  accidents.map((accident) => (
                    <TableRow key={accident.id}>
                      <TableCell>
                        {new Date(accident.accident_date).toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        {accident.agent_name} ({accident.agent_matricule})
                      </TableCell>
                      <TableCell>{accident.accident_type_display}</TableCell>
                      <TableCell>{accident.location}</TableCell>
                      <TableCell>
                        <Chip label={accident.severity_display} size="small" color={getSeverityColor(accident.severity)} />
                      </TableCell>
                      <TableCell>
                        <Chip label={accident.status_display} size="small" color={getStatusColor(accident.status)} />
                      </TableCell>
                      <TableCell>
                        {accident.work_stoppage ? (
                          <Chip label={`${accident.work_stoppage_days || 0} jours`} size="small" color="warning" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={0.5}>
                          {accident.alert_rh && <Chip label="RH" size="small" color="error" />}
                          {accident.alert_direction && <Chip label="DIR" size="small" color="error" />}
                          {accident.alert_hse && <Chip label="HSE" size="small" color="error" />}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleViewAccident(accident)}>Voir</Button>
                          {canManage && accident.status !== 'closed' && (
                            <>
                              <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenDialog(accident)}>Modifier</Button>
                              <Button size="small" variant="outlined" startIcon={<CheckCircleIcon />} onClick={() => handleCloseAccident(accident)}>Clôturer</Button>
                              <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteAccident(accident)}>Supprimer</Button>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/bareme-reference-indemnisation.pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Barème de référence d&apos;indemnisation (PDF)
              </Button>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                href={`${(import.meta.env.BASE_URL || '/').replace(/\/$/, '')}/tableaux-maladies-professionnelles.pdf`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Tableaux de la liste des maladies professionnelles (PDF)
              </Button>
            </Box>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => setOpenDiseaseDialog(true)}>
              Ajouter une maladie
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Désignation maladie</TableCell>
                  <TableCell>Premiers symptômes</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Reconnaissance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diseases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucune maladie professionnelle trouvée
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  diseases.map((disease) => (
                    <TableRow key={disease.id}>
                      <TableCell>
                        {disease.agent_name} ({disease.agent_matricule})
                      </TableCell>
                      <TableCell>{disease.disease_type_display || '-'}</TableCell>
                      <TableCell>{disease.disease_name}</TableCell>
                      <TableCell>
                        {new Date(disease.first_symptoms_date).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Chip label={disease.status_display} size="small" />
                      </TableCell>
                      <TableCell>
                        {disease.recognition_number || '-'}
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleViewDisease(disease)}>
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

      {/* Dialog de déclaration/modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAccident ? 'Modifier l\'accident' : 'Déclarer un accident'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={formData.agent}
                  onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                  label="Agent *"
                  disabled={!!editingAccident}
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.full_name} ({agent.matricule})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type d'accident *</InputLabel>
                <Select
                  value={formData.accident_type}
                  onChange={(e) => setFormData({ ...formData, accident_type: e.target.value })}
                  label="Type d'accident *"
                >
                  <MenuItem value="work">Accident de travail</MenuItem>
                  <MenuItem value="commute">Accident de trajet</MenuItem>
                  <MenuItem value="service">Accident de service</MenuItem>
                  <MenuItem value="mission">Accident de mission</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date *"
                type="date"
                value={formData.accident_date}
                onChange={(e) => setFormData({ ...formData, accident_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heure *"
                type="time"
                value={formData.accident_time}
                onChange={(e) => setFormData({ ...formData, accident_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Lieu *"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mécanisme *"
                multiline
                rows={3}
                value={formData.mechanism}
                onChange={(e) => setFormData({ ...formData, mechanism: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description détaillée *"
                multiline
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de reprise"
                type="date"
                value={formData.return_to_work_date}
                onChange={(e) => setFormData({ ...formData, return_to_work_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IPP (%)"
                type="number"
                inputProps={{ min: 0, max: 100, step: 1 }}
                value={formData.ipp}
                onChange={(e) => setFormData({ ...formData, ipp: e.target.value })}
                placeholder="0 à 100"
                helperText="Pourcentage d'incapacité permanente (0-100 %)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Gravité *</InputLabel>
                <Select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  label="Gravité *"
                >
                  <MenuItem value="light">Léger</MenuItem>
                  <MenuItem value="moderate">Modéré</MenuItem>
                  <MenuItem value="severe">Grave</MenuItem>
                  <MenuItem value="fatal">Mortel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.work_stoppage}
                    onChange={(e) => setFormData({ ...formData, work_stoppage: e.target.checked })}
                  />
                }
                label="Arrêt de travail"
              />
            </Grid>
            {formData.work_stoppage && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre de jours d'arrêt"
                  type="number"
                  value={formData.work_stoppage_days}
                  onChange={(e) => setFormData({ ...formData, work_stoppage_days: e.target.value })}
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.medical_care}
                    onChange={(e) => setFormData({ ...formData, medical_care: e.target.checked })}
                  />
                }
                label="Soins médicaux"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.hospitalization}
                    onChange={(e) => setFormData({ ...formData, hospitalization: e.target.checked })}
                  />
                }
                label="Hospitalisation"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Analyse
      </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Causes racines"
                multiline
                rows={3}
                value={formData.root_causes}
                onChange={(e) => setFormData({ ...formData, root_causes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Facteurs contributifs"
                multiline
                rows={3}
                value={formData.contributing_factors}
                onChange={(e) => setFormData({ ...formData, contributing_factors: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Actions correctives"
                multiline
                rows={3}
                value={formData.corrective_actions}
                onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Actions préventives"
                multiline
                rows={3}
                value={formData.preventive_actions}
                onChange={(e) => setFormData({ ...formData, preventive_actions: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingAccident ? 'Modifier' : 'Déclarer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de visualisation */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détails de l'accident</DialogTitle>
        <DialogContent>
          {viewingAccident && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Agent</Typography>
                <Typography variant="body1">{viewingAccident.agent_name} ({viewingAccident.agent_matricule})</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography variant="body1">{viewingAccident.accident_type_display}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Date et heure</Typography>
                <Typography variant="body1">{new Date(viewingAccident.accident_date).toLocaleString('fr-FR')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Lieu</Typography>
                <Typography variant="body1">{viewingAccident.location}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Gravité</Typography>
                <Chip label={viewingAccident.severity_display} size="small" color={getSeverityColor(viewingAccident.severity)} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Statut</Typography>
                <Chip label={viewingAccident.status_display} size="small" color={getStatusColor(viewingAccident.status)} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Mécanisme</Typography>
                <Typography variant="body1">{viewingAccident.mechanism}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{viewingAccident.description}</Typography>
              </Grid>
              {viewingAccident.return_to_work_date && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date de reprise</Typography>
                  <Typography variant="body1">{new Date(viewingAccident.return_to_work_date).toLocaleDateString('fr-FR')}</Typography>
                </Grid>
              )}
              {viewingAccident.ipp != null && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">IPP</Typography>
                  <Typography variant="body1">{viewingAccident.ipp} %</Typography>
                </Grid>
              )}
              {viewingAccident.root_causes && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Causes racines</Typography>
                  <Typography variant="body1">{viewingAccident.root_causes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<PrintIcon />} onClick={handlePrintATMP}>Imprimer</Button>
          <Button startIcon={<PictureAsPdfIcon />} onClick={handleExportPDFATMP} color="error">Exporter PDF</Button>
          <Button onClick={() => setOpenViewDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de visualisation maladie professionnelle */}
      <Dialog open={openViewDiseaseDialog} onClose={() => { setOpenViewDiseaseDialog(false); setViewingDisease(null) }} maxWidth="md" fullWidth>
        <DialogTitle>Détails de la maladie professionnelle</DialogTitle>
        <DialogContent>
          {viewingDisease && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Agent</Typography>
                <Typography variant="body1">{viewingDisease.agent_name} ({viewingDisease.agent_matricule})</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography variant="body1">{viewingDisease.disease_type_display || '-'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Désignation maladie</Typography>
                <Typography variant="body1">{viewingDisease.disease_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Numéro de tableau</Typography>
                <Typography variant="body1">{viewingDisease.table_number ?? '-'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Statut</Typography>
                <Chip label={viewingDisease.status_display} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Date des premiers symptômes</Typography>
                <Typography variant="body1">{new Date(viewingDisease.first_symptoms_date).toLocaleDateString('fr-FR')}</Typography>
              </Grid>
              {viewingDisease.diagnosis_date && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date de diagnostic</Typography>
                  <Typography variant="body1">{new Date(viewingDisease.diagnosis_date).toLocaleDateString('fr-FR')}</Typography>
                </Grid>
              )}
              {viewingDisease.return_delay != null && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Durée d'absence</Typography>
                  <Typography variant="body1">{viewingDisease.return_delay} jour(s)</Typography>
                </Grid>
              )}
              {(viewingDisease.exposure_start_date || viewingDisease.exposure_end_date) && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Durée d'exposition</Typography>
                  <Typography variant="body1">
                    {viewingDisease.exposure_start_date ? new Date(viewingDisease.exposure_start_date).toLocaleDateString('fr-FR') : '?'}
                    {' — '}
                    {viewingDisease.exposure_end_date ? new Date(viewingDisease.exposure_end_date).toLocaleDateString('fr-FR') : '?'}
                    {viewingDisease.exposure_duration_days != null ? ` (${viewingDisease.exposure_duration_days} j)` : ''}
                  </Typography>
                </Grid>
              )}
              {viewingDisease.exposure_factors && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Facteurs d'exposition</Typography>
                  <Typography variant="body1">{viewingDisease.exposure_factors}</Typography>
                </Grid>
              )}
              {viewingDisease.medical_follow_up && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Suivi médical</Typography>
                  <Typography variant="body1">{viewingDisease.medical_follow_up}</Typography>
                </Grid>
              )}
              {viewingDisease.treatment && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Traitement</Typography>
                  <Typography variant="body1">{viewingDisease.treatment}</Typography>
                </Grid>
              )}
              {(viewingDisease.recognition_date || viewingDisease.recognition_number) && (
                <>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Date de reconnaissance</Typography>
                    <Typography variant="body1">{viewingDisease.recognition_date ? new Date(viewingDisease.recognition_date).toLocaleDateString('fr-FR') : '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Numéro de reconnaissance</Typography>
                    <Typography variant="body1">{viewingDisease.recognition_number || '-'}</Typography>
                  </Grid>
                </>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button startIcon={<PrintIcon />} onClick={handlePrintATMP}>Imprimer</Button>
          <Button startIcon={<PictureAsPdfIcon />} onClick={handleExportPDFATMP} color="error">Exporter PDF</Button>
          <Button onClick={() => { setOpenViewDiseaseDialog(false); setViewingDisease(null) }}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de déclaration de maladie professionnelle */}
      <Dialog open={openDiseaseDialog} onClose={() => setOpenDiseaseDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Déclarer une maladie professionnelle</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={diseaseFormData.agent}
                  onChange={(e) => setDiseaseFormData({ ...diseaseFormData, agent: e.target.value })}
                  label="Agent *"
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.full_name} ({agent.matricule})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type *</InputLabel>
                <Select
                  value={diseaseFormData.disease_type}
                  onChange={(e) => setDiseaseFormData({ ...diseaseFormData, disease_type: e.target.value })}
                  label="Type *"
                >
                  <MenuItem value="mp">Maladie professionnelle</MenuItem>
                  <MenuItem value="mcp">Maladie à caractère professionnel</MenuItem>
                  <MenuItem value="ms">Maladie suspecte</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Statut *</InputLabel>
                <Select
                  value={diseaseFormData.status}
                  onChange={(e) => setDiseaseFormData({ ...diseaseFormData, status: e.target.value })}
                  label="Statut *"
                >
                  <MenuItem value="declared">Déclarée</MenuItem>
                  <MenuItem value="recognized">Reconnue</MenuItem>
                  <MenuItem value="rejected">Rejetée</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Désignation maladie *"
                value={diseaseFormData.disease_name}
                onChange={(e) => setDiseaseFormData({ ...diseaseFormData, disease_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Numéro de tableau</InputLabel>
                <Select
                  value={diseaseFormData.table_number || ''}
                  onChange={(e) => setDiseaseFormData({ ...diseaseFormData, table_number: e.target.value })}
                  label="Numéro de tableau"
                >
                  <MenuItem value="">—</MenuItem>
                  {Array.from({ length: 100 }, (_, i) => i + 1).map((n) => (
                    <MenuItem key={n} value={String(n)}>{n}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date des premiers symptômes *"
                type="date"
                value={diseaseFormData.first_symptoms_date}
                onChange={(e) => setDiseaseFormData({ ...diseaseFormData, first_symptoms_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de diagnostic"
                type="date"
                value={diseaseFormData.diagnosis_date}
                onChange={(e) => setDiseaseFormData({ ...diseaseFormData, diagnosis_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Durée d'absence (jours)</InputLabel>
                <Select
                  value={diseaseFormData.return_delay || ''}
                  onChange={(e) => setDiseaseFormData({ ...diseaseFormData, return_delay: e.target.value })}
                  label="Durée d'absence (jours)"
                >
                  <MenuItem value="">—</MenuItem>
                  {Array.from({ length: 101 }, (_, i) => i).map((n) => (
                    <MenuItem key={n} value={String(n)}>{n}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Durée d&apos;exposition</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Début d'exposition"
                    type="date"
                    value={diseaseFormData.exposure_start_date}
                    onChange={(e) => setDiseaseFormData({ ...diseaseFormData, exposure_start_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fin d'exposition"
                    type="date"
                    value={diseaseFormData.exposure_end_date}
                    onChange={(e) => setDiseaseFormData({ ...diseaseFormData, exposure_end_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                {diseaseFormData.exposure_start_date && diseaseFormData.exposure_end_date && (() => {
                  const start = new Date(diseaseFormData.exposure_start_date).getTime()
                  const end = new Date(diseaseFormData.exposure_end_date).getTime()
                  const days = end >= start ? Math.round((end - start) / (1000 * 60 * 60 * 24)) : null
                  return days != null ? (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Durée calculée : {days} jour{days !== 1 ? 's' : ''}
                      </Typography>
                    </Grid>
                  ) : null
                })()}
              </Grid>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Facteurs d'exposition"
                multiline
                rows={3}
                value={diseaseFormData.exposure_factors}
                onChange={(e) => setDiseaseFormData({ ...diseaseFormData, exposure_factors: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Suivi médical"
                multiline
                rows={3}
                value={diseaseFormData.medical_follow_up}
                onChange={(e) => setDiseaseFormData({ ...diseaseFormData, medical_follow_up: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Traitement"
                multiline
                rows={3}
                value={diseaseFormData.treatment}
                onChange={(e) => setDiseaseFormData({ ...diseaseFormData, treatment: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de reconnaissance"
                type="date"
                value={diseaseFormData.recognition_date}
                onChange={(e) => setDiseaseFormData({ ...diseaseFormData, recognition_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Numéro de reconnaissance"
                value={diseaseFormData.recognition_number}
                onChange={(e) => setDiseaseFormData({ ...diseaseFormData, recognition_number: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDiseaseDialog(false)}>Annuler</Button>
          <Button onClick={handleSubmitDisease} variant="contained" color="primary">
            Déclarer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Section d'impression / PDF — même format que le dossier médical */}
      {(viewingAccident || viewingDisease) && (
        <Box
          id={PRINT_SECTION_ID}
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
                <em>Le </em>{new Date().toLocaleDateString('fr-FR')}
              </td>
            </tr></tbody>
          </table>
          {/* TITRE */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#1F4788', border: '2px solid #1F4788', background: '#E8F0F8', padding: '4px 0 5px', marginTop: '20px', marginBottom: '14px', letterSpacing: '0.5px' }}>
            {(openViewDiseaseDialog && viewingDisease)
              ? 'MALADIE PROFESSIONNELLE'
              : viewingAccident
                ? 'ACCIDENT DU TRAVAIL / ATMP'
                : ''}
          </div>

          {!(openViewDiseaseDialog && viewingDisease) && viewingAccident && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Identification</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}><Typography><strong>Agent :</strong> {viewingAccident.agent_name} ({viewingAccident.agent_matricule})</Typography></Grid>
                <Grid item xs={6}><Typography><strong>Type :</strong> {viewingAccident.accident_type_display}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>Date et heure :</strong> {new Date(viewingAccident.accident_date).toLocaleString('fr-FR')}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>Lieu :</strong> {viewingAccident.location}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>Gravité :</strong> {viewingAccident.severity_display}</Typography></Grid>
                <Grid item xs={6}><Typography><strong>Statut :</strong> {viewingAccident.status_display}</Typography></Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>Mécanisme</Typography>
              <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{viewingAccident.mechanism || ''}</Typography>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Description</Typography>
              <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{viewingAccident.description || ''}</Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {viewingAccident.return_to_work_date && (
                  <Grid item xs={6}><Typography><strong>Date de reprise :</strong> {new Date(viewingAccident.return_to_work_date).toLocaleDateString('fr-FR')}</Typography></Grid>
                )}
                {viewingAccident.ipp != null && (
                  <Grid item xs={6}><Typography><strong>IPP :</strong> {viewingAccident.ipp} %</Typography></Grid>
                )}
                {viewingAccident.work_stoppage && (
                  <Grid item xs={6}><Typography><strong>Arrêt de travail :</strong> {viewingAccident.work_stoppage_days ?? 0} jour(s)</Typography></Grid>
                )}
              </Grid>
              {viewingAccident.root_causes && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Causes racines</Typography>
                  <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{viewingAccident.root_causes}</Typography>
                </>
              )}
              {viewingAccident.corrective_actions && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Actions correctives</Typography>
                  <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{viewingAccident.corrective_actions}</Typography>
                </>
              )}
              {viewingAccident.preventive_actions && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Actions préventives</Typography>
                  <Typography sx={{ whiteSpace: 'pre-wrap' }}>{viewingAccident.preventive_actions}</Typography>
                </>
              )}
            </Box>
          )}

          {(openViewDiseaseDialog && viewingDisease) && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>1) Identification</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Agent :</strong> {viewingDisease.agent_name} ({viewingDisease.agent_matricule})</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Entreprise :</strong> {viewingDisease.agent_company || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Type :</strong> {viewingDisease.disease_type_display || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Statut :</strong> {viewingDisease.status_display || '-'}</Typography>
                  </Grid>
                  {viewingDisease.declared_by_name && (
                    <Grid item xs={12} sm={6}>
                      <Typography><strong>Déclarée par :</strong> {viewingDisease.declared_by_name}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>2) Maladie</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography><strong>Désignation :</strong> {viewingDisease.disease_name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>N° de tableau :</strong> {viewingDisease.table_number ?? '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Premiers symptômes :</strong> {viewingDisease.first_symptoms_date ? new Date(viewingDisease.first_symptoms_date).toLocaleDateString('fr-FR') : '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Date de diagnostic :</strong> {viewingDisease.diagnosis_date ? new Date(viewingDisease.diagnosis_date).toLocaleDateString('fr-FR') : '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>Durée d'absence :</strong> {viewingDisease.return_delay != null ? `${viewingDisease.return_delay} jour(s)` : '-'}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>3) Exposition</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Début :</strong>{' '}
                      {viewingDisease.exposure_start_date ? new Date(viewingDisease.exposure_start_date).toLocaleDateString('fr-FR') : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Fin :</strong>{' '}
                      {viewingDisease.exposure_end_date ? new Date(viewingDisease.exposure_end_date).toLocaleDateString('fr-FR') : '-'}
                      {viewingDisease.exposure_duration_days != null ? ` (${viewingDisease.exposure_duration_days} j)` : ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mt: 1 }}>
                      Facteurs d'exposition
                    </Typography>
                    <Box
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        p: 2,
                        minHeight: '48px',
                      }}
                    >
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>
                        {viewingDisease.exposure_factors || '—'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>4) Suivi / Traitement</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Suivi médical</Typography>
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, minHeight: '48px' }}>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{viewingDisease.medical_follow_up || '—'}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Traitement</Typography>
                    <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1, p: 2, minHeight: '48px' }}>
                      <Typography sx={{ whiteSpace: 'pre-wrap' }}>{viewingDisease.treatment || '—'}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 1 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>5) Reconnaissance</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography>
                      <strong>Date de reconnaissance :</strong>{' '}
                      {viewingDisease.recognition_date ? new Date(viewingDisease.recognition_date).toLocaleDateString('fr-FR') : '-'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography><strong>N° de reconnaissance :</strong> {viewingDisease.recognition_number || '-'}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #ccc' }}>
            <Typography variant="caption">Document confidentiel — Secret médical</Typography>
          </Box>
        </Box>
      )}

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
