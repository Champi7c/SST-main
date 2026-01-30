import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
  Divider,
} from '@mui/material'
import { Edit as EditIcon, History as HistoryIcon, Timeline as TimelineIcon, MedicalServices as MedicalServicesIcon } from '@mui/icons-material'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface DMST {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  allergies?: string
  medical_history?: string
  chronic_diseases?: string
  smoking: boolean
  alcohol: boolean
  drugs: boolean
  habits_notes?: string
  physical_pathologies?: string
  mental_pathologies?: string
  social_pathologies?: string
  hereditary_diseases?: string
  handicap: boolean
  handicap_details?: string
  pregnancy: boolean
  pregnancy_due_date?: string
  current_treatments?: string
  treating_doctors?: string
  working_conditions?: string
  under_surveillance: boolean
  surveillance_type?: string
  visits_count: number
  last_visit_date?: string
  history_count: number
  created_at: string
  updated_at: string
  created_by_name?: string
  updated_by_name?: string
}

interface Visit {
  id: number
  scheduled_date: string
  actual_date?: string
  status: string
  status_display: string
  visit_type_name: string
  diagnosis?: string
  decision?: string
  decision_display?: string
  doctor_name?: string
  nurse_name?: string
}

interface HistoryEntry {
  id: number
  modification_date: string
  modification_type: string
  field_name?: string
  old_value?: string
  new_value?: string
  modified_by_name?: string
  reason?: string
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default function DMST() {
  const { agentId } = useParams()
  const navigate = useNavigate()
  const [dmst, setDmst] = useState<DMST | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [editMode, setEditMode] = useState(false)
  const [visits, setVisits] = useState<Visit[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [evolution, setEvolution] = useState<any>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const { hasMedicalAccess, user } = useAuth()

  const [formData, setFormData] = useState({
    allergies: '',
    medical_history: '',
    chronic_diseases: '',
    smoking: false,
    alcohol: false,
    drugs: false,
    habits_notes: '',
    physical_pathologies: '',
    mental_pathologies: '',
    social_pathologies: '',
    hereditary_diseases: '',
    handicap: false,
    handicap_details: '',
    pregnancy: false,
    pregnancy_due_date: '',
    current_treatments: '',
    treating_doctors: '',
    working_conditions: '',
    under_surveillance: false,
    surveillance_type: '',
  })

  useEffect(() => {
    if (!hasMedicalAccess) {
      setError("Vous n'avez pas accès aux données médicales")
      setLoading(false)
      return
    }
    fetchDMST()
  }, [agentId, hasMedicalAccess])

  useEffect(() => {
    if (dmst && tabValue === 1) {
      fetchVisits()
    } else if (dmst && tabValue === 2) {
      fetchHistory()
    } else if (dmst && tabValue === 3) {
      fetchEvolution()
    }
  }, [dmst, tabValue])

  const fetchDMST = async () => {
    try {
      const response = await client.get(`/medical/dmst/?agent=${agentId}`)
      if (response.data.results && response.data.results.length > 0) {
        const dmstData = response.data.results[0]
        setDmst(dmstData)
        setFormData({
          allergies: dmstData.allergies || '',
          medical_history: dmstData.medical_history || '',
          chronic_diseases: dmstData.chronic_diseases || '',
          smoking: dmstData.smoking || false,
          alcohol: dmstData.alcohol || false,
          drugs: dmstData.drugs || false,
          habits_notes: dmstData.habits_notes || '',
          physical_pathologies: dmstData.physical_pathologies || '',
          mental_pathologies: dmstData.mental_pathologies || '',
          social_pathologies: dmstData.social_pathologies || '',
          hereditary_diseases: dmstData.hereditary_diseases || '',
          handicap: dmstData.handicap || false,
          handicap_details: dmstData.handicap_details || '',
          pregnancy: dmstData.pregnancy || false,
          pregnancy_due_date: dmstData.pregnancy_due_date || '',
          current_treatments: dmstData.current_treatments || '',
          treating_doctors: dmstData.treating_doctors || '',
          working_conditions: dmstData.working_conditions || '',
          under_surveillance: dmstData.under_surveillance || false,
          surveillance_type: dmstData.surveillance_type || '',
        })
      } else {
        // Créer un nouveau DMST si inexistant
        setError('DMST non trouvé. Voulez-vous le créer ?')
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Erreur lors du chargement du DMST')
    } finally {
      setLoading(false)
    }
  }

  const fetchVisits = async () => {
    if (!dmst) return
    try {
      const response = await client.get(`/medical/dmst/${dmst.id}/visits/`)
      setVisits(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des visites:', error)
    }
  }

  const fetchHistory = async () => {
    if (!dmst) return
    try {
      const response = await client.get(`/medical/dmst/${dmst.id}/history/`)
      setHistory(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
    }
  }

  const fetchEvolution = async () => {
    if (!dmst) return
    try {
      const response = await client.get(`/medical/dmst/${dmst.id}/evolution/`)
      setEvolution(response.data)
    } catch (error) {
      console.error('Erreur lors du chargement de l\'évolution:', error)
    }
  }

  const buildDMSTPayload = () => {
    return {
      allergies: formData.allergies?.trim() || null,
      medical_history: formData.medical_history?.trim() || null,
      chronic_diseases: formData.chronic_diseases?.trim() || null,
      smoking: formData.smoking,
      alcohol: formData.alcohol,
      drugs: formData.drugs,
      habits_notes: formData.habits_notes?.trim() || null,
      physical_pathologies: formData.physical_pathologies?.trim() || null,
      mental_pathologies: formData.mental_pathologies?.trim() || null,
      social_pathologies: formData.social_pathologies?.trim() || null,
      hereditary_diseases: formData.hereditary_diseases?.trim() || null,
      handicap: formData.handicap,
      handicap_details: formData.handicap_details?.trim() || null,
      pregnancy: formData.pregnancy,
      pregnancy_due_date: formData.pregnancy_due_date?.trim() || null,
      current_treatments: formData.current_treatments?.trim() || null,
      treating_doctors: formData.treating_doctors?.trim() || null,
      working_conditions: formData.working_conditions?.trim() || null,
      under_surveillance: formData.under_surveillance,
      surveillance_type: formData.surveillance_type?.trim() || null,
    }
  }

  const handleSave = async () => {
    if (!dmst) return
    try {
      await client.put(`/medical/dmst/${dmst.id}/`, {
        ...buildDMSTPayload(),
        agent: dmst.agent,
      })
      showSnackbar('DMST modifié avec succès', 'success')
      setEditMode(false)
      fetchDMST()
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const handleCreateDMST = async () => {
    const aid = agentId ? parseInt(agentId, 10) : NaN
    if (!Number.isFinite(aid)) {
      showSnackbar('Agent invalide.', 'error')
      return
    }
    try {
      const response = await client.post('/medical/dmst/', {
        ...buildDMSTPayload(),
        agent: aid,
      })
      setDmst(response.data)
      showSnackbar('DMST créé avec succès', 'success')
      setError('')
    } catch (error: any) {
      showSnackbar(getApiErrorMessage(error), 'error')
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

  const canEdit = user?.role ? ['super_admin', 'medecin', 'infirmier'].includes(user.role) : false

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  if (error && !dmst) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dossier Médical en Santé au Travail
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        {canEdit && (
          <Button variant="contained" onClick={handleCreateDMST}>
            Créer le DMST
          </Button>
        )}
      </Box>
    )
  }

  if (!dmst) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dossier Médical en Santé au Travail
        </Typography>
        <Alert severity="info">Aucun DMST trouvé.</Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dossier Médical en Santé au Travail
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agent: {dmst.agent_name} ({dmst.agent_matricule})
          </Typography>
        </Box>
        {canEdit && (
          <Box>
            {editMode ? (
              <>
                <Button variant="outlined" onClick={() => { setEditMode(false); fetchDMST() }} sx={{ mr: 1 }}>
                  Annuler
                </Button>
                <Button variant="contained" onClick={handleSave}>
                  Enregistrer
                </Button>
              </>
            ) : (
              <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditMode(true)}>
                Modifier
              </Button>
            )}
          </Box>
        )}
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Informations médicales" icon={<MedicalServicesIcon />} iconPosition="start" />
          <Tab label={`Visites (${dmst.visits_count})`} icon={<MedicalServicesIcon />} iconPosition="start" />
          <Tab label={`Historique (${dmst.history_count})`} icon={<HistoryIcon />} iconPosition="start" />
          <Tab label="Évolution" icon={<TimelineIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Allergies */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Allergies"
                multiline
                rows={3}
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                disabled={!editMode}
              />
            </Grid>

            {/* Antécédents médicaux */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Antécédents médicaux"
                multiline
                rows={3}
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                disabled={!editMode}
              />
            </Grid>

            {/* Maladies chroniques */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maladies chroniques"
                multiline
                rows={3}
                value={formData.chronic_diseases}
                onChange={(e) => setFormData({ ...formData, chronic_diseases: e.target.value })}
                disabled={!editMode}
              />
            </Grid>

            {/* Maladies héréditaires */}
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Maladies héréditaires"
                multiline
                rows={3}
                value={formData.hereditary_diseases}
                onChange={(e) => setFormData({ ...formData, hereditary_diseases: e.target.value })}
                disabled={!editMode}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Habitudes
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.smoking}
                    onChange={(e) => setFormData({ ...formData, smoking: e.target.checked })}
                    disabled={!editMode}
                  />
                }
                label="Tabagisme"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.alcohol}
                    onChange={(e) => setFormData({ ...formData, alcohol: e.target.checked })}
                    disabled={!editMode}
                  />
                }
                label="Alcool"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.drugs}
                    onChange={(e) => setFormData({ ...formData, drugs: e.target.checked })}
                    disabled={!editMode}
                  />
                }
                label="Drogues"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes sur les habitudes"
                multiline
                rows={2}
                value={formData.habits_notes}
                onChange={(e) => setFormData({ ...formData, habits_notes: e.target.value })}
                disabled={!editMode}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Classification des pathologies
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pathologies physiques"
                multiline
                rows={4}
                value={formData.physical_pathologies}
                onChange={(e) => setFormData({ ...formData, physical_pathologies: e.target.value })}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pathologies mentales"
                multiline
                rows={4}
                value={formData.mental_pathologies}
                onChange={(e) => setFormData({ ...formData, mental_pathologies: e.target.value })}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pathologies sociales"
                multiline
                rows={4}
                value={formData.social_pathologies}
                onChange={(e) => setFormData({ ...formData, social_pathologies: e.target.value })}
                disabled={!editMode}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Autres informations
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Traitements en cours"
                multiline
                rows={4}
                value={formData.current_treatments}
                onChange={(e) => setFormData({ ...formData, current_treatments: e.target.value })}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Médecins traitants"
                multiline
                rows={4}
                value={formData.treating_doctors}
                onChange={(e) => setFormData({ ...formData, treating_doctors: e.target.value })}
                disabled={!editMode}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Conditions de travail"
                multiline
                rows={3}
                value={formData.working_conditions}
                onChange={(e) => setFormData({ ...formData, working_conditions: e.target.value })}
                disabled={!editMode}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.handicap}
                    onChange={(e) => setFormData({ ...formData, handicap: e.target.checked })}
                    disabled={!editMode}
                  />
                }
                label="Handicap"
              />
            </Grid>
            {formData.handicap && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Détails du handicap"
                  multiline
                  rows={2}
                  value={formData.handicap_details}
                  onChange={(e) => setFormData({ ...formData, handicap_details: e.target.value })}
                  disabled={!editMode}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.pregnancy}
                    onChange={(e) => setFormData({ ...formData, pregnancy: e.target.checked })}
                    disabled={!editMode}
                  />
                }
                label="Grossesse"
              />
            </Grid>
            {formData.pregnancy && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date prévue d'accouchement"
                  type="date"
                  value={formData.pregnancy_due_date}
                  onChange={(e) => setFormData({ ...formData, pregnancy_due_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  disabled={!editMode}
                />
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.under_surveillance}
                    onChange={(e) => setFormData({ ...formData, under_surveillance: e.target.checked })}
                    disabled={!editMode}
                  />
                }
                label="Sous surveillance médicale"
              />
            </Grid>
            {formData.under_surveillance && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Type de surveillance"
                  value={formData.surveillance_type}
                  onChange={(e) => setFormData({ ...formData, surveillance_type: e.target.value })}
                  disabled={!editMode}
                />
              </Grid>
            )}
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Diagnostic</TableCell>
                  <TableCell>Décision</TableCell>
                  <TableCell>Médecin</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucune visite médicale enregistrée
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  visits.map((visit) => (
                    <TableRow key={visit.id}>
                      <TableCell>{new Date(visit.scheduled_date).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{visit.visit_type_name}</TableCell>
                      <TableCell>
                        <Chip label={visit.status_display} size="small" color={visit.status === 'completed' ? 'success' : 'default'} />
                      </TableCell>
                      <TableCell>{visit.diagnosis || '-'}</TableCell>
                      <TableCell>{visit.decision_display || '-'}</TableCell>
                      <TableCell>{visit.doctor_name || '-'}</TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => navigate(`/visits/${visit.id}`)}>
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Champ modifié</TableCell>
                  <TableCell>Ancienne valeur</TableCell>
                  <TableCell>Nouvelle valeur</TableCell>
                  <TableCell>Modifié par</TableCell>
                  <TableCell>Raison</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary">
                        Aucun historique enregistré
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.modification_date).toLocaleString('fr-FR')}</TableCell>
                      <TableCell>{entry.modification_type}</TableCell>
                      <TableCell>{entry.field_name || '-'}</TableCell>
                      <TableCell>{entry.old_value || '-'}</TableCell>
                      <TableCell>{entry.new_value || '-'}</TableCell>
                      <TableCell>{entry.modified_by_name || '-'}</TableCell>
                      <TableCell>{entry.reason || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {evolution ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Évolution de l'état de santé
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
                {evolution.total_visits} visite(s) médicale(s) enregistrée(s)
              </Typography>
              {evolution.evolution.length === 0 ? (
                <Alert severity="info">Aucune évolution enregistrée</Alert>
              ) : (
                <Box>
                  {evolution.evolution.map((entry: any, index: number) => (
                    <Paper key={index} sx={{ p: 2, mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {new Date(entry.date).toLocaleDateString('fr-FR')} - {entry.visit_type}
                      </Typography>
                      {entry.diagnosis && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Diagnostic:</strong> {entry.diagnosis}
                        </Typography>
                      )}
                      {entry.decision && (
                        <Typography variant="body2">
                          <strong>Décision:</strong> {entry.decision}
                        </Typography>
                      )}
                      {entry.doctor && (
                        <Typography variant="body2" color="text.secondary">
                          Médecin: {entry.doctor}
                        </Typography>
                      )}
                    </Paper>
                  ))}
                </Box>
              )}
            </Box>
          ) : (
            <CircularProgress />
          )}
        </TabPanel>
      </Paper>

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
