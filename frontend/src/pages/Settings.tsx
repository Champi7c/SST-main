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

  // Dialogues
  const [openVaccineDialog, setOpenVaccineDialog] = useState(false)
  const [openTypeDialog, setOpenTypeDialog] = useState(false)
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false)
  const [openVisitTypeDialog, setOpenVisitTypeDialog] = useState(false)
  const [openVaccineReqDialog, setOpenVaccineReqDialog] = useState(false)
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)

  // Formulaires
  const [vaccineForm, setVaccineForm] = useState({ name: '', code: '', validity_period_months: '', description: '' })
  const [typeForm, setTypeForm] = useState({ name: '', code: '', validity_period_months: '', description: '', drive_link: '' })
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', category_type: '', description: '' })
  const [visitTypeForm, setVisitTypeForm] = useState({ name: '', code: '', description: '' })
  const [vaccineReqForm, setVaccineReqForm] = useState<{ vaccine: string; job_position: string; risk_category: string; mandatory: boolean }>({
    vaccine: '', job_position: '', risk_category: '', mandatory: true,
  })
  const [companyForm, setCompanyForm] = useState({ name: '', siret: '', address: '', phone: '', email: '' })

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const { user, canManageUsers } = useAuth()
  const canManageRefs = canManageUsers
  const canManageCompanies = user?.role ? ['super_admin', 'admin', 'rh'].includes(user.role) : false

  // Chargement des donnees
  useEffect(() => {
    client.get('/vaccines/').then((r) => setVaccines(r.data.results ?? r.data)).catch(() => {})
    client.get('/training-types/').then((r) => setTrainingTypes(r.data.results ?? r.data)).catch(() => {})
    client.get('/risk-categories/').then((r) => setCategories(r.data.results ?? r.data)).catch(() => {})
    client.get('/visit-types/').then((r) => setVisitTypes(r.data.results ?? r.data)).catch(() => {})
    client.get('/pathologies/').then((r) => setPathologies(r.data.results ?? r.data)).catch(() => {})
    client.get('/vaccine-requirements/').then((r) => setVaccineReqs(r.data.results ?? r.data)).catch(() => {})
    client.get('/companies/').then((r) => setCompanies(r.data.results ?? r.data)).catch(() => {})
    client.get('/sites/').then((r) => setSites(r.data.results ?? r.data)).catch(() => {})
    client.get('/services/').then((r) => setServices(r.data.results ?? r.data)).catch(() => {})
    client.get('/job-positions/').then((r) => setJobPositions(r.data.results ?? r.data)).catch(() => {})
  }, [])

  const showSuccess = (message: string) => setSnackbar({ open: true, message, severity: 'success' })
  const showError = (message: string) => setSnackbar({ open: true, message, severity: 'error' })

  // Handlers vaccin
  const handleCreateVaccine = async () => {
    try {
      const payload = {
        name: vaccineForm.name,
        code: vaccineForm.code || undefined,
        validity_period_months: vaccineForm.validity_period_months ? Number(vaccineForm.validity_period_months) : undefined,
      }
      const { data } = await client.post('/vaccines/', payload)
      setVaccines((prev) => [...prev, data])
      setOpenVaccineDialog(false)
      setVaccineForm({ name: '', code: '', validity_period_months: '', description: '' })
      showSuccess('Vaccin cree avec succes')
    } catch {
      showError('Erreur lors de la creation du vaccin')
    }
  }

  // Handlers type de formation
  const handleCreateType = async () => {
    try {
      const payload = {
        name: typeForm.name,
        code: typeForm.code || undefined,
        validity_period_months: typeForm.validity_period_months ? Number(typeForm.validity_period_months) : undefined,
        drive_link: typeForm.drive_link || undefined,
      }
      const { data } = await client.post('/training-types/', payload)
      setTrainingTypes((prev) => [...prev, data])
      setOpenTypeDialog(false)
      setTypeForm({ name: '', code: '', validity_period_months: '', description: '', drive_link: '' })
      showSuccess('Type de formation cree avec succes')
    } catch {
      showError('Erreur lors de la creation du type de formation')
    }
  }

  // Handlers categorie de risque
  const handleCreateCategory = async () => {
    try {
      const payload = {
        name: categoryForm.name,
        code: categoryForm.code || undefined,
        category_type: categoryForm.category_type || undefined,
      }
      const { data } = await client.post('/risk-categories/', payload)
      setCategories((prev) => [...prev, data])
      setOpenCategoryDialog(false)
      setCategoryForm({ name: '', code: '', category_type: '', description: '' })
      showSuccess('Categorie creee avec succes')
    } catch {
      showError('Erreur lors de la creation de la categorie')
    }
  }

  // Handlers type de visite
  const handleCreateVisitType = async () => {
    try {
      const payload = {
        name: visitTypeForm.name,
        code: visitTypeForm.code,
        description: visitTypeForm.description || undefined,
      }
      const { data } = await client.post('/visit-types/', payload)
      setVisitTypes((prev) => [...prev, data])
      setOpenVisitTypeDialog(false)
      setVisitTypeForm({ name: '', code: '', description: '' })
      showSuccess('Type de visite cree avec succes')
    } catch {
      showError('Erreur lors de la creation du type de visite')
    }
  }

  // Handlers.regle vaccination
  const handleCreateVaccineReq = async () => {
    try {
      const payload = {
        vaccine: Number(vaccineReqForm.vaccine),
        job_position: vaccineReqForm.job_position ? Number(vaccineReqForm.job_position) : undefined,
        risk_category: vaccineReqForm.risk_category ? Number(vaccineReqForm.risk_category) : undefined,
        mandatory: vaccineReqForm.mandatory,
      }
      const { data } = await client.post('/vaccine-requirements/', payload)
      setVaccineReqs((prev) => [...prev, data])
      setOpenVaccineReqDialog(false)
      setVaccineReqForm({ vaccine: '', job_position: '', risk_category: '', mandatory: true })
      showSuccess('Regle de vaccination creee avec succes')
    } catch {
      showError('Erreur lors de la creation de la regle')
    }
  }

  // Handlers entreprise
  const openEditCompany = (company: Company) => {
    setEditingCompany(company)
    setCompanyForm({
      name: company.name,
      siret: company.siret ?? '',
      address: company.address ?? '',
      phone: company.phone ?? '',
      email: company.email ?? '',
    })
    setOpenCompanyDialog(true)
  }

  const handleCreateCompany = async () => {
    try {
      const { data } = await client.post('/companies/', companyForm)
      setCompanies((prev) => [...prev, data])
      setOpenCompanyDialog(false)
      setCompanyForm({ name: '', siret: '', address: '', phone: '', email: '' })
      showSuccess('Entreprise creee avec succes')
    } catch {
      showError('Erreur lors de la creation de l\'entreprise')
    }
  }

  const handleUpdateCompany = async () => {
    if (!editingCompany) return
    try {
      const { data } = await client.put(`/companies/${editingCompany.id}/`, companyForm)
      setCompanies((prev) => prev.map((c) => (c.id === editingCompany.id ? data : c)))
      setOpenCompanyDialog(false)
      setEditingCompany(null)
      showSuccess('Entreprise mise a jour avec succes')
    } catch {
      showError('Erreur lors de la mise a jour de l\'entreprise')
    }
  }

  const handleConfirmDeleteCompany = async () => {
    if (!companyToDelete) return
    try {
      await client.delete(`/companies/${companyToDelete.id}/`)
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id))
      setCompanyToDelete(null)
      showSuccess('Entreprise suprrimee')
    } catch {
      showError('Erreur lors de la suppression de l\'entreprise')
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Parametres
      </Typography>

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<PersonIcon />} iconPosition="start" label="Mon compte" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Referentiels" />
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
                    <Typography variant="body1">{user?.full_name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Identifiant</Typography>
                    <Typography variant="body1">{user?.username || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{user?.email || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Role</Typography>
                    <Typography variant="body1">{user?.role_display || user?.role || '-'}</Typography>
                  </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Pour modifier le mot de passe ou les parametres avances, contactez votre administrateur.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Gestion des referentiels utilises dans les modules Vaccination, Prevention et Formation.
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
                    <TableCell>Validite (mois)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaccines.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.name}</TableCell>
                      <TableCell>{v.code || '-'}</TableCell>
                      <TableCell>{v.validity_period_months ?? '-'}</TableCell>
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
                    <TableCell>Validite (mois)</TableCell>
                    <TableCell>Lien Drive (cours)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainingTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.code || '-'}</TableCell>
                      <TableCell>{t.validity_period_months ?? '-'}</TableCell>
                      <TableCell>
                        {t.drive_link ? (
                          <a href={t.drive_link} target="_blank" rel="noopener noreferrer">Ouvrir le cours</a>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Categories de risques
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => setOpenCategoryDialog(true)}>
                Ajouter une categorie
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
                      <TableCell>{c.code || '-'}</TableCell>
                      <TableCell>
                        {c.category_type === 'physical' && 'Physique'}
                        {c.category_type === 'biological' && 'Biologique'}
                        {c.category_type === 'chemical' && 'Chimique'}
                        {c.category_type === 'psychosocial' && 'Psychosocial'}
                        {c.category_type === 'ergonomic' && 'Ergonomique'}
                        {!c.category_type && '-'}
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
                      <TableCell>{vt.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Pathologies (CIM-10)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Lecture seule. Gestion complete via l'admin Django.</Typography>
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
                      <TableCell>{p.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Vaccinations obligatoires / recommandees
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => { setVaccineReqForm({ vaccine: '', job_position: '', risk_category: '', mandatory: true }); setOpenVaccineReqDialog(true) }}>
                Ajouter une regle
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vaccin</TableCell>
                    <TableCell>Poste / Categorie risque</TableCell>
                    <TableCell>Obligatoire</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaccineReqs.map((vr) => (
                    <TableRow key={vr.id}>
                      <TableCell>{vr.vaccine_name}</TableCell>
                      <TableCell>{vr.job_position_name || vr.risk_category_name || '-'}</TableCell>
                      <TableCell>{vr.mandatory ? 'Oui' : 'Recommande'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Entreprises, sites, services et postes de travail. Gestion complete via l'admin Django ou les API.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
              <Typography variant="subtitle1">Entreprises</Typography>
              {canManageCompanies && (
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
              )}
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>SIRET</TableCell>
                    <TableCell>Adresse</TableCell>
                    <TableCell>Telephone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.siret || '-'}</TableCell>
                      <TableCell>{c.address || '-'}</TableCell>
                      <TableCell>{c.phone || '-'}</TableCell>
                      <TableCell>{c.email || '-'}</TableCell>
                      <TableCell align="right">
                        {canManageCompanies && (
                          <>
                            <IconButton size="small" color="primary" onClick={() => openEditCompany(c)} title="Modifier" aria-label="Modifier">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setCompanyToDelete(c)} title="Supprimer" aria-label="Supprimer">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
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
                    <TableRow key={jp.id}><TableCell>{jp.name}</TableCell><TableCell>{jp.code || '-'}</TableCell><TableCell>{jp.company_name ?? jp.company}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Box>
      </Paper>

      {/* Dialog : Vaccin */}
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
              <TextField fullWidth label="Validite (mois)" type="number" value={vaccineForm.validity_period_months} onChange={(e) => setVaccineForm({ ...vaccineForm, validity_period_months: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={vaccineForm.description} onChange={(e) => setVaccineForm({ ...vaccineForm, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVaccineDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleCreateVaccine} disabled={!vaccineForm.name}>Creer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Type de formation */}
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
              <TextField fullWidth label="Validite (mois)" type="number" value={typeForm.validity_period_months} onChange={(e) => setTypeForm({ ...typeForm, validity_period_months: e.target.value })} />
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
          <Button variant="contained" onClick={handleCreateType} disabled={!typeForm.name}>Creer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Categorie de risque */}
      <Dialog open={openCategoryDialog} onClose={() => setOpenCategoryDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nouvelle categorie de risque</DialogTitle>
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
                  <MenuItem value="">-</MenuItem>
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
          <Button variant="contained" onClick={handleCreateCategory} disabled={!categoryForm.name}>Creer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Type de visite */}
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
          <Button variant="contained" onClick={handleCreateVisitType} disabled={!visitTypeForm.name || !visitTypeForm.code}>Creer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Regle vaccination */}
      <Dialog open={openVaccineReqDialog} onClose={() => setOpenVaccineReqDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nouvelle regle vaccination (obligatoire / recommandee)</DialogTitle>
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
                  <MenuItem value="">-</MenuItem>
                  {jobPositions.map((jp) => (
                    <MenuItem key={jp.id} value={String(jp.id)}>{jp.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categorie de risque</InputLabel>
                <Select
                  value={vaccineReqForm.risk_category}
                  onChange={(e) => setVaccineReqForm({ ...vaccineReqForm, risk_category: e.target.value, job_position: '' })}
                  label="Categorie de risque"
                >
                  <MenuItem value="">-</MenuItem>
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
                  <MenuItem value="no">Non (recommande)</MenuItem>
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
            Creer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Entreprise (creation / edition) */}
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
              <TextField fullWidth label="Telephone" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
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
              Creer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog : Confirmation suppression entreprise */}
      <Dialog open={!!companyToDelete} onClose={() => setCompanyToDelete(null)}>
        <DialogTitle>Supprimer l&apos;entreprise</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer l&apos;entreprise &quot;{companyToDelete?.name}&quot; ? Cette action est irreversible (sites, services et postes lies seront egalement supprims).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyToDelete(null)}>Annuler</Button>
          {canManageCompanies && (
            <Button variant="contained" color="error" onClick={handleConfirmDeleteCompany}>
              Supprimer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}