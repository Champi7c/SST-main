import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import DescriptionIcon from '@mui/icons-material/Description'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PrintIcon from '@mui/icons-material/Print'
import PdfIcon from '@mui/icons-material/PictureAsPdf'
import client, { getApiErrorMessage } from '../../api/client'
import {
  MedicalConsultation,
  CONSULTATION_DOCUMENTS,
  printCompteRendu,
  exportCompteRenduPDF,
} from './consultationPrintTemplates'
import StringListEditor from './clinicalSections/StringListEditor'
import AutresConstantes from './clinicalSections/AutresConstantes'
import AntecedentsSection from './clinicalSections/AntecedentsSection'
import HabitudesDeVieSection from './clinicalSections/HabitudesDeVieSection'
import PlaintesSection from './clinicalSections/PlaintesSection'
import ExpositionsProfessionnellesSection from './clinicalSections/ExpositionsProfessionnellesSection'
import ExamenCliniqueSection from './clinicalSections/ExamenCliniqueSection'
import EtatGeneralSection from './clinicalSections/EtatGeneralSection'

const FICHE_BLUE = '#1F4788'

const FicheTitleBand = ({ label }: { label: string }) => (
  <Box
    sx={{
      textAlign: 'center', fontWeight: 700, fontSize: '0.95rem', color: FICHE_BLUE,
      border: `2px solid ${FICHE_BLUE}`, backgroundColor: '#E8F0F8', py: 0.75, borderRadius: 1, mb: 2, letterSpacing: 0.5,
    }}
  >
    {label}
  </Box>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: FICHE_BLUE }}>{children}</Typography>
)

interface DMSTInfo {
  agent_name: string
  agent_matricule: string
  agent_age?: number
  agent_gender?: string
}

interface VisitTypeOption {
  id: number
  name: string
  code: string
}

interface ObservationHistoryTabProps {
  agentId: string
  dmst: DMSTInfo
  visitTypes: VisitTypeOption[]
  hasMedicalAccess: boolean
}

interface ObservationFormState {
  visit_type: string
  motif: string
  diagnostic_principal: string
  data: Record<string, unknown>
}

const emptyForm: ObservationFormState = { visit_type: '', motif: '', diagnostic_principal: '', data: {} }

const EDUCATION_THEMES = ['MHD', 'MHV', 'FDR-CVx', 'Ergo', 'SPB&Psy', 'Thérapie']

