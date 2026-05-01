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
} from '@mui/material'
import {
  Search as SearchIcon,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface Agent {
  id: number
  matricule: string
  full_name: string
  company_name: string
  site_name?: string
  service_name?: string
}

export default function Visits() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { hasMedicalAccess } = useAuth()

  useEffect(() => {
    fetchAgents()
    const agentParam = searchParams.get('agent')
    if (agentParam) {
      navigate(`/dmst/${agentParam}`)
    }
  }, [searchParams, navigate])

  const fetchAgents = async () => {
    try {
      const response = await client.get('/medical/agents/', {
        params: {
          is_active: true,
          page_size: 1000,
          ordering: '-created_at'
        }
      })
      const data = response.data
      const agentsList = Array.isArray(data) ? data : (data.results || [])
      setAgents(agentsList.filter((a: any) => !a.is_archived))
    } catch (error) {
      console.error('Erreur lors du chargement des agents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenObservationForm = (agentId: number) => {
    navigate(`/dmst/${agentId}`)
  }

  const filteredAgents = agents.filter((agent) => {
    const search = searchTerm.toLowerCase()
    return (
      (agent.full_name ?? '').toLowerCase().includes(search) ||
      (agent.matricule ?? '').toLowerCase().includes(search) ||
      (agent.company_name ?? '').toLowerCase().includes(search)
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Fiche d'observation</Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Sélectionnez un agent pour remplir sa fiche d'observation médicale
        </Typography>
      </Paper>

      <Paper>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Rechercher un agent par nom, matricule ou entreprise..."
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
                <TableCell>Entreprise</TableCell>
                <TableCell>Site</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAgents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm ? 'Aucun agent trouvé' : 'Aucun agent disponible'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAgents.map((agent) => (
                  <TableRow key={agent.id} hover>
                    <TableCell>{agent.matricule}</TableCell>
                    <TableCell>{agent.full_name}</TableCell>
                    <TableCell>{agent.company_name}</TableCell>
                    <TableCell>{agent.site_name || '-'}</TableCell>
                    <TableCell>{agent.service_name || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<MedicalServicesIcon />}
                        onClick={() => handleOpenObservationForm(agent.id)}
                      >
                        Remplir la fiche
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  )
}