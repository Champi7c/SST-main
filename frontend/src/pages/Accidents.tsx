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
  IconButton,
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
} from '@mui/icons-material'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

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
  circumstances: string
  description: string
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
  disease_name: string
  disease_code?: string
  first_symptoms_date: string
  diagnosis_date?: string
  status: string
  status_display: string
  exposure_period?: string
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
  const [editingAccident, setEditingAccident] = useState<WorkAccident | null>(null)
  const [viewingAccident, setViewingAccident] = useState<WorkAccident | null>(null)
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
    circumstances: '',
    description: '',
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
        circumstances: accident.circumstances,
        description: accident.description,
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
        circumstances: '',
        description: '',
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
    if (!Number.isFinite(agentId) || !formData.accident_date?.trim() || !formData.location?.trim() || !formData.circumstances?.trim() || !formData.description?.trim()) {
      showSnackbar('Veuillez remplir agent, date, lieu, circonstances et description.', 'error')
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
        circumstances: formData.circumstances.trim(),
        description: formData.description.trim(),
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
      } else {
        await client.post('/accidents/work-accidents/', data)
        showSnackbar('Accident déclaré avec succès', 'success')
      }
      handleCloseDialog()
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

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const canManage = user?.role ? ['super_admin', 'medecin', 'rh', 'hse'].includes(user.role) : false

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Accidents de travail & Maladies professionnelles</Typography>
        {canManage && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Déclarer un accident
          </Button>
        )}
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
          <Tab label="Accidents de travail" />
          <Tab label="Maladies professionnelles" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box display="flex" gap={2} mb={2}>
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Agent</TableCell>
                  <TableCell>Maladie</TableCell>
                  <TableCell>Premiers symptômes</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Reconnaissance</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {diseases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
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
                        <IconButton size="small">
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
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
                label="Circonstances *"
                multiline
                rows={3}
                value={formData.circumstances}
                onChange={(e) => setFormData({ ...formData, circumstances: e.target.value })}
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
                <Typography variant="subtitle2" color="text.secondary">Circonstances</Typography>
                <Typography variant="body1">{viewingAccident.circumstances}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                <Typography variant="body1">{viewingAccident.description}</Typography>
              </Grid>
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
