import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  IconButton,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon, Settings as SettingsIcon } from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface Vaccine {
  id: number
  name: string
  code?: string
  validity_period_months?: number
}

interface TrainingType {
  id: number
  name: string
  code?: string
  validity_period_months?: number
  drive_link?: string
}

interface RiskCategory {
  id: number
  name: string
  code?: string
  category_type?: string
}
interface VisitType {
  id: number
  name: string
  code: string
  description?: string
}
interface Pathology {
  id: number
  name: string
  code: string
  description?: string
}
interface VaccineRequirement {
  id: number
  vaccine: number
  vaccine_name: string
  job_position?: number
  job_position_name?: string
  risk_category?: number
  risk_category_name?: string
  mandatory: boolean
}
interface Company {
  id: number
  name: string
  siret?: string
  address?: string
  phone?: string | null
  email?: string | null
}
interface Site {
  id: number
  name: string
  company: number
  company_name?: string
}
interface Service {
  id: number
  name: string
  company: number
  company_name?: string
  site?: number
}
interface JobPosition {
  id: number
  name: string
  company: number
  company_name?: string
  code?: string
}

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

export default function Settings() {
  const [tabValue, setTabValue] = useState(0)
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  const [categories, setCategories] = useState<RiskCategory[]>([])
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([])
  const [pathologies, setPathologies] = useState<Pathology[]>([])
  const [vaccineReqs, setVaccineReqs] = useState<VaccineRequirement[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [openVaccineDialog, setOpenVaccineDialog] = useState(false)
  const [openTypeDialog, setOpenTypeDialog] = useState(false)
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false)
  const [openVisitTypeDialog, setOpenVisitTypeDialog] = useState(false)
  const [openVaccineReqDialog, setOpenVaccineReqDialog] = useState(false)
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const { user, canManageUsers } = useAuth()

  const [vaccineForm, setVaccineForm] = useState({ name: '', code: '', validity_period_months: '', description: '' })
  const [typeForm, setTypeForm] = useState({ name: '', code: '', validity_period_months: '', description: '', drive_link: '' })
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', category_type: '', description: '' })
  const [visitTypeForm, setVisitTypeForm] = useState({ name: '', code: '', description: '' })
  const [vaccineReqForm, setVaccineReqForm] = useState({
    vaccine: '',
    job_position: '',
    risk_category: '',
    mandatory: true,
  })
  const [companyForm, setCompanyForm] = useState({
    name: '',
    siret: '',
    address: '',
    phone: '',
    email: '',
  })

  useEffect(() => {
    fetchVaccines()
    fetchTrainingTypes()
    fetchCategories()
    fetchVisitTypes()
    fetchPathologies()
    fetchVaccineReqs()
    fetchCompanies()
    fetchSites()
    fetchServices()
    fetchJobPositions()
  }, [tabValue])

  const fetchVaccines = async () => {
    try {
      const r = await client.get('/vaccination/vaccines/')
      setVaccines(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchTrainingTypes = async () => {
    try {
      const r = await client.get('/training/training-types/')
      setTrainingTypes(r.data.results || r.data)
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

  const fetchVisitTypes = async () => {
    try {
      const r = await client.get('/visits/types/')
      setVisitTypes(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchPathologies = async () => {
    try {
      const r = await client.get('/medical/pathologies/')
      setPathologies(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchVaccineReqs = async () => {
    try {
      const r = await client.get('/vaccination/requirements/')
      setVaccineReqs(r.data.results || r.data)
    } catch {
      /**/
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

  const fetchSites = async () => {
    try {
      const r = await client.get('/companies/sites/')
      setSites(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchServices = async () => {
    try {
      const r = await client.get('/companies/services/')
      setServices(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchJobPositions = async () => {
    try {
      const r = await client.get('/companies/job-positions/')
      setJobPositions(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreateVaccine = async () => {
    try {
      await client.post('/vaccination/vaccines/', {
        name: vaccineForm.name,
        code: vaccineForm.code || null,
        validity_period_months: vaccineForm.validity_period_months ? parseInt(vaccineForm.validity_period_months) : null,
        description: vaccineForm.description || null,
      })
      showSnackbar('Vaccin ajouté', 'success')
      setOpenVaccineDialog(false)
      setVaccineForm({ name: '', code: '', validity_period_months: '', description: '' })
      fetchVaccines()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateType = async () => {
    try {
      await client.post('/training/training-types/', {
        name: typeForm.name,
        code: typeForm.code || null,
        validity_period_months: typeForm.validity_period_months ? parseInt(typeForm.validity_period_months) : null,
        description: typeForm.description || null,
        drive_link: typeForm.drive_link?.trim() || null,
      })
      showSnackbar('Type de formation ajouté', 'success')
      setOpenTypeDialog(false)
      setTypeForm({ name: '', code: '', validity_period_months: '', description: '', drive_link: '' })
      fetchTrainingTypes()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateCategory = async () => {
    try {
      await client.post('/prevention/risk-categories/', {
        name: categoryForm.name,
        code: categoryForm.code || null,
        category_type: categoryForm.category_type || null,
        description: categoryForm.description || null,
      })
      showSnackbar('Catégorie de risque ajoutée', 'success')
      setOpenCategoryDialog(false)
      setCategoryForm({ name: '', code: '', category_type: '', description: '' })
      fetchCategories()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateVisitType = async () => {
    try {
      await client.post('/visits/types/', {
        name: visitTypeForm.name,
        code: visitTypeForm.code,
        description: visitTypeForm.description || null,
      })
      showSnackbar('Type de visite ajouté', 'success')
      setOpenVisitTypeDialog(false)
      setVisitTypeForm({ name: '', code: '', description: '' })
      fetchVisitTypes()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateVaccineReq = async () => {
    try {
      await client.post('/vaccination/requirements/', {
        vaccine: parseInt(vaccineReqForm.vaccine),
        job_position: vaccineReqForm.job_position ? parseInt(vaccineReqForm.job_position) : null,
        risk_category: vaccineReqForm.risk_category ? parseInt(vaccineReqForm.risk_category) : null,
        mandatory: vaccineReqForm.mandatory,
      })
      showSnackbar('Vaccination obligatoire ajoutée', 'success')
      setOpenVaccineReqDialog(false)
      setVaccineReqForm({ vaccine: '', job_position: '', risk_category: '', mandatory: true })
      fetchVaccineReqs()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateCompany = async () => {
    const siret = companyForm.siret.replace(/\s/g, '')
    if (siret.length !== 14) {
      showSnackbar('Le SIRET doit contenir exactement 14 chiffres', 'error')
      return
    }
    try {
      await client.post('/companies/companies/', {
        name: companyForm.name.trim(),
        siret,
        address: companyForm.address.trim(),
        phone: companyForm.phone.trim() || null,
        email: companyForm.email.trim() || null,
        is_active: true,
      })
      showSnackbar('Entreprise ajoutée', 'success')
      setOpenCompanyDialog(false)
      setCompanyForm({ name: '', siret: '', address: '', phone: '', email: '' })
      fetchCompanies()
    } catch (err: any) {
      const msg = err.response?.data
      const detail = typeof msg === 'string' ? msg : msg?.siret?.[0] || msg?.detail || 'Erreur'
      showSnackbar(String(detail), 'error')
    }
  }

  const openEditCompany = (c: Company) => {
    setCompanyForm({
      name: c.name,
      siret: c.siret || '',
      address: c.address || '',
      phone: c.phone || '',
      email: c.email || '',
    })
    setEditingCompany(c)
    setOpenCompanyDialog(true)
  }

  const handleUpdateCompany = async () => {
    if (!editingCompany) return
    const siret = companyForm.siret.replace(/\s/g, '')
    if (siret.length !== 14) {
      showSnackbar('Le SIRET doit contenir exactement 14 chiffres', 'error')
      return
    }
    try {
      await client.patch(`/companies/companies/${editingCompany.id}/`, {
        name: companyForm.name.trim(),
        siret,
        address: companyForm.address.trim(),
        phone: companyForm.phone.trim() || null,
        email: companyForm.email.trim() || null,
      })
      showSnackbar('Entreprise modifiée', 'success')
      setOpenCompanyDialog(false)
      setEditingCompany(null)
      setCompanyForm({ name: '', siret: '', address: '', phone: '', email: '' })
      fetchCompanies()
    } catch (err: any) {
      const msg = err.response?.data
      const detail = typeof msg === 'string' ? msg : msg?.siret?.[0] || msg?.detail || 'Erreur'
      showSnackbar(String(detail), 'error')
    }
  }

  const handleConfirmDeleteCompany = async () => {
    if (!companyToDelete) return
    try {
      await client.delete(`/companies/companies/${companyToDelete.id}/`)
      showSnackbar('Entreprise supprimée', 'success')
      setCompanyToDelete(null)
      fetchCompanies()
      fetchSites()
      fetchServices()
      fetchJobPositions()
    } catch (err: any) {
      const detail = err.response?.data?.detail || err.response?.data?.siret?.[0] || 'Erreur'
      showSnackbar(String(detail), 'error')
    }
  }

  const canManageRefs = canManageUsers

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Paramètres
      </Typography>

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<PersonIcon />} iconPosition="start" label="Mon compte" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Référentiels" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Structures" />
        </Tabs>

        <Box sx={{ px: 2, pb: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <Card variant="outlined" sx={{ maxWidth: 480 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations du compte
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Nom complet</Typography>
                    <Typography variant="body1">{user?.full_name || '–'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Identifiant</Typography>
                    <Typography variant="body1">{user?.username || '–'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{user?.email || '–'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Rôle</Typography>
                    <Typography variant="body1">{user?.role_display || user?.role || '–'}</Typography>
                  </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Pour modifier le mot de passe ou les paramètres avancés, contactez votre administrateur.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Gestion des référentiels utilisés dans les modules Vaccination, Prévention et Formation.
            </Typography>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Vaccins
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => setOpenVaccineDialog(true)}>
                Ajouter un vaccin
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
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

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Types de formation
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => setOpenTypeDialog(true)}>
                Ajouter un type
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Validité (mois)</TableCell>
                    <TableCell>Lien Drive (cours)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainingTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.code || '–'}</TableCell>
                      <TableCell>{t.validity_period_months ?? '–'}</TableCell>
                      <TableCell>
                        {t.drive_link ? (
                          <a href={t.drive_link} target="_blank" rel="noopener noreferrer">Ouvrir le cours</a>
                        ) : '–'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Catégories de risques
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => setOpenCategoryDialog(true)}>
                Ajouter une catégorie
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.code || '–'}</TableCell>
                      <TableCell>
                        {c.category_type === 'physical' && 'Physique'}
                        {c.category_type === 'biological' && 'Biologique'}
                        {c.category_type === 'chemical' && 'Chimique'}
                        {c.category_type === 'psychosocial' && 'Psychosocial'}
                        {c.category_type === 'ergonomic' && 'Ergonomique'}
                        {!c.category_type && '–'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Types de visites
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => { setVisitTypeForm({ name: '', code: '', description: '' }); setOpenVisitTypeDialog(true) }}>
                Ajouter un type
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visitTypes.map((vt) => (
                    <TableRow key={vt.id}>
                      <TableCell>{vt.name}</TableCell>
                      <TableCell>{vt.code}</TableCell>
                      <TableCell>{vt.description || '–'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Pathologies (CIM-10)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Lecture seule. Gestion complète via l’admin Django.</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pathologies.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.code}</TableCell>
                      <TableCell>{p.description || '–'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Vaccinations obligatoires / recommandées
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => { setVaccineReqForm({ vaccine: '', job_position: '', risk_category: '', mandatory: true }); setOpenVaccineReqDialog(true) }}>
                Ajouter une règle
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vaccin</TableCell>
                    <TableCell>Poste / Catégorie risque</TableCell>
                    <TableCell>Obligatoire</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaccineReqs.map((vr) => (
                    <TableRow key={vr.id}>
                      <TableCell>{vr.vaccine_name}</TableCell>
                      <TableCell>{vr.job_position_name || vr.risk_category_name || '–'}</TableCell>
                      <TableCell>{vr.mandatory ? 'Oui' : 'Recommandé'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Entreprises, sites, services et postes de travail. Gestion complète via l’admin Django ou les API.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
              <Typography variant="subtitle1">Entreprises</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingCompany(null)
                  setCompanyForm({ name: '', siret: '', address: '', phone: '', email: '' })
                  setOpenCompanyDialog(true)
                }}
              >
                Ajouter une entreprise
              </Button>
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>SIRET</TableCell>
                    <TableCell>Adresse</TableCell>
                    <TableCell>Téléphone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.siret || '–'}</TableCell>
                      <TableCell>{c.address || '–'}</TableCell>
                      <TableCell>{c.phone || '–'}</TableCell>
                      <TableCell>{c.email || '–'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => openEditCompany(c)} title="Modifier" aria-label="Modifier">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setCompanyToDelete(c)} title="Supprimer" aria-label="Supprimer">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Sites</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Nom</TableCell><TableCell>Entreprise</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {sites.map((s) => (
                    <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{s.company_name ?? s.company}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Services</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Nom</TableCell><TableCell>Entreprise</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{s.company_name ?? s.company}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Postes de travail</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Nom</TableCell><TableCell>Code</TableCell><TableCell>Entreprise</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {jobPositions.map((jp) => (
                    <TableRow key={jp.id}><TableCell>{jp.name}</TableCell><TableCell>{jp.code || '–'}</TableCell><TableCell>{jp.company_name ?? jp.company}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Box>
      </Paper>

      <Dialog open={openVaccineDialog} onClose={() => setOpenVaccineDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nouveau vaccin</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom *" value={vaccineForm.name} onChange={(e) => setVaccineForm({ ...vaccineForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Code" value={vaccineForm.code} onChange={(e) => setVaccineForm({ ...vaccineForm, code: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Validité (mois)" type="number" value={vaccineForm.validity_period_months} onChange={(e) => setVaccineForm({ ...vaccineForm, validity_period_months: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={vaccineForm.description} onChange={(e) => setVaccineForm({ ...vaccineForm, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVaccineDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateVaccine} disabled={!vaccineForm.name}>Créer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openTypeDialog} onClose={() => setOpenTypeDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nouveau type de formation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom *" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Code" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Validité (mois)" type="number" value={typeForm.validity_period_months} onChange={(e) => setTypeForm({ ...typeForm, validity_period_months: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Lien Drive (cours)" placeholder="https://drive.google.com/..." value={typeForm.drive_link} onChange={(e) => setTypeForm({ ...typeForm, drive_link: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTypeDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateType} disabled={!typeForm.name}>Créer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nouvelle catégorie de risque</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom *" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Code" value={categoryForm.code} onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={categoryForm.category_type} onChange={(e) => setCategoryForm({ ...categoryForm, category_type: e.target.value })} label="Type">
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
              <TextField fullWidth label="Description" multiline rows={2} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCategoryDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateCategory} disabled={!categoryForm.name}>Créer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openVisitTypeDialog} onClose={() => setOpenVisitTypeDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nouveau type de visite</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom *" value={visitTypeForm.name} onChange={(e) => setVisitTypeForm({ ...visitTypeForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Code *" value={visitTypeForm.code} onChange={(e) => setVisitTypeForm({ ...visitTypeForm, code: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={visitTypeForm.description} onChange={(e) => setVisitTypeForm({ ...visitTypeForm, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVisitTypeDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateVisitType} disabled={!visitTypeForm.name || !visitTypeForm.code}>Créer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openVaccineReqDialog} onClose={() => setOpenVaccineReqDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nouvelle règle vaccination (obligatoire / recommandée)</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Vaccin *</InputLabel>
                <Select
                  value={vaccineReqForm.vaccine}
                  onChange={(e) => setVaccineReqForm({ ...vaccineReqForm, vaccine: e.target.value })}
                  label="Vaccin *"
                >
                  {vaccines.map((v) => (
                    <MenuItem key={v.id} value={String(v.id)}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Poste de travail</InputLabel>
                <Select
                  value={vaccineReqForm.job_position}
                  onChange={(e) => setVaccineReqForm({ ...vaccineReqForm, job_position: e.target.value, risk_category: '' })}
                  label="Poste de travail"
                >
                  <MenuItem value="">–</MenuItem>
                  {jobPositions.map((jp) => (
                    <MenuItem key={jp.id} value={String(jp.id)}>{jp.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Catégorie de risque</InputLabel>
                <Select
                  value={vaccineReqForm.risk_category}
                  onChange={(e) => setVaccineReqForm({ ...vaccineReqForm, risk_category: e.target.value, job_position: '' })}
                  label="Catégorie de risque"
                >
                  <MenuItem value="">–</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Obligatoire</InputLabel>
                <Select
                  value={vaccineReqForm.mandatory ? 'yes' : 'no'}
                  onChange={(e) => setVaccineReqForm({ ...vaccineReqForm, mandatory: e.target.value === 'yes' })}
                  label="Obligatoire"
                >
                  <MenuItem value="yes">Oui</MenuItem>
                  <MenuItem value="no">Non (recommandé)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVaccineReqDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateVaccineReq}
            disabled={!vaccineReqForm.vaccine || (!vaccineReqForm.job_position && !vaccineReqForm.risk_category)}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openCompanyDialog}
        onClose={() => { setOpenCompanyDialog(false); setEditingCompany(null) }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom de l'entreprise *" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SIRET *"
                value={companyForm.siret}
                onChange={(e) => setCompanyForm({ ...companyForm, siret: e.target.value.replace(/\D/g, '') })}
                inputProps={{ maxLength: 14 }}
                helperText="14 chiffres"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Adresse *" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} multiline rows={2} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Téléphone" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCompanyDialog(false); setEditingCompany(null) }}>Annuler</Button>
          {editingCompany ? (
            <Button
              variant="contained"
              onClick={handleUpdateCompany}
              disabled={!companyForm.name.trim() || companyForm.siret.replace(/\s/g, '').length !== 14 || !companyForm.address.trim()}
            >
              Enregistrer
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleCreateCompany}
              disabled={!companyForm.name.trim() || companyForm.siret.replace(/\s/g, '').length !== 14 || !companyForm.address.trim()}
            >
              Créer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog open={!!companyToDelete} onClose={() => setCompanyToDelete(null)}>
        <DialogTitle>Supprimer l&apos;entreprise</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer l&apos;entreprise &quot;{companyToDelete?.name}&quot; ? Cette action est irréversible (sites, services et postes liés seront également supprimés).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyToDelete(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteCompany}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