export default function ObservationHistoryTab({ agentId, dmst, visitTypes, hasMedicalAccess }: ObservationHistoryTabProps) {
  const [fiches, setFiches] = useState<MedicalConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editing, setEditing] = useState<MedicalConsultation | null>(null)
  const [form, setForm] = useState<ObservationFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<MedicalConsultation | null>(null)
  const [docsMenu, setDocsMenu] = useState<{ anchor: HTMLElement; consultation: MedicalConsultation } | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  const showError = (msg: string) => setSnackbar({ open: true, message: msg, severity: 'error' })
  const showSuccess = (msg: string) => setSnackbar({ open: true, message: msg, severity: 'success' })

  const sstVisitTypes = useMemo(
    () => visitTypes.filter((vt) => vt.code !== 'consultation'),
    [visitTypes]
  )

  const fetchFiches = () => {
    setLoading(true)
    client.get('/medical/consultations/', { params: { agent: agentId, kind: 'observation', ordering: '-consultation_date', page_size: 500 } })
      .then((r) => setFiches(r.data.results ?? r.data))
      .catch((err) => showError(getApiErrorMessage(err)))
      .finally(() => { setLoading(false); setLoaded(true) })
  }

  useEffect(() => {
    if (!loaded) fetchFiches()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cdata = form.data || {}
  const setD = (key: string, value: unknown) => setForm((f) => ({ ...f, data: { ...f.data, [key]: value } }))
  const getD = (key: string) => (cdata[key] ?? '') as string
  const getDBool = (key: string) => !!cdata[key]
  const getDList = (key: string): string[] => (Array.isArray(cdata[key]) ? (cdata[key] as string[]) : [])
  const fieldApi = { data: cdata, getD, setD, getDBool, getDList }

  const isChild = typeof dmst.agent_age === 'number' && dmst.agent_age < 15
  const isFemaleAdult = dmst.agent_gender === 'F' && !isChild

  const imc = useMemo(() => {
    const p = Number(getD('poids'))
    const t = Number(getD('taille'))
    if (p > 0 && t > 0) return (p / Math.pow(t / 100, 2)).toFixed(1)
    return ''
  }, [cdata.poids, cdata.taille]) // eslint-disable-line react-hooks/exhaustive-deps

  const buildPreview = (): MedicalConsultation => ({
    id: editing?.id ?? 0,
    agent: Number(agentId),
    agent_name: dmst.agent_name,
    agent_matricule: dmst.agent_matricule,
    agent_age: dmst.agent_age,
    agent_gender: dmst.agent_gender,
    doctor_name: editing?.doctor_name,
    kind: 'observation',
    consultation_date: editing?.consultation_date ?? new Date().toISOString(),
    motif: form.motif,
    diagnostic_principal: form.diagnostic_principal,
    data: form.data,
  })

  const [exportingPdf, setExportingPdf] = useState(false)
  const handlePrintCurrent = () => printCompteRendu(buildPreview())
  const handleExportPdfCurrent = async () => {
    setExportingPdf(true)
    try {
      await exportCompteRenduPDF(buildPreview())
    } catch (err) {
      showError(getApiErrorMessage(err))
    } finally {
      setExportingPdf(false)
    }
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm, visit_type: sstVisitTypes[0] ? String(sstVisitTypes[0].id) : '' })
    setView('form')
  }

  const openEdit = (f: MedicalConsultation) => {
    setEditing(f)
    setForm({
      visit_type: f.visit_type ? String(f.visit_type) : '',
      motif: f.motif || '',
      diagnostic_principal: f.diagnostic_principal || '',
      data: { ...(f.data || {}) },
    })
    setView('form')
  }

  const backToList = () => {
    setView('list')
    setEditing(null)
    setForm(emptyForm)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        agent: Number(agentId),
        kind: 'observation',
        visit_type: form.visit_type ? Number(form.visit_type) : null,
        motif: form.motif || null,
        diagnostic_principal: form.diagnostic_principal || null,
        data: form.data,
      }
      if (editing) {
        await client.put(`/medical/consultations/${editing.id}/`, payload)
        showSuccess('Fiche mise à jour avec succès')
      } else {
        await client.post('/medical/consultations/', payload)
        showSuccess('Fiche enregistrée avec succès')
      }
      fetchFiches()
      backToList()
    } catch (err) {
      showError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!toDelete) return
    try {
      await client.delete(`/medical/consultations/${toDelete.id}/`)
      setFiches((prev) => prev.filter((f) => f.id !== toDelete.id))
      setToDelete(null)
      showSuccess('Fiche supprimée')
    } catch (err) {
      showError(getApiErrorMessage(err))
    }
  }

  if (view === 'list') {
    return (
      <Box sx={{ mb: 3 }}>
        <FicheTitleBand label="HISTORIQUE DES FICHES D'OBSERVATION — SERVICE DE SANTÉ AU TRAVAIL" />
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Fiches d'observation datées</Typography>
          {hasMedicalAccess && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
              Nouvelle fiche d'observation
            </Button>
          )}
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Médecin</TableCell>
                  <TableCell>Diagnostic / conclusion</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {fiches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        Aucune fiche d'observation enregistrée pour cet agent.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  fiches.map((f) => (
                    <TableRow key={f.id} hover>
                      <TableCell>{new Date(f.consultation_date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                      <TableCell>{f.visit_type_name || '-'}</TableCell>
                      <TableCell>{f.doctor_name || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.diagnostic_principal || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => openEdit(f)} title="Ouvrir / Modifier">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={(e) => setDocsMenu({ anchor: e.currentTarget, consultation: f })} title="Documents">
                          <DescriptionIcon fontSize="small" />
                        </IconButton>
                        {hasMedicalAccess && (
                          <IconButton size="small" color="error" onClick={() => setToDelete(f)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Menu anchorEl={docsMenu?.anchor} open={!!docsMenu} onClose={() => setDocsMenu(null)}>
          {docsMenu && CONSULTATION_DOCUMENTS.map((doc) => (
            <MenuItem key={doc.key} disabled={!doc.hasContent(docsMenu.consultation)} onClick={() => { doc.print(docsMenu.consultation); setDocsMenu(null) }}>
              {doc.label}
            </MenuItem>
          ))}
        </Menu>

        <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
          <DialogTitle>Supprimer la fiche d'observation</DialogTitle>
          <DialogContent>
            <Typography>
              Supprimer la fiche du {toDelete ? new Date(toDelete.consultation_date).toLocaleDateString('fr-FR') : ''} ? Cette action est irréversible.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setToDelete(null)}>Annuler</Button>
            <Button variant="contained" color="error" onClick={handleConfirmDelete}>Supprimer</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
        </Snackbar>
      </Box>
    )
  }

  // ─── Vue formulaire ────────────────────────────────────────────────────

  const educationThemes = getDList('education_themes')
  const toggleEducationTheme = (theme: string, checked: boolean) => {
    setD('education_themes', checked ? [...educationThemes, theme] : educationThemes.filter((t) => t !== theme))
  }

  return (
    <Box sx={{ mb: 3 }}>
      <FicheTitleBand label="FICHE D'OBSERVATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL" />
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Button startIcon={<ArrowBackIcon />} onClick={backToList}>Retour à l'historique</Button>
          <Typography variant="h6">{editing ? "Modifier la fiche d'observation" : "Nouvelle fiche d'observation"}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintCurrent}>Imprimer</Button>
          <Button
            variant="outlined" color="error"
            startIcon={exportingPdf ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
            onClick={handleExportPdfCurrent} disabled={exportingPdf}
          >
            Exporter PDF
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Type de visite</InputLabel>
            <Select value={form.visit_type} label="Type de visite" onChange={(e) => setForm({ ...form, visit_type: e.target.value })}>
              {sstVisitTypes.map((vt) => (<MenuItem key={vt.id} value={String(vt.id)}>{vt.name}</MenuItem>))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Direction" value={getD('observation_direction')} onChange={(e) => setD('observation_direction', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField fullWidth label="Site" value={getD('observation_site')} onChange={(e) => setD('observation_site', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Fonction / Poste" value={getD('observation_function')} onChange={(e) => setD('observation_function', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth type="number" label="Ancienneté au poste (ans)" value={getD('seniority_years')} onChange={(e) => setD('seniority_years', e.target.value)} />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Plaintes</SectionTitle></Grid>
        <Grid item xs={12}>
          <PlaintesSection {...fieldApi} />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Antécédents</SectionTitle></Grid>
        <Grid item xs={12}>
          <AntecedentsSection {...fieldApi} isFemaleAdult={isFemaleAdult} isChild={isChild} />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Habitudes de vie</SectionTitle></Grid>
        <Grid item xs={12}>
          <HabitudesDeVieSection {...fieldApi} />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Expositions professionnelles</SectionTitle></Grid>
        <Grid item xs={12}>
          <ExpositionsProfessionnellesSection {...fieldApi} />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Constantes</SectionTitle></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="TA sys." value={getD('ta_sys')} onChange={(e) => setD('ta_sys', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="TA dia." value={getD('ta_dia')} onChange={(e) => setD('ta_dia', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="T° (°C)" value={getD('temperature')} onChange={(e) => setD('temperature', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="FC (/min)" value={getD('fc')} onChange={(e) => setD('fc', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="SpO₂ (%)" value={getD('spo2')} onChange={(e) => setD('spo2', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="Glycémie (g/L)" value={getD('glycemie')} onChange={(e) => setD('glycemie', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="Poids (kg)" value={getD('poids')} onChange={(e) => setD('poids', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="Taille (cm)" value={getD('taille')} onChange={(e) => setD('taille', e.target.value)} /></Grid>
        {imc && <Grid item xs={12}><Chip label={`IMC calculé : ${imc} kg/m²`} size="small" /></Grid>}
        <Grid item xs={12}>
          <Box sx={{ mt: 1 }}>
            <AutresConstantes value={getDList('autres_constantes') as unknown as { label: string; value: string }[]} onChange={(v) => setD('autres_constantes', v)} />
          </Box>
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Examen clinique</SectionTitle></Grid>
        <Grid item xs={12}>
          <ExamenCliniqueSection {...fieldApi} includeGynecologique={isFemaleAdult} />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>État général</SectionTitle></Grid>
        <Grid item xs={12}>
          <EtatGeneralSection {...fieldApi} />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Conclusion médicale — Avis d'aptitude</SectionTitle></Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Diagnostic / conclusion (résumé)" value={form.diagnostic_principal} onChange={(e) => setForm({ ...form, diagnostic_principal: e.target.value })} sx={{ mb: 1 }} />
          <Box display="flex" flexWrap="wrap" gap={2}>
            <FormControlLabel control={<Checkbox checked={getDBool('conclusion_apte')} onChange={(e) => setD('conclusion_apte', e.target.checked)} />} label="APTE" />
            <FormControlLabel control={<Checkbox checked={getDBool('conclusion_asr')} onChange={(e) => setD('conclusion_asr', e.target.checked)} />} label="ASR" />
            <FormControlLabel control={<Checkbox checked={getDBool('conclusion_aar')} onChange={(e) => setD('conclusion_aar', e.target.checked)} />} label="AAR" />
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel control={<Checkbox checked={getDBool('conclusion_int')} onChange={(e) => setD('conclusion_int', e.target.checked)} />} label="INT" />
              {getDBool('conclusion_int') && (
                <TextField size="small" label="Durée" value={getD('conclusion_int_duree')} onChange={(e) => setD('conclusion_int_duree', e.target.value)} sx={{ width: 120 }} />
              )}
            </Box>
            <FormControlLabel control={<Checkbox checked={getDBool('conclusion_ind')} onChange={(e) => setD('conclusion_ind', e.target.checked)} />} label="IND" />
          </Box>
          <TextField fullWidth multiline rows={2} label="Restrictions / Aménagements" value={getD('conclusion_restrictions')} onChange={(e) => setD('conclusion_restrictions', e.target.value)} sx={{ mt: 1.5 }} />
          <TextField fullWidth multiline rows={2} label="Recommandations" value={getD('conclusion_recommandations')} onChange={(e) => setD('conclusion_recommandations', e.target.value)} sx={{ mt: 1.5 }} />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Éducation thérapeutique</SectionTitle></Grid>
        <Grid item xs={12}>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {EDUCATION_THEMES.map((theme) => (
              <FormControlLabel
                key={theme}
                control={<Checkbox checked={educationThemes.includes(theme)} onChange={(e) => toggleEducationTheme(theme, e.target.checked)} />}
                label={theme}
              />
            ))}
          </Box>
          <TextField fullWidth size="small" placeholder="Autre / préciser" value={getD('education_autre')} onChange={(e) => setD('education_autre', e.target.value)} sx={{ mt: 1 }} />
          <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 1.5 }}>
            <TextField size="small" type="date" label="Date prochaine visite" InputLabelProps={{ shrink: true }} value={getD('next_visit_date')} onChange={(e) => setD('next_visit_date', e.target.value)} />
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Type de la prochaine visite</InputLabel>
              <Select value={getD('next_visit_type')} label="Type de la prochaine visite" onChange={(e) => setD('next_visit_type', e.target.value)}>
                <MenuItem value="">—</MenuItem>
                <MenuItem value="periodique">Périodique</MenuItem>
                <MenuItem value="surveillance">Surveillance renforcée</MenuItem>
                <MenuItem value="specialisee">Spécialisée</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Diagnostics différentiels</SectionTitle></Grid>
        <Grid item xs={12}>
          <StringListEditor label="" values={getDList('diagnostics_differentiels')} onChange={(v) => setD('diagnostics_differentiels', v)} placeholder="Ajouter un diagnostic différentiel..." />
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" gap={1} sx={{ mt: 3 }}>
        <Button onClick={backToList}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}>
          Enregistrer la fiche
        </Button>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}
