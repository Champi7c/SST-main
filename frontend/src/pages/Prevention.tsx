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
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface RiskCategory {
  id: number
  name: string
  code?: string
  category_type?: string
}

interface Risk {
  id: number
  name: string
  description: string
  company: number
  company_name: string
  site_name?: string
  service_name?: string
  job_position?: number
  job_position_name?: string
  category_name: string
  severity: string
  severity_display: string
  probability_display: string
  identification_date: string
  is_active: boolean
}

interface PreventiveAction {
  id: number
  risk: number
  risk_name: string
  title: string
  action_type: string
  action_type_display: string
  status: string
  status_display: string
  planned_date: string
  due_date?: string
  completed_date?: string
  responsible_name?: string
}

interface ExposureSheet {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  exposure_period: string
  exposed_risks_details?: { id: number; name: string }[]
}

interface RiskSheet {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  risks_description: string
  preventive_measures?: string
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
interface Agent {
  id: number
  matricule: string
  full_name: string
}

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

export default function Prevention() {
  const [tabValue, setTabValue] = useState(0)
  const [risks, setRisks] = useState<Risk[]>([])
  const [actions, setActions] = useState<PreventiveAction[]>([])
  const [exposureSheets, setExposureSheets] = useState<ExposureSheet[]>([])
  const [riskSheets, setRiskSheets] = useState<RiskSheet[]>([])
  const [categories, setCategories] = useState<RiskCategory[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [openRiskDialog, setOpenRiskDialog] = useState(false)
  const [openActionDialog, setOpenActionDialog] = useState(false)
  const [openFieDialog, setOpenFieDialog] = useState(false)
  const [openFirDialog, setOpenFirDialog] = useState(false)
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [siteFilter, setSiteFilter] = useState<string>('')
  const [serviceFilter, setServiceFilter] = useState<string>('')
  const [indicators, setIndicators] = useState<{
    by_category: { category__name: string; category__id: number; count: number }[]
    by_severity: { severity: string; count: number }[]
    total_risks: number
    actions_total: number
    actions_completed: number
    actions_advancement_rate: number
    actions_overdue: number
    agents_total: number
    with_fie: number
    with_fir: number
    coverage_fie_pct: number
    coverage_fir_pct: number
    risks_linked_at_mp: number
  } | null>(null)
  const { user } = useAuth()

  const [riskForm, setRiskForm] = useState({
    company: '',
    site: '',
    service: '',
    job_position: '',
    category: '',
    name: '',
    description: '',
    severity: 'medium',
    probability: 'medium',
    identification_date: new Date().toISOString().split('T')[0],
  })

  const [actionForm, setActionForm] = useState({
    risk: '',
    action_type: 'preventive',
    title: '',
    description: '',
    planned_date: '',
    due_date: '',
    status: 'planned',
  })

  const [fieForm, setFieForm] = useState({ agent: '', exposure_period: '', exposed_risks: [] as number[] })
  const [firForm, setFirForm] = useState({ agent: '', risks_description: '', preventive_measures: '' })
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', category_type: '', description: '' })

  const canManage = user?.role ? ['super_admin', 'admin', 'consultant', 'hse', 'direction'].includes(user.role) : false

  useEffect(() => {
    if (companyFilter) {
      fetchSites(companyFilter)
      fetchServices(companyFilter)
    } else {
      setSites([])
      setServices([])
      setSiteFilter('')
      setServiceFilter('')
    }
  }, [companyFilter])

  useEffect(() => {
    fetchRisks()
    fetchActions()
    fetchExposureSheets()
    fetchRiskSheets()
    fetchCategories()
    fetchCompanies()
    fetchAgents()
    fetchIndicators()
  }, [companyFilter, siteFilter, serviceFilter])

  useEffect(() => {
    if (riskForm.company) {
      fetchSites(riskForm.company)
      fetchServices(riskForm.company)
    }
  }, [riskForm.company])

  const fetchCompanies = async () => {
    try {
      const r = await client.get('/companies/companies/')
      setCompanies(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchSites = async (companyId: string) => {
    try {
      const r = await client.get(`/companies/sites/?company=${companyId}`)
      setSites(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchServices = async (companyId: string) => {
    try {
      const r = await client.get(`/companies/services/?company=${companyId}`)
      setServices(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchCategories = async () => {
    try {
      const r = await client.get('/prevention/risk-categories/')
      setCategories(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchRisks = async () => {
    try {
      const params: Record<string, string> = {}
      if (companyFilter) params['company'] = companyFilter
      if (siteFilter) params['site'] = siteFilter
      if (serviceFilter) params['service'] = serviceFilter
      const r = await client.get('/prevention/risks/', { params })
      setRisks(r.data.results || r.data)
    } catch (e) {
      console.error(e)
      showSnackbar('Erreur chargement risques', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchIndicators = async () => {
    try {
      const params: Record<string, string> = {}
      if (companyFilter) params['company'] = companyFilter
      if (siteFilter) params['site'] = siteFilter
      if (serviceFilter) params['service'] = serviceFilter
      const r = await client.get('/prevention/indicators/', { params })
      setIndicators(r.data)
    } catch (e) {
      console.error(e)
      setIndicators(null)
    }
  }

  const fetchActions = async () => {
    try {
      const r = await client.get('/prevention/actions/')
      setActions(r.data.results || r.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchExposureSheets = async () => {
    try {
      const params: Record<string, string> = {}
      if (companyFilter) params['agent__company'] = companyFilter
      if (siteFilter) params['agent__site'] = siteFilter
      if (serviceFilter) params['agent__service'] = serviceFilter
      const r = await client.get('/prevention/exposure-sheets/', { params })
      setExposureSheets(r.data.results || r.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRiskSheets = async () => {
    try {
      const params: Record<string, string> = {}
      if (companyFilter) params['agent__company'] = companyFilter
      if (siteFilter) params['agent__site'] = siteFilter
      if (serviceFilter) params['agent__service'] = serviceFilter
      const r = await client.get('/prevention/risk-sheets/', { params })
      setRiskSheets(r.data.results || r.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchAgents = async () => {
    try {
      const params: Record<string, string> = { is_active: 'true' }
      if (companyFilter) params['company'] = companyFilter
      if (siteFilter) params['site'] = siteFilter
      if (serviceFilter) params['service'] = serviceFilter
      const r = await client.get('/medical/agents/', { params })
      const data = r.data.results || r.data
      setAgents((data as any[]).filter((a: any) => !a.is_archived))
    } catch (e) {
      console.error(e)
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreateRisk = async () => {
    try {
      await client.post('/prevention/risks/', {
        company: parseInt(riskForm.company),
        site: riskForm.site ? parseInt(riskForm.site) : null,
        service: riskForm.service ? parseInt(riskForm.service) : null,
        job_position: riskForm.job_position ? parseInt(riskForm.job_position) : null,
        category: parseInt(riskForm.category),
        name: riskForm.name,
        description: riskForm.description,
        severity: riskForm.severity,
        probability: riskForm.probability,
        identification_date: riskForm.identification_date,
      })
      showSnackbar('Risque créé', 'success')
      setOpenRiskDialog(false)
      fetchRisks()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateAction = async () => {
    try {
      await client.post('/prevention/actions/', {
        risk: parseInt(actionForm.risk),
        action_type: actionForm.action_type,
        title: actionForm.title,
        description: actionForm.description,
        planned_date: actionForm.planned_date,
        due_date: actionForm.due_date || null,
        status: actionForm.status,
      })
      showSnackbar('Action créée', 'success')
      setOpenActionDialog(false)
      fetchActions()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateFie = async () => {
    try {
      await client.post('/prevention/exposure-sheets/', {
        agent: parseInt(fieForm.agent),
        exposure_period: fieForm.exposure_period,
        exposed_risks: fieForm.exposed_risks,
      })
      showSnackbar('Fiche d\'exposition créée', 'success')
      setOpenFieDialog(false)
      fetchExposureSheets()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateFir = async () => {
    try {
      await client.post('/prevention/risk-sheets/', {
        agent: parseInt(firForm.agent),
        risks_description: firForm.risks_description,
        preventive_measures: firForm.preventive_measures || null,
      })
      showSnackbar('Fiche des risques créée', 'success')
      setOpenFirDialog(false)
      fetchRiskSheets()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateCategory = async () => {
    try {
      await client.post('/prevention/categories/', {
        name: categoryForm.name,
        code: categoryForm.code || null,
        category_type: categoryForm.category_type || null,
        description: categoryForm.description || null,
      })
      showSnackbar('Catégorie créée', 'success')
      setOpenCategoryDialog(false)
      setCategoryForm({ name: '', code: '', category_type: '', description: '' })
      fetchCategories()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const getSeverityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'error'
      case 'high': return 'error'
      case 'medium': return 'warning'
      default: return 'default'
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'success'
      case 'in_progress': return 'info'
      case 'cancelled': return 'default'
      default: return 'warning'
    }
  }

  if (loading && tabValue === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Prévention et évaluation des risques</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Risques identifiés</Typography>
              <Typography variant="h4">{risks.filter((r) => r.is_active).length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Actions préventives</Typography>
              <Typography variant="h4">{actions.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Fiches d'exposition</Typography>
              <Typography variant="h4">{exposureSheets.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Fiches des risques</Typography>
              <Typography variant="h4">{riskSheets.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {indicators && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Indicateurs prévention</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Taux d&apos;avancement plan</Typography>
                  <Typography variant="h5">{indicators.actions_advancement_rate}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Actions en retard</Typography>
                  <Typography variant="h5" color={indicators.actions_overdue > 0 ? 'error.main' : 'text.primary'}>{indicators.actions_overdue}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Couverture FIE</Typography>
                  <Typography variant="h5">{indicators.coverage_fie_pct}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Couverture FIR</Typography>
                  <Typography variant="h5">{indicators.coverage_fir_pct}%</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Risques liés AT/MP</Typography>
                  <Typography variant="h5">{indicators.risks_linked_at_mp}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          {indicators.by_category && indicators.by_category.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Risques par catégorie</Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 180 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Catégorie</TableCell>
                      <TableCell align="right">Nombre</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {indicators.by_category.map((row: { category__name: string; count: number }) => (
                      <TableRow key={row.category__name || 'unknown'}>
                        <TableCell>{row.category__name || '–'}</TableCell>
                        <TableCell align="right">{row.count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Paper>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Risques" />
          <Tab label="Actions préventives" />
          <Tab label="Fiches d'exposition (FIE)" />
          <Tab label="Fiches des risques (FIR)" />
          <Tab label="Risques par poste" />
        </Tabs>

        <Box sx={{ px: 2, pb: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2, mb: 2 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Entreprise</InputLabel>
              <Select
                value={companyFilter}
                onChange={(e) => { setCompanyFilter(e.target.value); setSiteFilter(''); setServiceFilter('') }}
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
              <Select value={siteFilter} onChange={(e) => { setSiteFilter(e.target.value); setServiceFilter('') }} label="Site">
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

          <TabPanel value={tabValue} index={0}>
            {canManage && (
              <Button startIcon={<AddIcon />} variant="outlined" sx={{ mb: 2 }} onClick={() => {
                setRiskForm({
                  company: companyFilter || '',
                  site: '',
                  service: '',
                  job_position: '',
                  category: '',
                  name: '',
                  description: '',
                  severity: 'medium',
                  probability: 'medium',
                  identification_date: new Date().toISOString().split('T')[0],
                })
                setOpenRiskDialog(true)
              }}>
                Ajouter un risque
              </Button>
            )}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Catégorie</TableCell>
                    <TableCell>Gravité</TableCell>
                    <TableCell>Entreprise</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {risks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">Aucun risque</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    risks.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.name}</TableCell>
                        <TableCell>{r.category_name}</TableCell>
                        <TableCell><Chip label={r.severity_display} size="small" color={getSeverityColor(r.severity)} /></TableCell>
                        <TableCell>{r.company_name}</TableCell>
                        <TableCell>{new Date(r.identification_date).toLocaleDateString('fr-FR')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {canManage && (
              <Button startIcon={<AddIcon />} variant="outlined" sx={{ mb: 2 }} onClick={() => {
                setActionForm({
                  risk: '',
                  action_type: 'preventive',
                  title: '',
                  description: '',
                  planned_date: new Date().toISOString().split('T')[0],
                  due_date: '',
                  status: 'planned',
                })
                setOpenActionDialog(true)
              }}>
                Ajouter une action
              </Button>
            )}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Titre</TableCell>
                    <TableCell>Risque</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date prévue</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {actions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">Aucune action</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    actions.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.title}</TableCell>
                        <TableCell>{a.risk_name}</TableCell>
                        <TableCell>{a.action_type_display}</TableCell>
                        <TableCell><Chip label={a.status_display} size="small" color={getStatusColor(a.status)} /></TableCell>
                        <TableCell>{new Date(a.planned_date).toLocaleDateString('fr-FR')}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {canManage && (
              <Button startIcon={<AddIcon />} variant="outlined" sx={{ mb: 2 }} onClick={() => {
                setFieForm({ agent: '', exposure_period: '', exposed_risks: [] })
                setOpenFieDialog(true)
              }}>
                Nouvelle fiche d'exposition
              </Button>
            )}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Période d'exposition</TableCell>
                    <TableCell>Risques exposés</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {exposureSheets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">Aucune fiche</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    exposureSheets.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{f.agent_name} ({f.agent_matricule})</TableCell>
                        <TableCell>{f.exposure_period}</TableCell>
                        <TableCell>
                          {(f.exposed_risks_details || []).map((r) => r.name).join(', ') || '–'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {canManage && (
              <Button startIcon={<AddIcon />} variant="outlined" sx={{ mb: 2 }} onClick={() => {
                setFirForm({ agent: '', risks_description: '', preventive_measures: '' })
                setOpenFirDialog(true)
              }}>
                Nouvelle fiche des risques
              </Button>
            )}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Description des risques</TableCell>
                    <TableCell>Mesures préventives</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {riskSheets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">Aucune fiche</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    riskSheets.map((f) => (
                      <TableRow key={f.id}>
                        <TableCell>{f.agent_name} ({f.agent_matricule})</TableCell>
                        <TableCell sx={{ maxWidth: 300 }}>{f.risks_description}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>{f.preventive_measures || '–'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Synthèse des risques par poste de travail.
            </Typography>
            {(() => {
              const byPoste = new Map<string, Risk[]>()
              risks.filter((r) => r.is_active).forEach((r) => {
                const key = r.job_position_name || 'Non rattaché'
                if (!byPoste.has(key)) byPoste.set(key, [])
                byPoste.get(key)!.push(r)
              })
              const entries = Array.from(byPoste.entries()).sort((a, b) => a[0].localeCompare(b[0]))
              return entries.length === 0 ? (
                <Typography variant="body2" color="text.secondary">Aucun risque</Typography>
              ) : (
                entries.map(([poste, list]) => (
                  <Box key={poste} sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      {poste} ({list.length})
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Risque</TableCell>
                            <TableCell>Catégorie</TableCell>
                            <TableCell>Gravité</TableCell>
                            <TableCell>Probabilité</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {list.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.name}</TableCell>
                              <TableCell>{r.category_name}</TableCell>
                              <TableCell>
                                <Chip label={r.severity_display} size="small" color={getSeverityColor(r.severity)} />
                              </TableCell>
                              <TableCell>{r.probability_display}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                ))
              )
            })()}
          </TabPanel>
        </Box>
      </Paper>

      {/* Dialog risque */}
      <Dialog open={openRiskDialog} onClose={() => setOpenRiskDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouveau risque</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Entreprise *</InputLabel>
                <Select
                  value={riskForm.company}
                  onChange={(e) => setRiskForm({ ...riskForm, company: e.target.value, site: '', service: '', job_position: '' })}
                  label="Entreprise *"
                >
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Site</InputLabel>
                <Select
                  value={riskForm.site}
                  onChange={(e) => setRiskForm({ ...riskForm, site: e.target.value })}
                  label="Site"
                  disabled={!riskForm.company}
                >
                  {sites.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Service</InputLabel>
                <Select
                  value={riskForm.service}
                  onChange={(e) => setRiskForm({ ...riskForm, service: e.target.value })}
                  label="Service"
                  disabled={!riskForm.company}
                >
                  {services.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Catégorie *</InputLabel>
                <Select
                  value={riskForm.category}
                  onChange={(e) => setRiskForm({ ...riskForm, category: e.target.value })}
                  label="Catégorie *"
                >
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du risque *"
                value={riskForm.name}
                onChange={(e) => setRiskForm({ ...riskForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={3}
                value={riskForm.description}
                onChange={(e) => setRiskForm({ ...riskForm, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Gravité</InputLabel>
                <Select
                  value={riskForm.severity}
                  onChange={(e) => setRiskForm({ ...riskForm, severity: e.target.value })}
                  label="Gravité"
                >
                  <MenuItem value="low">Faible</MenuItem>
                  <MenuItem value="medium">Moyen</MenuItem>
                  <MenuItem value="high">Élevé</MenuItem>
                  <MenuItem value="critical">Critique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Probabilité</InputLabel>
                <Select
                  value={riskForm.probability}
                  onChange={(e) => setRiskForm({ ...riskForm, probability: e.target.value })}
                  label="Probabilité"
                >
                  <MenuItem value="low">Faible</MenuItem>
                  <MenuItem value="medium">Moyen</MenuItem>
                  <MenuItem value="high">Élevé</MenuItem>
                  <MenuItem value="critical">Critique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Date d'identification"
                type="date"
                value={riskForm.identification_date}
                onChange={(e) => setRiskForm({ ...riskForm, identification_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRiskDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateRisk}
            disabled={!riskForm.company || !riskForm.category || !riskForm.name || !riskForm.description}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog action */}
      <Dialog open={openActionDialog} onClose={() => setOpenActionDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle action préventive / corrective</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Risque *</InputLabel>
                <Select
                  value={actionForm.risk}
                  onChange={(e) => setActionForm({ ...actionForm, risk: e.target.value })}
                  label="Risque *"
                >
                  {risks.filter((r) => r.is_active).map((r) => (
                    <MenuItem key={r.id} value={String(r.id)}>{r.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={actionForm.action_type}
                  onChange={(e) => setActionForm({ ...actionForm, action_type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="preventive">Préventive</MenuItem>
                  <MenuItem value="corrective">Corrective</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date prévue *"
                type="date"
                value={actionForm.planned_date}
                onChange={(e) => setActionForm({ ...actionForm, planned_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre *"
                value={actionForm.title}
                onChange={(e) => setActionForm({ ...actionForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description *"
                multiline
                rows={3}
                value={actionForm.description}
                onChange={(e) => setActionForm({ ...actionForm, description: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActionDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateAction}
            disabled={!actionForm.risk || !actionForm.title || !actionForm.description || !actionForm.planned_date}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog FIE */}
      <Dialog open={openFieDialog} onClose={() => setOpenFieDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle fiche individuelle d'exposition</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={fieForm.agent}
                  onChange={(e) => setFieForm({ ...fieForm, agent: e.target.value })}
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
                label="Période d'exposition *"
                value={fieForm.exposure_period}
                onChange={(e) => setFieForm({ ...fieForm, exposure_period: e.target.value })}
                placeholder="Ex: 2020-2024"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Risques exposés</InputLabel>
                <Select
                  multiple
                  value={fieForm.exposed_risks}
                  onChange={(e) => setFieForm({ ...fieForm, exposed_risks: e.target.value as number[] })}
                  label="Risques exposés"
                  renderValue={(sel) =>
                    (sel as number[])
                      .map((id) => risks.find((r) => r.id === id)?.name)
                      .filter(Boolean)
                      .join(', ') || '–'
                  }
                >
                  {risks.filter((r) => r.is_active).map((r) => (
                    <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFieDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateFie}
            disabled={!fieForm.agent || !fieForm.exposure_period}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog FIR */}
      <Dialog open={openFirDialog} onClose={() => setOpenFirDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle fiche individuelle des risques</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={firForm.agent}
                  onChange={(e) => setFirForm({ ...firForm, agent: e.target.value })}
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
                label="Description des risques *"
                multiline
                rows={4}
                value={firForm.risks_description}
                onChange={(e) => setFirForm({ ...firForm, risks_description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mesures préventives"
                multiline
                rows={3}
                value={firForm.preventive_measures}
                onChange={(e) => setFirForm({ ...firForm, preventive_measures: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFirDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateFir}
            disabled={!firForm.agent || !firForm.risks_description}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Catégorie de risque */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle catégorie de risque</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom *"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code"
                value={categoryForm.code}
                onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={categoryForm.category_type}
                  onChange={(e) => setCategoryForm({ ...categoryForm, category_type: e.target.value })}
                  label="Type"
                >
                  <MenuItem value="">–</MenuItem>
                  <MenuItem value="physical">Physique</MenuItem>
                  <MenuItem value="biological">Biologique</MenuItem>
                  <MenuItem value="chemical">Chimique</MenuItem>
                  <MenuItem value="psychosocial">Psychosocial</MenuItem>
                  <MenuItem value="ergonomic">Ergonomique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateCategory}
            disabled={!categoryForm.name}
          >
            Créer
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
