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
  CircularProgress,
  IconButton,
  Tooltip,
  InputAdornment,
  TextField,
  TablePagination,
} from '@mui/material'
import { Search as SearchIcon, Edit as EditIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface DMST {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  agent_age?: number
  agent_direction?: string
  agent_function?: string
  agent_site_name?: string
  visits_count: number
  last_visit_date?: string
  created_at: string
  updated_at: string
}

export default function DMSTList() {
  const [dmsts, setDmsts] = useState<DMST[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const navigate = useNavigate()
  const { hasMedicalAccess } = useAuth()

  useEffect(() => {
    fetchDmsts()
  }, [page, rowsPerPage])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(0)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const fetchDmsts = async () => {
    if (!hasMedicalAccess) {
      setLoading(false)
      return
    }
    try {
      const params: Record<string, string | number> = {
        page: page + 1,
        page_size: rowsPerPage,
        ordering: '-updated_at'
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim()
      }
      const response = await client.get('/medical/dmst/', { params })
      const data = response.data
      if (Array.isArray(data)) {
        setDmsts(data)
        setTotalCount(data.length)
      } else {
        setDmsts(data.results || [])
        setTotalCount(data.count || 0)
      }
    } catch (error: any) {
      console.error('Error loading DMSTs:', error)
      setDmsts([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5">Dossiers Médicales (DMST)</Typography>
      </Box>

      <TextField
        fullWidth
        size="small"
        placeholder="Rechercher par nom, prénom, matricule..."
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
              <TableCell>Âge</TableCell>
              <TableCell>Entreprise</TableCell>
              <TableCell>Site</TableCell>
              <TableCell>Service</TableCell>
              <TableCell>Fonction</TableCell>
              <TableCell>Dernière visite</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dmsts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  <Typography variant="body2" color="text.secondary">
                    {totalCount === 0 ? 'Aucun dossier médical trouvé' : 'Aucun dossier ne correspond à la recherche'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              dmsts.map((dmst) => (
                <TableRow key={dmst.id}>
                  <TableCell>{dmst.agent_matricule}</TableCell>
                  <TableCell>{dmst.agent_name}</TableCell>
                  <TableCell>{dmst.agent_age || '-'}</TableCell>
                  <TableCell>{dmst.agent_direction}</TableCell>
                  <TableCell>{dmst.agent_site_name || '-'}</TableCell>
                  <TableCell>{dmst.agent_function || '-'}</TableCell>
                  <TableCell>{dmst.last_visit_date ? new Date(dmst.last_visit_date).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell>
                    <Tooltip title="Voir/Modifier le DMST">
                      <IconButton size="small" onClick={() => navigate(`/dmst/${dmst.agent}`)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        labelRowsPerPage="Lignes par page:"
      />
    </Box>
  )
}
