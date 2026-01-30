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
  Switch,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { Edit as EditIcon, Unarchive as UnarchiveIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface Agent {
  id: number
  matricule: string
  title?: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string
  age?: number
  gender: string
  email?: string
  phone?: string
  address?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  emergency_contact_relation?: string
  company: number
  company_name: string
  site?: number
  site_name?: string
  service?: number
  service_name?: string
  job_position?: number
  job_position_name?: string
  function?: string
  grade?: string
  professional_category?: string
  supervisor?: number
  supervisor_name?: string
  supervisor_matricule?: string
  hire_date: string
  is_active: boolean
  is_archived: boolean
}

interface Company {
  id: number
  name: string
}

interface Site {
  id: number
  name: string
  company: number
}

interface Service {
  id: number
  name: string
  company: number
  site?: number
}

interface JobPosition {
  id: number
  name: string
  company: number
}

export default function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [submitLoading, setSubmitLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const { hasMedicalAccess, user } = useAuth()

  // Données pour les formulaires
  const [companies, setCompanies] = useState<Company[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [supervisors, setSupervisors] = useState<Agent[]>([])

  // Formulaire
  const [formData, setFormData] = useState({
    matricule: '',
    title: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: 'M',
    email: '',
    phone: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    company: '',
    site: '',
    service: '',
    job_position: '',
    function: '',
    grade: '',
    professional_category: '',
    supervisor: '',
    hire_date: '',
    is_active: true,
  })

  useEffect(() => {
    fetchAgents()
    fetchCompanies()
  }, [showArchived])

  useEffect(() => {
    if (formData.company) {
      fetchSites(formData.company)
      fetchServices(formData.company)
      fetchJobPositions(formData.company)
    }
  }, [formData.company])

  useEffect(() => {
    if (formData.site && formData.company) {
      fetchServices(formData.company, formData.site)
    }
  }, [formData.site])

  useEffect(() => {
    if (formData.company) {
      fetchSupervisors(formData.company)
    }
  }, [formData.company])

  const fetchAgents = async () => {
    try {
      const params = showArchived ? { show_archived: 'true' } : {}
      const response = await client.get('/medical/agents/', { params })
      setAgents(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error)
      showSnackbar('Erreur lors du chargement des agents', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await client.get('/companies/companies/')
      setCompanies(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des entreprises:', error)
    }
  }

  const fetchSites = async (companyId: string) => {
    try {
      const response = await client.get(`/companies/sites/?company=${companyId}`)
      setSites(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des sites:', error)
    }
  }

  const fetchServices = async (companyId: string, siteId?: string) => {
    try {
      let url = `/companies/services/?company=${companyId}`
      if (siteId) url += `&site=${siteId}`
      const response = await client.get(url)
      setServices(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des services:', error)
    }
  }

  const fetchJobPositions = async (companyId: string) => {
    try {
      const response = await client.get(`/companies/job-positions/?company=${companyId}`)
      setJobPositions(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des postes:', error)
    }
  }

  const fetchSupervisors = async (companyId: string) => {
    try {
      const response = await client.get(`/medical/agents/?company=${companyId}&is_active=true`)
      const allAgents = response.data.results || response.data
      setSupervisors(allAgents.filter((a: Agent) => !a.is_archived))
    } catch (error) {
      console.error('Erreur lors du chargement des supérieurs:', error)
    }
  }

  const handleOpenDialog = (agent?: Agent) => {
    setFieldErrors({})
    if (agent) {
      setEditingAgent(agent)
      setFormData({
        matricule: agent.matricule,
        title: agent.title || '',
        first_name: agent.first_name,
        last_name: agent.last_name,
        date_of_birth: agent.date_of_birth,
        gender: agent.gender,
        email: agent.email || '',
        phone: agent.phone || '',
        address: agent.address || '',
        emergency_contact_name: agent.emergency_contact_name || '',
        emergency_contact_phone: agent.emergency_contact_phone || '',
        emergency_contact_relation: agent.emergency_contact_relation || '',
        company: agent.company.toString(),
        site: agent.site?.toString() || '',
        service: agent.service?.toString() || '',
        job_position: agent.job_position?.toString() || '',
        function: agent.function || '',
        grade: agent.grade || '',
        professional_category: agent.professional_category || '',
        supervisor: agent.supervisor?.toString() || '',
        hire_date: agent.hire_date,
        is_active: agent.is_active,
      })
    } else {
      setEditingAgent(null)
      setFormData({
        matricule: '',
        title: '',
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'M',
        email: '',
        phone: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        emergency_contact_relation: '',
        company: '',
        site: '',
        service: '',
        job_position: '',
        function: '',
        grade: '',
        professional_category: '',
        supervisor: '',
        hire_date: '',
        is_active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingAgent(null)
    setFieldErrors({})
  }

  const handleSubmit = async () => {
    setFieldErrors({})
    const companyVal = formData.company
    const companyId = (companyVal !== '' && companyVal !== undefined) ? parseInt(String(companyVal), 10) : NaN
    if (!editingAgent && (!formData.matricule?.trim() || !formData.first_name?.trim() || !formData.last_name?.trim() || !formData.date_of_birth || !formData.hire_date)) {
      showSnackbar('Veuillez remplir les champs obligatoires (matricule, prénom, nom, date de naissance, date d\'embauche).', 'error')
      return
    }
    if (!Number.isFinite(companyId)) {
      showSnackbar('Veuillez sélectionner une entreprise.', 'error')
      setFieldErrors((e) => ({ ...e, company: 'Champ obligatoire' }))
      return
    }
    setSubmitLoading(true)
    try {
      const data: Record<string, unknown> = {
        matricule: formData.matricule.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        hire_date: formData.hire_date,
        company: companyId,
        is_active: formData.is_active,
        title: formData.title || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        emergency_contact_name: formData.emergency_contact_name?.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone?.trim() || null,
        emergency_contact_relation: formData.emergency_contact_relation?.trim() || null,
        site: formData.site ? parseInt(String(formData.site), 10) : null,
        service: formData.service ? parseInt(String(formData.service), 10) : null,
        job_position: formData.job_position ? parseInt(String(formData.job_position), 10) : null,
        supervisor: formData.supervisor ? parseInt(String(formData.supervisor), 10) : null,
        function: formData.function?.trim() || null,
        grade: formData.grade?.trim() || null,
        professional_category: formData.professional_category?.trim() || null,
      }
      if (editingAgent) {
        await client.put(`/medical/agents/${editingAgent.id}/`, data)
        showSnackbar('Agent modifié avec succès', 'success')
      } else {
        await client.post('/medical/agents/', data)
        showSnackbar('Agent créé avec succès', 'success')
      }
      handleCloseDialog()
      fetchAgents()
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error)
      const msg = getApiErrorMessage(error)
      showSnackbar(msg, 'error')
      const data = error?.response?.data
      if (data && typeof data === 'object' && !data.detail) {
        const errs: Record<string, string> = {}
        for (const [key, val] of Object.entries(data)) {
          const text = Array.isArray(val) ? val[0] : String(val)
          if (text && typeof text === 'string') errs[key] = text
        }
        if (Object.keys(errs).length > 0) setFieldErrors(errs)
      }
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleUnarchive = async (agent: Agent) => {
    try {
      await client.post(`/medical/agents/${agent.id}/unarchive/`)
      showSnackbar('Agent désarchivé avec succès', 'success')
      fetchAgents()
    } catch (error) {
      console.error('Erreur lors du désarchivage:', error)
      showSnackbar('Erreur lors du désarchivage', 'error')
    }
  }

  const handleDelete = async (agent: Agent) => {
    if (!window.confirm(`Supprimer (archiver) l'agent ${agent.full_name} ?`)) return
    try {
      await client.delete(`/medical/agents/${agent.id}/`)
      showSnackbar('Agent supprimé (archivé) avec succès', 'success')
      fetchAgents()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error) || 'Erreur lors de la suppression', 'error')
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  // Vérifier si l'utilisateur peut gérer les agents
  const canManageAgents = user?.role ? ['super_admin', 'admin', 'rh', 'hse'].includes(user.role) : false

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
        <Typography variant="h4">Gestion des Agents</Typography>
        <Box>
          <FormControlLabel
            control={
              <Switch
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
            }
            label="Afficher les archivés"
            sx={{ mr: 2 }}
          />
          {canManageAgents && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Nouvel agent
            </Button>
          )}
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Matricule</TableCell>
              <TableCell>Nom</TableCell>
              <TableCell>Prénom</TableCell>
              <TableCell>Âge</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Entreprise</TableCell>
              <TableCell>Site</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Fonction</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {agents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Aucun agent trouvé
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell>{agent.matricule}</TableCell>
                  <TableCell>{agent.last_name}</TableCell>
                  <TableCell>{agent.first_name}</TableCell>
                  <TableCell>{agent.age || '-'}</TableCell>
                  <TableCell>{agent.email || '-'}</TableCell>
                  <TableCell>{agent.phone || '-'}</TableCell>
                  <TableCell>{agent.company_name}</TableCell>
                  <TableCell>{agent.site_name || '-'}</TableCell>
                  <TableCell>{agent.service_name || '-'}</TableCell>
                  <TableCell>{agent.function || '-'}</TableCell>
                  <TableCell>
                    {agent.is_archived ? (
                      <Chip label="Archivé" color="default" size="small" />
                    ) : agent.is_active ? (
                      <Chip label="Actif" color="success" size="small" />
                    ) : (
                      <Chip label="Inactif" color="error" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {canManageAgents && (
                        <>
                          <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenDialog(agent)}>Modifier</Button>
                          {agent.is_archived ? (
                            <Button size="small" variant="outlined" startIcon={<UnarchiveIcon />} onClick={() => handleUnarchive(agent)}>Désarchiver</Button>
                          ) : (
                            <>
                              <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(agent)}>Supprimer</Button>
                            </>
                          )}
                        </>
                      )}
                      {hasMedicalAccess && (
                        <Button size="small" variant="outlined" onClick={() => navigate(`/dmst/${agent.id}`)}>DMST</Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de création/modification */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingAgent ? 'Modifier l\'agent' : 'Nouvel agent'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Informations administratives */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Informations administratives
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Matricule *"
                value={formData.matricule}
                onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
                required
                disabled={!!editingAgent}
                error={!!fieldErrors.matricule}
                helperText={fieldErrors.matricule}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Civilité</InputLabel>
                <Select
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  label="Civilité"
                >
                  <MenuItem value="M">Monsieur</MenuItem>
                  <MenuItem value="MME">Madame</MenuItem>
                  <MenuItem value="MLLE">Mademoiselle</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Sexe *</InputLabel>
                <Select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  label="Sexe *"
                  required
                >
                  <MenuItem value="M">Masculin</MenuItem>
                  <MenuItem value="F">Féminin</MenuItem>
                  <MenuItem value="O">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prénom *"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                required
                error={!!fieldErrors.first_name}
                helperText={fieldErrors.first_name}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom *"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                required
                error={!!fieldErrors.last_name}
                helperText={fieldErrors.last_name}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Date de naissance *"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                error={!!fieldErrors.date_of_birth}
                helperText={fieldErrors.date_of_birth}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Téléphone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adresse"
                multiline
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>

            {/* Contact d'urgence */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Contact d'urgence
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Nom"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Téléphone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Relation"
                value={formData.emergency_contact_relation}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
              />
            </Grid>

            {/* Informations professionnelles */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Informations professionnelles
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required error={!!fieldErrors.company}>
                <InputLabel>Entreprise *</InputLabel>
                <Select
                  value={formData.company === '' || formData.company === undefined ? '' : String(formData.company)}
                  onChange={(e) => {
                    const v = e.target.value
                    setFormData({
                      ...formData,
                      company: v === undefined ? '' : String(v),
                      site: '',
                      service: '',
                      job_position: '',
                      supervisor: '',
                    })
                  }}
                  label="Entreprise *"
                >
                  {companies.map((company) => (
                    <MenuItem key={company.id} value={String(company.id)}>
                      {company.name}
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.company && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{fieldErrors.company}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!fieldErrors.site}>
                <InputLabel>Site</InputLabel>
                <Select
                  value={formData.site === '' || formData.site === undefined ? '' : String(formData.site)}
                  onChange={(e) => {
                    setFormData({ ...formData, site: e.target.value === undefined ? '' : String(e.target.value), service: '' })
                  }}
                  label="Site"
                  disabled={!formData.company}
                >
                  {sites.map((site) => (
                    <MenuItem key={site.id} value={String(site.id)}>
                      {site.name}
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.site && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{fieldErrors.site}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!fieldErrors.service}>
                <InputLabel>Service</InputLabel>
                <Select
                  value={formData.service === '' || formData.service === undefined ? '' : String(formData.service)}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value === undefined ? '' : String(e.target.value) })}
                  label="Service"
                  disabled={!formData.company}
                >
                  {services.map((service) => (
                    <MenuItem key={service.id} value={String(service.id)}>
                      {service.name}
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.service && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{fieldErrors.service}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!fieldErrors.job_position}>
                <InputLabel>Poste de travail</InputLabel>
                <Select
                  value={formData.job_position === '' || formData.job_position === undefined ? '' : String(formData.job_position)}
                  onChange={(e) => setFormData({ ...formData, job_position: e.target.value === undefined ? '' : String(e.target.value) })}
                  label="Poste de travail"
                  disabled={!formData.company}
                >
                  {jobPositions.map((position) => (
                    <MenuItem key={position.id} value={String(position.id)}>
                      {position.name}
                    </MenuItem>
                  ))}
                </Select>
                {fieldErrors.job_position && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.5 }}>{fieldErrors.job_position}</Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Fonction"
                value={formData.function}
                onChange={(e) => setFormData({ ...formData, function: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Grade"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Catégorie professionnelle"
                value={formData.professional_category}
                onChange={(e) => setFormData({ ...formData, professional_category: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Supérieur hiérarchique</InputLabel>
                <Select
                  value={formData.supervisor === '' || formData.supervisor === undefined ? '' : String(formData.supervisor)}
                  onChange={(e) => setFormData({ ...formData, supervisor: e.target.value === undefined ? '' : String(e.target.value) })}
                  label="Supérieur hiérarchique"
                  disabled={!formData.company}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {supervisors
                    .filter((s) => s.id !== editingAgent?.id)
                    .map((supervisor) => (
                      <MenuItem key={supervisor.id} value={String(supervisor.id)}>
                        {supervisor.full_name} ({supervisor.matricule})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date d'embauche *"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                error={!!fieldErrors.hire_date}
                helperText={fieldErrors.hire_date}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Actif"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={submitLoading}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary" disabled={submitLoading} startIcon={submitLoading ? <CircularProgress size={18} color="inherit" /> : undefined}>
            {submitLoading ? (editingAgent ? 'Modification...' : 'Création...') : (editingAgent ? 'Modifier' : 'Créer')}
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
