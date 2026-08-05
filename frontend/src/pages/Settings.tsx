import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  IconButton,
  Avatar,
  Chip,
  InputAdornment,
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Person as PersonIcon, Settings as SettingsIcon, LocationOn as LocationOnIcon } from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface Vaccine {
  id: number
  name: string
  code?: string
  validity_period_months?: number
}

interface TrainingType {
  id: number
  name: string
  code?: string
  validity_period_months?: number
  drive_link?: string
}

interface RiskCategory {
  id: number
  name: string
  code?: string
  category_type?: string
}
interface VisitType {
  id: number
  name: string
  code: string
  description?: string
}
interface Pathology {
  id: number
  name: string
  code: string
  description?: string
}
interface VaccineRequirement {
  id: number
  vaccine: number
  vaccine_name: string
  job_position?: number
  job_position_name?: string
  risk_category?: number
  risk_category_name?: string
  mandatory: boolean
}
interface Company {
  id: number
  name: string
  siret?: string
  address?: string
  phone?: string | null
  email?: string | null
}
interface Site {
  id: number
  name: string
  company: number
  company_name?: string
}
interface Service {
  id: number
  name: string
  company: number
  company_name?: string
  site?: number
}
interface JobPosition {
  id: number
  name: string
  company: number
  company_name?: string
  code?: string
}
interface Doctor {
  id: number
  last_name: string
  first_name: string
  full_name?: string
  specialty?: string
  phone?: string
  email?: string
  company?: number | null
  company_name?: string
}

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  )
}

