import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  Card,
  CardContent,
} from '@mui/material'
import {
  VideoCall as VideoCallIcon,
  Send as SendIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenInNewIcon,
  Videocam as VideocamIcon,
} from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

interface ConsultationRecord {
  id: number
  subject: string
  status: string
  status_display: string
  meeting_id: string
  meeting_link: string
  created_at: string
  scheduled_at?: string
  agent_name?: string
  agent_matricule?: string
}

export default function ConsultationEnLigne() {
  const navigate = useNavigate()
  const [tabValue, setTabValue] = useState(0)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [loading, setLoading] = useState(false)
  const [agents, setAgents] = useState<{ id: number; full_name: string; matricule: string }[]>([])
  const [form, setForm] = useState({
    subject: '',
    message: '',
    preferred_date: '',
    preferred_time: '',
    agent_id: '',
  })
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([])
  const [createdLink, setCreatedLink] = useState<string | null>(null)
  const { hasMedicalAccess } = useAuth()

  const loadAgents = async () => {
    try {
      const r = await client.get('/medical/agents/', { params: { is_active: true } })
      const data = r.data.results || r.data
      setAgents((data as any[]).filter((a: any) => !a.is_archived).map((a: any) => ({
        id: a.id,
        full_name: a.full_name || `${a.last_name || ''} ${a.first_name || ''}`.trim(),
        matricule: a.matricule || '',
      })))
    } catch {
      setAgents([])
    }
  }

  const loadConsultations = async () => {
    try {
      const r = await client.get('/consultations/')
      setConsultations(r.data.results || r.data || [])
    } catch {
      setConsultations([])
    }
  }

  useEffect(() => {
    loadAgents()
  }, [])

  useEffect(() => {
    loadConsultations()
  }, [tabValue])

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.subject.trim()) {
      setSnackbar({ open: true, message: 'Veuillez indiquer un sujet.', severity: 'error' })
      return
    }
    setLoading(true)
    setCreatedLink(null)
    try {
      const payload: Record<string, unknown> = {
        subject: form.subject.trim(),
        message: form.message.trim() || null,
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time.trim() || null,
      }
      if (form.agent_id) payload.agent = parseInt(form.agent_id, 10)
      const r = await client.post('/consultations/', payload)
      const link = r.data?.meeting_link
      setCreatedLink(link || null)
      setForm({ subject: '', message: '', preferred_date: '', preferred_time: '', agent_id: '' })
      setSnackbar({
        open: true,
        message: link
          ? 'Consultation créée. Envoyez le lien ci-dessous à la personne pour qu\'elle rejoigne avec sa webcam.'
          : 'Consultation créée.',
        severity: 'success',
      })
      loadConsultations()
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.subject?.[0] || 'Erreur lors de l\'envoi.'
      setSnackbar({ open: true, message: String(msg), severity: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link).then(
      () => setSnackbar({ open: true, message: 'Lien copié dans le presse-papier.', severity: 'success' }),
      () => setSnackbar({ open: true, message: 'Impossible de copier le lien.', severity: 'error' }),
    )
  }

  const openRoom = (meetingLink: string, inApp: boolean) => {
    if (inApp) {
      const match = meetingLink.match(/meet\.jit\.si\/(.+)$/)
      const roomId = match ? match[1] : ''
      if (roomId) navigate(`/consultation-en-ligne/room/${encodeURIComponent(roomId)}`)
      else window.open(meetingLink, '_blank', 'noopener,noreferrer')
    } else {
      window.open(meetingLink, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <VideoCallIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">Consultation en ligne</Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Créez une consultation et envoyez le lien à la personne concernée. Elle pourra rejoindre la visioconférence avec webcam et micro (comme Google Meet ou Teams) en cliquant sur le lien.
      </Alert>

      {createdLink && (
        <Card sx={{ mb: 3, bgcolor: 'success.light', color: 'success.contrastText' }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Lien à envoyer à la personne
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Envoyez ce lien par email, SMS ou messagerie. La personne pourra rejoindre la consultation avec sa webcam.
            </Typography>
            <TextField
              fullWidth
              size="small"
              value={createdLink}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <Button
                      startIcon={<CopyIcon />}
                      onClick={() => copyLink(createdLink)}
                      color="inherit"
                      variant="outlined"
                      size="small"
                    >
                      Copier
                    </Button>
                  </InputAdornment>
                ),
              }}
              sx={{ input: { color: 'inherit' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
            />
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<VideocamIcon />}
                onClick={() => openRoom(createdLink, true)}
                sx={{ bgcolor: 'white', color: 'success.dark' }}
              >
                Rejoindre la visio (dans l’app)
              </Button>
              <Button
                variant="outlined"
                startIcon={<OpenInNewIcon />}
                onClick={() => openRoom(createdLink, false)}
                sx={{ borderColor: 'white', color: 'white' }}
              >
                Ouvrir dans un nouvel onglet
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Créer une consultation" />
          <Tab label="Mes consultations" />
        </Tabs>

        <Box sx={{ px: 2, pb: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <form onSubmit={handleSubmitRequest}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sujet de la consultation *"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="Ex : suivi médical, question vaccination..."
                    required
                  />
                </Grid>
                {hasMedicalAccess && agents.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Agent concerné (optionnel)</InputLabel>
                      <Select
                        value={form.agent_id}
                        onChange={(e) => setForm({ ...form, agent_id: e.target.value })}
                        label="Agent concerné (optionnel)"
                      >
                        <MenuItem value="">— Aucun —</MenuItem>
                        {agents.map((a) => (
                          <MenuItem key={a.id} value={String(a.id)}>{a.full_name} ({a.matricule})</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message / précisions"
                    multiline
                    rows={4}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Décrivez brièvement votre demande..."
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date souhaitée"
                    type="date"
                    value={form.preferred_date}
                    onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Créneau horaire souhaité"
                    value={form.preferred_time}
                    onChange={(e) => setForm({ ...form, preferred_time: e.target.value })}
                    placeholder="Ex : matin, 14h-16h..."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SendIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Création...' : 'Créer la consultation et obtenir le lien'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            {consultations.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 4 }}>
                Aucune consultation. Créez-en une dans l’onglet « Créer une consultation » pour obtenir un lien à envoyer.
              </Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Sujet</TableCell>
                      <TableCell>Agent</TableCell>
                      <TableCell>Statut</TableCell>
                      <TableCell>Créée le</TableCell>
                      <TableCell align="right">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {consultations.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>{c.subject}</TableCell>
                        <TableCell>{c.agent_name ? `${c.agent_name} (${c.agent_matricule || ''})` : '–'}</TableCell>
                        <TableCell>
                          <Chip
                            label={c.status_display || c.status}
                            size="small"
                            color={
                              c.status === 'completed' ? 'success' :
                              c.status === 'cancelled' ? 'default' :
                              c.status === 'in_progress' ? 'primary' : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell>{new Date(c.created_at).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<VideocamIcon />}
                            onClick={() => openRoom(c.meeting_link, true)}
                            sx={{ mr: 0.5 }}
                          >
                            Rejoindre (visio)
                          </Button>
                          <Button
                            size="small"
                            startIcon={<CopyIcon />}
                            onClick={() => copyLink(c.meeting_link)}
                          >
                            Copier le lien
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
