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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
  IconButton,
} from '@mui/material'
import { Add as AddIcon, CheckCircle as CheckIcon, Print as PrintIcon } from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface Vaccine {
  id: number
  name: string
  code?: string
  validity_period_months?: number
}

interface VaccinationRecord {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  vaccine: number
  vaccine_name: string
  vaccination_date: string
  dose_number?: number
  dose_interval_months?: number
  next_due_date?: string
  batch_number?: string
  is_due: boolean
  observation?: string
}

interface MedicalSurveillanceRecord {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  surveillance_type: string
  surveillance_type_display: string
  start_date: string
  next_review_date?: string
  is_active: boolean
  is_due: boolean
}

interface VaccinationAlertRecord {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  vaccine: number
  vaccine_name: string
  alert_type: string
  alert_type_display: string
  due_date: string
  acknowledged: boolean
  created_at: string
}

interface ContraindicationRecord {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  vaccine: number
  vaccine_name: string
  reason: string
  observation?: string
  recorded_at: string
}

interface Agent {
  id: number
  matricule: string
  full_name: string
}

interface Company {
  id: number
  name: string
}
interface Site {
  id: number
  name: string
}
interface Service {
  id: number
  name: string
}

export default function Vaccination() {
  const [tabValue, setTabValue] = useState(0)
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([])
  const [surveillances, setSurveillances] = useState<MedicalSurveillanceRecord[]>([])
  const [alerts, setAlerts] = useState<VaccinationAlertRecord[]>([])
  const [contraindications, setContraindications] = useState<ContraindicationRecord[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [openContraindicationDialog, setOpenContraindicationDialog] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [carnetPrintData, setCarnetPrintData] = useState<{ agent_name: string; agent_matricule: string; vaccinations: VaccinationRecord[] } | null>(null)
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [siteFilter, setSiteFilter] = useState<string>('')
  const [serviceFilter, setServiceFilter] = useState<string>('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [services, setServices] = useState<Service[]>([])
  const { hasMedicalAccess } = useAuth()

  const [formData, setFormData] = useState({
    agent: '',
    vaccine_name: '',
    vaccination_date: '',
    dose_number: '1',
    dose_interval_months: '1',
    next_due_date: '',
    batch_number: '',
    observation: '',
  })
  const [contraindicationForm, setContraindicationForm] = useState({
    agent: '',
    vaccine_name: '',
    reason: '',
    observation: '',
  })
  const [surveillanceForm, setSurveillanceForm] = useState({
    agent: '',
    surveillance_type: 'quinquennial',
    start_date: new Date().toISOString().split('T')[0],
    next_review_date: '',
    reason: '',
    medical_findings: '',
    recommendations: '',
  })
  const [openSurveillanceDialog, setOpenSurveillanceDialog] = useState(false)

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (companyFilter) {
      client.get(`/companies/sites/?company=${companyFilter}`).then((r) => setSites(r.data.results || r.data)).catch(() => {})
      client.get(`/companies/services/?company=${companyFilter}`).then((r) => setServices(r.data.results || r.data)).catch(() => {})
    } else {
      setSites([])
      setServices([])
      setSiteFilter('')
      setServiceFilter('')
    }
  }, [companyFilter])

  useEffect(() => {
    fetchVaccines()
    fetchVaccinations()
    fetchSurveillances()
    fetchAlerts()
    fetchContraindications()
    fetchAgents()
  }, [companyFilter, siteFilter, serviceFilter, hasMedicalAccess])

  useEffect(() => {
    if (!carnetPrintData) return
    const t = setTimeout(() => {
      window.print()
      setCarnetPrintData(null)
    }, 400)
    return () => clearTimeout(t)
  }, [carnetPrintData])

  const handlePrintCarnet = async (agentId: number, agentName: string, agentMatricule: string) => {
    try {
      const r = await client.get('/vaccination/vaccinations/', { params: { agent: agentId } })
      const list = r.data.results || r.data
      setCarnetPrintData({ agent_name: agentName, agent_matricule: agentMatricule, vaccinations: list || [] })
    } catch (e) {
      showSnackbar('Erreur lors du chargement des vaccinations', 'error')
    }
  }

  const fetchCompanies = async () => {
    try {
      const r = await client.get('/companies/companies/')
      setCompanies(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const buildFilterParams = () => {
    const p: Record<string, string> = {}
    if (companyFilter) p['agent__company'] = companyFilter
    if (siteFilter) p['agent__site'] = siteFilter
    if (serviceFilter) p['agent__service'] = serviceFilter
    return p
  }

  const fetchVaccines = async () => {
    try {
      const r = await client.get('/vaccination/vaccines/')
      setVaccines(r.data.results || r.data)
    } catch (e) {
      console.error(e)
      showSnackbar('Erreur chargement vaccins', 'error')
    }
  }

  const fetchVaccinations = async () => {
    if (!hasMedicalAccess) {
      setLoading(false)
      return
    }
    try {
      const params = buildFilterParams()
      const r = await client.get('/vaccination/vaccinations/', { params })
      setVaccinations(r.data.results || r.data)
    } catch (e) {
      console.error(e)
      showSnackbar('Erreur chargement vaccinations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchSurveillances = async () => {
    if (!hasMedicalAccess) return
    try {
      const params = { ...buildFilterParams(), is_active: 'true' }
      const r = await client.get('/vaccination/surveillances/', { params })
      setSurveillances(r.data.results || r.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchAlerts = async () => {
    if (!hasMedicalAccess) return
    try {
      const params = { ...buildFilterParams(), acknowledged: 'false' }
      const r = await client.get('/vaccination/alerts/', { params })
      setAlerts(r.data.results || r.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchContraindications = async () => {
    if (!hasMedicalAccess) return
    try {
      const params = buildFilterParams()
      const r = await client.get('/vaccination/contraindications/', { params })
      setContraindications(r.data.results || r.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchAgents = async () => {
    if (!hasMedicalAccess) return
    try {
      const p: Record<string, string> = { is_active: 'true' }
      if (companyFilter) p['company'] = companyFilter
      if (siteFilter) p['site'] = siteFilter
      if (serviceFilter) p['service'] = serviceFilter
      const r = await client.get('/medical/agents/', { params: p })
      const data = r.data.results || r.data
      setAgents((data as any[]).filter((a: any) => !a.is_archived))
    } catch (e) {
      console.error(e)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleOpenDialog = () => {
    setFormData({
      agent: '',
      vaccine_name: '',
      vaccination_date: new Date().toISOString().split('T')[0],
      dose_number: '1',
      dose_interval_months: '1',
      next_due_date: '',
      batch_number: '',
      observation: '',
    })
    setOpenDialog(true)
  }

  const calculateNextDoseDate = (vaccinationDate: string, doseNumber: string, intervalMonths: string) => {
    if (!vaccinationDate || doseNumber === '3') return '' // Pas de prochaine dose si c'est la 3ème
    
    const date = new Date(vaccinationDate)
    const interval = parseInt(intervalMonths)
    date.setMonth(date.getMonth() + interval)
    return date.toISOString().split('T')[0]
  }

  const handleSubmit = async () => {
    try {
      if (!formData.vaccine_name || !formData.vaccine_name.trim()) {
        showSnackbar('Le nom du vaccin est requis', 'error')
        return
      }
      
      const nextDueDate = formData.next_due_date || calculateNextDoseDate(
        formData.vaccination_date,
        formData.dose_number,
        formData.dose_interval_months
      )
      
      const payload = {
        agent: parseInt(formData.agent),
        vaccine_name_input: formData.vaccine_name.trim(),
        vaccination_date: formData.vaccination_date,
        dose_number: parseInt(formData.dose_number),
        dose_interval_months: parseInt(formData.dose_interval_months),
        next_due_date: nextDueDate || null,
        batch_number: formData.batch_number?.trim() || null,
        observation: formData.observation?.trim() || null,
      }
      
      console.log('Envoi de la vaccination:', payload)
      
      await client.post('/vaccination/vaccinations/', payload)
      showSnackbar('Vaccination enregistrée', 'success')
      setOpenDialog(false)
      fetchVaccinations()
      fetchAlerts()
    } catch (err: any) {
      console.error('Erreur vaccination:', err.response?.data)
      const errorMessage = err.response?.data?.vaccine_name_input?.[0] || 
                          err.response?.data?.detail || 
                          Object.values(err.response?.data || {}).flat().join(', ') ||
                          'Erreur lors de l\'enregistrement'
      showSnackbar(errorMessage, 'error')
    }
  }

  const handleAcknowledgeAlert = async (id: number) => {
    try {
      await client.post(`/vaccination/alerts/${id}/acknowledge/`)
      showSnackbar('Alerte prise en compte', 'success')
      fetchAlerts()
    } catch (e: any) {
      showSnackbar(e.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleOpenContraindicationDialog = () => {
    setContraindicationForm({ agent: '', vaccine_name: '', reason: '', observation: '' })
    setOpenContraindicationDialog(true)
  }

  const handleOpenSurveillanceDialog = () => {
    setSurveillanceForm({
      agent: '',
      surveillance_type: 'quinquennial',
      start_date: new Date().toISOString().split('T')[0],
      next_review_date: '',
      reason: '',
      medical_findings: '',
      recommendations: '',
    })
    setOpenSurveillanceDialog(true)
  }

  const handleSubmitSurveillance = async () => {
    try {
      await client.post('/vaccination/surveillances/', {
        agent: parseInt(surveillanceForm.agent),
        surveillance_type: surveillanceForm.surveillance_type,
        start_date: surveillanceForm.start_date,
        next_review_date: surveillanceForm.next_review_date || null,
        reason: surveillanceForm.reason,
        medical_findings: surveillanceForm.medical_findings || null,
        recommendations: surveillanceForm.recommendations || null,
      })
      showSnackbar('Surveillance médicale enregistrée', 'success')
      setOpenSurveillanceDialog(false)
      fetchSurveillances()
    } catch (err: any) {
      console.error('Erreur surveillance:', err.response?.data)
      const errorMessage = err.response?.data?.detail || 
                          Object.values(err.response?.data || {}).flat().join(', ') ||
                          'Erreur lors de l\'enregistrement'
      showSnackbar(errorMessage, 'error')
    }
  }

  const handleSubmitContraindication = async () => {
    try {
      if (!contraindicationForm.vaccine_name || !contraindicationForm.vaccine_name.trim()) {
        showSnackbar('Le nom du vaccin est requis', 'error')
        return
      }
      
      await client.post('/vaccination/contraindications/', {
        agent: parseInt(contraindicationForm.agent),
        vaccine_name_input: contraindicationForm.vaccine_name.trim(),
        reason: contraindicationForm.reason,
        observation: contraindicationForm.observation?.trim() || null,
      })
      showSnackbar('Contre-indication enregistrée', 'success')
      setOpenContraindicationDialog(false)
      fetchContraindications()
    } catch (err: any) {
      console.error('Erreur contre-indication:', err.response?.data)
      const errorMessage = err.response?.data?.vaccine_name_input?.[0] || 
                          err.response?.data?.detail || 
                          Object.values(err.response?.data || {}).flat().join(', ') ||
                          'Erreur lors de l\'enregistrement'
      showSnackbar(errorMessage, 'error')
    }
  }

  const dueCount = vaccinations.filter((v) => v.is_due).length
  const surveillanceCount = surveillances.filter((s) => s.is_active).length
  const alertsCount = alerts.length

  if (loading && tabValue === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  const renderFilters = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, mb: 2 }}>
      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Entreprise</InputLabel>
        <Select
          value={companyFilter}
          onChange={(e) => {
            setCompanyFilter(e.target.value)
            setSiteFilter('')
            setServiceFilter('')
          }}
          label="Entreprise"
        >
          <MenuItem value="">Toutes</MenuItem>
          {companies.map((c) => (
            <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }} disabled={!companyFilter}>
        <InputLabel>Site</InputLabel>
        <Select
          value={siteFilter}
          onChange={(e) => { setSiteFilter(e.target.value); setServiceFilter('') }}
          label="Site"
        >
          <MenuItem value="">Tous</MenuItem>
          {sites.map((s) => (
            <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }} disabled={!companyFilter}>
        <InputLabel>Service</InputLabel>
        <Select value={serviceFilter} onChange={(e) => setServiceFilter(e.target.value)} label="Service">
          <MenuItem value="">Tous</MenuItem>
          {services.map((s) => (
            <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  )

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Vaccination</Typography>
        {hasMedicalAccess && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenDialog}>
            Enregistrer une vaccination
          </Button>
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Vaccinations</Typography>
              <Typography variant="h4">{vaccinations.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Rappels à échéance</Typography>
              <Typography variant="h4" color={dueCount > 0 ? 'error.main' : 'text.primary'}>{dueCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Surveillances actives</Typography>
              <Typography variant="h4">{surveillanceCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Alertes non prises en compte</Typography>
              <Typography variant="h4" color={alertsCount > 0 ? 'warning.main' : 'text.primary'}>{alertsCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Vaccinations" />
          <Tab label="Vaccins" />
          <Tab label="Surveillances" />
          <Tab label="Alertes" />
          <Tab label="Contre-indications" />
          <Tab label="Carnets de vaccination" />
        </Tabs>

        <Box sx={{ px: 2, pb: 2 }}>
          {tabValue === 0 && (
            <>
              {renderFilters()}
              {!hasMedicalAccess ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                  Accès aux données de vaccination réservé au personnel médical.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell>Vaccin</TableCell>
                        <TableCell>Dose</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Rappel</TableCell>
                        <TableCell>Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vaccinations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary">Aucune vaccination</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        vaccinations.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell>{v.agent_name} ({v.agent_matricule})</TableCell>
                            <TableCell>{v.vaccine_name}</TableCell>
                            <TableCell>
                              {v.dose_number ? `${v.dose_number}ère dose` : '–'}
                              {v.dose_interval_months && ` (${v.dose_interval_months} mois)`}
                            </TableCell>
                            <TableCell>{new Date(v.vaccination_date).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell>{v.next_due_date ? new Date(v.next_due_date).toLocaleDateString('fr-FR') : '–'}</TableCell>
                            <TableCell>
                              {v.is_due ? (
                                <Chip label="Rappel à faire" size="small" color="error" />
                              ) : (
                                <Chip label="À jour" size="small" color="success" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {tabValue === 1 && (
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Validité (mois)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaccines.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.name}</TableCell>
                      <TableCell>{v.code || '–'}</TableCell>
                      <TableCell>{v.validity_period_months ?? '–'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {tabValue === 2 && (
            <>
              {hasMedicalAccess && (
                <>
                  {renderFilters()}
                  <Button startIcon={<AddIcon />} variant="outlined" sx={{ mb: 2 }} onClick={handleOpenSurveillanceDialog}>
                    Ajouter une surveillance médicale
                  </Button>
                </>
              )}
              {!hasMedicalAccess ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                  Accès aux surveillances médicales réservé au personnel médical.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Début</TableCell>
                        <TableCell>Prochaine revue</TableCell>
                        <TableCell>Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {surveillances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="text.secondary">Aucune surveillance active</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        surveillances.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>{s.agent_name} ({s.agent_matricule})</TableCell>
                            <TableCell>{s.surveillance_type_display}</TableCell>
                            <TableCell>{new Date(s.start_date).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell>{s.next_review_date ? new Date(s.next_review_date).toLocaleDateString('fr-FR') : '–'}</TableCell>
                            <TableCell>
                              {s.is_due ? (
                                <Chip label="Revue à faire" size="small" color="warning" />
                              ) : (
                                <Chip label="Actif" size="small" color="success" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {tabValue === 3 && (
            <>
              {hasMedicalAccess && renderFilters()}
              {!hasMedicalAccess ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                  Accès aux alertes vaccination réservé au personnel médical.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell>Vaccin</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Date rappel</TableCell>
                        <TableCell>Retard</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alerts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <Typography variant="body2" color="text.secondary">Aucune alerte non prise en compte</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        alerts.map((a) => {
                          const dueDate = new Date(a.due_date)
                          const today = new Date()
                          const daysDiff = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                          const isOverdue = daysDiff > 0
                          
                          return (
                            <TableRow key={a.id}>
                              <TableCell>{a.agent_name} ({a.agent_matricule})</TableCell>
                              <TableCell>{a.vaccine_name}</TableCell>
                              <TableCell>
                                <Chip
                                  label={a.alert_type_display}
                                  size="small"
                                  color={a.alert_type === 'overdue' ? 'error' : 'warning'}
                                />
                              </TableCell>
                              <TableCell>{dueDate.toLocaleDateString('fr-FR')}</TableCell>
                              <TableCell>
                                {isOverdue ? (
                                  <Chip 
                                    label={`${daysDiff} jour${daysDiff > 1 ? 's' : ''} de retard`} 
                                    size="small" 
                                    color="error" 
                                  />
                                ) : (
                                  <Chip 
                                    label={`Dans ${Math.abs(daysDiff)} jour${Math.abs(daysDiff) > 1 ? 's' : ''}`} 
                                    size="small" 
                                    color="warning" 
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                <IconButton size="small" onClick={() => handleAcknowledgeAlert(a.id)} title="Prise en compte">
                                  <CheckIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {tabValue === 4 && (
            <>
              {hasMedicalAccess && (
                <>
                  {renderFilters()}
                  <Button startIcon={<AddIcon />} variant="outlined" sx={{ mb: 2 }} onClick={handleOpenContraindicationDialog}>
                    Ajouter une contre-indication
                  </Button>
                </>
              )}
              {!hasMedicalAccess ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                  Accès aux contre-indications réservé au personnel médical.
                </Typography>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Agent</TableCell>
                        <TableCell>Vaccin</TableCell>
                        <TableCell>Raison</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {contraindications.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center">
                            <Typography variant="body2" color="text.secondary">Aucune contre-indication</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        contraindications.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell>{c.agent_name} ({c.agent_matricule})</TableCell>
                            <TableCell>{c.vaccine_name}</TableCell>
                            <TableCell>{c.reason}</TableCell>
                            <TableCell>{new Date(c.recorded_at).toLocaleDateString('fr-FR')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {tabValue === 5 && (
            <>
              {!hasMedicalAccess ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                  Accès aux carnets de vaccination réservé au personnel médical.
                </Typography>
              ) : (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Sélectionnez un agent pour imprimer son carnet de vaccination.
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Agent</TableCell>
                          <TableCell>Matricule</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {agents.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} align="center">
                              <Typography variant="body2" color="text.secondary">Aucun agent ou charger les agents via les filtres.</Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          agents.map((a) => (
                            <TableRow key={a.id}>
                              <TableCell>{a.full_name}</TableCell>
                              <TableCell>{a.matricule}</TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<PrintIcon />}
                                  onClick={() => handlePrintCarnet(a.id, a.full_name, a.matricule)}
                                >
                                  Imprimer le carnet
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </>
          )}
        </Box>
      </Paper>

      {carnetPrintData && (
        <Box
          id="carnet-print-section"
          className="print-section carnet-print-section"
          sx={{
            position: 'absolute',
            left: -9999,
            top: 0,
            width: '210mm',
            padding: '20mm',
            backgroundColor: '#fff',
            '@media print': {
              left: 0,
              top: 0,
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
            CARNET DE VACCINATION — SERVICE DE SANTÉ AU TRAVAIL
          </div>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {carnetPrintData.agent_name} — Matricule : {carnetPrintData.agent_matricule}
            </Typography>
          </Box>
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Vaccin</strong></TableCell>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Rappel</strong></TableCell>
                  <TableCell><strong>Dose</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {carnetPrintData.vaccinations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>Aucune vaccination enregistrée</TableCell>
                  </TableRow>
                ) : (
                  carnetPrintData.vaccinations
                    .sort((a, b) => new Date(b.vaccination_date).getTime() - new Date(a.vaccination_date).getTime())
                    .map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>{v.vaccine_name}</TableCell>
                        <TableCell>{new Date(v.vaccination_date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{v.next_due_date ? new Date(v.next_due_date).toLocaleDateString('fr-FR') : '–'}</TableCell>
                        <TableCell>{v.dose_number ? `${v.dose_number}ère dose` : '–'}</TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Typography variant="caption" sx={{ mt: 2, display: 'block' }}>
            Document confidentiel — Secret médical — Données de vaccination
          </Typography>
        </Box>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enregistrer une vaccination</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={formData.agent}
                  onChange={(e) => setFormData({ ...formData, agent: e.target.value })}
                  label="Agent *"
                >
                  {agents.map((a) => (
                    <MenuItem key={a.id} value={String(a.id)}>{a.full_name} ({a.matricule})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du vaccin *"
                value={formData.vaccine_name}
                onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
                required
                placeholder="Ex: Vaccin contre l'hépatite B"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de vaccination *"
                type="date"
                value={formData.vaccination_date}
                onChange={(e) => {
                  const newDate = e.target.value
                  const nextDue = calculateNextDoseDate(newDate, formData.dose_number, formData.dose_interval_months)
                  setFormData({ ...formData, vaccination_date: newDate, next_due_date: nextDue })
                }}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth required>
                <InputLabel>Numéro de dose *</InputLabel>
                <Select
                  value={formData.dose_number}
                  onChange={(e) => {
                    const newDose = e.target.value
                    const nextDue = calculateNextDoseDate(formData.vaccination_date, newDose, formData.dose_interval_months)
                    setFormData({ ...formData, dose_number: newDose, next_due_date: nextDue })
                  }}
                  label="Numéro de dose *"
                >
                  <MenuItem value="1">1ère dose</MenuItem>
                  <MenuItem value="2">2ème dose</MenuItem>
                  <MenuItem value="3">3ème dose</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth required>
                <InputLabel>Intervalle *</InputLabel>
                <Select
                  value={formData.dose_interval_months}
                  onChange={(e) => {
                    const newInterval = e.target.value
                    const nextDue = calculateNextDoseDate(formData.vaccination_date, formData.dose_number, newInterval)
                    setFormData({ ...formData, dose_interval_months: newInterval, next_due_date: nextDue })
                  }}
                  label="Intervalle *"
                >
                  <MenuItem value="1">1 mois</MenuItem>
                  <MenuItem value="6">6 mois</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de rappel (calculée automatiquement)"
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                disabled={formData.dose_number === '3'}
                helperText={formData.dose_number === '3' ? 'Pas de rappel pour la 3ème dose' : 'Calculée automatiquement selon l\'intervalle'}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Numéro de lot"
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={formData.observation}
                onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.agent || !formData.vaccine_name || !formData.vaccination_date}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openContraindicationDialog} onClose={() => setOpenContraindicationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajouter une contre-indication</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={contraindicationForm.agent}
                  onChange={(e) => setContraindicationForm({ ...contraindicationForm, agent: e.target.value })}
                  label="Agent *"
                >
                  {agents.map((a) => (
                    <MenuItem key={a.id} value={String(a.id)}>{a.full_name} ({a.matricule})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du vaccin *"
                value={contraindicationForm.vaccine_name}
                onChange={(e) => setContraindicationForm({ ...contraindicationForm, vaccine_name: e.target.value })}
                required
                placeholder="Ex: Vaccin contre l'hépatite B"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Raison *"
                multiline
                rows={3}
                value={contraindicationForm.reason}
                onChange={(e) => setContraindicationForm({ ...contraindicationForm, reason: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={contraindicationForm.observation}
                onChange={(e) => setContraindicationForm({ ...contraindicationForm, observation: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContraindicationDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSubmitContraindication}
            disabled={!contraindicationForm.agent || !contraindicationForm.vaccine_name || !contraindicationForm.reason}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Surveillance médicale */}
      <Dialog open={openSurveillanceDialog} onClose={() => setOpenSurveillanceDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Nouvelle surveillance médicale</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={surveillanceForm.agent}
                  onChange={(e) => setSurveillanceForm({ ...surveillanceForm, agent: e.target.value })}
                  label="Agent *"
                >
                  {agents.map((a) => (
                    <MenuItem key={a.id} value={String(a.id)}>{a.full_name} ({a.matricule})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Type de surveillance *</InputLabel>
                <Select
                  value={surveillanceForm.surveillance_type}
                  onChange={(e) => setSurveillanceForm({ ...surveillanceForm, surveillance_type: e.target.value })}
                  label="Type de surveillance *"
                >
                  <MenuItem value="quinquennial">Quinquennale</MenuItem>
                  <MenuItem value="specific">Spécifique</MenuItem>
                  <MenuItem value="chronic">Maladie chronique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de début *"
                type="date"
                value={surveillanceForm.start_date}
                onChange={(e) => setSurveillanceForm({ ...surveillanceForm, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de prochaine révision"
                type="date"
                value={surveillanceForm.next_review_date}
                onChange={(e) => setSurveillanceForm({ ...surveillanceForm, next_review_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Raison de la surveillance *"
                multiline
                rows={3}
                value={surveillanceForm.reason}
                onChange={(e) => setSurveillanceForm({ ...surveillanceForm, reason: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Constats médicaux"
                multiline
                rows={3}
                value={surveillanceForm.medical_findings}
                onChange={(e) => setSurveillanceForm({ ...surveillanceForm, medical_findings: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Recommandations"
                multiline
                rows={3}
                value={surveillanceForm.recommendations}
                onChange={(e) => setSurveillanceForm({ ...surveillanceForm, recommendations: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSurveillanceDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSubmitSurveillance}
            disabled={!surveillanceForm.agent || !surveillanceForm.reason || !surveillanceForm.start_date}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
