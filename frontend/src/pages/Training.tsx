import { useState, useEffect, useRef } from 'react'
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
  Divider,
} from '@mui/material'
import { Add as AddIcon, Publish as PublishIcon, People as PeopleIcon, Download as DownloadIcon, Upload as UploadIcon, Print as PrintIcon, WorkspacePremium as CertIcon } from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface TrainingType {
  id: number
  name: string
  code?: string
  validity_period_months?: number
  drive_link?: string
  description?: string
}

interface TrainingRecord {
  id: number
  agent?: number | null
  agent_name?: string | null
  agent_matricule?: string | null
  participants_count: number
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
  trainer_name?: string
  notes?: string
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
  const [_agents, setAgents] = useState<Agent[]>([])
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
  const [importLoading, setImportLoading] = useState(false)
  const importFileInputRef = useRef<HTMLInputElement>(null)
  const [certDialog, setCertDialog] = useState<{ open: boolean; training: TrainingRecord | null; participantName: string }>({ open: false, training: null, participantName: '' })
  const emptyCertForm = { formationName: '', dateDebut: '', dateFin: '', organisation: '', formateur: '', certificatNo: '', resultat: '', validiteDate: '' }
  const [newCertDialog, setNewCertDialog] = useState(false)
  const [newCertForm, setNewCertForm] = useState(emptyCertForm)
  const [newCertParticipant, setNewCertParticipant] = useState('')
  const { user, canManageUsers } = useAuth()
  const [requirementForm, setRequirementForm] = useState({
    company: '',
    training_type: '',
    job_position: '',
    mandatory: true,
  })

