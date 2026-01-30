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
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  Card,
  CardContent,
} from '@mui/material'
import { Add as AddIcon, Publish as PublishIcon, People as PeopleIcon } from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface TrainingType {
  id: number
  name: string
  code?: string
  validity_period_months?: number
}

interface TrainingRecord {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  training_type: number
  training_type_name: string
  start_date: string
  end_date?: string
  next_due_date?: string
  status: string
  status_display: string
  is_due: boolean
  result?: string
  certificate_number?: string
  training_organization?: string
}

interface EducationalArticle {
  id: number
  title: string
  theme?: string
  target_audience: string
  target_audience_display: string
  is_published: boolean
  published_date?: string
  author_name?: string
  created_at: string
}

interface Company {
  id: number
  name: string
}
interface Agent {
  id: number
  matricule: string
  full_name: string
}
interface JobPosition {
  id: number
  name: string
  company: number
}
interface TrainingRequirementRecord {
  id: number
  training_type: number
  training_type_name: string
  job_position: number
  job_position_name: string
  mandatory: boolean
}
interface ArticleRecipientRecord {
  id: number
  article: number
  agent: number
  agent_name: string
  agent_matricule: string
  read: boolean
  read_date?: string
}

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

export default function Training() {
  const [tabValue, setTabValue] = useState(0)
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  const [trainings, setTrainings] = useState<TrainingRecord[]>([])
  const [articles, setArticles] = useState<EducationalArticle[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [openTrainingDialog, setOpenTrainingDialog] = useState(false)
  const [openArticleDialog, setOpenArticleDialog] = useState(false)
  const [openRequirementsDialog, setOpenRequirementsDialog] = useState(false)
  const [openRecipientsDialog, setOpenRecipientsDialog] = useState(false)
  const [recipientsArticle, setRecipientsArticle] = useState<EducationalArticle | null>(null)
  const [recipients, setRecipients] = useState<ArticleRecipientRecord[]>([])
  const [requirements, setRequirements] = useState<TrainingRequirementRecord[]>([])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { user, canManageUsers } = useAuth()
  const [requirementForm, setRequirementForm] = useState({
    company: '',
    training_type: '',
    job_position: '',
    mandatory: true,
  })

  const [trainingForm, setTrainingForm] = useState({
    agent: '',
    training_type: '',
    start_date: '',
    end_date: '',
    next_due_date: '',
    status: 'planned',
    result: '',
    certificate_number: '',
    training_organization: '',
    trainer_name: '',
    notes: '',
  })

  const [articleForm, setArticleForm] = useState({
    title: '',
    content: '',
    theme: '',
    target_audience: 'all',
    is_published: false,
  })

  const canManage = user?.role ? ['super_admin', 'admin', 'consultant', 'hse', 'direction'].includes(user.role) : false

  useEffect(() => {
    fetchTrainingTypes()
    fetchTrainings()
    fetchArticles()
    fetchAgents()
    fetchCompanies()
    fetchRequirements()
  }, [companyFilter, statusFilter])

  useEffect(() => {
    if (requirementForm.company) fetchJobPositions(requirementForm.company)
    else setJobPositions([])
  }, [requirementForm.company])

  const fetchCompanies = async () => {
    try {
      const r = await client.get('/companies/companies/')
      setCompanies(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchTrainingTypes = async () => {
    try {
      const r = await client.get('/training/training-types/')
      setTrainingTypes(r.data.results || r.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchTrainings = async () => {
    try {
      const params: Record<string, string> = {}
      if (companyFilter) params['agent__company'] = companyFilter
      if (statusFilter !== 'all') params['status'] = statusFilter
      const r = await client.get('/training/trainings/', { params })
      setTrainings(r.data.results || r.data)
    } catch (e) {
      console.error(e)
      showSnackbar('Erreur chargement formations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchArticles = async () => {
    try {
      const r = await client.get('/training/articles/')
      setArticles(r.data.results || r.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchAgents = async () => {
    try {
      const params: Record<string, string> = { is_active: 'true' }
      if (companyFilter) params['company'] = companyFilter
      const r = await client.get('/medical/agents/', { params })
      const data = r.data.results || r.data
      setAgents((data as any[]).filter((a: any) => !a.is_archived))
    } catch (e) {
      console.error(e)
    }
  }

  const fetchRequirements = async () => {
    try {
      const r = await client.get('/training/requirements/')
      setRequirements(r.data.results || r.data)
    } catch (e) {
      console.error(e)
    }
  }

  const fetchJobPositions = async (companyId: string) => {
    if (!companyId) {
      setJobPositions([])
      return
    }
    try {
      const r = await client.get(`/companies/job-positions/?company=${companyId}`)
      setJobPositions(r.data.results || r.data)
    } catch {
      setJobPositions([])
    }
  }

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreateTraining = async () => {
    try {
      await client.post('/training/trainings/', {
        agent: parseInt(trainingForm.agent),
        training_type: parseInt(trainingForm.training_type),
        start_date: trainingForm.start_date,
        end_date: trainingForm.end_date || null,
        next_due_date: trainingForm.next_due_date || null,
        status: trainingForm.status,
        result: trainingForm.result || null,
        certificate_number: trainingForm.certificate_number || null,
        training_organization: trainingForm.training_organization || null,
        trainer_name: trainingForm.trainer_name || null,
        notes: trainingForm.notes || null,
      })
      showSnackbar('Formation enregistrée', 'success')
      setOpenTrainingDialog(false)
      fetchTrainings()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleCreateArticle = async () => {
    try {
      await client.post('/training/articles/', {
        title: articleForm.title,
        content: articleForm.content,
        theme: articleForm.theme || null,
        target_audience: articleForm.target_audience,
        is_published: articleForm.is_published,
      })
      showSnackbar('Article créé', 'success')
      setOpenArticleDialog(false)
      fetchArticles()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handlePublishArticle = async (a: EducationalArticle) => {
    try {
      await client.post(`/training/articles/${a.id}/publish/`)
      showSnackbar('Article publié, destinataires créés', 'success')
      fetchArticles()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const handleOpenRecipients = async (a: EducationalArticle) => {
    setRecipientsArticle(a)
    try {
      const r = await client.get(`/training/article-recipients/?article=${a.id}`)
      setRecipients(r.data.results || r.data)
    } catch {
      setRecipients([])
    }
    setOpenRecipientsDialog(true)
  }

  const handleMarkRecipientRead = async (rec: ArticleRecipientRecord) => {
    try {
      await client.patch(`/training/article-recipients/${rec.id}/`, {
        read: true,
        read_date: new Date().toISOString(),
      })
      setRecipients((prev) => prev.map((r) => (r.id === rec.id ? { ...r, read: true, read_date: new Date().toISOString() } : r)))
    } catch {
      /**/
    }
  }

  const handleCreateRequirement = async () => {
    try {
      await client.post('/training/requirements/', {
        training_type: parseInt(requirementForm.training_type),
        job_position: parseInt(requirementForm.job_position),
        mandatory: requirementForm.mandatory,
      })
      showSnackbar('Habilitation ajoutée', 'success')
      setOpenRequirementsDialog(false)
      setRequirementForm({ company: '', training_type: '', job_position: '', mandatory: true })
      fetchRequirements()
    } catch (err: any) {
      showSnackbar(err.response?.data?.detail || 'Erreur', 'error')
    }
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'completed': return 'success'
      case 'in_progress': return 'info'
      case 'cancelled': return 'default'
      default: return 'warning'
    }
  }

  const dueCount = trainings.filter((t) => t.is_due).length
  const completedCount = trainings.filter((t) => t.status === 'completed').length

  if (loading && tabValue === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Formation et sensibilisation</Typography>
        {canManage && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => {
              setTrainingForm({
                agent: '',
                training_type: '',
                start_date: new Date().toISOString().split('T')[0],
                end_date: '',
                next_due_date: '',
                status: 'planned',
                result: '',
                certificate_number: '',
                training_organization: '',
                trainer_name: '',
                notes: '',
              })
              setOpenTrainingDialog(true)
            }}
          >
            Nouvelle formation
          </Button>
        )}
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Formations enregistrées</Typography>
              <Typography variant="h4">{trainings.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Formations terminées</Typography>
              <Typography variant="h4">{completedCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Rappels à échéance</Typography>
              <Typography variant="h4" color={dueCount > 0 ? 'error.main' : 'text.primary'}>{dueCount}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Formations" />
          <Tab label="Types de formation" />
          <Tab label="Articles d'éducation sanitaire" />
          <Tab label="Habilitations" />
        </Tabs>

        <Box sx={{ px: 2, pb: 2 }}>
          <FormControl size="small" sx={{ minWidth: 200, mt: 2, mb: 2, mr: 2 }}>
            <InputLabel>Entreprise</InputLabel>
            <Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} label="Entreprise">
              <MenuItem value="">Toutes</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {tabValue === 0 && (
            <FormControl size="small" sx={{ minWidth: 160, mt: 2, mb: 2 }}>
              <InputLabel>Statut</InputLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Statut">
                <MenuItem value="all">Tous</MenuItem>
                <MenuItem value="planned">Planifiée</MenuItem>
                <MenuItem value="in_progress">En cours</MenuItem>
                <MenuItem value="completed">Terminée</MenuItem>
                <MenuItem value="cancelled">Annulée</MenuItem>
              </Select>
            </FormControl>
          )}

          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Agent</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Début</TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell>Rappel</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>À jour</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary">Aucune formation</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    trainings.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.agent_name} ({t.agent_matricule})</TableCell>
                        <TableCell>{t.training_type_name}</TableCell>
                        <TableCell>{new Date(t.start_date).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>{t.end_date ? new Date(t.end_date).toLocaleDateString('fr-FR') : '–'}</TableCell>
                        <TableCell>{t.next_due_date ? new Date(t.next_due_date).toLocaleDateString('fr-FR') : '–'}</TableCell>
                        <TableCell>
                          <Chip label={t.status_display} size="small" color={getStatusColor(t.status)} />
                        </TableCell>
                        <TableCell>
                          {t.status === 'completed' && (
                            t.is_due ? (
                              <Chip label="Rappel à faire" size="small" color="error" />
                            ) : (
                              <Chip label="À jour" size="small" color="success" />
                            )
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <TableContainer sx={{ mt: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Validité (mois)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainingTypes.map((tp) => (
                    <TableRow key={tp.id}>
                      <TableCell>{tp.name}</TableCell>
                      <TableCell>{tp.code || '–'}</TableCell>
                      <TableCell>{tp.validity_period_months ?? '–'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            {canManage && (
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mb: 2 }}
                onClick={() => {
                  setArticleForm({ title: '', content: '', theme: '', target_audience: 'all', is_published: false })
                  setOpenArticleDialog(true)
                }}
              >
                Nouvel article
              </Button>
            )}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Titre</TableCell>
                    <TableCell>Thématique</TableCell>
                    <TableCell>Public cible</TableCell>
                    <TableCell>Publié</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {articles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary">Aucun article</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    articles.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>{a.title}</TableCell>
                        <TableCell>{a.theme || '–'}</TableCell>
                        <TableCell>{a.target_audience_display}</TableCell>
                        <TableCell>{a.is_published ? <Chip label="Oui" size="small" color="success" /> : 'Non'}</TableCell>
                        <TableCell>{new Date(a.created_at).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {canManage && !a.is_published && (
                              <Button size="small" startIcon={<PublishIcon />} onClick={() => handlePublishArticle(a)}>
                                Publier
                              </Button>
                            )}
                            <Button size="small" startIcon={<PeopleIcon />} onClick={() => handleOpenRecipients(a)}>
                              Destinataires
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            {canManageUsers && (
              <Button
                startIcon={<AddIcon />}
                variant="outlined"
                sx={{ mb: 2 }}
                onClick={() => {
                  setRequirementForm({ company: companyFilter || '', training_type: '', job_position: '', mandatory: true })
                  setOpenRequirementsDialog(true)
                }}
              >
                Ajouter une habilitation
              </Button>
            )}
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type de formation</TableCell>
                    <TableCell>Poste de travail</TableCell>
                    <TableCell>Obligatoire</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requirements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">Aucune habilitation</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    requirements.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.training_type_name}</TableCell>
                        <TableCell>{r.job_position_name}</TableCell>
                        <TableCell>{r.mandatory ? <Chip label="Oui" size="small" color="primary" /> : 'Non'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Box>
      </Paper>

      <Dialog open={openTrainingDialog} onClose={() => setOpenTrainingDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle formation</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Agent *</InputLabel>
                <Select
                  value={trainingForm.agent}
                  onChange={(e) => setTrainingForm({ ...trainingForm, agent: e.target.value })}
                  label="Agent *"
                >
                  {agents.map((a) => (
                    <MenuItem key={a.id} value={String(a.id)}>{a.full_name} ({a.matricule})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Type de formation *</InputLabel>
                <Select
                  value={trainingForm.training_type}
                  onChange={(e) => setTrainingForm({ ...trainingForm, training_type: e.target.value })}
                  label="Type de formation *"
                >
                  {trainingTypes.map((tp) => (
                    <MenuItem key={tp.id} value={String(tp.id)}>{tp.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de début *"
                type="date"
                value={trainingForm.start_date}
                onChange={(e) => setTrainingForm({ ...trainingForm, start_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date de fin"
                type="date"
                value={trainingForm.end_date}
                onChange={(e) => setTrainingForm({ ...trainingForm, end_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Prochain rappel"
                type="date"
                value={trainingForm.next_due_date}
                onChange={(e) => setTrainingForm({ ...trainingForm, next_due_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Statut</InputLabel>
                <Select
                  value={trainingForm.status}
                  onChange={(e) => setTrainingForm({ ...trainingForm, status: e.target.value })}
                  label="Statut"
                >
                  <MenuItem value="planned">Planifiée</MenuItem>
                  <MenuItem value="in_progress">En cours</MenuItem>
                  <MenuItem value="completed">Terminée</MenuItem>
                  <MenuItem value="cancelled">Annulée</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organisme formateur"
                value={trainingForm.training_organization}
                onChange={(e) => setTrainingForm({ ...trainingForm, training_organization: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Formateur"
                value={trainingForm.trainer_name}
                onChange={(e) => setTrainingForm({ ...trainingForm, trainer_name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Résultat"
                value={trainingForm.result}
                onChange={(e) => setTrainingForm({ ...trainingForm, result: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="N° certificat"
                value={trainingForm.certificate_number}
                onChange={(e) => setTrainingForm({ ...trainingForm, certificate_number: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={2}
                value={trainingForm.notes}
                onChange={(e) => setTrainingForm({ ...trainingForm, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTrainingDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateTraining}
            disabled={!trainingForm.agent || !trainingForm.training_type || !trainingForm.start_date}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openArticleDialog} onClose={() => setOpenArticleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvel article d'éducation sanitaire</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Titre *"
                value={articleForm.title}
                onChange={(e) => setArticleForm({ ...articleForm, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Thématique"
                value={articleForm.theme}
                onChange={(e) => setArticleForm({ ...articleForm, theme: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Contenu *"
                multiline
                rows={6}
                value={articleForm.content}
                onChange={(e) => setArticleForm({ ...articleForm, content: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Public cible</InputLabel>
                <Select
                  value={articleForm.target_audience}
                  onChange={(e) => setArticleForm({ ...articleForm, target_audience: e.target.value })}
                  label="Public cible"
                >
                  <MenuItem value="all">Tous les agents</MenuItem>
                  <MenuItem value="category">Par catégorie</MenuItem>
                  <MenuItem value="surveillance">Agents sous surveillance</MenuItem>
                  <MenuItem value="specific">Agents spécifiques</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Publié</InputLabel>
                <Select
                  value={articleForm.is_published ? 'yes' : 'no'}
                  onChange={(e) => setArticleForm({ ...articleForm, is_published: e.target.value === 'yes' })}
                  label="Publié"
                >
                  <MenuItem value="no">Non</MenuItem>
                  <MenuItem value="yes">Oui</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenArticleDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateArticle}
            disabled={!articleForm.title || !articleForm.content}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRecipientsDialog} onClose={() => setOpenRecipientsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Destinataires {recipientsArticle ? `– ${recipientsArticle.title}` : ''}</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Agent</TableCell>
                  <TableCell>Lu</TableCell>
                  <TableCell>Date lecture</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recipients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary">Aucun destinataire (publier l&apos;article pour en créer).</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  recipients.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.agent_name} ({r.agent_matricule})</TableCell>
                      <TableCell>{r.read ? <Chip label="Oui" size="small" color="success" /> : 'Non'}</TableCell>
                      <TableCell>{r.read_date ? new Date(r.read_date).toLocaleString('fr-FR') : '–'}</TableCell>
                      <TableCell>
                        {!r.read && (
                          <Button size="small" onClick={() => handleMarkRecipientRead(r)}>Marquer lu</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRecipientsDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRequirementsDialog} onClose={() => setOpenRequirementsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle habilitation (formation obligatoire / recommandée)</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Entreprise *</InputLabel>
                <Select
                  value={requirementForm.company}
                  onChange={(e) => setRequirementForm({ ...requirementForm, company: e.target.value, job_position: '' })}
                  label="Entreprise *"
                >
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Type de formation *</InputLabel>
                <Select
                  value={requirementForm.training_type}
                  onChange={(e) => setRequirementForm({ ...requirementForm, training_type: e.target.value })}
                  label="Type de formation *"
                >
                  {trainingTypes.map((tp) => (
                    <MenuItem key={tp.id} value={String(tp.id)}>{tp.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required disabled={!requirementForm.company}>
                <InputLabel>Poste de travail *</InputLabel>
                <Select
                  value={requirementForm.job_position}
                  onChange={(e) => setRequirementForm({ ...requirementForm, job_position: e.target.value })}
                  label="Poste de travail *"
                >
                  {jobPositions.map((jp) => (
                    <MenuItem key={jp.id} value={String(jp.id)}>{jp.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Obligatoire</InputLabel>
                <Select
                  value={requirementForm.mandatory ? 'yes' : 'no'}
                  onChange={(e) => setRequirementForm({ ...requirementForm, mandatory: e.target.value === 'yes' })}
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
          <Button onClick={() => setOpenRequirementsDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleCreateRequirement}
            disabled={!requirementForm.training_type || !requirementForm.job_position}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
