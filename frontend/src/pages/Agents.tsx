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
  Autocomplete,
  InputAdornment,
} from '@mui/material'
import { Edit as EditIcon, Unarchive as UnarchiveIcon, Add as AddIcon, Delete as DeleteIcon, Search as SearchIcon } from '@mui/icons-material'
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
  const [searchQuery, setSearchQuery] = useState('')
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
      const companyId = parseInt(formData.company, 10)
      // Ne charger les sites/services que si c'est un ID valide (pas un nom d'entreprise)
      if (!isNaN(companyId)) {
        fetchSites(companyId.toString())
        fetchServices(companyId.toString())
        fetchJobPositions(companyId.toString())
      } else {
        // Si c'est un nom d'entreprise, vider les listes
        setSites([])
        setServices([])
        setJobPositions([])
      }
    }
  }, [formData.company])

  useEffect(() => {
    if (formData.site && formData.company) {
      const companyId = parseInt(formData.company, 10)
      if (!isNaN(companyId)) {
        fetchServices(companyId.toString(), formData.site)
      }
    }
  }, [formData.site])

  useEffect(() => {
    if (formData.company) {
      const companyId = parseInt(formData.company, 10)
      if (!isNaN(companyId)) {
        fetchSupervisors(companyId.toString())
      } else {
        setSupervisors([])
      }
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
    const companyId = formData.company ? parseInt(formData.company, 10) : NaN
    const isCompanyName = formData.company && !Number.isFinite(companyId)
    if (!editingAgent && (!formData.first_name?.trim() || !formData.last_name?.trim() || !formData.date_of_birth)) {
      showSnackbar('Veuillez remplir les champs obligatoires (prénom, nom, date de naissance).', 'error')
      return
    }
    if (!formData.company || (!Number.isFinite(companyId) && !isCompanyName)) {
      showSnackbar('Veuillez sélectionner ou saisir une entreprise.', 'error')
      setFieldErrors((e) => ({ ...e, company: 'Champ obligatoire' }))
      return
    }
    setSubmitLoading(true)
    try {
      const data: Record<string, unknown> = {
        matricule: formData.matricule?.trim() || null,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        hire_date: formData.hire_date || null,
        is_active: formData.is_active,
        title: formData.title || null,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        emergency_contact_name: formData.emergency_contact_name?.trim() || null,
        emergency_contact_phone: formData.emergency_contact_phone?.trim() || null,
        emergency_contact_relation: formData.emergency_contact_relation?.trim() || null,
        function: formData.function?.trim() || null,
        grade: formData.grade?.trim() || null,
        professional_category: formData.professional_category?.trim() || null,
      }
      
      // Si c'est un nom d'entreprise, envoyer company_name_input, sinon company (ID)
      if (isCompanyName) {
        data.company_name_input = formData.company.trim()
      } else {
        data.company = companyId
      }
      
      // Gérer le site
      if (formData.site) {
        const siteId = parseInt(formData.site, 10)
        if (!isNaN(siteId)) {
          data.site = siteId
        } else {
          data.site_name_input = formData.site.trim()
        }
      }
      
      // Gérer le service
      if (formData.service) {
        const serviceId = parseInt(formData.service, 10)
        if (!isNaN(serviceId)) {
          data.service = serviceId
        } else {
          data.service_name_input = formData.service.trim()
        }
      }
      
      // Gérer le poste de travail
      if (formData.job_position) {
        const jobPositionId = parseInt(formData.job_position, 10)
        if (!isNaN(jobPositionId)) {
          data.job_position = jobPositionId
        } else {
          data.job_position_name_input = formData.job_position.trim()
        }
      }
      
      // Gérer le superviseur
      if (formData.supervisor) {
        const supervisorId = parseInt(formData.supervisor, 10)
        if (!isNaN(supervisorId)) {
          data.supervisor = supervisorId
        } else {
          // C'est un matricule ou un nom
          data.supervisor_matricule_input = formData.supervisor.trim()
        }
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
      fetchCompanies() // Rafraîchir la liste des entreprises au cas où une nouvelle a été créée
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
  const canManageAgents = user?.role ? ['super_admin', 'admin', 'rh', 'hse', 'medecin', 'infirmier', 'direction'].includes(user.role) : false

  // Filtrer les agents selon la barre de recherche (nom, prénom, matricule, email, entreprise, téléphone)
  const searchLower = searchQuery.trim().toLowerCase()
  const filteredAgents = searchLower
    ? agents.filter(
        (a) =>
          (a.full_name && a.full_name.toLowerCase().includes(searchLower)) ||
          (a.first_name && a.first_name.toLowerCase().includes(searchLower)) ||
          (a.last_name && a.last_name.toLowerCase().includes(searchLower)) ||
          (a.matricule && a.matricule.toLowerCase().includes(searchLower)) ||
          (a.email && a.email.toLowerCase().includes(searchLower)) ||
          (a.company_name && a.company_name.toLowerCase().includes(searchLower)) ||
          (a.phone && a.phone.replace(/\s/g, '').includes(searchQuery.trim().replace(/\s/g, '')))
      )
    : agents

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Gestion des Agents</Typography>
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

      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher par nom, prénom, matricule, email, entreprise, téléphone..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />

      <TableContainer component={Paper}>
        <Table size="small">
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
            {filteredAgents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {agents.length === 0 ? 'Aucun agent trouvé' : 'Aucun agent ne correspond à la recherche'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAgents.map((agent) => (
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
                label="Matricule"
                value={formData.matricule}
                onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
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
              <Autocomplete
                freeSolo
                options={companies}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  return option.name
                }}
                value={
                  formData.company
                    ? (companies.find(c => c.id.toString() === formData.company.toString()) || 
                       (typeof formData.company === 'string' && !isNaN(Number(formData.company)) 
                        ? null 
                        : formData.company))
                    : null
                }
                inputValue={
                  formData.company && typeof formData.company === 'string' && isNaN(Number(formData.company))
                    ? formData.company
                    : formData.company && companies.find(c => c.id.toString() === formData.company.toString())
                    ? companies.find(c => c.id.toString() === formData.company.toString())!.name
                    : ''
                }
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input' && newInputValue) {
                    const existingCompany = companies.find(c => c.name.toLowerCase() === newInputValue.toLowerCase())
                    if (!existingCompany) {
                      setFormData({
                        ...formData,
                        company: newInputValue,
                        site: '',
                        service: '',
                        job_position: '',
                        supervisor: '',
                      })
                    }
                  }
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setFormData({
                      ...formData,
                      company: newValue,
                      site: '',
                      service: '',
                      job_position: '',
                      supervisor: '',
                    })
                  } else if (newValue && 'id' in newValue) {
                    setFormData({
                      ...formData,
                      company: newValue.id.toString(),
                      site: '',
                      service: '',
                      job_position: '',
                      supervisor: '',
                    })
                  } else {
                    setFormData({
                      ...formData,
                      company: '',
                      site: '',
                      service: '',
                      job_position: '',
                      supervisor: '',
                    })
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Entreprise *"
                    required
                    placeholder="Sélectionnez ou tapez un nom d'entreprise"
                    error={!!fieldErrors.company}
                    helperText={fieldErrors.company}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={sites}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  return option.name
                }}
                value={
                  formData.site
                    ? (sites.find(s => s.id.toString() === formData.site.toString()) || 
                       (typeof formData.site === 'string' && !isNaN(Number(formData.site)) 
                        ? null 
                        : formData.site))
                    : null
                }
                inputValue={
                  formData.site && typeof formData.site === 'string' && isNaN(Number(formData.site))
                    ? formData.site
                    : formData.site && sites.find(s => s.id.toString() === formData.site.toString())
                    ? sites.find(s => s.id.toString() === formData.site.toString())!.name
                    : ''
                }
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input' && newInputValue && formData.company) {
                    const existingSite = sites.find(s => s.name.toLowerCase() === newInputValue.toLowerCase())
                    if (!existingSite) {
                      // Permettre la saisie même si l'entreprise est un nom (sera créée par le backend)
                      setFormData({
                        ...formData,
                        site: newInputValue,
                        service: '',
                      })
                    }
                  }
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setFormData({ ...formData, site: newValue, service: '' })
                  } else if (newValue && 'id' in newValue) {
                    setFormData({ ...formData, site: newValue.id.toString(), service: '' })
                  } else {
                    setFormData({ ...formData, site: '', service: '' })
                  }
                }}
                disabled={!formData.company}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Site"
                    placeholder="Sélectionnez ou tapez un nom de site"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={services}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  return option.name
                }}
                value={
                  formData.service
                    ? (services.find(s => s.id.toString() === formData.service.toString()) || 
                       (typeof formData.service === 'string' && !isNaN(Number(formData.service)) 
                        ? null 
                        : formData.service))
                    : null
                }
                inputValue={
                  formData.service && typeof formData.service === 'string' && isNaN(Number(formData.service))
                    ? formData.service
                    : formData.service && services.find(s => s.id.toString() === formData.service.toString())
                    ? services.find(s => s.id.toString() === formData.service.toString())!.name
                    : ''
                }
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input' && newInputValue && formData.company) {
                    const existingService = services.find(s => s.name.toLowerCase() === newInputValue.toLowerCase())
                    if (!existingService) {
                      // Permettre la saisie même si l'entreprise est un nom (sera créée par le backend)
                      setFormData({
                        ...formData,
                        service: newInputValue,
                      })
                    }
                  }
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setFormData({ ...formData, service: newValue })
                  } else if (newValue && 'id' in newValue) {
                    setFormData({ ...formData, service: newValue.id.toString() })
                  } else {
                    setFormData({ ...formData, service: '' })
                  }
                }}
                disabled={!formData.company}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Service"
                    placeholder="Sélectionnez ou tapez un nom de service"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={jobPositions}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  return option.name
                }}
                value={
                  formData.job_position
                    ? (jobPositions.find(j => j.id.toString() === formData.job_position.toString()) || 
                       (typeof formData.job_position === 'string' && !isNaN(Number(formData.job_position)) 
                        ? null 
                        : formData.job_position))
                    : null
                }
                inputValue={
                  formData.job_position && typeof formData.job_position === 'string' && isNaN(Number(formData.job_position))
                    ? formData.job_position
                    : formData.job_position && jobPositions.find(j => j.id.toString() === formData.job_position.toString())
                    ? jobPositions.find(j => j.id.toString() === formData.job_position.toString())!.name
                    : ''
                }
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input' && newInputValue && formData.company) {
                    const existingJobPosition = jobPositions.find(j => j.name.toLowerCase() === newInputValue.toLowerCase())
                    if (!existingJobPosition) {
                      // Permettre la saisie même si l'entreprise est un nom (sera créée par le backend)
                      setFormData({
                        ...formData,
                        job_position: newInputValue,
                      })
                    }
                  }
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setFormData({ ...formData, job_position: newValue })
                  } else if (newValue && 'id' in newValue) {
                    setFormData({ ...formData, job_position: newValue.id.toString() })
                  } else {
                    setFormData({ ...formData, job_position: '' })
                  }
                }}
                disabled={!formData.company}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Poste de travail"
                    placeholder="Sélectionnez ou tapez un nom de poste"
                  />
                )}
              />
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
              <Autocomplete
                freeSolo
                options={supervisors.filter((s) => s.id !== editingAgent?.id)}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option
                  return `${option.full_name} (${option.matricule})`
                }}
                value={
                  formData.supervisor
                    ? (supervisors.find(s => s.id.toString() === formData.supervisor.toString()) || 
                       (typeof formData.supervisor === 'string' && !isNaN(Number(formData.supervisor)) 
                        ? null 
                        : formData.supervisor))
                    : null
                }
                inputValue={
                  formData.supervisor && typeof formData.supervisor === 'string' && isNaN(Number(formData.supervisor))
                    ? formData.supervisor
                    : formData.supervisor && supervisors.find(s => s.id.toString() === formData.supervisor.toString())
                    ? `${supervisors.find(s => s.id.toString() === formData.supervisor.toString())!.full_name} (${supervisors.find(s => s.id.toString() === formData.supervisor.toString())!.matricule})`
                    : ''
                }
                onInputChange={(event, newInputValue, reason) => {
                  if (reason === 'input' && newInputValue && formData.company) {
                    const match = newInputValue.match(/^(.+?)\s*\((.+?)\)$/)
                    if (match) {
                      const [, , matricule] = match
                      const existingSupervisor = supervisors.find(s => 
                        s.matricule.toLowerCase() === matricule.trim().toLowerCase()
                      )
                      if (!existingSupervisor) {
                        setFormData({ ...formData, supervisor: matricule.trim() })
                      }
                    } else {
                      const existingSupervisor = supervisors.find(s => 
                        s.full_name.toLowerCase().includes(newInputValue.toLowerCase()) ||
                        s.matricule.toLowerCase() === newInputValue.toLowerCase()
                      )
                      if (!existingSupervisor) {
                        setFormData({ ...formData, supervisor: newInputValue })
                      }
                    }
                  }
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    if (newValue.trim() === '' || newValue.toLowerCase() === 'aucun') {
                      setFormData({ ...formData, supervisor: '' })
                    } else {
                      setFormData({ ...formData, supervisor: newValue })
                    }
                  } else if (newValue && 'id' in newValue) {
                    setFormData({ ...formData, supervisor: newValue.id.toString() })
                  } else {
                    setFormData({ ...formData, supervisor: '' })
                  }
                }}
                disabled={!formData.company}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Supérieur hiérarchique"
                    placeholder="Sélectionnez ou tapez un nom/matricule (ou laissez vide)"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date d'embauche"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
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
