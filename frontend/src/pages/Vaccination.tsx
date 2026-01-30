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
import { Add as AddIcon, CheckCircle as CheckIcon } from '@mui/icons-material'
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
  next_due_date?: string
  batch_number?: string
  is_due: boolean
  notes?: string
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
  notes?: string
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
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [siteFilter, setSiteFilter] = useState<string>('')
  const [serviceFilter, setServiceFilter] = useState<string>('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [services, setServices] = useState<Service[]>([])
  const { hasMedicalAccess } = useAuth()

  const [formData, setFormData] = useState({
    agent: '',
    vaccine: '',
    vaccination_date: '',
    next_due_date: '',
    batch_number: '',
    notes: '',
  })
  const [contraindicationForm, setContraindicationForm] = useState({
    agent: '',
    vaccine: '',
    reason: '',
    notes: '',
  })

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
      vaccine: '',
      vaccination_date: new Date().toISOString().split('T')[0],
      next_due_date: '',
      batch_number: '',
      notes: '',
    })
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    try {
      await client.post('/vaccination/vaccinations/', {
        agent: parseInt(formData.agent),
        vaccine: parseInt(formData.vaccine),
        vaccination_date: formData.vaccination_date,
        next_due_date: formData.next_due_date || null,
        batch_number: formData.batch_number || null,
        notes: formData.notes || null,
      })
      showSnackbar('Vaccination enregistrée', 'success')
      setOpenDialog(false)
      fetchVaccinations()
      fetchAlerts()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur lors de l\'enregistrement', 'error')
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
    setContraindicationForm({ agent: '', vaccine: '', reason: '', notes: '' })
    setOpenContraindicationDialog(true)
  }

  const handleSubmitContraindication = async () => {
    try {
      await client.post('/vaccination/contraindications/', {
        agent: parseInt(contraindicationForm.agent),
        vaccine: parseInt(contraindicationForm.vaccine),
        reason: contraindicationForm.reason,
        notes: contraindicationForm.notes || null,
      })
      showSnackbar('Contre-indication enregistrée', 'success')
      setOpenContraindicationDialog(false)
      fetchContraindications()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
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
                        <TableCell>Date</TableCell>
                        <TableCell>Rappel</TableCell>
                        <TableCell>Statut</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vaccinations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="text.secondary">Aucune vaccination</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        vaccinations.map((v) => (
                          <TableRow key={v.id}>
                            <TableCell>{v.agent_name} ({v.agent_matricule})</TableCell>
                            <TableCell>{v.vaccine_name}</TableCell>
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
              {hasMedicalAccess && renderFilters()}
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
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {alerts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="body2" color="text.secondary">Aucune alerte non prise en compte</Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        alerts.map((a) => (
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
                            <TableCell>{new Date(a.due_date).toLocaleDateString('fr-FR')}</TableCell>
                            <TableCell>
                              <IconButton size="small" onClick={() => handleAcknowledgeAlert(a.id)} title="Prise en compte">
                                <CheckIcon fontSize="small" />
                              </IconButton>
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
        </Box>
      </Paper>

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
              <FormControl fullWidth required>
                <InputLabel>Vaccin *</InputLabel>
                <Select
                  value={formData.vaccine}
                  onChange={(e) => setFormData({ ...formData, vaccine: e.target.value })}
                  label="Vaccin *"
                >
                  {vaccines.map((v) => (
                    <MenuItem key={v.id} value={String(v.id)}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de vaccination *"
                type="date"
                value={formData.vaccination_date}
                onChange={(e) => setFormData({ ...formData, vaccination_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de rappel"
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
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
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.agent || !formData.vaccine || !formData.vaccination_date}
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
              <FormControl fullWidth required>
                <InputLabel>Vaccin *</InputLabel>
                <Select
                  value={contraindicationForm.vaccine}
                  onChange={(e) => setContraindicationForm({ ...contraindicationForm, vaccine: e.target.value })}
                  label="Vaccin *"
                >
                  {vaccines.map((v) => (
                    <MenuItem key={v.id} value={String(v.id)}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
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
                value={contraindicationForm.notes}
                onChange={(e) => setContraindicationForm({ ...contraindicationForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenContraindicationDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSubmitContraindication}
            disabled={!contraindicationForm.agent || !contraindicationForm.vaccine || !contraindicationForm.reason}
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