  const [trainingForm, setTrainingForm] = useState({
    participants_count: '1',
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

  const canManage = user?.role ? ['super_admin', 'admin', 'consultant', 'hse', 'direction', 'medecin', 'rh', 'infirmier'].includes(user.role) : false

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

  const initialTrainingForm = () => ({
    participants_count: '1',
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

  const handleCreateTraining = async () => {
    try {
      await client.post('/training/trainings/', {
        agent: null,
        participants_count: Math.max(1, parseInt(trainingForm.participants_count, 10) || 1),
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
      setTrainingForm(initialTrainingForm())
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
      showSnackbar('Certification ajoutée', 'success')
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

  const escapeCsv = (v: string | number | undefined | null): string => {
    if (v === undefined || v === null) return ''
    const s = String(v)
    if (s.includes(';') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }

  const exportFormationsCsv = () => {
    const headers = ['Effectif', 'Type de formation', 'Date début', 'Date fin', 'Date rappel', 'Statut', 'Résultat', 'N° certificat', 'Organisme formateur', 'Formateur', 'Notes']
    const rows = trainings.map((t) => [
      escapeCsv(String(t.participants_count ?? 1)),
      escapeCsv(t.training_type_name),
      escapeCsv(t.start_date ? new Date(t.start_date).toLocaleDateString('fr-FR') : ''),
      escapeCsv(t.end_date ? new Date(t.end_date).toLocaleDateString('fr-FR') : ''),
      escapeCsv(t.next_due_date ? new Date(t.next_due_date).toLocaleDateString('fr-FR') : ''),
      escapeCsv(t.status_display),
      escapeCsv(t.result),
      escapeCsv(t.certificate_number),
      escapeCsv(t.training_organization),
      escapeCsv(t.trainer_name),
      escapeCsv(t.notes),
    ])
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `formations_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showSnackbar('Export formations téléchargé', 'success')
  }

  const exportCoursCsv = () => {
    const headers = ['Nom', 'Code', 'Validité (mois)', 'Lien Drive (cours)', 'Description']
    const rows = trainingTypes.map((tp) => [
      escapeCsv(tp.name),
      escapeCsv(tp.code),
      escapeCsv(tp.validity_period_months),
      escapeCsv(tp.drive_link),
      escapeCsv(tp.description),
    ])
    const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cours_types_formation_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showSnackbar('Export des cours téléchargé', 'success')
  }

  const handlePrintCertificate = (training: TrainingRecord, participantName: string) => {
    const isPro = true
    const dateDebut = training.start_date ? new Date(training.start_date).toLocaleDateString('fr-FR') : '–'
    const dateFin = training.end_date ? new Date(training.end_date).toLocaleDateString('fr-FR') : dateDebut
    const logoOrigin = window.location.origin

    const proHeader = isPro ? `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
        <img src="${logoOrigin}/coly.png" alt="Logo" style="height:80px;object-fit:contain;" />
        <div style="text-align:right;font-size:12px;color:#555;">
          <div style="font-weight:bold;font-size:15px;color:#1976d2;">SERVICE DE SANTÉ AU TRAVAIL</div>
          <div>Département Hygiène, Sécurité et Environnement</div>
        </div>
      </div>
      <hr style="border:none;border-top:2px solid #1976d2;margin-bottom:28px;" />
    ` : ''

    const accentColor = isPro ? '#1976d2' : '#333'
    const borderStyle = isPro ? '3px double #1976d2' : '2px solid #333'
    const innerBorder = isPro ? `<div style="position:absolute;top:10px;left:10px;right:10px;bottom:10px;border:1px solid #90caf9;pointer-events:none;"></div>` : ''

    const detailRow = (label: string, value: string) =>
      `<div class="detail-item"><div class="detail-label">${label}</div><div>${value}</div></div>`

    const details = [
      detailRow('Date de début', dateDebut),
      detailRow('Date de fin', dateFin),
      training.training_organization ? detailRow('Organisme formateur', training.training_organization) : '',
      training.trainer_name ? detailRow('Formateur', training.trainer_name) : '',
      training.result ? detailRow('Résultat', training.result) : '',
      training.next_due_date ? detailRow("Valide jusqu'au", new Date(training.next_due_date).toLocaleDateString('fr-FR')) : '',
    ].filter(Boolean).join('')

    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8" />
  <title>Attestation – ${training.training_type_name}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: Georgia, serif; margin: 0; background: #fff; color: #222; }
    .cert-container { max-width: 680px; margin: 20px auto; border: ${borderStyle}; padding: 48px; position: relative; }
    h1 { text-align: center; text-transform: uppercase; letter-spacing: 3px; font-size: ${isPro ? '26px' : '22px'}; color: ${accentColor}; margin: 0 0 6px; }
    .subtitle { text-align: center; font-size: 13px; color: #888; margin-bottom: 32px; }
    .certify-text { text-align: center; font-size: 16px; margin-bottom: 12px; }
    .name-wrap { text-align: center; margin-bottom: 20px; }
    .name { font-size: 26px; font-weight: bold; border-bottom: 2px solid ${accentColor}; padding: 0 24px 6px; }
    .training-name { text-align: center; font-size: 19px; font-style: italic; color: ${accentColor}; margin: 16px 0 28px; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 0 0 32px; }
    .detail-item { background: #f7f7f7; padding: 10px 14px; border-radius: 4px; border-left: 3px solid ${accentColor}; font-size: 14px; }
    .detail-label { font-weight: bold; color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
    .signature-area { display: flex; justify-content: space-between; margin-top: 48px; }
    .signature-box { text-align: center; width: 40%; }
    .signature-line { border-top: 1px solid #555; padding-top: 8px; font-size: 12px; color: #555; }
    .cert-number { text-align: center; font-size: 11px; color: #aaa; margin-top: 24px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="cert-container">
    ${innerBorder}
    ${proHeader}
    <h1>Attestation de Formation</h1>
    <div class="subtitle">Service de Santé au Travail</div>
    <div class="certify-text">La présente attestation certifie que</div>
    <div class="name-wrap"><span class="name">${participantName || 'Participant'}</span></div>
    <div class="certify-text">a suivi et réussi avec succès la formation</div>
    <div class="training-name">${training.training_type_name}</div>
    <div class="details">${details}</div>
    <div class="signature-area">
      <div class="signature-box">
        <div class="signature-line">Le Formateur<br/>${training.trainer_name || '..............................'}</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Le Responsable SST</div>
      </div>
    </div>
    ${training.certificate_number ? `<div class="cert-number">N° Attestation : ${training.certificate_number}</div>` : ''}
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`

    const win = window.open('', '_blank', 'width=820,height=950')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  const handlePrintCustomCertificate = (
    participantName: string,
    form: typeof emptyCertForm
  ) => {
    const isPro = true
    const logoOrigin = window.location.origin
    const accentColor = '#1976d2'
    const borderStyle = '3px double #1976d2'
    const proHeader = isPro ? `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;">
        <img src="${logoOrigin}/coly.png" alt="Logo" style="height:80px;object-fit:contain;" />
        <div style="text-align:right;font-size:12px;color:#555;">
          <div style="font-weight:bold;font-size:15px;color:#1976d2;">SERVICE DE SANTÉ AU TRAVAIL</div>
          <div>Département Hygiène, Sécurité et Environnement</div>
        </div>
      </div>
      <hr style="border:none;border-top:2px solid #1976d2;margin-bottom:28px;" />
    ` : ''
    const innerBorder = isPro ? `<div style="position:absolute;top:10px;left:10px;right:10px;bottom:10px;border:1px solid #90caf9;pointer-events:none;"></div>` : ''

    const detailRow = (label: string, value: string) =>
      value ? `<div class="detail-item"><div class="detail-label">${label}</div><div>${value}</div></div>` : ''

    const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR') : ''
    const details = [
      detailRow('Date de début', fmtDate(form.dateDebut)),
      detailRow('Date de fin', fmtDate(form.dateFin)),
      detailRow('Organisme formateur', form.organisation),
      detailRow('Formateur', form.formateur),
      detailRow('Résultat', form.resultat),
      detailRow("Valide jusqu'au", fmtDate(form.validiteDate)),
    ].filter(Boolean).join('')

    const html = `<!DOCTYPE html>
<html><head>
  <meta charset="utf-8" />
  <title>Attestation – ${form.formationName}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: Georgia, serif; margin: 0; background: #fff; color: #222; }
    .cert-container { max-width: 680px; margin: 20px auto; border: ${borderStyle}; padding: 48px; position: relative; }
    h1 { text-align:center; text-transform:uppercase; letter-spacing:3px; font-size:${isPro ? '26px' : '22px'}; color:${accentColor}; margin:0 0 6px; }
    .subtitle { text-align:center; font-size:13px; color:#888; margin-bottom:32px; }
    .certify-text { text-align:center; font-size:16px; margin-bottom:12px; }
    .name-wrap { text-align:center; margin-bottom:20px; }
    .name { font-size:26px; font-weight:bold; border-bottom:2px solid ${accentColor}; padding:0 24px 6px; }
    .training-name { text-align:center; font-size:19px; font-style:italic; color:${accentColor}; margin:16px 0 28px; }
    .details { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:0 0 32px; }
    .detail-item { background:#f7f7f7; padding:10px 14px; border-radius:4px; border-left:3px solid ${accentColor}; font-size:14px; }
    .detail-label { font-weight:bold; color:#666; font-size:11px; text-transform:uppercase; margin-bottom:2px; }
    .signature-area { display:flex; justify-content:space-between; margin-top:48px; }
    .signature-box { text-align:center; width:40%; }
    .signature-line { border-top:1px solid #555; padding-top:8px; font-size:12px; color:#555; }
    .cert-number { text-align:center; font-size:11px; color:#aaa; margin-top:24px; }
    @media print { body { margin:0; } }
  </style>
</head>
<body>
  <div class="cert-container">
    ${innerBorder}
    ${proHeader}
    <h1>Attestation de Formation</h1>
    <div class="subtitle">Service de Santé au Travail</div>
    <div class="certify-text">La présente attestation certifie que</div>
    <div class="name-wrap"><span class="name">${participantName || 'Participant'}</span></div>
    <div class="certify-text">a suivi et réussi avec succès la formation</div>
    <div class="training-name">${form.formationName || 'Formation'}</div>
    <div class="details">${details}</div>
    <div class="signature-area">
      <div class="signature-box">
        <div class="signature-line">Le Formateur<br/>${form.formateur || '..............................'}</div>
      </div>
      <div class="signature-box">
        <div class="signature-line">Le Responsable SST</div>
      </div>
    </div>
    ${form.certificatNo ? `<div class="cert-number">N° Attestation : ${form.certificatNo}</div>` : ''}
  </div>
  <script>window.onload = function(){ window.print(); }<\/script>
</body></html>`

    const win = window.open('', '_blank', 'width=820,height=950')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') {
        inQuotes = !inQuotes
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      } else if ((c === ';' && !inQuotes) || c === '\n' || c === '\r') {
        result.push(current.trim())
        current = ''
        if (c !== ';') break
      } else {
        current += c
      }
    }
    result.push(current.trim())
    return result
  }

  const handleImportCours = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showSnackbar('Veuillez sélectionner un fichier CSV.', 'error')
      return
    }
    setImportLoading(true)
    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) {
        showSnackbar('Le fichier CSV doit contenir une ligne d\'en-tête et au moins une ligne de données.', 'error')
        setImportLoading(false)
        return
      }
      const header = parseCsvLine(lines[0])
      const nameIdx = header.findIndex((h) => /nom/i.test(h))
      const codeIdx = header.findIndex((h) => /code/i.test(h))
      const validIdx = header.findIndex((h) => /validit/i.test(h))
      const linkIdx = header.findIndex((h) => /lien|drive/i.test(h))
      const descIdx = header.findIndex((h) => /description/i.test(h))
      if (nameIdx === -1) {
        showSnackbar('Le CSV doit contenir une colonne "Nom".', 'error')
        setImportLoading(false)
        return
      }
      let created = 0
      let errors = 0
      for (let i = 1; i < lines.length; i++) {
        const cells = parseCsvLine(lines[i])
        const name = cells[nameIdx]?.trim()
        if (!name) continue
        try {
          await client.post('/training/training-types/', {
            name,
            code: codeIdx >= 0 ? (cells[codeIdx]?.trim() || null) : null,
            validity_period_months: validIdx >= 0 && cells[validIdx] ? parseInt(cells[validIdx], 10) || null : null,
            drive_link: linkIdx >= 0 ? (cells[linkIdx]?.trim() || null) : null,
            description: descIdx >= 0 ? (cells[descIdx]?.trim() || null) : null,
          })
          created++
        } catch {
          errors++
        }
      }
      if (importFileInputRef.current) importFileInputRef.current.value = ''
      fetchTrainingTypes()
      showSnackbar(`${created} cours importé(s).${errors ? ` ${errors} erreur(s).` : ''}`, errors ? 'error' : 'success')
    } catch (e) {
      showSnackbar('Erreur lors de la lecture du fichier.', 'error')
    }
    setImportLoading(false)
  }

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
              setTrainingForm(initialTrainingForm())
              setOpenTrainingDialog(true)
            }}
          >
            Ajouter formation
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

      {canManage && (
        <Paper sx={{ p: 2, mb: 3 }} elevation={2}>
          <Typography variant="h6" gutterBottom>Ajouter une formation</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Remplissez le formulaire ci-dessous pour enregistrer une nouvelle formation.</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Effectif (nombre de participants) *"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={trainingForm.participants_count}
                onChange={(e) => setTrainingForm({ ...trainingForm, participants_count: e.target.value || '1' })}
                placeholder="Ex. 25"
                required
              />
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
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateTraining}
                disabled={!trainingForm.participants_count || !trainingForm.training_type || !trainingForm.start_date}
              >
                Enregistrer la formation
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Formations" />
          <Tab label="Types de formation" />
          <Tab label="Articles d'éducation sanitaire" />
          <Tab label="Certifications" />
          <Tab label="Attestation" icon={<CertIcon />} iconPosition="start" />
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
            <>
              <FormControl size="small" sx={{ minWidth: 160, mt: 2, mb: 2, mr: 2 }}>
                <InputLabel>Statut</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Statut">
                  <MenuItem value="all">Tous</MenuItem>
                  <MenuItem value="planned">Planifiée</MenuItem>
                  <MenuItem value="in_progress">En cours</MenuItem>
                  <MenuItem value="completed">Terminée</MenuItem>
                  <MenuItem value="cancelled">Annulée</MenuItem>
                </Select>
              </FormControl>
              {canManage && (
                <Button variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2, mb: 2, mr: 2 }} onClick={() => { setTrainingForm(initialTrainingForm()); setOpenTrainingDialog(true) }}>
                  Ajouter formation
                </Button>
              )}
              <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ mt: 2, mb: 2, mr: 2 }} onClick={exportFormationsCsv} disabled={trainings.length === 0}>
                Exporter formations et détails
              </Button>
            </>
          )}
          {tabValue === 1 && (
            <>
              {canManage && (
                <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="subtitle2" gutterBottom>Importer des cours (fichier CSV)</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Déposez un fichier CSV avec les colonnes : Nom, Code, Validité (mois), Lien Drive (cours), Description (séparateur ;). Vous pouvez exporter les cours existants pour voir le format.
                  </Typography>
                  <input
                    type="file"
                    accept=".csv"
                    ref={importFileInputRef}
                    onChange={handleImportCours}
                    style={{ display: 'none' }}
                  />
                  <Button
                    variant="contained"
                    startIcon={importLoading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
                    onClick={() => importFileInputRef.current?.click()}
                    disabled={importLoading}
                    sx={{ mr: 2 }}
                  >
                    {importLoading ? 'Import en cours...' : 'Choisir un fichier CSV'}
                  </Button>
                  <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCoursCsv} disabled={trainingTypes.length === 0}>
                    Exporter les cours
                  </Button>
                </Box>
              )}
              {!canManage && (
                <Button variant="outlined" startIcon={<DownloadIcon />} sx={{ mt: 2, mb: 2 }} onClick={exportCoursCsv} disabled={trainingTypes.length === 0}>
                  Exporter les cours
                </Button>
              )}
            </>
          )}

          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Effectif</TableCell>
                    <TableCell>Thématique</TableCell>
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
                        <TableCell>{t.participants_count ?? 1}</TableCell>
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
                    <TableCell>Lien Drive (cours)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainingTypes.map((tp) => (
                    <TableRow key={tp.id}>
                      <TableCell>{tp.name}</TableCell>
                      <TableCell>{tp.code || '–'}</TableCell>
                      <TableCell>{tp.validity_period_months ?? '–'}</TableCell>
                      <TableCell>
                        {tp.drive_link ? (
                          <a href={tp.drive_link} target="_blank" rel="noopener noreferrer">Ouvrir le cours</a>
                        ) : '–'}
                      </TableCell>
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
                Ajouter une certification
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
                        <Typography variant="body2" color="text.secondary">Aucune certification</Typography>
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

          <TabPanel value={tabValue} index={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Sélectionnez une formation terminée pour générer une attestation, ou créez-en une nouvelle manuellement.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setNewCertForm(emptyCertForm)
                  setNewCertParticipant('')
                  setNewCertDialog(true)
                }}
              >
                Nouvelle attestation
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Participant / Effectif</TableCell>
                    <TableCell>Formation</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>N° Attestation</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Imprimer</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainings.filter((t) => t.status === 'completed').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body2" color="text.secondary">Aucune formation terminée</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    trainings.filter((t) => t.status === 'completed').map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.agent_name ? `${t.agent_name} (${t.agent_matricule || '–'})` : `${t.participants_count ?? 1} participant(s)`}</TableCell>
                        <TableCell>{t.training_type_name}</TableCell>
                        <TableCell>{new Date(t.start_date).toLocaleDateString('fr-FR')}{t.end_date ? ` → ${new Date(t.end_date).toLocaleDateString('fr-FR')}` : ''}</TableCell>
                        <TableCell>{t.certificate_number || '–'}</TableCell>
                        <TableCell><Chip label={t.status_display} size="small" color="success" /></TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PrintIcon />}
                            onClick={() => setCertDialog({ open: true, training: t, participantName: t.agent_name || '' })}
                          >
                            Imprimer
                          </Button>
                        </TableCell>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Effectif (nombre de participants) *"
                type="number"
                inputProps={{ min: 1, step: 1 }}
                value={trainingForm.participants_count}
                onChange={(e) => setTrainingForm({ ...trainingForm, participants_count: e.target.value || '1' })}
                placeholder="Ex. 25"
                required
              />
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
            disabled={!trainingForm.participants_count || !trainingForm.training_type || !trainingForm.start_date}
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
                  <TableCell>Effectif</TableCell>
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
        <DialogTitle>Nouvelle certification (formation obligatoire / recommandée)</DialogTitle>
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

      <Dialog open={certDialog.open} onClose={() => setCertDialog({ ...certDialog, open: false })} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <CertIcon color="primary" />
          Simuler l'attestation
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ minHeight: 560 }}>
            {/* Colonne gauche : contrôles */}
            <Grid item xs={12} md={4} sx={{ p: 3, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
              <TextField
                fullWidth
                label="Nom du participant"
                value={certDialog.participantName}
                onChange={(e) => setCertDialog({ ...certDialog, participantName: e.target.value })}
                placeholder="Entrez le nom complet..."
                size="small"
                sx={{ mb: 2 }}
              />
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                <strong>Formation :</strong> {certDialog.training?.training_type_name}
              </Typography>
              {certDialog.training?.certificate_number && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  <strong>N° Attestation :</strong> {certDialog.training.certificate_number}
                </Typography>
              )}
              {certDialog.training?.training_organization && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  <strong>Organisme :</strong> {certDialog.training.training_organization}
                </Typography>
              )}
              {certDialog.training?.trainer_name && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                  <strong>Formateur :</strong> {certDialog.training.trainer_name}
                </Typography>
              )}
              <Box sx={{ mt: 'auto', pt: 3 }}>
                <Alert severity="info" sx={{ fontSize: 12 }}>Logo clinique + encadrement décoratif + couleurs officielles</Alert>
              </Box>
            </Grid>

            {/* Colonne droite : aperçu du certificat */}
            <Grid item xs={12} md={8} sx={{ p: 3, bgcolor: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
              <Box sx={{ transform: 'scale(0.75)', transformOrigin: 'top center', width: '680px', flexShrink: 0 }}>
                {/* Certificat simulé */}
                <Box sx={{
                  bgcolor: '#fff',
                  border: '3px double #1976d2',
                  p: '48px',
                  fontFamily: 'Georgia, serif',
                  position: 'relative',
                  minHeight: 600,
                }}>
                  <Box sx={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, border: '1px solid #90caf9', pointerEvents: 'none' }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box component="img" src="/coly.png" alt="Logo" sx={{ height: 72, objectFit: 'contain' }} />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: 15, color: '#1976d2' }}>SERVICE DE SANTÉ AU TRAVAIL</Typography>
                      <Typography sx={{ fontSize: 12, color: '#555' }}>Département Hygiène, Sécurité et Environnement</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ borderColor: '#1976d2', borderWidth: 2, mb: 3 }} />

                  <Typography sx={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: 3, fontSize: 26, fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                    Attestation de Formation
                  </Typography>
                  <Typography sx={{ textAlign: 'center', fontSize: 13, color: '#888', mb: 4 }}>Service de Santé au Travail</Typography>

                  <Typography sx={{ textAlign: 'center', fontSize: 16, mb: 1.5 }}>La présente attestation certifie que</Typography>

                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography component="span" sx={{ fontSize: 26, fontWeight: 'bold', borderBottom: '2px solid #1976d2', px: 3, pb: 0.5, display: 'inline-block' }}>
                      {certDialog.participantName || 'Nom du participant'}
                    </Typography>
                  </Box>

                  <Typography sx={{ textAlign: 'center', fontSize: 16, mb: 1 }}>a suivi et réussi avec succès la formation</Typography>
                  <Typography sx={{ textAlign: 'center', fontSize: 19, fontStyle: 'italic', color: '#1976d2', mb: 3 }}>
                    {certDialog.training?.training_type_name || 'Nom de la formation'}
                  </Typography>

                  <Grid container spacing={1.5} sx={{ mb: 4 }}>
                    {[
                      { label: 'Date de début', val: certDialog.training?.start_date ? new Date(certDialog.training.start_date).toLocaleDateString('fr-FR') : '–' },
                      { label: 'Date de fin', val: certDialog.training?.end_date ? new Date(certDialog.training.end_date).toLocaleDateString('fr-FR') : '–' },
                      ...(certDialog.training?.training_organization ? [{ label: 'Organisme formateur', val: certDialog.training.training_organization }] : []),
                      ...(certDialog.training?.trainer_name ? [{ label: 'Formateur', val: certDialog.training.trainer_name }] : []),
                      ...(certDialog.training?.result ? [{ label: 'Résultat', val: certDialog.training.result }] : []),
                      ...(certDialog.training?.next_due_date ? [{ label: "Valide jusqu'au", val: new Date(certDialog.training.next_due_date).toLocaleDateString('fr-FR') }] : []),
                    ].map((item) => (
                      <Grid item xs={6} key={item.label}>
                        <Box sx={{ bgcolor: '#f7f7f7', p: 1.5, borderRadius: 1, borderLeft: '3px solid #1976d2' }}>
                          <Typography sx={{ fontSize: 11, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', mb: 0.3 }}>{item.label}</Typography>
                          <Typography sx={{ fontSize: 14 }}>{item.val}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
                    <Box sx={{ width: '40%', textAlign: 'center' }}>
                      <Divider sx={{ borderColor: '#555', mb: 1 }} />
                      <Typography sx={{ fontSize: 12, color: '#555' }}>Le Formateur<br />{certDialog.training?.trainer_name || '..............................'}</Typography>
                    </Box>
                    <Box sx={{ width: '40%', textAlign: 'center' }}>
                      <Divider sx={{ borderColor: '#555', mb: 1 }} />
                      <Typography sx={{ fontSize: 12, color: '#555' }}>Le Responsable SST</Typography>
                    </Box>
                  </Box>

                  {certDialog.training?.certificate_number && (
                    <Typography sx={{ textAlign: 'center', fontSize: 11, color: '#aaa', mt: 3 }}>
                      N° Attestation : {certDialog.training.certificate_number}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
          <Button onClick={() => setCertDialog({ ...certDialog, open: false })}>Annuler</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={() => {
              if (certDialog.training) handlePrintCertificate(certDialog.training, certDialog.participantName)
              setCertDialog({ ...certDialog, open: false })
            }}
          >
            Imprimer cette attestation
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={newCertDialog} onClose={() => setNewCertDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
          <CertIcon color="primary" />
          Nouvelle attestation personnalisée
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <Grid container sx={{ minHeight: 580 }}>
            {/* Formulaire */}
            <Grid item xs={12} md={5} sx={{ p: 3, borderRight: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', overflowY: 'auto' }}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>Informations</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Nom du participant *" value={newCertParticipant} onChange={(e) => setNewCertParticipant(e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Intitulé de la formation *" value={newCertForm.formationName} onChange={(e) => setNewCertForm({ ...newCertForm, formationName: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Date de début" type="date" value={newCertForm.dateDebut} onChange={(e) => setNewCertForm({ ...newCertForm, dateDebut: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Date de fin" type="date" value={newCertForm.dateFin} onChange={(e) => setNewCertForm({ ...newCertForm, dateFin: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Organisme formateur" value={newCertForm.organisation} onChange={(e) => setNewCertForm({ ...newCertForm, organisation: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Formateur" value={newCertForm.formateur} onChange={(e) => setNewCertForm({ ...newCertForm, formateur: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="Résultat" value={newCertForm.resultat} onChange={(e) => setNewCertForm({ ...newCertForm, resultat: e.target.value })} />
                </Grid>
                <Grid item xs={6}>
                  <TextField fullWidth size="small" label="N° Attestation" value={newCertForm.certificatNo} onChange={(e) => setNewCertForm({ ...newCertForm, certificatNo: e.target.value })} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth size="small" label="Valide jusqu'au" type="date" value={newCertForm.validiteDate} onChange={(e) => setNewCertForm({ ...newCertForm, validiteDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                </Grid>
              </Grid>
            </Grid>

            {/* Aperçu live */}
            <Grid item xs={12} md={7} sx={{ p: 3, bgcolor: '#e8e8e8', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto' }}>
              <Box sx={{ transform: 'scale(0.72)', transformOrigin: 'top center', width: '660px', flexShrink: 0 }}>
                <Box sx={{
                  bgcolor: '#fff',
                  border: '3px double #1976d2',
                  p: '44px',
                  fontFamily: 'Georgia, serif',
                  position: 'relative',
                }}>
                  <Box sx={{ position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, border: '1px solid #90caf9', pointerEvents: 'none' }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box component="img" src="/coly.png" alt="Logo" sx={{ height: 68, objectFit: 'contain' }} />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ fontWeight: 'bold', fontSize: 14, color: '#1976d2' }}>SERVICE DE SANTÉ AU TRAVAIL</Typography>
                      <Typography sx={{ fontSize: 11, color: '#555' }}>Département Hygiène, Sécurité et Environnement</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ borderColor: '#1976d2', borderWidth: 2, mb: 3 }} />
                  <Typography sx={{ textAlign: 'center', textTransform: 'uppercase', letterSpacing: 3, fontSize: 24, fontWeight: 'bold', color: '#1976d2', mb: 0.5 }}>
                    Attestation de Formation
                  </Typography>
                  <Typography sx={{ textAlign: 'center', fontSize: 12, color: '#888', mb: 3.5 }}>Service de Santé au Travail</Typography>
                  <Typography sx={{ textAlign: 'center', fontSize: 15, mb: 1.5 }}>La présente attestation certifie que</Typography>
                  <Box sx={{ textAlign: 'center', mb: 2.5 }}>
                    <Typography component="span" sx={{ fontSize: 24, fontWeight: 'bold', borderBottom: '2px solid #1976d2', px: 3, pb: 0.5, display: 'inline-block' }}>
                      {newCertParticipant || 'Nom du participant'}
                    </Typography>
                  </Box>
                  <Typography sx={{ textAlign: 'center', fontSize: 15, mb: 1 }}>a suivi et réussi avec succès la formation</Typography>
                  <Typography sx={{ textAlign: 'center', fontSize: 18, fontStyle: 'italic', color: '#1976d2', mb: 3 }}>
                    {newCertForm.formationName || 'Intitulé de la formation'}
                  </Typography>
                  <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    {[
                      { label: 'Date de début', val: newCertForm.dateDebut ? new Date(newCertForm.dateDebut).toLocaleDateString('fr-FR') : '' },
                      { label: 'Date de fin', val: newCertForm.dateFin ? new Date(newCertForm.dateFin).toLocaleDateString('fr-FR') : '' },
                      { label: 'Organisme formateur', val: newCertForm.organisation },
                      { label: 'Formateur', val: newCertForm.formateur },
                      { label: 'Résultat', val: newCertForm.resultat },
                      { label: "Valide jusqu'au", val: newCertForm.validiteDate ? new Date(newCertForm.validiteDate).toLocaleDateString('fr-FR') : '' },
                    ].filter((i) => i.val).map((item) => (
                      <Grid item xs={6} key={item.label}>
                        <Box sx={{ bgcolor: '#f7f7f7', p: 1.2, borderRadius: 1, borderLeft: '3px solid #1976d2' }}>
                          <Typography sx={{ fontSize: 10, fontWeight: 'bold', color: '#666', textTransform: 'uppercase', mb: 0.2 }}>{item.label}</Typography>
                          <Typography sx={{ fontSize: 13 }}>{item.val}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 5 }}>
                    <Box sx={{ width: '40%', textAlign: 'center' }}>
                      <Divider sx={{ borderColor: '#555', mb: 1 }} />
                      <Typography sx={{ fontSize: 11, color: '#555' }}>Le Formateur<br />{newCertForm.formateur || '..............................'}</Typography>
                    </Box>
                    <Box sx={{ width: '40%', textAlign: 'center' }}>
                      <Divider sx={{ borderColor: '#555', mb: 1 }} />
                      <Typography sx={{ fontSize: 11, color: '#555' }}>Le Responsable SST</Typography>
                    </Box>
                  </Box>
                  {newCertForm.certificatNo && (
                    <Typography sx={{ textAlign: 'center', fontSize: 10, color: '#aaa', mt: 2.5 }}>N° Attestation : {newCertForm.certificatNo}</Typography>
                  )}
                </Box>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', p: 2 }}>
          <Button onClick={() => setNewCertDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            disabled={!newCertParticipant || !newCertForm.formationName}
            onClick={() => {
              handlePrintCustomCertificate(newCertParticipant, newCertForm)
              setNewCertDialog(false)
            }}
          >
            Imprimer cette attestation
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
