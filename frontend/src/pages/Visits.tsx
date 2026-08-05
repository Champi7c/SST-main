import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
} from '@mui/material'
import {
  Search as SearchIcon,
  MedicalServices as MedicalServicesIcon,
  Assignment as AssignmentIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface DMST {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  agent_age?: number
  agent_direction?: string
  agent_site_name?: string
  created_at?: string
  updated_at?: string
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

const emptyNewAgentForm = {
  matricule: '',
  first_name: '',
  last_name: '',
  date_of_birth: '',
  gender: 'M',
  company: '',
  site: '',
  phone: '',
}

export default function Visits() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [dmsts, setDmsts] = useState<DMST[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { hasMedicalAccess } = useAuth()

  const [companies, setCompanies] = useState<Company[]>([])
  const [allSites, setAllSites] = useState<Site[]>([])
  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false)
  const [newAgentForm, setNewAgentForm] = useState(emptyNewAgentForm)
  const [creatingAgent, setCreatingAgent] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })

  useEffect(() => {
    fetchDMSTs()
    const agentParam = searchParams.get('agent')
    if (agentParam) {
      navigate(`/dmst/${agentParam}`)
    }
  }, [searchParams, navigate])

  useEffect(() => {
    client.get('/companies/companies/?page_size=500').then((r) => setCompanies(r.data.results ?? r.data)).catch(() => {})
    client.get('/companies/sites/?page_size=500').then((r) => setAllSites(r.data.results ?? r.data)).catch(() => {})
  }, [])

  const sitesForSelectedCompany = newAgentForm.company
    ? allSites.filter((s) => s.company.toString() === newAgentForm.company)
    : []

  const openNewAgent = () => {
    setNewAgentForm(emptyNewAgentForm)
    setOpenNewAgentDialog(true)
  }

  const handleCreateNewAgent = async () => {
    if (!newAgentForm.first_name.trim() || !newAgentForm.last_name.trim() || !newAgentForm.date_of_birth || !newAgentForm.company) {
      setSnackbar({ open: true, message: 'Veuillez remplir les champs obligatoires (prénom, nom, date de naissance, entreprise).', severity: 'error' })
      return
    }
    setCreatingAgent(true)
    try {
      const payload = {
        matricule: newAgentForm.matricule.trim() || null,
        first_name: newAgentForm.first_name.trim(),
        last_name: newAgentForm.last_name.trim(),
        date_of_birth: newAgentForm.date_of_birth,
        gender: newAgentForm.gender,
        company: parseInt(newAgentForm.company, 10),
        site: newAgentForm.site ? parseInt(newAgentForm.site, 10) : null,
        phone: newAgentForm.phone.trim() || null,
      }
      const { data: created } = await client.post('/medical/agents/', payload)
      setOpenNewAgentDialog(false)
      navigate(`/dmst/${created.id}`)
    } catch (error) {
      setSnackbar({ open: true, message: getApiErrorMessage(error), severity: 'error' })
    } finally {
      setCreatingAgent(false)
    }
  }

  const fetchDMSTs = async () => {
    try {
      const response = await client.get('/medical/dmst/', {
        params: {
          page_size: 1000,
          ordering: '-created_at'
        }
      })
      const data = response.data
      const dmstList = Array.isArray(data) ? data : (data.results || [])
      setDmsts(dmstList)
    } catch (error) {
      console.error('Erreur lors du chargement des DMST:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenObservationForm = (agentId: number) => {
    navigate(`/dmst/${agentId}`)
  }

  const filteredDmsts = dmsts.filter((dmst) => {
    const search = searchTerm.toLowerCase()
    return (
      (dmst.agent_name ?? '').toLowerCase().includes(search) ||
      (dmst.agent_matricule ?? '').toLowerCase().includes(search)
    )
  })

  if (!hasMedicalAccess) {
    return (
      <Box>
        <Alert severity="error">Vous n'avez pas accès aux données médicales</Alert>
      </Box>
    )
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
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={3}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: 'rgba(15,76,134,0.12)', color: '#0F4C86', width: 48, height: 48 }}>
            <AssignmentIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800}>Fiches d'observation médicale</Typography>
            <Typography variant="body2" color="text.secondary">
              Liste des fiches déjà créées. Cliquez sur « Voir/Modifier » pour accéder à une fiche.
            </Typography>
          </Box>
        </Box>
        {hasMedicalAccess && (
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openNewAgent}>
            Nouvel agent &amp; programmer une visite
          </Button>
        )}
      </Box>

      <Paper>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Rechercher par nom ou matricule de l'agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Matricule</TableCell>
                <TableCell>Nom et prénoms</TableCell>
                <TableCell>Âge</TableCell>
                <TableCell>Direction</TableCell>
                <TableCell>Site</TableCell>
                <TableCell>Date de création</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDmsts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'Aucune fiche trouvée' : 'Aucune fiche de observation médicale créée'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDmsts.map((dmst) => (
                  <TableRow key={dmst.id} hover>
                    <TableCell>{dmst.agent_matricule}</TableCell>
                    <TableCell>{dmst.agent_name}</TableCell>
                    <TableCell>{dmst.agent_age || '-'}</TableCell>
                    <TableCell>{dmst.agent_direction || '-'}</TableCell>
                    <TableCell>{dmst.agent_site_name || '-'}</TableCell>
                    <TableCell>
                      {dmst.created_at ? new Date(dmst.created_at).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="info"
                        startIcon={<MedicalServicesIcon />}
                        onClick={() => handleOpenObservationForm(dmst.agent)}
                      >
                        Voir/Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog : Nouvel agent non enregistré + programmation de visite */}
      <Dialog open={openNewAgentDialog} onClose={() => setOpenNewAgentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvel agent &amp; programmer une visite</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cet agent n'est pas encore enregistré ? Créez sa fiche ici, vous serez ensuite redirigé vers son DMST pour programmer sa visite.
          </Typography>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Matricule"
                value={newAgentForm.matricule}
                onChange={(e) => setNewAgentForm({ ...newAgentForm, matricule: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Sexe</InputLabel>
                <Select
                  value={newAgentForm.gender}
                  label="Sexe"
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, gender: e.target.value })}
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
                value={newAgentForm.first_name}
                onChange={(e) => setNewAgentForm({ ...newAgentForm, first_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nom *"
                value={newAgentForm.last_name}
                onChange={(e) => setNewAgentForm({ ...newAgentForm, last_name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de naissance *"
                type="date"
                value={newAgentForm.date_of_birth}
                onChange={(e) => setNewAgentForm({ ...newAgentForm, date_of_birth: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Téléphone"
                value={newAgentForm.phone}
                onChange={(e) => setNewAgentForm({ ...newAgentForm, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Entreprise *</InputLabel>
                <Select
                  value={newAgentForm.company}
                  label="Entreprise *"
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, company: e.target.value, site: '' })}
                >
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!newAgentForm.company}>
                <InputLabel>Site</InputLabel>
                <Select
                  value={newAgentForm.site}
                  label="Site"
                  onChange={(e) => setNewAgentForm({ ...newAgentForm, site: e.target.value })}
                >
                  <MenuItem value="">—</MenuItem>
                  {sitesForSelectedCompany.map((s) => (
                    <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewAgentDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateNewAgent}
            disabled={creatingAgent}
            startIcon={creatingAgent ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            Créer et programmer la visite
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
