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
  Divider,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  EventBusy as EventBusyIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface MedicalVisit {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  visit_type: number
  visit_type_name: string
  scheduled_date: string
  actual_date?: string
  status: string
  status_display: string
  reason?: string
  temperature?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  heart_rate?: number
  blood_sugar?: number
  weight?: number
  height?: number
  diagnosis?: string
  prescriptions?: string
  recommendations?: string
  decision?: string
  decision_display?: string
  decision_details?: string
  alert_rh: boolean
  alert_direction: boolean
  alert_reason?: string
  rescheduled_date?: string
  rescheduling_reason?: string
  doctor?: number
  doctor_name?: string
  nurse?: number
  nurse_name?: string
  notes?: string
  created_at: string
  updated_at: string
}

interface VisitType {
  id: number
  name: string
  code: string
  description?: string
}

interface Agent {
  id: number
  matricule: string
  full_name: string
  company_name: string
}

function TabPanel(props: { children?: React.ReactNode; index: number; value: number }) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function Visits() {
  const [visits, setVisits] = useState<MedicalVisit[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openViewDialog, setOpenViewDialog] = useState(false)
  const [editingVisit, setEditingVisit] = useState<MedicalVisit | null>(null)
  const [viewingVisit, setViewingVisit] = useState<MedicalVisit | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const { hasMedicalAccess, user } = useAuth()

  // Données pour les formulaires
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Formulaire
  const [formData, setFormData] = useState({
    agent: '',
    visit_type: '',
    scheduled_date: '',
    scheduled_time: '',
    reason: '',
    importance: 'normal',
  })

  // Formulaire d'enregistrement
  const [recordData, setRecordData] = useState({
    actual_date: '',
    actual_time: '',
    temperature: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    blood_sugar: '',
    weight: '',
    height: '',
    diagnosis: '',
    prescriptions: '',
    recommendations: '',
    decision: '',
    decision_details: '',
    alert_rh: false,
    alert_direction: false,
    alert_reason: '',
    notes: '',
  })

  useEffect(() => {
    fetchVisits()
    fetchVisitTypes()
    fetchAgents()
  }, [statusFilter])

  const fetchVisits = async () => {
    try {
      const params: any = {}
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      const response = await client.get('/visits/visits/', { params })
      setVisits(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des visites:', error)
      showSnackbar('Erreur lors du chargement des visites', 'error')
    } finally {
      setLoading(false)
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

  const fetchAgents = async () => {
    try {
      const response = await client.get('/medical/agents/?is_active=true')
      const data = response.data.results || response.data
      setAgents(data.filter((a: any) => !a.is_archived))
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error)
    }
  }

  const handleOpenDialog = (visit?: MedicalVisit) => {
    if (visit) {
      setEditingVisit(visit)
      const scheduledDate = new Date(visit.scheduled_date)
      setFormData({
        agent: visit.agent.toString(),
        visit_type: visit.visit_type.toString(),
        scheduled_date: scheduledDate.toISOString().split('T')[0],
        scheduled_time: scheduledDate.toTimeString().slice(0, 5),
        reason: visit.reason || '',
        importance: 'normal',
      })
      
      if (visit.status === 'completed' && visit.actual_date) {
        const actualDate = new Date(visit.actual_date)
        setRecordData({
          actual_date: actualDate.toISOString().split('T')[0],
          actual_time: actualDate.toTimeString().slice(0, 5),
          temperature: visit.temperature?.toString() || '',
          blood_pressure_systolic: visit.blood_pressure_systolic?.toString() || '',
          blood_pressure_diastolic: visit.blood_pressure_diastolic?.toString() || '',
          heart_rate: visit.heart_rate?.toString() || '',
          blood_sugar: visit.blood_sugar?.toString() || '',
          weight: visit.weight?.toString() || '',
          height: visit.height?.toString() || '',
          diagnosis: visit.diagnosis || '',
          prescriptions: visit.prescriptions || '',
          recommendations: visit.recommendations || '',
          decision: visit.decision || '',
          decision_details: visit.decision_details || '',
          alert_rh: visit.alert_rh || false,
          alert_direction: visit.alert_direction || false,
          alert_reason: visit.alert_reason || '',
          notes: visit.notes || '',
        })
      }
      setTabValue(0)
    } else {
      setEditingVisit(null)
      setFormData({
        agent: '',
        visit_type: '',
        scheduled_date: '',
        scheduled_time: '',
        reason: '',
        importance: 'normal',
      })
      setRecordData({
        actual_date: '',
        actual_time: '',
        temperature: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        blood_sugar: '',
        weight: '',
        height: '',
        diagnosis: '',
        prescriptions: '',
        recommendations: '',
        decision: '',
        decision_details: '',
        alert_rh: false,
        alert_direction: false,
        alert_reason: '',
        notes: '',
      })
      setTabValue(0)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingVisit(null)
  }

  const handleViewVisit = (visit: MedicalVisit) => {
    setViewingVisit(visit)
    setOpenViewDialog(true)
  }

  const handleSubmit = async () => {
    const agentId = formData.agent ? parseInt(formData.agent, 10) : NaN
    const visitTypeId = formData.visit_type ? parseInt(formData.visit_type, 10) : NaN
    const time = formData.scheduled_time?.trim() || '09:00'
    if (!Number.isFinite(agentId) || !Number.isFinite(visitTypeId) || !formData.scheduled_date?.trim()) {
      showSnackbar('Veuillez remplir agent, type de visite et date programmée.', 'error')
      return
    }
    try {
      const scheduledDateTime = `${formData.scheduled_date}T${time}:00`
      const data = {
        agent: agentId,
        visit_type: visitTypeId,
        scheduled_date: scheduledDateTime,
        reason: formData.reason?.trim() || null,
        status: 'scheduled',
      }

      if (editingVisit) {
        await client.put(`/visits/visits/${editingVisit.id}/`, data)
        showSnackbar('Visite modifiée avec succès', 'success')
      } else {
        await client.post('/visits/visits/', data)
        showSnackbar('Visite programmée avec succès', 'success')
      }
      handleCloseDialog()
      fetchVisits()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleRecordVisit = async () => {
    if (!editingVisit) return
    const ad = recordData.actual_date?.trim()
    const at = recordData.actual_time?.trim() || '09:00'
    const actualDateTime = ad ? `${ad}T${at}:00` : new Date().toISOString()
    try {
      const data: Record<string, unknown> = {
        agent: editingVisit.agent,
        visit_type: editingVisit.visit_type,
        scheduled_date: editingVisit.scheduled_date,
        status: 'completed',
        actual_date: actualDateTime,
        temperature: recordData.temperature ? parseFloat(recordData.temperature) : null,
        blood_pressure_systolic: recordData.blood_pressure_systolic ? parseInt(recordData.blood_pressure_systolic, 10) : null,
        blood_pressure_diastolic: recordData.blood_pressure_diastolic ? parseInt(recordData.blood_pressure_diastolic, 10) : null,
        heart_rate: recordData.heart_rate ? parseInt(recordData.heart_rate, 10) : null,
        blood_sugar: recordData.blood_sugar ? parseFloat(recordData.blood_sugar) : null,
        weight: recordData.weight ? parseFloat(recordData.weight) : null,
        height: recordData.height ? parseFloat(recordData.height) : null,
        diagnosis: recordData.diagnosis?.trim() || null,
        prescriptions: recordData.prescriptions?.trim() || null,
        recommendations: recordData.recommendations?.trim() || null,
        decision: recordData.decision || null,
        decision_details: recordData.decision_details?.trim() || null,
        alert_rh: recordData.alert_rh,
        alert_direction: recordData.alert_direction,
        alert_reason: recordData.alert_reason?.trim() || null,
        notes: recordData.notes?.trim() || null,
        reason: null,
      }
      await client.put(`/visits/visits/${editingVisit.id}/`, data)
      await client.post(`/visits/visits/${editingVisit.id}/complete/`)
      showSnackbar('Visite enregistrée avec succès', 'success')
      handleCloseDialog()
      fetchVisits()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleMarkAbsent = async (visit: MedicalVisit) => {
    const reason = window.prompt('Raison de l\'absence:')
    if (!reason) return
    try {
      await client.post(`/visits/visits/${visit.id}/mark_absent/`, { reason })
      showSnackbar('Absence enregistrée', 'success')
      fetchVisits()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleReschedule = async (visit: MedicalVisit) => {
    const newDate = window.prompt('Nouvelle date (YYYY-MM-DD):')
    const reason = window.prompt('Raison de la reprogrammation:')
    if (!newDate) return
    try {
      await client.post(`/visits/visits/${visit.id}/reschedule/`, {
        rescheduled_date: `${newDate}T${formData.scheduled_time || '09:00'}:00`,
        rescheduling_reason: reason || '',
      })
      showSnackbar('Visite reprogrammée', 'success')
      fetchVisits()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleCancel = async (visit: MedicalVisit) => {
    if (!window.confirm('Êtes-vous sûr de vouloir annuler cette visite ?')) return
    const reason = window.prompt('Raison de l\'annulation:')
    
    try {
      await client.post(`/visits/visits/${visit.id}/cancel/`, { reason: reason || '' })
      showSnackbar('Visite annulée', 'success')
      fetchVisits()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleDeleteVisit = async (visit: MedicalVisit) => {
    if (!window.confirm(`Supprimer la visite du ${new Date(visit.scheduled_date).toLocaleDateString('fr-FR')} (${visit.agent_name}) ?`)) return
    try {
      await client.delete(`/visits/visits/${visit.id}/`)
      showSnackbar('Visite supprimée', 'success')
      fetchVisits()
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

  const canManageVisits = user?.role ? ['super_admin', 'medecin', 'infirmier', 'admin'].includes(user.role) : false
  const isRH = user?.role === 'rh'

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success'
      case 'scheduled': return 'info'
      case 'cancelled': return 'error'
      case 'absent': return 'warning'
      case 'rescheduled': return 'default'
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Visites médicales</Typography>
        <Box>
          <FormControl sx={{ minWidth: 150, mr: 2 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Statut"
            >
              <MenuItem value="all">Tous</MenuItem>
              <MenuItem value="scheduled">Programmées</MenuItem>
              <MenuItem value="completed">Réalisées</MenuItem>
              <MenuItem value="absent">Absents</MenuItem>
              <MenuItem value="cancelled">Annulées</MenuItem>
              <MenuItem value="rescheduled">Reprogrammées</MenuItem>
            </Select>
          </FormControl>
          {canManageVisits && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Programmer une visite
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date programmée</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Statut</TableCell>
              {!isRH && <TableCell>Décision</TableCell>}
              {isRH && <TableCell>Alerte RH</TableCell>}
              <TableCell>Médecin</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visits.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isRH ? 7 : 8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Aucune visite trouvée
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>
                    {new Date(visit.scheduled_date).toLocaleString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {visit.agent_name} ({visit.agent_matricule})
                  </TableCell>
                  <TableCell>{visit.visit_type_name}</TableCell>
                  <TableCell>
                    <Chip label={visit.status_display} size="small" color={getStatusColor(visit.status)} />
                  </TableCell>
                  {!isRH && (
                    <TableCell>
                      {visit.decision_display || '-'}
                    </TableCell>
                  )}
                  {isRH && (
                    <TableCell>
                      {visit.alert_rh && <Chip label="Alerte" color="error" size="small" />}
                    </TableCell>
                  )}
                  <TableCell>{visit.doctor_name || '-'}</TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleViewVisit(visit)}>Voir</Button>
                      {canManageVisits && visit.status === 'scheduled' && (
                        <>
                          <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenDialog(visit)}>Modifier</Button>
                          <Button size="small" variant="outlined" startIcon={<EventBusyIcon />} onClick={() => handleMarkAbsent(visit)}>Absent</Button>
                          <Button size="small" variant="outlined" startIcon={<ScheduleIcon />} onClick={() => handleReschedule(visit)}>Reprogrammer</Button>
                          <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDeleteVisit(visit)}>Supprimer</Button>
                          <Button size="small" variant="outlined" startIcon={<CancelIcon />} onClick={() => handleCancel(visit)}>Annuler</Button>
                        </>
                      )}
                      {hasMedicalAccess && visit.status === 'scheduled' && (
                        <Button size="small" variant="outlined" color="success" startIcon={<CheckCircleIcon />} onClick={() => { handleOpenDialog(visit); setTabValue(1); }}>Enregistrer</Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de programmation/enregistrement */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingVisit ? (tabValue === 0 ? 'Modifier la visite' : 'Enregistrer la visite') : 'Programmer une visite'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
            <Tab label="Programmation" disabled={!!editingVisit && editingVisit.status === 'completed'} />
            {editingVisit && hasMedicalAccess && <Tab label="Enregistrement" />}
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Agent *</InputLabel>
                  <Select
                    value={formData.agent}
                    onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                    label="Agent *"
                    disabled={!!editingVisit}
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
                  <InputLabel>Type de visite *</InputLabel>
                  <Select
                    value={formData.visit_type}
                    onChange={(e) => setFormData({ ...formData, visit_type: e.target.value })}
                    label="Type de visite *"
                  >
                    {visitTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date *"
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Heure *"
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Raison / Motif"
                  multiline
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {editingVisit && hasMedicalAccess && (
            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Date réelle
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    value={recordData.actual_date}
                    onChange={(e) => setRecordData({ ...recordData, actual_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Heure"
                    type="time"
                    value={recordData.actual_time}
                    onChange={(e) => setRecordData({ ...recordData, actual_time: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Constantes médicales
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Température (°C)"
                    type="number"
                    value={recordData.temperature}
                    onChange={(e) => setRecordData({ ...recordData, temperature: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Tension systolique"
                    type="number"
                    value={recordData.blood_pressure_systolic}
                    onChange={(e) => setRecordData({ ...recordData, blood_pressure_systolic: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Tension diastolique"
                    type="number"
                    value={recordData.blood_pressure_diastolic}
                    onChange={(e) => setRecordData({ ...recordData, blood_pressure_diastolic: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Fréquence cardiaque"
                    type="number"
                    value={recordData.heart_rate}
                    onChange={(e) => setRecordData({ ...recordData, heart_rate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Glycémie (g/L)"
                    type="number"
                    value={recordData.blood_sugar}
                    onChange={(e) => setRecordData({ ...recordData, blood_sugar: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Poids (kg)"
                    type="number"
                    value={recordData.weight}
                    onChange={(e) => setRecordData({ ...recordData, weight: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Taille (cm)"
                    type="number"
                    value={recordData.height}
                    onChange={(e) => setRecordData({ ...recordData, height: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Observations médicales
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Diagnostic"
                    multiline
                    rows={4}
                    value={recordData.diagnosis}
                    onChange={(e) => setRecordData({ ...recordData, diagnosis: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Prescriptions"
                    multiline
                    rows={3}
                    value={recordData.prescriptions}
                    onChange={(e) => setRecordData({ ...recordData, prescriptions: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Recommandations"
                    multiline
                    rows={3}
                    value={recordData.recommendations}
                    onChange={(e) => setRecordData({ ...recordData, recommendations: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Décision médicale
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Décision</InputLabel>
                    <Select
                      value={recordData.decision}
                      onChange={(e) => setRecordData({ ...recordData, decision: e.target.value })}
                      label="Décision"
                    >
                      <MenuItem value="apte">Apte</MenuItem>
                      <MenuItem value="apte_avec_reserves">Apte avec réserves</MenuItem>
                      <MenuItem value="inapte_temporaire">Inapte temporaire</MenuItem>
                      <MenuItem value="inapte_permanent">Inapte permanent</MenuItem>
                      <MenuItem value="inapte_poste">Inapte au poste</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Détails de la décision"
                    multiline
                    rows={2}
                    value={recordData.decision_details}
                    onChange={(e) => setRecordData({ ...recordData, decision_details: e.target.value })}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Alertes
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={recordData.alert_rh}
                        onChange={(e) => setRecordData({ ...recordData, alert_rh: e.target.checked })}
                      />
                    }
                    label="Alerte RH"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={recordData.alert_direction}
                        onChange={(e) => setRecordData({ ...recordData, alert_direction: e.target.checked })}
                      />
                    }
                    label="Alerte Direction"
                  />
                </Grid>
                {recordData.alert_rh || recordData.alert_direction ? (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Raison de l'alerte"
                      multiline
                      rows={2}
                      value={recordData.alert_reason}
                      onChange={(e) => setRecordData({ ...recordData, alert_reason: e.target.value })}
                    />
                  </Grid>
                ) : null}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    multiline
                    rows={3}
                    value={recordData.notes}
                    onChange={(e) => setRecordData({ ...recordData, notes: e.target.value })}
                  />
                </Grid>
              </Grid>
            </TabPanel>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          {tabValue === 0 ? (
            <Button onClick={handleSubmit} variant="contained" color="primary">
              {editingVisit ? 'Modifier' : 'Programmer'}
            </Button>
          ) : (
            <Button onClick={handleRecordVisit} variant="contained" color="success">
              Enregistrer la visite
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog de visualisation */}
      <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Détails de la visite</DialogTitle>
        <DialogContent>
          {viewingVisit && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Agent</Typography>
                <Typography variant="body1">{viewingVisit.agent_name} ({viewingVisit.agent_matricule})</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                <Typography variant="body1">{viewingVisit.visit_type_name}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Date programmée</Typography>
                <Typography variant="body1">{new Date(viewingVisit.scheduled_date).toLocaleString('fr-FR')}</Typography>
              </Grid>
              {viewingVisit.actual_date && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date réelle</Typography>
                  <Typography variant="body1">{new Date(viewingVisit.actual_date).toLocaleString('fr-FR')}</Typography>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Statut</Typography>
                <Chip label={viewingVisit.status_display} size="small" color={getStatusColor(viewingVisit.status)} />
              </Grid>
              {!isRH && viewingVisit.decision && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Décision</Typography>
                  <Typography variant="body1">{viewingVisit.decision_display}</Typography>
                </Grid>
              )}
              {!isRH && viewingVisit.diagnosis && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Diagnostic</Typography>
                  <Typography variant="body1">{viewingVisit.diagnosis}</Typography>
                </Grid>
              )}
              {viewingVisit.reason && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Raison</Typography>
                  <Typography variant="body1">{viewingVisit.reason}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Fermer</Button>
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