export default function Settings() {
  const [tabValue, setTabValue] = useState(0)
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [trainingTypes, setTrainingTypes] = useState<TrainingType[]>([])
  const [categories, setCategories] = useState<RiskCategory[]>([])
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([])
  const [pathologies, setPathologies] = useState<Pathology[]>([])
  const [vaccineReqs, setVaccineReqs] = useState<VaccineRequirement[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])

  // Dialogues
  const [openVaccineDialog, setOpenVaccineDialog] = useState(false)
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null)
  const [vaccineToDelete, setVaccineToDelete] = useState<Vaccine | null>(null)
  const [openTypeDialog, setOpenTypeDialog] = useState(false)
  const [editingType, setEditingType] = useState<TrainingType | null>(null)
  const [typeToDelete, setTypeToDelete] = useState<TrainingType | null>(null)
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false)
  const [editingCategory, setEditingCategory] = useState<RiskCategory | null>(null)
  const [categoryToDelete, setCategoryToDelete] = useState<RiskCategory | null>(null)
  const [openVisitTypeDialog, setOpenVisitTypeDialog] = useState(false)
  const [editingVisitType, setEditingVisitType] = useState<VisitType | null>(null)
  const [visitTypeToDelete, setVisitTypeToDelete] = useState<VisitType | null>(null)
  const [openVaccineReqDialog, setOpenVaccineReqDialog] = useState(false)
  const [editingVaccineReq, setEditingVaccineReq] = useState<VaccineRequirement | null>(null)
  const [vaccineReqToDelete, setVaccineReqToDelete] = useState<VaccineRequirement | null>(null)
  const [openCompanyDialog, setOpenCompanyDialog] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null)
  const [openSiteDialog, setOpenSiteDialog] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null)
  const [openDoctorDialog, setOpenDoctorDialog] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [doctorToDelete, setDoctorToDelete] = useState<Doctor | null>(null)

  // Formulaires
  const [vaccineForm, setVaccineForm] = useState({ name: '', code: '', validity_period_months: '', description: '' })
  const [typeForm, setTypeForm] = useState({ name: '', code: '', validity_period_months: '', description: '', drive_link: '' })
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', category_type: '', description: '' })
  const [visitTypeForm, setVisitTypeForm] = useState({ name: '', code: '', description: '' })
  const [vaccineReqForm, setVaccineReqForm] = useState<{ vaccine: string; job_position: string; risk_category: string; mandatory: boolean }>({
    vaccine: '', job_position: '', risk_category: '', mandatory: true,
  })
  const [companyForm, setCompanyForm] = useState({ name: '', siret: '', address: '', phone: '', email: '' })
  const [pendingSiteNames, setPendingSiteNames] = useState<string[]>([])
  const [newSiteInput, setNewSiteInput] = useState('')
  const [siteForm, setSiteForm] = useState({ name: '', company: '' })
  const [doctorForm, setDoctorForm] = useState({ last_name: '', first_name: '', specialty: '', phone: '', email: '', company: '' })

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const { user, canManageUsers } = useAuth()
  const canManageRefs = canManageUsers
  const canManageCompanies = user?.role ? ['super_admin', 'admin', 'rh', 'infirmier'].includes(user.role) : false

  // Chargement des donnees
  useEffect(() => {
    client.get('/vaccination/vaccines/').then((r) => setVaccines(r.data.results ?? r.data)).catch(() => {})
    client.get('/training/training-types/').then((r) => setTrainingTypes(r.data.results ?? r.data)).catch(() => {})
    client.get('/prevention/risk-categories/').then((r) => setCategories(r.data.results ?? r.data)).catch(() => {})
    client.get('/visits/types/').then((r) => setVisitTypes(r.data.results ?? r.data)).catch(() => {})
    client.get('/medical/pathologies/').then((r) => setPathologies(r.data.results ?? r.data)).catch(() => {})
    client.get('/vaccination/requirements/').then((r) => setVaccineReqs(r.data.results ?? r.data)).catch(() => {})
    client.get('/companies/companies/').then((r) => setCompanies(r.data.results ?? r.data)).catch(() => {})
    client.get('/companies/sites/').then((r) => setSites(r.data.results ?? r.data)).catch(() => {})
    client.get('/companies/services/').then((r) => setServices(r.data.results ?? r.data)).catch(() => {})
    client.get('/companies/job-positions/').then((r) => setJobPositions(r.data.results ?? r.data)).catch(() => {})
    client.get('/companies/doctors/?page_size=500').then((r) => setDoctors(r.data.results ?? r.data)).catch(() => {})
  }, [])

  const showSuccess = (message: string) => setSnackbar({ open: true, message, severity: 'success' })
  const showError = (message: string) => setSnackbar({ open: true, message, severity: 'error' })

  // Handlers vaccin
  const openEditVaccine = (vaccine: Vaccine) => {
    setEditingVaccine(vaccine)
    setVaccineForm({
      name: vaccine.name,
      code: vaccine.code ?? '',
      validity_period_months: vaccine.validity_period_months?.toString() ?? '',
      description: '',
    })
    setOpenVaccineDialog(true)
  }

  const handleCreateVaccine = async () => {
    try {
      const payload = {
        name: vaccineForm.name,
        code: vaccineForm.code || undefined,
        validity_period_months: vaccineForm.validity_period_months ? Number(vaccineForm.validity_period_months) : undefined,
      }
      const { data } = await client.post('/vaccination/vaccines/', payload)
      setVaccines((prev) => [...prev, data])
      setOpenVaccineDialog(false)
      setVaccineForm({ name: '', code: '', validity_period_months: '', description: '' })
      showSuccess('Vaccin créé avec succès')
    } catch {
      showError('Erreur lors de la création du vaccin')
    }
  }

  const handleUpdateVaccine = async () => {
    if (!editingVaccine) return
    try {
      const payload = {
        name: vaccineForm.name,
        code: vaccineForm.code || undefined,
        validity_period_months: vaccineForm.validity_period_months ? Number(vaccineForm.validity_period_months) : undefined,
      }
      const { data } = await client.put(`/vaccination/vaccines/${editingVaccine.id}/`, payload)
      setVaccines((prev) => prev.map((v) => (v.id === editingVaccine.id ? data : v)))
      setOpenVaccineDialog(false)
      setEditingVaccine(null)
      showSuccess('Vaccin mis à jour avec succès')
    } catch {
      showError('Erreur lors de la mise à jour du vaccin')
    }
  }

  const handleConfirmDeleteVaccine = async () => {
    if (!vaccineToDelete) return
    try {
      await client.delete(`/vaccination/vaccines/${vaccineToDelete.id}/`)
      setVaccines((prev) => prev.filter((v) => v.id !== vaccineToDelete.id))
      setVaccineToDelete(null)
      showSuccess('Vaccin supprimé')
    } catch {
      showError('Erreur lors de la suppression du vaccin')
    }
  }

  // Handlers type de formation
  const openEditType = (t: TrainingType) => {
    setEditingType(t)
    setTypeForm({
      name: t.name,
      code: t.code ?? '',
      validity_period_months: t.validity_period_months?.toString() ?? '',
      description: '',
      drive_link: t.drive_link ?? '',
    })
    setOpenTypeDialog(true)
  }

  const handleCreateType = async () => {
    try {
      const payload = {
        name: typeForm.name,
        code: typeForm.code || undefined,
        validity_period_months: typeForm.validity_period_months ? Number(typeForm.validity_period_months) : undefined,
        drive_link: typeForm.drive_link || undefined,
      }
      const { data } = await client.post('/training/training-types/', payload)
      setTrainingTypes((prev) => [...prev, data])
      setOpenTypeDialog(false)
      setTypeForm({ name: '', code: '', validity_period_months: '', description: '', drive_link: '' })
      showSuccess('Type de formation cree avec succes')
    } catch {
      showError('Erreur lors de la creation du type de formation')
    }
  }

  const handleUpdateType = async () => {
    if (!editingType) return
    try {
      const payload = {
        name: typeForm.name,
        code: typeForm.code || undefined,
        validity_period_months: typeForm.validity_period_months ? Number(typeForm.validity_period_months) : undefined,
        drive_link: typeForm.drive_link || undefined,
      }
      const { data } = await client.put(`/training/training-types/${editingType.id}/`, payload)
      setTrainingTypes((prev) => prev.map((t) => (t.id === editingType.id ? data : t)))
      setOpenTypeDialog(false)
      setEditingType(null)
      showSuccess('Type de formation mis à jour avec succès')
    } catch {
      showError('Erreur lors de la mise à jour du type de formation')
    }
  }

  const handleConfirmDeleteType = async () => {
    if (!typeToDelete) return
    try {
      await client.delete(`/training/training-types/${typeToDelete.id}/`)
      setTrainingTypes((prev) => prev.filter((t) => t.id !== typeToDelete.id))
      setTypeToDelete(null)
      showSuccess('Type de formation supprimé')
    } catch {
      showError('Erreur lors de la suppression du type de formation')
    }
  }

  // Handlers categorie de risque
  const openEditCategory = (c: RiskCategory) => {
    setEditingCategory(c)
    setCategoryForm({
      name: c.name,
      code: c.code ?? '',
      category_type: c.category_type ?? '',
      description: '',
    })
    setOpenCategoryDialog(true)
  }

  const handleCreateCategory = async () => {
    try {
      const payload = {
        name: categoryForm.name,
        code: categoryForm.code || undefined,
        category_type: categoryForm.category_type || undefined,
      }
      const { data } = await client.post('/prevention/risk-categories/', payload)
      setCategories((prev) => [...prev, data])
      setOpenCategoryDialog(false)
      setCategoryForm({ name: '', code: '', category_type: '', description: '' })
      showSuccess('Categorie creee avec succes')
    } catch {
      showError('Erreur lors de la creation de la categorie')
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return
    try {
      const payload = {
        name: categoryForm.name,
        code: categoryForm.code || undefined,
        category_type: categoryForm.category_type || undefined,
      }
      const { data } = await client.put(`/prevention/risk-categories/${editingCategory.id}/`, payload)
      setCategories((prev) => prev.map((c) => (c.id === editingCategory.id ? data : c)))
      setOpenCategoryDialog(false)
      setEditingCategory(null)
      showSuccess('Categorie mise à jour avec succès')
    } catch {
      showError('Erreur lors de la mise à jour de la categorie')
    }
  }

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDelete) return
    try {
      await client.delete(`/prevention/risk-categories/${categoryToDelete.id}/`)
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
      setCategoryToDelete(null)
      showSuccess('Categorie supprimée')
    } catch {
      showError('Erreur lors de la suppression de la categorie')
    }
  }

  // Handlers type de visite
  const openEditVisitType = (vt: VisitType) => {
    setEditingVisitType(vt)
    setVisitTypeForm({ name: vt.name, code: vt.code, description: vt.description ?? '' })
    setOpenVisitTypeDialog(true)
  }

  const handleCreateVisitType = async () => {
    try {
      const payload = {
        name: visitTypeForm.name,
        code: visitTypeForm.code,
        description: visitTypeForm.description || undefined,
      }
      const { data } = await client.post('/visits/types/', payload)
      setVisitTypes((prev) => [...prev, data])
      setOpenVisitTypeDialog(false)
      setVisitTypeForm({ name: '', code: '', description: '' })
      showSuccess('Type de visite cree avec succes')
    } catch {
      showError('Erreur lors de la creation du type de visite')
    }
  }

  const handleUpdateVisitType = async () => {
    if (!editingVisitType) return
    try {
      const payload = {
        name: visitTypeForm.name,
        code: visitTypeForm.code,
        description: visitTypeForm.description || undefined,
      }
      const { data } = await client.put(`/visits/types/${editingVisitType.id}/`, payload)
      setVisitTypes((prev) => prev.map((vt) => (vt.id === editingVisitType.id ? data : vt)))
      setOpenVisitTypeDialog(false)
      setEditingVisitType(null)
      showSuccess('Type de visite mis à jour avec succès')
    } catch {
      showError('Erreur lors de la mise à jour du type de visite')
    }
  }

  const handleConfirmDeleteVisitType = async () => {
    if (!visitTypeToDelete) return
    try {
      await client.delete(`/visits/types/${visitTypeToDelete.id}/`)
      setVisitTypes((prev) => prev.filter((vt) => vt.id !== visitTypeToDelete.id))
      setVisitTypeToDelete(null)
      showSuccess('Type de visite supprimé')
    } catch {
      showError('Erreur lors de la suppression du type de visite')
    }
  }

  // Handlers.regle vaccination
  const openEditVaccineReq = (vr: VaccineRequirement) => {
    setEditingVaccineReq(vr)
    setVaccineReqForm({
      vaccine: String(vr.vaccine),
      job_position: vr.job_position ? String(vr.job_position) : '',
      risk_category: vr.risk_category ? String(vr.risk_category) : '',
      mandatory: vr.mandatory,
    })
    setOpenVaccineReqDialog(true)
  }

  const handleCreateVaccineReq = async () => {
    try {
      const payload = {
        vaccine: Number(vaccineReqForm.vaccine),
        job_position: vaccineReqForm.job_position ? Number(vaccineReqForm.job_position) : undefined,
        risk_category: vaccineReqForm.risk_category ? Number(vaccineReqForm.risk_category) : undefined,
        mandatory: vaccineReqForm.mandatory,
      }
      const { data } = await client.post('/vaccination/requirements/', payload)
      setVaccineReqs((prev) => [...prev, data])
      setOpenVaccineReqDialog(false)
      setVaccineReqForm({ vaccine: '', job_position: '', risk_category: '', mandatory: true })
      showSuccess('Regle de vaccination creee avec succes')
    } catch {
      showError('Erreur lors de la creation de la regle')
    }
  }

  const handleUpdateVaccineReq = async () => {
    if (!editingVaccineReq) return
    try {
      const payload = {
        vaccine: Number(vaccineReqForm.vaccine),
        job_position: vaccineReqForm.job_position ? Number(vaccineReqForm.job_position) : undefined,
        risk_category: vaccineReqForm.risk_category ? Number(vaccineReqForm.risk_category) : undefined,
        mandatory: vaccineReqForm.mandatory,
      }
      const { data } = await client.put(`/vaccination/requirements/${editingVaccineReq.id}/`, payload)
      setVaccineReqs((prev) => prev.map((vr) => (vr.id === editingVaccineReq.id ? data : vr)))
      setOpenVaccineReqDialog(false)
      setEditingVaccineReq(null)
      showSuccess('Regle mise à jour avec succès')
    } catch {
      showError('Erreur lors de la mise à jour de la regle')
    }
  }

  const handleConfirmDeleteVaccineReq = async () => {
    if (!vaccineReqToDelete) return
    try {
      await client.delete(`/vaccination/requirements/${vaccineReqToDelete.id}/`)
      setVaccineReqs((prev) => prev.filter((vr) => vr.id !== vaccineReqToDelete.id))
      setVaccineReqToDelete(null)
      showSuccess('Regle supprimée')
    } catch {
      showError('Erreur lors de la suppression de la regle')
    }
  }

  // Handlers entreprise
  const openEditCompany = (company: Company) => {
    setEditingCompany(company)
    setCompanyForm({
      name: company.name,
      siret: company.siret ?? '',
      address: company.address ?? '',
      phone: company.phone ?? '',
      email: company.email ?? '',
    })
    setPendingSiteNames([])
    setNewSiteInput('')
    setOpenCompanyDialog(true)
  }

  const addPendingSite = () => {
    const name = newSiteInput.trim()
    if (!name || pendingSiteNames.some((s) => s.toLowerCase() === name.toLowerCase())) return
    setPendingSiteNames((prev) => [...prev, name])
    setNewSiteInput('')
  }

  const removePendingSite = (name: string) => {
    setPendingSiteNames((prev) => prev.filter((s) => s !== name))
  }

  const createPendingSites = async (companyId: number) => {
    if (pendingSiteNames.length === 0) return
    const created = await Promise.all(
      pendingSiteNames.map((name) => client.post('/companies/sites/', { name, company: companyId }))
    )
    setSites((prev) => [...prev, ...created.map((r) => r.data)])
  }

  const handleCreateCompany = async () => {
    try {
      const { data } = await client.post('/companies/companies/', companyForm)
      setCompanies((prev) => [...prev, data])
      const siteCount = pendingSiteNames.length
      await createPendingSites(data.id)
      setOpenCompanyDialog(false)
      setCompanyForm({ name: '', siret: '', address: '', phone: '', email: '' })
      setPendingSiteNames([])
      setNewSiteInput('')
      showSuccess(siteCount > 0 ? `Entreprise creee avec succes (${siteCount} site${siteCount > 1 ? 's' : ''})` : 'Entreprise creee avec succes')
    } catch {
      showError('Erreur lors de la creation de l\'entreprise')
    }
  }

  const handleUpdateCompany = async () => {
    if (!editingCompany) return
    try {
      const { data } = await client.put(`/companies/companies/${editingCompany.id}/`, companyForm)
      setCompanies((prev) => prev.map((c) => (c.id === editingCompany.id ? data : c)))
      await createPendingSites(editingCompany.id)
      setOpenCompanyDialog(false)
      setEditingCompany(null)
      setPendingSiteNames([])
      setNewSiteInput('')
      showSuccess('Entreprise mise a jour avec succes')
    } catch {
      showError('Erreur lors de la mise a jour de l\'entreprise')
    }
  }

  const handleConfirmDeleteCompany = async () => {
    if (!companyToDelete) return
    try {
      await client.delete(`/companies/companies/${companyToDelete.id}/`)
      setCompanies((prev) => prev.filter((c) => c.id !== companyToDelete.id))
      setCompanyToDelete(null)
      showSuccess('Entreprise suprrimee')
    } catch {
      showError('Erreur lors de la suppression de l\'entreprise')
    }
  }

  // Handlers site
  const openEditSite = (site: Site) => {
    setEditingSite(site)
    setSiteForm({ name: site.name, company: site.company.toString() })
    setOpenSiteDialog(true)
  }

  const handleUpdateSite = async () => {
    if (!editingSite) return
    try {
      const { data } = await client.put(`/companies/sites/${editingSite.id}/`, { name: siteForm.name, company: parseInt(siteForm.company) })
      setSites((prev) => prev.map((s) => (s.id === editingSite.id ? data : s)))
      setOpenSiteDialog(false)
      setEditingSite(null)
      showSuccess('Site mis à jour avec succès')
    } catch {
      showError('Erreur lors de la mise à jour du site')
    }
  }

  const handleConfirmDeleteSite = async () => {
    if (!siteToDelete) return
    try {
      await client.delete(`/companies/sites/${siteToDelete.id}/`)
      setSites((prev) => prev.filter((s) => s.id !== siteToDelete.id))
      setSiteToDelete(null)
      showSuccess('Site supprimé')
    } catch {
      showError('Erreur lors de la suppression du site')
    }
  }

  // Handlers médecin
  const openEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setDoctorForm({
      last_name: doctor.last_name,
      first_name: doctor.first_name,
      specialty: doctor.specialty ?? '',
      phone: doctor.phone ?? '',
      email: doctor.email ?? '',
      company: doctor.company ? String(doctor.company) : '',
    })
    setOpenDoctorDialog(true)
  }

  const handleCreateDoctor = async () => {
    try {
      const payload = {
        last_name: doctorForm.last_name.trim(),
        first_name: doctorForm.first_name.trim(),
        specialty: doctorForm.specialty.trim() || null,
        phone: doctorForm.phone.trim() || null,
        email: doctorForm.email.trim() || null,
        company: doctorForm.company ? parseInt(doctorForm.company) : null,
      }
      const { data } = await client.post('/companies/doctors/', payload)
      setDoctors((prev) => [...prev, data])
      setOpenDoctorDialog(false)
      setDoctorForm({ last_name: '', first_name: '', specialty: '', phone: '', email: '', company: '' })
      showSuccess('Médecin créé avec succès')
    } catch {
      showError('Erreur lors de la création du médecin')
    }
  }

  const handleUpdateDoctor = async () => {
    if (!editingDoctor) return
    try {
      const payload = {
        last_name: doctorForm.last_name.trim(),
        first_name: doctorForm.first_name.trim(),
        specialty: doctorForm.specialty.trim() || null,
        phone: doctorForm.phone.trim() || null,
        email: doctorForm.email.trim() || null,
        company: doctorForm.company ? parseInt(doctorForm.company) : null,
      }
      const { data } = await client.put(`/companies/doctors/${editingDoctor.id}/`, payload)
      setDoctors((prev) => prev.map((d) => (d.id === editingDoctor.id ? data : d)))
      setOpenDoctorDialog(false)
      setEditingDoctor(null)
      showSuccess('Médecin mis à jour avec succès')
    } catch {
      showError('Erreur lors de la mise à jour du médecin')
    }
  }

  const handleConfirmDeleteDoctor = async () => {
    if (!doctorToDelete) return
    try {
      await client.delete(`/companies/doctors/${doctorToDelete.id}/`)
      setDoctors((prev) => prev.filter((d) => d.id !== doctorToDelete.id))
      setDoctorToDelete(null)
      showSuccess('Médecin supprimé')
    } catch {
      showError('Erreur lors de la suppression du médecin')
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <Avatar sx={{ bgcolor: 'rgba(15,76,134,0.12)', color: '#0F4C86', width: 48, height: 48 }}>
          <SettingsIcon />
        </Avatar>
        <Box>
          <Typography variant="h4" fontWeight={800}>Parametres</Typography>
          <Typography variant="body2" color="text.secondary">
            Compte, referentiels et structures de la plateforme
          </Typography>
        </Box>
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab icon={<PersonIcon />} iconPosition="start" label="Mon compte" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Referentiels" />
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Structures" />
        </Tabs>

        <Box sx={{ px: 2, pb: 2 }}>
          <TabPanel value={tabValue} index={0}>
            <Card variant="outlined" sx={{ maxWidth: 480 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Informations du compte
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Nom complet</Typography>
                    <Typography variant="body1">{user?.full_name || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Identifiant</Typography>
                    <Typography variant="body1">{user?.username || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{user?.email || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">Role</Typography>
                    <Typography variant="body1">{user?.role_display || user?.role || '-'}</Typography>
                  </Grid>
                </Grid>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Pour modifier le mot de passe ou les parametres avances, contactez votre administrateur.
                </Typography>
              </CardContent>
            </Card>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Gestion des referentiels utilises dans les modules Vaccination, Prevention et Formation.
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 3, mb: 1 }}>
              <Typography variant="subtitle1">Vaccins</Typography>
              {canManageRefs && (
                <Button
                  startIcon={<AddIcon />}
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setEditingVaccine(null)
                    setVaccineForm({ name: '', code: '', validity_period_months: '', description: '' })
                    setOpenVaccineDialog(true)
                  }}
                >
                  Ajouter un vaccin
                </Button>
              )}
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Validite (mois)</TableCell>
                    {canManageRefs && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaccines.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell>{v.name}</TableCell>
                      <TableCell>{v.code || '-'}</TableCell>
                      <TableCell>{v.validity_period_months ?? '-'}</TableCell>
                      {canManageRefs && (
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => openEditVaccine(v)} title="Modifier">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setVaccineToDelete(v)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Types de formation
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => { setEditingType(null); setTypeForm({ name: '', code: '', validity_period_months: '', description: '', drive_link: '' }); setOpenTypeDialog(true) }}>
                Ajouter un type
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Validite (mois)</TableCell>
                    <TableCell>Lien Drive (cours)</TableCell>
                    {canManageRefs && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trainingTypes.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.name}</TableCell>
                      <TableCell>{t.code || '-'}</TableCell>
                      <TableCell>{t.validity_period_months ?? '-'}</TableCell>
                      <TableCell>
                        {t.drive_link ? (
                          <a href={t.drive_link} target="_blank" rel="noopener noreferrer">Ouvrir le cours</a>
                        ) : '-'}
                      </TableCell>
                      {canManageRefs && (
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => openEditType(t)} title="Modifier">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setTypeToDelete(t)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Categories de risques
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => { setEditingCategory(null); setCategoryForm({ name: '', code: '', category_type: '', description: '' }); setOpenCategoryDialog(true) }}>
                Ajouter une categorie
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Type</TableCell>
                    {canManageRefs && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.code || '-'}</TableCell>
                      <TableCell>
                        {c.category_type === 'physical' && 'Physique'}
                        {c.category_type === 'biological' && 'Biologique'}
                        {c.category_type === 'chemical' && 'Chimique'}
                        {c.category_type === 'psychosocial' && 'Psychosocial'}
                        {c.category_type === 'ergonomic' && 'Ergonomique'}
                        {!c.category_type && '-'}
                      </TableCell>
                      {canManageRefs && (
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => openEditCategory(c)} title="Modifier">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setCategoryToDelete(c)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
              Types de visites
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => { setEditingVisitType(null); setVisitTypeForm({ name: '', code: '', description: '' }); setOpenVisitTypeDialog(true) }}>
                Ajouter un type
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                    {canManageRefs && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visitTypes.map((vt) => (
                    <TableRow key={vt.id}>
                      <TableCell>{vt.name}</TableCell>
                      <TableCell>{vt.code}</TableCell>
                      <TableCell>{vt.description || '-'}</TableCell>
                      {canManageRefs && (
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => openEditVisitType(vt)} title="Modifier">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setVisitTypeToDelete(vt)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Pathologies (CIM-10)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Lecture seule. Gestion complete via l'admin Django.</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pathologies.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell>
                      <TableCell>{p.code}</TableCell>
                      <TableCell>{p.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
              Vaccinations obligatoires / recommandees
            </Typography>
            {canManageRefs && (
              <Button startIcon={<AddIcon />} size="small" variant="outlined" sx={{ mb: 1 }} onClick={() => { setEditingVaccineReq(null); setVaccineReqForm({ vaccine: '', job_position: '', risk_category: '', mandatory: true }); setOpenVaccineReqDialog(true) }}>
                Ajouter une regle
              </Button>
            )}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Vaccin</TableCell>
                    <TableCell>Poste / Categorie risque</TableCell>
                    <TableCell>Obligatoire</TableCell>
                    {canManageRefs && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vaccineReqs.map((vr) => (
                    <TableRow key={vr.id}>
                      <TableCell>{vr.vaccine_name}</TableCell>
                      <TableCell>{vr.job_position_name || vr.risk_category_name || '-'}</TableCell>
                      <TableCell>{vr.mandatory ? 'Oui' : 'Recommande'}</TableCell>
                      {canManageRefs && (
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => openEditVaccineReq(vr)} title="Modifier">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setVaccineReqToDelete(vr)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Entreprises, sites, services et postes de travail. Gestion complete via l'admin Django ou les API.
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
              <Typography variant="subtitle1">Entreprises</Typography>
              {canManageCompanies && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingCompany(null)
                    setCompanyForm({ name: '', siret: '', address: '', phone: '', email: '' })
                    setPendingSiteNames([])
                    setNewSiteInput('')
                    setOpenCompanyDialog(true)
                  }}
                >
                  Ajouter une entreprise
                </Button>
              )}
            </Box>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>SIRET</TableCell>
                    <TableCell>Adresse</TableCell>
                    <TableCell>Telephone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {companies.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.name}</TableCell>
                      <TableCell>{c.siret || '-'}</TableCell>
                      <TableCell>{c.address || '-'}</TableCell>
                      <TableCell>{c.phone || '-'}</TableCell>
                      <TableCell>{c.email || '-'}</TableCell>
                      <TableCell align="right">
                        {canManageCompanies && (
                          <>
                            <IconButton size="small" color="primary" onClick={() => openEditCompany(c)} title="Modifier" aria-label="Modifier">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setCompanyToDelete(c)} title="Supprimer" aria-label="Supprimer">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Sites</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Les sites s'ajoutent directement depuis le formulaire d'une entreprise (bouton "Ajouter une entreprise" ou "Modifier").
            </Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Entreprise</TableCell>
                    {canManageCompanies && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sites.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.company_name ?? s.company}</TableCell>
                      {canManageCompanies && (
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => openEditSite(s)} title="Modifier">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error" onClick={() => setSiteToDelete(s)} title="Supprimer">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Services</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Nom</TableCell><TableCell>Entreprise</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {services.map((s) => (
                    <TableRow key={s.id}><TableCell>{s.name}</TableCell><TableCell>{s.company_name ?? s.company}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Postes de travail</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow><TableCell>Nom</TableCell><TableCell>Code</TableCell><TableCell>Entreprise</TableCell></TableRow>
                </TableHead>
                <TableBody>
                  {jobPositions.map((jp) => (
                    <TableRow key={jp.id}><TableCell>{jp.name}</TableCell><TableCell>{jp.code || '-'}</TableCell><TableCell>{jp.company_name ?? jp.company}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 1 }}>
              <Typography variant="subtitle1">Médecins</Typography>
              {canManageCompanies && (
                <Button variant="outlined" startIcon={<AddIcon />} size="small" onClick={() => { setEditingDoctor(null); setDoctorForm({ last_name: '', first_name: '', specialty: '', phone: '', email: '', company: '' }); setOpenDoctorDialog(true) }}>
                  Ajouter un médecin
                </Button>
              )}
            </Box>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nom</TableCell>
                    <TableCell>Prénom</TableCell>
                    <TableCell>Spécialité</TableCell>
                    <TableCell>Téléphone</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Entreprise</TableCell>
                    {canManageCompanies && <TableCell align="right">Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {doctors.length === 0 ? (
                    <TableRow><TableCell colSpan={7} align="center"><Typography variant="body2" color="text.secondary">Aucun médecin enregistré</Typography></TableCell></TableRow>
                  ) : doctors.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>{d.last_name}</TableCell>
                      <TableCell>{d.first_name}</TableCell>
                      <TableCell>{d.specialty || '-'}</TableCell>
                      <TableCell>{d.phone || '-'}</TableCell>
                      <TableCell>{d.email || '-'}</TableCell>
                      <TableCell>{d.company_name || '-'}</TableCell>
                      {canManageCompanies && (
                        <TableCell align="right">
                          <IconButton size="small" color="primary" onClick={() => openEditDoctor(d)} title="Modifier"><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" color="error" onClick={() => setDoctorToDelete(d)} title="Supprimer"><DeleteIcon fontSize="small" /></IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Box>
      </Paper>

      {/* Dialog : Vaccin (création / édition) */}
      <Dialog open={openVaccineDialog} onClose={() => { setOpenVaccineDialog(false); setEditingVaccine(null) }} maxWidth="xs" fullWidth>
        <DialogTitle>{editingVaccine ? 'Modifier le vaccin' : 'Nouveau vaccin'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom *" value={vaccineForm.name} onChange={(e) => setVaccineForm({ ...vaccineForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Code" value={vaccineForm.code} onChange={(e) => setVaccineForm({ ...vaccineForm, code: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Validite (mois)" type="number" value={vaccineForm.validity_period_months} onChange={(e) => setVaccineForm({ ...vaccineForm, validity_period_months: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={vaccineForm.description} onChange={(e) => setVaccineForm({ ...vaccineForm, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenVaccineDialog(false); setEditingVaccine(null) }}>Annuler</Button>
          {editingVaccine ? (
            <Button variant="contained" onClick={handleUpdateVaccine} disabled={!vaccineForm.name}>Enregistrer</Button>
          ) : (
            <Button variant="contained" onClick={handleCreateVaccine} disabled={!vaccineForm.name}>Créer</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog : Confirmation suppression vaccin */}
      <Dialog open={!!vaccineToDelete} onClose={() => setVaccineToDelete(null)}>
        <DialogTitle>Supprimer le vaccin</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer le vaccin &quot;{vaccineToDelete?.name}&quot; ? Les enregistrements de vaccination liés ne seront pas supprimés.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVaccineToDelete(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteVaccine}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Type de formation (creation / edition) */}
      <Dialog open={openTypeDialog} onClose={() => { setOpenTypeDialog(false); setEditingType(null) }} maxWidth="xs" fullWidth>
        <DialogTitle>{editingType ? 'Modifier le type de formation' : 'Nouveau type de formation'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom *" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Code" value={typeForm.code} onChange={(e) => setTypeForm({ ...typeForm, code: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Validite (mois)" type="number" value={typeForm.validity_period_months} onChange={(e) => setTypeForm({ ...typeForm, validity_period_months: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Lien Drive (cours)" placeholder="https://drive.google.com/..." value={typeForm.drive_link} onChange={(e) => setTypeForm({ ...typeForm, drive_link: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenTypeDialog(false); setEditingType(null) }}>Annuler</Button>
          {editingType ? (
            <Button variant="contained" onClick={handleUpdateType} disabled={!typeForm.name}>Enregistrer</Button>
          ) : (
            <Button variant="contained" onClick={handleCreateType} disabled={!typeForm.name}>Creer</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog : Confirmation suppression type de formation */}
      <Dialog open={!!typeToDelete} onClose={() => setTypeToDelete(null)}>
        <DialogTitle>Supprimer le type de formation</DialogTitle>
        <DialogContent>
          <Typography>Supprimer le type de formation &quot;{typeToDelete?.name}&quot; ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeToDelete(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteType}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Categorie de risque (creation / edition) */}
      <Dialog open={openCategoryDialog} onClose={() => { setOpenCategoryDialog(false); setEditingCategory(null) }} maxWidth="xs" fullWidth>
        <DialogTitle>{editingCategory ? 'Modifier la categorie de risque' : 'Nouvelle categorie de risque'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom *" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Code" value={categoryForm.code} onChange={(e) => setCategoryForm({ ...categoryForm, code: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select value={categoryForm.category_type} onChange={(e) => setCategoryForm({ ...categoryForm, category_type: e.target.value })} label="Type">
                  <MenuItem value="">-</MenuItem>
                  <MenuItem value="physical">Physique</MenuItem>
                  <MenuItem value="biological">Biologique</MenuItem>
                  <MenuItem value="chemical">Chimique</MenuItem>
                  <MenuItem value="psychosocial">Psychosocial</MenuItem>
                  <MenuItem value="ergonomic">Ergonomique</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCategoryDialog(false); setEditingCategory(null) }}>Annuler</Button>
          {editingCategory ? (
            <Button variant="contained" onClick={handleUpdateCategory} disabled={!categoryForm.name}>Enregistrer</Button>
          ) : (
            <Button variant="contained" onClick={handleCreateCategory} disabled={!categoryForm.name}>Creer</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog : Confirmation suppression categorie de risque */}
      <Dialog open={!!categoryToDelete} onClose={() => setCategoryToDelete(null)}>
        <DialogTitle>Supprimer la categorie de risque</DialogTitle>
        <DialogContent>
          <Typography>Supprimer la categorie &quot;{categoryToDelete?.name}&quot; ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryToDelete(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteCategory}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Type de visite (creation / edition) */}
      <Dialog open={openVisitTypeDialog} onClose={() => { setOpenVisitTypeDialog(false); setEditingVisitType(null) }} maxWidth="xs" fullWidth>
        <DialogTitle>{editingVisitType ? 'Modifier le type de visite' : 'Nouveau type de visite'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom *" value={visitTypeForm.name} onChange={(e) => setVisitTypeForm({ ...visitTypeForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Code *" value={visitTypeForm.code} onChange={(e) => setVisitTypeForm({ ...visitTypeForm, code: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" multiline rows={2} value={visitTypeForm.description} onChange={(e) => setVisitTypeForm({ ...visitTypeForm, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenVisitTypeDialog(false); setEditingVisitType(null) }}>Annuler</Button>
          {editingVisitType ? (
            <Button variant="contained" onClick={handleUpdateVisitType} disabled={!visitTypeForm.name || !visitTypeForm.code}>Enregistrer</Button>
          ) : (
            <Button variant="contained" onClick={handleCreateVisitType} disabled={!visitTypeForm.name || !visitTypeForm.code}>Creer</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog : Confirmation suppression type de visite */}
      <Dialog open={!!visitTypeToDelete} onClose={() => setVisitTypeToDelete(null)}>
        <DialogTitle>Supprimer le type de visite</DialogTitle>
        <DialogContent>
          <Typography>Supprimer le type de visite &quot;{visitTypeToDelete?.name}&quot; ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisitTypeToDelete(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteVisitType}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Regle vaccination (creation / edition) */}
      <Dialog open={openVaccineReqDialog} onClose={() => { setOpenVaccineReqDialog(false); setEditingVaccineReq(null) }} maxWidth="xs" fullWidth>
        <DialogTitle>{editingVaccineReq ? 'Modifier la regle de vaccination' : 'Nouvelle regle vaccination (obligatoire / recommandee)'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Vaccin *</InputLabel>
                <Select
                  value={vaccineReqForm.vaccine}
                  onChange={(e) => setVaccineReqForm({ ...vaccineReqForm, vaccine: e.target.value })}
                  label="Vaccin *"
                >
                  {vaccines.map((v) => (
                    <MenuItem key={v.id} value={String(v.id)}>{v.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Poste de travail</InputLabel>
                <Select
                  value={vaccineReqForm.job_position}
                  onChange={(e) => setVaccineReqForm({ ...vaccineReqForm, job_position: e.target.value, risk_category: '' })}
                  label="Poste de travail"
                >
                  <MenuItem value="">-</MenuItem>
                  {jobPositions.map((jp) => (
                    <MenuItem key={jp.id} value={String(jp.id)}>{jp.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Categorie de risque</InputLabel>
                <Select
                  value={vaccineReqForm.risk_category}
                  onChange={(e) => setVaccineReqForm({ ...vaccineReqForm, risk_category: e.target.value, job_position: '' })}
                  label="Categorie de risque"
                >
                  <MenuItem value="">-</MenuItem>
                  {categories.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Obligatoire</InputLabel>
                <Select
                  value={vaccineReqForm.mandatory ? 'yes' : 'no'}
                  onChange={(e) => setVaccineReqForm({ ...vaccineReqForm, mandatory: e.target.value === 'yes' })}
                  label="Obligatoire"
                >
                  <MenuItem value="yes">Oui</MenuItem>
                  <MenuItem value="no">Non (recommande)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenVaccineReqDialog(false); setEditingVaccineReq(null) }}>Annuler</Button>
          {editingVaccineReq ? (
            <Button
              variant="contained"
              onClick={handleUpdateVaccineReq}
              disabled={!vaccineReqForm.vaccine || (!vaccineReqForm.job_position && !vaccineReqForm.risk_category)}
            >
              Enregistrer
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleCreateVaccineReq}
              disabled={!vaccineReqForm.vaccine || (!vaccineReqForm.job_position && !vaccineReqForm.risk_category)}
            >
              Creer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog : Confirmation suppression regle vaccination */}
      <Dialog open={!!vaccineReqToDelete} onClose={() => setVaccineReqToDelete(null)}>
        <DialogTitle>Supprimer la regle</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer la regle pour &quot;{vaccineReqToDelete?.vaccine_name}&quot; ({vaccineReqToDelete?.job_position_name || vaccineReqToDelete?.risk_category_name || '-'}) ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVaccineReqToDelete(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteVaccineReq}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Entreprise (creation / edition) */}
      <Dialog
        open={openCompanyDialog}
        onClose={() => { setOpenCompanyDialog(false); setEditingCompany(null); setPendingSiteNames([]); setNewSiteInput('') }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{editingCompany ? 'Modifier l\'entreprise' : 'Nouvelle entreprise'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom de l'entreprise *" value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="SIRET *"
                value={companyForm.siret}
                onChange={(e) => setCompanyForm({ ...companyForm, siret: e.target.value.replace(/\D/g, '') })}
                inputProps={{ maxLength: 14 }}
                helperText="14 chiffres"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Adresse *" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} multiline rows={2} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Telephone" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOnIcon fontSize="small" color="action" />
                Sites de l'entreprise
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Nom du site (ex. Site de Dakar)"
                  value={newSiteInput}
                  onChange={(e) => setNewSiteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addPendingSite()
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={addPendingSite} disabled={!newSiteInput.trim()} title="Ajouter le site">
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              {pendingSiteNames.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {pendingSiteNames.map((name) => (
                    <Chip
                      key={name}
                      label={name}
                      icon={<LocationOnIcon />}
                      onDelete={() => removePendingSite(name)}
                      size="small"
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="caption" color="text.secondary">
                  Aucun site ajouté pour l'instant. Vous pourrez aussi en ajouter plus tard depuis l'onglet Sites.
                </Typography>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenCompanyDialog(false); setEditingCompany(null); setPendingSiteNames([]); setNewSiteInput('') }}>Annuler</Button>
          {editingCompany ? (
            <Button
              variant="contained"
              onClick={handleUpdateCompany}
              disabled={!companyForm.name.trim() || companyForm.siret.replace(/\s/g, '').length !== 14 || !companyForm.address.trim()}
            >
              Enregistrer
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleCreateCompany}
              disabled={!companyForm.name.trim() || companyForm.siret.replace(/\s/g, '').length !== 14 || !companyForm.address.trim()}
            >
              Creer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog : Confirmation suppression entreprise */}
      <Dialog open={!!companyToDelete} onClose={() => setCompanyToDelete(null)}>
        <DialogTitle>Supprimer l&apos;entreprise</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer l&apos;entreprise &quot;{companyToDelete?.name}&quot; ? Cette action est irreversible (sites, services et postes lies seront egalement supprims).
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompanyToDelete(null)}>Annuler</Button>
          {canManageCompanies && (
            <Button variant="contained" color="error" onClick={handleConfirmDeleteCompany}>
              Supprimer
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog : Site (édition) */}
      <Dialog open={openSiteDialog} onClose={() => { setOpenSiteDialog(false); setEditingSite(null) }} maxWidth="xs" fullWidth>
        <DialogTitle>Modifier le site</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom du site *"
                value={siteForm.name}
                onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Entreprise *</InputLabel>
                <Select
                  value={siteForm.company}
                  onChange={(e) => setSiteForm({ ...siteForm, company: e.target.value })}
                  label="Entreprise *"
                >
                  {companies.map((c) => (
                    <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenSiteDialog(false); setEditingSite(null) }}>Annuler</Button>
          <Button variant="contained" onClick={handleUpdateSite} disabled={!siteForm.name.trim() || !siteForm.company}>
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Confirmation suppression site */}
      <Dialog open={!!siteToDelete} onClose={() => setSiteToDelete(null)}>
        <DialogTitle>Supprimer le site</DialogTitle>
        <DialogContent>
          <Typography>
            Supprimer le site &quot;{siteToDelete?.name}&quot; ? Les agents rattachés à ce site ne seront pas supprimés.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSiteToDelete(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteSite}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog : Médecin (création / édition) */}
      <Dialog open={openDoctorDialog} onClose={() => { setOpenDoctorDialog(false); setEditingDoctor(null) }} maxWidth="sm" fullWidth>
        <DialogTitle>{editingDoctor ? 'Modifier le médecin' : 'Nouveau médecin'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nom *" value={doctorForm.last_name} onChange={(e) => setDoctorForm({ ...doctorForm, last_name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Prénom *" value={doctorForm.first_name} onChange={(e) => setDoctorForm({ ...doctorForm, first_name: e.target.value })} required />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Spécialité" value={doctorForm.specialty} onChange={(e) => setDoctorForm({ ...doctorForm, specialty: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Téléphone" value={doctorForm.phone} onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email" type="email" value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Entreprise</InputLabel>
                <Select value={doctorForm.company} onChange={(e) => setDoctorForm({ ...doctorForm, company: e.target.value })} label="Entreprise">
                  <MenuItem value="">-</MenuItem>
                  {companies.map((c) => (<MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenDoctorDialog(false); setEditingDoctor(null) }}>Annuler</Button>
          {editingDoctor ? (
            <Button variant="contained" onClick={handleUpdateDoctor} disabled={!doctorForm.last_name.trim() || !doctorForm.first_name.trim()}>Enregistrer</Button>
          ) : (
            <Button variant="contained" onClick={handleCreateDoctor} disabled={!doctorForm.last_name.trim() || !doctorForm.first_name.trim()}>Créer</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Dialog : Confirmation suppression médecin */}
      <Dialog open={!!doctorToDelete} onClose={() => setDoctorToDelete(null)}>
        <DialogTitle>Supprimer le médecin</DialogTitle>
        <DialogContent>
          <Typography>Supprimer le médecin &quot;Dr. {doctorToDelete?.last_name} {doctorToDelete?.first_name}&quot; ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDoctorToDelete(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDeleteDoctor}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  )
}