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

export default function Visits() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [dmsts, setDmsts] = useState<DMST[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { hasMedicalAccess } = useAuth()

  useEffect(() => {
    fetchDMSTs()
    const agentParam = searchParams.get('agent')
    if (agentParam) {
      navigate(`/dmst/${agentParam}`)
    }
  }, [searchParams, navigate])

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Fiches d'observation médicale</Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Liste des fiches d'observation médicale déjà créées. Cliquez sur "Voir/Modifier" pour accéder à une fiche.
        </Typography>
      </Paper>

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
    </Box>
  )
}
