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
  Switch,
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

const FICHE_BLUE = '#1F4788'

const FicheTitleBand = ({ label }: { label: string }) => (
  <Box
    sx={{
      textAlign: 'center',
      fontWeight: 700,
      fontSize: '0.95rem',
      color: FICHE_BLUE,
      border: `2px solid ${FICHE_BLUE}`,
      backgroundColor: '#E8F0F8',
      py: 0.75,
      borderRadius: 1,
      mb: 2,
      letterSpacing: 0.5,
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

interface ConsultationTabProps {
  agentId: string
  dmst: DMSTInfo
  visitTypes: VisitTypeOption[]
  hasMedicalAccess: boolean
}

interface ConsultationFormState {
  visit_type: string
  motif: string
  diagnostic_principal: string
  data: Record<string, unknown>
}

const emptyForm: ConsultationFormState = { visit_type: '', motif: '', diagnostic_principal: '', data: {} }

const EXAM_SYSTEMS_BASE: { key: string; label: string }[] = [
  { key: 'respiratoire', label: 'Respiratoire' },
  { key: 'cardiovasculaire', label: 'Cardiovasculaire' },
  { key: 'digestif', label: 'Digestif' },
  { key: 'neurologique', label: 'Neurologique' },
  { key: 'orl', label: 'ORL' },
  { key: 'ophtalmologique', label: 'Ophtalmologique' },
  { key: 'dermatologique', label: 'Dermatologique' },
  { key: 'osteoarticulaire', label: 'Ostéo-articulaire' },
  { key: 'urologique', label: 'Urologique' },
]

const GENERAL_ITEMS: { key: string; label: string }[] = [
  { key: 'deshydratation', label: 'Déshydratation' },
  { key: 'denutrition', label: 'Dénutrition' },
  { key: 'ictere', label: 'Ictère' },
  { key: 'cyanose', label: 'Cyanose' },
  { key: 'oedemes', label: 'Œdèmes' },
  { key: 'aeg', label: "Altération de l'état général" },
  { key: 'adenopathies', label: 'Adénopathies' },
]

function StringListEditor({
  label,
  values,
  onChange,
  editable,
  placeholder,
}: {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  editable: boolean
  placeholder?: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (!v) return
    onChange([...values, v])
    setInput('')
  }
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>{label}</Typography>
      {editable && (
        <Box display="flex" gap={1} sx={{ mb: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder={placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          />
          <Button variant="outlined" size="small" onClick={add} disabled={!input.trim()}>Ajouter</Button>
        </Box>
      )}
      <Box display="flex" flexWrap="wrap" gap={1}>
        {values.length === 0 && <Typography variant="caption" color="text.secondary">Aucun élément</Typography>}
        {values.map((v, i) => (
          <Chip
            key={`${v}-${i}`}
            label={v}
            size="small"
            onDelete={editable ? () => onChange(values.filter((_, idx) => idx !== i)) : undefined}
          />
        ))}
      </Box>
    </Box>
  )
}

export default function ConsultationTab({ agentId, dmst, visitTypes, hasMedicalAccess }: ConsultationTabProps) {
  const [consultations, setConsultations] = useState<MedicalConsultation[]>([])
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [view, setView] = useState<'list' | 'form'>('list')
  const [editing, setEditing] = useState<MedicalConsultation | null>(null)
  const [form, setForm] = useState<ConsultationFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toDelete, setToDelete] = useState<MedicalConsultation | null>(null)
  const [docsMenu, setDocsMenu] = useState<{ anchor: HTMLElement; consultation: MedicalConsultation } | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  const showError = (msg: string) => setSnackbar({ open: true, message: msg, severity: 'error' })
  const showSuccess = (msg: string) => setSnackbar({ open: true, message: msg, severity: 'success' })

  const fetchConsultations = () => {
    setLoading(true)
    client.get('/medical/consultations/', { params: { agent: agentId, ordering: '-consultation_date', page_size: 500 } })
      .then((r) => setConsultations(r.data.results ?? r.data))
      .catch((err) => showError(getApiErrorMessage(err)))
      .finally(() => { setLoading(false); setLoaded(true) })
  }

  useEffect(() => {
    if (!loaded) fetchConsultations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const cdata = form.data || {}
  const setD = (key: string, value: unknown) => setForm((f) => ({ ...f, data: { ...f.data, [key]: value } }))
  const getD = (key: string) => (cdata[key] ?? '') as string
  const getDBool = (key: string) => !!cdata[key]
  const getDList = (key: string): string[] => (Array.isArray(cdata[key]) ? (cdata[key] as string[]) : [])

  const isChild = typeof dmst.agent_age === 'number' && dmst.agent_age < 15
  const isFemaleAdult = dmst.agent_gender === 'F' && !isChild

  const examSystems = useMemo(
    () => (isFemaleAdult ? [...EXAM_SYSTEMS_BASE, { key: 'gynecologique', label: 'Gynécologique' }] : EXAM_SYSTEMS_BASE),
    [isFemaleAdult]
  )

  const imc = useMemo(() => {
    const p = Number(getD('poids'))
    const t = Number(getD('taille'))
    if (p > 0 && t > 0) return (p / Math.pow(t / 100, 2)).toFixed(1)
    return ''
  }, [cdata.poids, cdata.taille]) // eslint-disable-line react-hooks/exhaustive-deps

  const paquetsAnnees = useMemo(() => {
    const cig = Number(getD('tabac_cig_jour'))
    const anciennete = Number(getD('tabac_anciennete'))
    if (cig > 0 && anciennete > 0) return ((cig / 20) * anciennete).toFixed(1)
    return ''
  }, [cdata.tabac_cig_jour, cdata.tabac_anciennete]) // eslint-disable-line react-hooks/exhaustive-deps

  const buildPreviewConsultation = (): MedicalConsultation => ({
    id: editing?.id ?? 0,
    agent: Number(agentId),
    agent_name: dmst.agent_name,
    agent_matricule: dmst.agent_matricule,
    agent_age: dmst.agent_age,
    agent_gender: dmst.agent_gender,
    doctor_name: editing?.doctor_name,
    consultation_date: editing?.consultation_date ?? new Date().toISOString(),
    motif: form.motif,
    diagnostic_principal: form.diagnostic_principal,
    data: form.data,
  })

  const [exportingPdf, setExportingPdf] = useState(false)

  const handlePrintCurrent = () => printCompteRendu(buildPreviewConsultation())

  const handleExportPdfCurrent = async () => {
    setExportingPdf(true)
    try {
      await exportCompteRenduPDF(buildPreviewConsultation())
    } catch (err) {
      showError(getApiErrorMessage(err))
    } finally {
      setExportingPdf(false)
    }
  }

  const openNew = () => {
    setEditing(null)
    const defaultType = visitTypes.find((vt) => vt.code === 'consultation')
    setForm({ ...emptyForm, visit_type: defaultType ? String(defaultType.id) : '' })
    setView('form')
  }

  const openEdit = (c: MedicalConsultation) => {
    setEditing(c)
    setForm({
      visit_type: c.visit_type ? String(c.visit_type) : '',
      motif: c.motif || '',
      diagnostic_principal: c.diagnostic_principal || '',
      data: { ...(c.data || {}) },
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
        visit_type: form.visit_type ? Number(form.visit_type) : null,
        motif: form.motif || null,
        diagnostic_principal: form.diagnostic_principal || null,
        data: form.data,
      }
      if (editing) {
        await client.put(`/medical/consultations/${editing.id}/`, payload)
        showSuccess('Consultation mise à jour avec succès')
      } else {
        await client.post('/medical/consultations/', payload)
        showSuccess('Consultation enregistrée avec succès')
      }
      fetchConsultations()
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
      setConsultations((prev) => prev.filter((c) => c.id !== toDelete.id))
      setToDelete(null)
      showSuccess('Consultation supprimée')
    } catch (err) {
      showError(getApiErrorMessage(err))
    }
  }

  const editable = true // droits déjà filtrés en amont par hasMedicalAccess (bouton "Nouvelle consultation" / "Modifier")

  if (view === 'list') {
    return (
      <Box>
        <FicheTitleBand label="FICHE DE CONSULTATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL" />
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Historique des consultations</Typography>
          {hasMedicalAccess && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>
              Nouvelle consultation
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
                  <TableCell>Médecin</TableCell>
                  <TableCell>Motif</TableCell>
                  <TableCell>Diagnostic principal</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {consultations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                        Aucune consultation enregistrée pour cet agent.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  consultations.map((c) => (
                    <TableRow key={c.id} hover>
                      <TableCell>{new Date(c.consultation_date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</TableCell>
                      <TableCell>{c.doctor_name || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.motif || '-'}</TableCell>
                      <TableCell sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.diagnostic_principal || '-'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="primary" onClick={() => openEdit(c)} title="Ouvrir / Modifier">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => setDocsMenu({ anchor: e.currentTarget, consultation: c })}
                          title="Documents"
                        >
                          <DescriptionIcon fontSize="small" />
                        </IconButton>
                        {hasMedicalAccess && (
                          <IconButton size="small" color="error" onClick={() => setToDelete(c)} title="Supprimer">
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

        <Menu
          anchorEl={docsMenu?.anchor}
          open={!!docsMenu}
          onClose={() => setDocsMenu(null)}
        >
          {docsMenu && CONSULTATION_DOCUMENTS.map((doc) => (
            <MenuItem
              key={doc.key}
              disabled={!doc.hasContent(docsMenu.consultation)}
              onClick={() => { doc.print(docsMenu.consultation); setDocsMenu(null) }}
            >
              {doc.label}
            </MenuItem>
          ))}
        </Menu>

        <Dialog open={!!toDelete} onClose={() => setToDelete(null)}>
          <DialogTitle>Supprimer la consultation</DialogTitle>
          <DialogContent>
            <Typography>
              Supprimer la consultation du {toDelete ? new Date(toDelete.consultation_date).toLocaleDateString('fr-FR') : ''} ?
              Cette action est irréversible.
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

  return (
    <Box>
      <FicheTitleBand label="FICHE DE CONSULTATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL" />
      <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5} mb={2}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Button startIcon={<ArrowBackIcon />} onClick={backToList}>Retour à l'historique</Button>
          <Typography variant="h6">{editing ? 'Modifier la consultation' : 'Nouvelle consultation'}</Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrintCurrent}>
            Imprimer
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={exportingPdf ? <CircularProgress size={16} color="inherit" /> : <PdfIcon />}
            onClick={handleExportPdfCurrent}
            disabled={exportingPdf}
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
              {visitTypes.map((vt) => (<MenuItem key={vt.id} value={String(vt.id)}>{vt.name}</MenuItem>))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Motif et plaintes</SectionTitle></Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline rows={2} label="Motif de consultation" value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} />
        </Grid>
        <Grid item xs={12}>
          <StringListEditor label="Plaintes" values={getDList('plaintes')} onChange={(v) => setD('plaintes', v)} editable={editable} placeholder="Ajouter une plainte..." />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Histoire de la maladie actuelle</SectionTitle></Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth multiline rows={5}
            placeholder="Début, évolution, symptômes associés, traitements déjà reçus, facteurs aggravants/soulageants, chronologie..."
            value={getD('histoire_maladie_actuelle')}
            onChange={(e) => setD('histoire_maladie_actuelle', e.target.value)}
          />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Antécédents</SectionTitle></Grid>
        {[
          ['atcd_medicaux', 'Antécédents médicaux'],
          ['atcd_chirurgicaux', 'Antécédents chirurgicaux'],
          ['atcd_traumatiques', 'Antécédents traumatiques'],
          ['atcd_allergiques', 'Antécédents allergiques'],
          ['atcd_transfusionnels', 'Antécédents transfusionnels'],
          ['atcd_familiaux', 'Antécédents familiaux'],
        ].map(([key, label]) => (
          <Grid item xs={12} sm={6} key={key}>
            <TextField fullWidth multiline rows={2} label={label} value={getD(key)} onChange={(e) => setD(key, e.target.value)} />
          </Grid>
        ))}

        {isFemaleAdult && (
          <>
            <Grid item xs={12}><Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Antécédents gynéco-obstétricaux</Typography></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={2} label="Antécédents gynécologiques" value={getD('atcd_gyneco')} onChange={(e) => setD('atcd_gyneco', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth multiline rows={2} label="Antécédents obstétricaux" value={getD('atcd_obstetricaux')} onChange={(e) => setD('atcd_obstetricaux', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth type="number" label="Grossesses" value={getD('gyneco_grossesses')} onChange={(e) => setD('gyneco_grossesses', e.target.value)} /></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth label="Parité" value={getD('parite')} onChange={(e) => setD('parite', e.target.value)} /></Grid>
            <Grid item xs={12} sm={3}><TextField fullWidth label="Gestité" value={getD('gestite')} onChange={(e) => setD('gestite', e.target.value)} /></Grid>
            <Grid item xs={12} sm={3}>
              <TextField fullWidth type="date" label="Date des dernières règles" InputLabelProps={{ shrink: true }} value={getD('ddr')} onChange={(e) => setD('ddr', e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Contraception" value={getD('contraception')} onChange={(e) => setD('contraception', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={<Checkbox checked={getDBool('menopause')} onChange={(e) => setD('menopause', e.target.checked)} />} label="Ménopause" />
              {getDBool('menopause') && (
                <TextField size="small" type="date" label="Depuis le" InputLabelProps={{ shrink: true }} value={getD('menopause_date')} onChange={(e) => setD('menopause_date', e.target.value)} sx={{ ml: 2 }} />
              )}
            </Grid>
          </>
        )}

        {isChild && (
          <>
            <Grid item xs={12}><Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 1 }}>Rubriques pédiatriques</Typography></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Antécédents néonataux" value={getD('pedia_neonatal')} onChange={(e) => setD('pedia_neonatal', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Vaccination" value={getD('pedia_vaccination')} onChange={(e) => setD('pedia_vaccination', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Développement psychomoteur" value={getD('pedia_developpement')} onChange={(e) => setD('pedia_developpement', e.target.value)} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth multiline rows={2} label="Croissance" value={getD('pedia_croissance')} onChange={(e) => setD('pedia_croissance', e.target.value)} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Allaitement" value={getD('pedia_allaitement')} onChange={(e) => setD('pedia_allaitement', e.target.value)} /></Grid>
          </>
        )}

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Habitudes de vie</SectionTitle></Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel control={<Checkbox checked={getDBool('activite_physique_oui')} onChange={(e) => setD('activite_physique_oui', e.target.checked)} />} label="Activité physique" />
          {getDBool('activite_physique_oui') && (
            <TextField size="small" label="Fréquence" value={getD('activite_physique_frequence')} onChange={(e) => setD('activite_physique_frequence', e.target.value)} sx={{ ml: 2 }} />
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Tabac</InputLabel>
            <Select value={getD('tabac_statut') || 'jamais'} label="Tabac" onChange={(e) => setD('tabac_statut', e.target.value)}>
              <MenuItem value="jamais">Jamais</MenuItem>
              <MenuItem value="ancien">Ancien fumeur</MenuItem>
              <MenuItem value="actuel">Fumeur actuel</MenuItem>
            </Select>
          </FormControl>
          {getD('tabac_statut') && getD('tabac_statut') !== 'jamais' && (
            <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" sx={{ mt: 1 }}>
              <TextField size="small" type="number" label="Cigarettes/jour" value={getD('tabac_cig_jour')} onChange={(e) => setD('tabac_cig_jour', e.target.value)} sx={{ width: 140 }} />
              <TextField size="small" type="number" label="Ancienneté (années)" value={getD('tabac_anciennete')} onChange={(e) => setD('tabac_anciennete', e.target.value)} sx={{ width: 160 }} />
              {paquetsAnnees && <Chip size="small" label={`${paquetsAnnees} paquets-années`} />}
            </Box>
          )}
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel control={<Checkbox checked={getDBool('alcool_oui')} onChange={(e) => setD('alcool_oui', e.target.checked)} />} label="Alcool" />
          {getDBool('alcool_oui') && (
            <Box display="flex" gap={1} sx={{ mt: 1 }}>
              <TextField size="small" label="Fréquence" value={getD('alcool_frequence')} onChange={(e) => setD('alcool_frequence', e.target.value)} />
              <TextField size="small" label="Quantité" value={getD('alcool_quantite')} onChange={(e) => setD('alcool_quantite', e.target.value)} />
            </Box>
          )}
        </Grid>
        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Café (tasses/j)" value={getD('cafe_tasses')} onChange={(e) => setD('cafe_tasses', e.target.value)} /></Grid>
        <Grid item xs={6} sm={3}><TextField fullWidth size="small" type="number" label="Thé (tasses/j)" value={getD('the_tasses')} onChange={(e) => setD('the_tasses', e.target.value)} /></Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel control={<Checkbox checked={getDBool('phyto_oui')} onChange={(e) => setD('phyto_oui', e.target.checked)} />} label="Phytothérapie" />
          {getDBool('phyto_oui') && <TextField size="small" label="Préciser" value={getD('phyto_details')} onChange={(e) => setD('phyto_details', e.target.value)} sx={{ ml: 2 }} />}
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel control={<Checkbox checked={getDBool('drogues_oui')} onChange={(e) => setD('drogues_oui', e.target.checked)} />} label="Drogues" />
          {getDBool('drogues_oui') && <TextField size="small" label="Préciser" value={getD('drogues_details')} onChange={(e) => setD('drogues_details', e.target.value)} sx={{ ml: 2 }} />}
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Rubriques optionnelles</SectionTitle></Grid>
        {[
          ['option_exposition_pro', 'Exposition professionnelle'],
          ['option_nuisances_pro', 'Nuisances professionnelles'],
          ['option_aptitude_poste', 'Aptitude au poste'],
        ].map(([toggleKey, label]) => (
          <Grid item xs={12} key={toggleKey}>
            <FormControlLabel
              control={<Switch checked={getDBool(toggleKey)} onChange={(e) => setD(toggleKey, e.target.checked)} />}
              label={label}
            />
            {getDBool(toggleKey) && (
              <TextField fullWidth multiline rows={2} value={getD(`${toggleKey}_details`)} onChange={(e) => setD(`${toggleKey}_details`, e.target.value)} sx={{ mt: 0.5 }} />
            )}
          </Grid>
        ))}

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Constantes</SectionTitle></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="TA sys." value={getD('ta_sys')} onChange={(e) => setD('ta_sys', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="TA dia." value={getD('ta_dia')} onChange={(e) => setD('ta_dia', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="T° (°C)" value={getD('temperature')} onChange={(e) => setD('temperature', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="FC (/min)" value={getD('fc')} onChange={(e) => setD('fc', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="Poids (kg)" value={getD('poids')} onChange={(e) => setD('poids', e.target.value)} /></Grid>
        <Grid item xs={6} sm={2}><TextField fullWidth size="small" label="Taille (cm)" value={getD('taille')} onChange={(e) => setD('taille', e.target.value)} /></Grid>
        {imc && <Grid item xs={12}><Chip label={`IMC calculé : ${imc} kg/m²`} size="small" /></Grid>}
        <Grid item xs={12}>
          <Box sx={{ mt: 1 }}>
            <AutresConstantes value={getDList('autres_constantes') as unknown as { label: string; value: string }[]} onChange={(v) => setD('autres_constantes', v)} />
          </Box>
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Examen clinique</SectionTitle></Grid>
        {examSystems.map((sys) => {
          const normal = cdata[`exam_${sys.key}_normal`] !== false
          return (
            <Grid item xs={12} sm={6} key={sys.key}>
              <FormControlLabel
                control={<Checkbox checked={normal} onChange={(e) => setD(`exam_${sys.key}_normal`, e.target.checked)} />}
                label={`${sys.label} — Normal`}
              />
              {!normal && (
                <TextField
                  fullWidth size="small" multiline rows={2}
                  placeholder="Anomalie constatée"
                  value={getD(`exam_${sys.key}_details`)}
                  onChange={(e) => setD(`exam_${sys.key}_details`, e.target.value)}
                  sx={{ mt: 0.5 }}
                />
              )}
            </Grid>
          )
        })}

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>État général</SectionTitle></Grid>
        {GENERAL_ITEMS.map((item) => {
          const normal = cdata[`general_${item.key}_normal`] !== false
          return (
            <Grid item xs={12} sm={6} key={item.key}>
              <FormControlLabel
                control={<Checkbox checked={normal} onChange={(e) => setD(`general_${item.key}_normal`, e.target.checked)} />}
                label={`${item.label} — Normal`}
              />
              {!normal && (
                <TextField
                  fullWidth size="small" multiline rows={2}
                  placeholder="Anomalie constatée"
                  value={getD(`general_${item.key}_details`)}
                  onChange={(e) => setD(`general_${item.key}_details`, e.target.value)}
                  sx={{ mt: 0.5 }}
                />
              )}
            </Grid>
          )
        })}

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Hypothèses diagnostiques</SectionTitle></Grid>
        <Grid item xs={12}>
          <TextField fullWidth label="Diagnostic principal" value={form.diagnostic_principal} onChange={(e) => setForm({ ...form, diagnostic_principal: e.target.value })} />
        </Grid>
        <Grid item xs={12}>
          <StringListEditor label="Diagnostics différentiels" values={getDList('diagnostics_differentiels')} onChange={(v) => setD('diagnostics_differentiels', v)} editable={editable} placeholder="Ajouter un diagnostic différentiel..." />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Résumé syndromique</SectionTitle></Grid>
        <Grid item xs={12}>
          <TextField fullWidth multiline rows={3} value={getD('resume_syndromique')} onChange={(e) => setD('resume_syndromique', e.target.value)} />
        </Grid>

        <Grid item xs={12}><Divider sx={{ my: 1 }} /><SectionTitle>Conduite à tenir</SectionTitle></Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={2} label="Prescriptions médicamenteuses" value={getD('cat_prescriptions')} onChange={(e) => setD('cat_prescriptions', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={2} label="Examens biologiques" value={getD('cat_examens_bio')} onChange={(e) => setD('cat_examens_bio', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={2} label="Imagerie" value={getD('cat_imagerie')} onChange={(e) => setD('cat_imagerie', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={2} label="ECG" value={getD('cat_ecg')} onChange={(e) => setD('cat_ecg', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={2} label="Avis spécialisé (motif)" value={getD('cat_avis_specialise')} onChange={(e) => setD('cat_avis_specialise', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Destinataire de l'avis / adressage" value={getD('cat_avis_destinataire')} onChange={(e) => setD('cat_avis_destinataire', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControlLabel control={<Switch checked={getDBool('cat_hospitalisation')} onChange={(e) => setD('cat_hospitalisation', e.target.checked)} />} label="Hospitalisation" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth multiline rows={2} label="Conseils hygiéno-diététiques" value={getD('cat_conseils')} onChange={(e) => setD('cat_conseils', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Suivi" value={getD('cat_suivi')} onChange={(e) => setD('cat_suivi', e.target.value)} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField fullWidth label="Contrôle" value={getD('cat_controle')} onChange={(e) => setD('cat_controle', e.target.value)} />
        </Grid>
        <Grid item xs={12}>
          <FormControlLabel control={<Switch checked={getDBool('cat_arret_travail')} onChange={(e) => setD('cat_arret_travail', e.target.checked)} />} label="Arrêt de travail" />
          {getDBool('cat_arret_travail') && (
            <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
              <TextField size="small" type="date" label="Date de début" InputLabelProps={{ shrink: true }} value={getD('arret_date_debut')} onChange={(e) => setD('arret_date_debut', e.target.value)} />
              <TextField size="small" type="number" label="Durée (jours)" value={getD('arret_duree_jours')} onChange={(e) => setD('arret_duree_jours', e.target.value)} sx={{ width: 140 }} />
              <TextField size="small" label="Motif" value={getD('arret_motif')} onChange={(e) => setD('arret_motif', e.target.value)} sx={{ minWidth: 200 }} />
            </Box>
          )}
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" gap={1} sx={{ mt: 3 }}>
        <Button onClick={backToList}>Annuler</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}>
          Enregistrer la consultation
        </Button>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}

function AutresConstantes({ value, onChange }: { value: { label: string; value: string }[]; onChange: (v: { label: string; value: string }[]) => void }) {
  const [label, setLabel] = useState('')
  const [val, setVal] = useState('')
  const add = () => {
    if (!label.trim() || !val.trim()) return
    onChange([...(value || []), { label: label.trim(), value: val.trim() }])
    setLabel('')
    setVal('')
  }
  return (
    <Box>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>Autres constantes</Typography>
      <Box display="flex" gap={1} sx={{ mb: 1 }}>
        <TextField size="small" label="Nom" value={label} onChange={(e) => setLabel(e.target.value)} />
        <TextField size="small" label="Valeur" value={val} onChange={(e) => setVal(e.target.value)} />
        <Button variant="outlined" size="small" onClick={add} disabled={!label.trim() || !val.trim()}>Ajouter</Button>
      </Box>
      <Box display="flex" flexWrap="wrap" gap={1}>
        {(value || []).map((item, i) => (
          <Chip
            key={`${item.label}-${i}`}
            label={`${item.label} : ${item.value}`}
            size="small"
            onDelete={() => onChange(value.filter((_, idx) => idx !== i))}
          />
        ))}
      </Box>
    </Box>
  )
}
