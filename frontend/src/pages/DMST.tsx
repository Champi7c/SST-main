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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import { Edit as EditIcon, MedicalServices as MedicalServicesIcon, Print as PrintIcon, PictureAsPdf as PdfIcon } from '@mui/icons-material'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

interface DMST {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  agent_age?: number
  agent_direction?: string
  agent_function?: string
  agent_site_name?: string
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
  observation_date?: string
  observation_direction?: string
  observation_function?: string
  observation_site?: string
  medical_antecedents?: string
  surgical_antecedents?: string
  sport_activity?: boolean
  physical_activity?: boolean
  tobacco?: boolean
  alcohol_obs?: boolean
  coffee?: boolean
  tea?: boolean
  at_mp_nature?: string
  previous_companies?: string
  blood_pressure_systolic?: string
  blood_pressure_diastolic?: string
  temperature?: string
  heart_rate?: string
  dextro_jn?: string
  dextro_pp?: string
  weight?: string
  height?: string
  bmi?: string
  clinical_exam?: string
  medical_conclusion_apte?: boolean
  medical_conclusion_asr?: boolean
  medical_conclusion_aar?: boolean
  medical_conclusion_int?: boolean
  medical_conclusion_ind?: boolean
  education_mhd?: boolean
  education_mhv?: boolean
  education_fdr_cvx?: boolean
  education_ergo?: boolean
  education_spb_psy?: boolean
  education_therapy?: boolean
  education_other?: string
  observer_name?: string
  observation_form_data?: Record<string, unknown>
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
  avis?: string
  avis_display?: string
  doctor_name?: string
  nurse_name?: string
}

interface VisitType {
  id: number
  name: string
  code: string
  description?: string
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
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [openVisitDialog, setOpenVisitDialog] = useState(false)
  const [visitTypes, setVisitTypes] = useState<VisitType[]>([])
  const [visitForm, setVisitForm] = useState({
    visit_type: '',
    scheduled_date: '',
    scheduled_time: '',
    reason: '',
  })
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
    observation_date: '',
    observation_direction: '',
    observation_function: '',
    observation_site: '',
    medical_antecedents: '',
    surgical_antecedents: '',
    sport_activity: false,
    physical_activity: false,
    tobacco: false,
    alcohol_obs: false,
    coffee: false,
    tea: false,
    at_mp_nature: '',
    previous_companies: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    heart_rate: '',
    dextro_jn: '',
    dextro_pp: '',
    weight: '',
    height: '',
    bmi: '',
    clinical_exam: '',
    medical_conclusion_apte: false,
    medical_conclusion_asr: false,
    medical_conclusion_aar: false,
    medical_conclusion_int: false,
    medical_conclusion_ind: false,
    education_mhd: false,
    education_mhv: false,
    education_fdr_cvx: false,
    education_ergo: false,
    education_spb_psy: false,
    education_therapy: false,
    education_other: '',
    observer_name: '',
    observation_form_data: {} as Record<string, unknown>,
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
    }
  }, [dmst, tabValue])

  useEffect(() => {
    fetchVisitTypes()
  }, [])

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
          observation_date: dmstData.observation_date || '',
          observation_direction: dmstData.observation_direction || dmstData.agent_direction || '',
          observation_function: dmstData.observation_function || dmstData.agent_function || '',
          observation_site: dmstData.observation_site || dmstData.agent_site_name || '',
          medical_antecedents: dmstData.medical_antecedents || '',
          surgical_antecedents: dmstData.surgical_antecedents || '',
          sport_activity: dmstData.sport_activity || false,
          physical_activity: dmstData.physical_activity || false,
          tobacco: dmstData.tobacco || false,
          alcohol_obs: dmstData.alcohol_obs || false,
          coffee: dmstData.coffee || false,
          tea: dmstData.tea || false,
          at_mp_nature: dmstData.at_mp_nature || '',
          previous_companies: dmstData.previous_companies || '',
          blood_pressure_systolic: dmstData.blood_pressure_systolic || '',
          blood_pressure_diastolic: dmstData.blood_pressure_diastolic || '',
          temperature: dmstData.temperature || '',
          heart_rate: dmstData.heart_rate || '',
          dextro_jn: dmstData.dextro_jn || '',
          dextro_pp: dmstData.dextro_pp || '',
          weight: dmstData.weight ? String(dmstData.weight) : '',
          height: dmstData.height ? String(dmstData.height) : '',
          bmi: dmstData.bmi ? String(dmstData.bmi) : '',
          clinical_exam: dmstData.clinical_exam || '',
          medical_conclusion_apte: dmstData.medical_conclusion_apte || false,
          medical_conclusion_asr: dmstData.medical_conclusion_asr || false,
          medical_conclusion_aar: dmstData.medical_conclusion_aar || false,
          medical_conclusion_int: dmstData.medical_conclusion_int || false,
          medical_conclusion_ind: dmstData.medical_conclusion_ind || false,
          education_mhd: dmstData.education_mhd || false,
          education_mhv: dmstData.education_mhv || false,
          education_fdr_cvx: dmstData.education_fdr_cvx || false,
          education_ergo: dmstData.education_ergo || false,
          education_spb_psy: dmstData.education_spb_psy || false,
          education_therapy: dmstData.education_therapy || false,
          education_other: dmstData.education_other || '',
          observer_name: dmstData.observer_name || '',
          observation_form_data: dmstData.observation_form_data || {},
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

  const fetchVisitTypes = async () => {
    try {
      const response = await client.get('/visits/types/')
      setVisitTypes(response.data.results || response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des types de visites:', error)
    }
  }

  const handleOpenVisitDialog = () => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = now.toTimeString().slice(0, 5)
    setVisitForm({
      visit_type: '',
      scheduled_date: dateStr,
      scheduled_time: timeStr,
      reason: '',
    })
    setOpenVisitDialog(true)
  }

  const handleSubmitVisit = async () => {
    if (!dmst || !visitForm.visit_type || !visitForm.scheduled_date || !visitForm.scheduled_time) {
      setSnackbar({ open: true, message: 'Veuillez remplir tous les champs obligatoires', severity: 'error' })
      return
    }

    try {
      const scheduledDateTime = `${visitForm.scheduled_date}T${visitForm.scheduled_time}:00`
      await client.post('/visits/visits/', {
        agent: parseInt(agentId!),
        visit_type: parseInt(visitForm.visit_type),
        scheduled_date: scheduledDateTime,
        reason: visitForm.reason || null,
        status: 'scheduled',
      })
      setSnackbar({ open: true, message: 'Visite programmée avec succès', severity: 'success' })
      setOpenVisitDialog(false)
      fetchVisits()
    } catch (error: any) {
      console.error('Erreur lors de la programmation de la visite:', error)
      const errorMessage = getApiErrorMessage(error) || 'Erreur lors de la programmation de la visite'
      setSnackbar({ open: true, message: errorMessage, severity: 'error' })
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
      observation_date: formData.observation_date?.trim() || null,
      observation_direction: formData.observation_direction?.trim() || null,
      observation_function: formData.observation_function?.trim() || null,
      observation_site: formData.observation_site?.trim() || null,
      medical_antecedents: formData.medical_antecedents?.trim() || null,
      surgical_antecedents: formData.surgical_antecedents?.trim() || null,
      sport_activity: formData.sport_activity,
      physical_activity: formData.physical_activity,
      tobacco: formData.tobacco,
      alcohol_obs: formData.alcohol_obs,
      coffee: formData.coffee,
      tea: formData.tea,
      at_mp_nature: formData.at_mp_nature?.trim() || null,
      previous_companies: formData.previous_companies?.trim() || null,
      blood_pressure_systolic: formData.blood_pressure_systolic?.trim() || null,
      blood_pressure_diastolic: formData.blood_pressure_diastolic?.trim() || null,
      temperature: formData.temperature?.trim() || null,
      heart_rate: formData.heart_rate?.trim() || null,
      dextro_jn: formData.dextro_jn?.trim() || null,
      dextro_pp: formData.dextro_pp?.trim() || null,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      height: formData.height ? parseFloat(formData.height) : null,
      bmi: formData.bmi ? parseFloat(formData.bmi) : null,
      clinical_exam: formData.clinical_exam?.trim() || null,
      medical_conclusion_apte: formData.medical_conclusion_apte,
      medical_conclusion_asr: formData.medical_conclusion_asr,
      medical_conclusion_aar: formData.medical_conclusion_aar,
      medical_conclusion_int: formData.medical_conclusion_int,
      medical_conclusion_ind: formData.medical_conclusion_ind,
      education_mhd: formData.education_mhd,
      education_mhv: formData.education_mhv,
      education_fdr_cvx: formData.education_fdr_cvx,
      education_ergo: formData.education_ergo,
      education_spb_psy: formData.education_spb_psy,
      education_therapy: formData.education_therapy,
      education_other: formData.education_other?.trim() || null,
      observer_name: formData.observer_name?.trim() || null,
      observation_form_data: formData.observation_form_data && Object.keys(formData.observation_form_data).length > 0 ? formData.observation_form_data : null,
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportPDF = async () => {
    if (!dmst) {
      showSnackbar('Aucun DMST disponible', 'error')
      return
    }
    
    try {
      showSnackbar('Génération du PDF en cours...', 'success')
      
      // Rendre la section d'impression visible temporairement
      const printSection = document.getElementById('print-section')
      if (!printSection) {
        showSnackbar('Section d\'impression introuvable', 'error')
        console.error('print-section element not found')
        return
      }

      // Sauvegarder les styles originaux
      const originalDisplay = window.getComputedStyle(printSection).display
      const originalPosition = window.getComputedStyle(printSection).position
      const originalLeft = window.getComputedStyle(printSection).left
      const originalTop = window.getComputedStyle(printSection).top
      const originalWidth = window.getComputedStyle(printSection).width
      const originalZIndex = window.getComputedStyle(printSection).zIndex

      // Afficher temporairement la section avec les EXACTES mêmes dimensions que l'impression
      // Convertir 210mm en pixels (1mm = 3.779527559 pixels à 96 DPI)
      const mmToPx = 3.779527559
      const widthPx = 210 * mmToPx
      const paddingPx = 20 * mmToPx
      
      printSection.style.display = 'block'
      printSection.style.position = 'fixed'
      printSection.style.left = '0'
      printSection.style.top = '0'
      printSection.style.width = `${widthPx}px`
      printSection.style.minWidth = `${widthPx}px`
      printSection.style.maxWidth = `${widthPx}px`
      printSection.style.padding = `${paddingPx}px`
      printSection.style.margin = '0'
      printSection.style.zIndex = '9999'
      printSection.style.backgroundColor = '#ffffff'
      printSection.style.boxSizing = 'border-box'

      // Attendre un peu pour que le rendu se fasse
      await new Promise(resolve => setTimeout(resolve, 100))

      // Attendre que les images se chargent
      const images = printSection.querySelectorAll('img')
      if (images.length > 0) {
        const imagePromises = Array.from(images).map((img: HTMLImageElement) => {
          if (img.complete && img.naturalHeight !== 0) {
            return Promise.resolve()
          }
          return new Promise((resolve) => {
            img.onload = () => resolve(null)
            img.onerror = () => resolve(null)
            setTimeout(() => resolve(null), 3000) // Timeout après 3 secondes
          })
        })
        await Promise.all(imagePromises)
      }
      
      await new Promise(resolve => setTimeout(resolve, 500))

      console.log('Capture de la section d\'impression...')
      
      // Attendre un peu plus pour que tout soit rendu
      await new Promise(resolve => setTimeout(resolve, 200))

      // Capturer la section avec html2canvas - EXACTEMENT comme l'impression
      const canvas = await html2canvas(printSection, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: printSection.offsetWidth,
        height: printSection.scrollHeight,
        allowTaint: false,
        removeContainer: false,
        imageTimeout: 15000,
        letterRendering: true,
        onclone: (clonedDoc) => {
          // S'assurer que tous les styles sont appliqués dans le clone EXACTEMENT comme l'impression
          const clonedSection = clonedDoc.getElementById('print-section')
          if (clonedSection) {
            clonedSection.style.display = 'block'
            clonedSection.style.visibility = 'visible'
            clonedSection.style.opacity = '1'
            clonedSection.style.width = `${widthPx}px`
            clonedSection.style.minWidth = `${widthPx}px`
            clonedSection.style.maxWidth = `${widthPx}px`
            clonedSection.style.padding = `${paddingPx}px`
            clonedSection.style.margin = '0'
            clonedSection.style.backgroundColor = '#ffffff'
            clonedSection.style.boxSizing = 'border-box'
            
            // S'assurer que toutes les images sont visibles
            const clonedImages = clonedSection.querySelectorAll('img')
            clonedImages.forEach((img: HTMLImageElement) => {
              img.style.display = 'block'
              img.style.visibility = 'visible'
              img.style.opacity = '1'
            })
          }
        },
      })

      console.log('Canvas créé:', canvas.width, 'x', canvas.height)

      // Restaurer les styles originaux
      printSection.style.display = originalDisplay
      printSection.style.position = originalPosition
      printSection.style.left = originalLeft
      printSection.style.top = originalTop
      printSection.style.width = originalWidth
      printSection.style.zIndex = originalZIndex

      // Créer le PDF avec les EXACTES mêmes dimensions que l'impression
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ 
        orientation: 'portrait', 
        unit: 'mm', 
        format: 'a4',
        compress: false
      })
      const pdfWidth = pdf.internal.pageSize.getWidth() // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight() // 297mm
      
      // Le canvas a été créé avec scale 2, donc on doit diviser par 2 pour obtenir les dimensions réelles
      // La largeur du canvas correspond à 210mm (largeur A4)
      // Calculer le ratio de conversion pixel -> mm
      // widthPx = 210mm * mmToPx = largeur réelle en pixels
      const actualWidthPx = widthPx * 2 // scale 2
      const actualHeightPx = canvas.height
      
      // Ratio pour convertir pixels du canvas (avec scale 2) vers mm
      const pxToMm = pdfWidth / actualWidthPx
      
      // Dimensions de l'image en mm
      const imgWidthMm = actualWidthPx * pxToMm
      const imgHeightMm = actualHeightPx * pxToMm

      console.log('Dimensions PDF:', pdfWidth, 'x', pdfHeight, 'mm')
      console.log('Dimensions canvas (scale 2):', canvas.width, 'x', canvas.height, 'px')
      console.log('Dimensions réelles calculées:', imgWidthMm, 'x', imgHeightMm, 'mm')
      console.log('Ratio px->mm:', pxToMm)

      // Si le contenu dépasse une page, ajouter des pages supplémentaires
      let yPosition = 0
      const pageHeight = pdfHeight
      
      if (imgHeightMm <= pageHeight) {
        // Tout tient sur une page - utiliser les dimensions exactes
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidthMm, imgHeightMm, undefined, 'FAST')
      } else {
        // Plusieurs pages nécessaires
        let remainingHeight = imgHeightMm
        let sourceY = 0
        
        while (remainingHeight > 0) {
          if (yPosition > 0) {
            pdf.addPage()
            yPosition = 0
          }
          
          const pageContentHeight = Math.min(pageHeight, remainingHeight)
          const sourceHeightPx = (pageContentHeight / imgHeightMm) * actualHeightPx
          
          // Créer un canvas temporaire pour cette page
          const pageCanvas = document.createElement('canvas')
          pageCanvas.width = canvas.width
          pageCanvas.height = Math.ceil(sourceHeightPx)
          const ctx = pageCanvas.getContext('2d')
          
          if (ctx) {
            ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeightPx, 0, 0, canvas.width, sourceHeightPx)
            const pageImgData = pageCanvas.toDataURL('image/png', 1.0)
            pdf.addImage(pageImgData, 'PNG', 0, yPosition, imgWidthMm, pageContentHeight, undefined, 'FAST')
          }
          
          sourceY += sourceHeightPx
          remainingHeight -= pageContentHeight
          yPosition += pageContentHeight
        }
      }

      // Sauvegarder le PDF
      const fileName = `fiche_observation_${dmst.agent_matricule}_${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)
      console.log('PDF sauvegardé:', fileName)
      showSnackbar('PDF exporté avec succès', 'success')
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error)
      showSnackbar(`Erreur lors de l'export PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, 'error')
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
  // Pour la fiche d'observation, permettre l'édition si l'utilisateur a l'accès médical
  const canEditObservation = hasMedicalAccess

  // Helper pour la fiche d'observation complète (observation_form_data)
  const obs = (formData.observation_form_data || {}) as Record<string, unknown>
  const setObs = (key: string, value: unknown) =>
    setFormData((prev) => ({
      ...prev,
      observation_form_data: { ...(prev.observation_form_data || {}), [key]: value },
    }))
  const getObs = (key: string) => (obs[key] ?? '') as string
  const getObsBool = (key: string) => !!obs[key]
  const getObsNum = (key: string) => (obs[key] !== undefined && obs[key] !== '' ? String(obs[key]) : '')

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
        {(canEdit || canEditObservation) && (
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
              <>
                <Button variant="contained" startIcon={<EditIcon />} onClick={() => setEditMode(true)} sx={{ mr: 1 }}>
                  {tabValue === 0 ? 'Remplir la fiche' : 'Modifier'}
                </Button>
                <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint} sx={{ mr: 1 }}>
                  Imprimer
                </Button>
                <Button variant="outlined" startIcon={<PdfIcon />} onClick={handleExportPDF} color="error">
                  Exporter PDF
                </Button>
              </>
            )}
          </Box>
        )}
      </Box>

      <Paper>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Fiche d'observation" icon={<MedicalServicesIcon />} iconPosition="start" />
          <Tab label={`Visites (${dmst.visits_count})`} icon={<MedicalServicesIcon />} iconPosition="start" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                FICHE D'OBSERVATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL
              </Typography>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} sx={{ mt: 1, mb: 2 }}>
                <Typography variant="body2">Fait à Dakar, le</Typography>
                <TextField size="small" type="date" value={formData.observation_date || ''} onChange={(e) => setFormData({ ...formData, observation_date: e.target.value })} disabled={!editMode} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                <Typography variant="body2" sx={{ ml: 2 }}>Type de visite :</Typography>
                <FormControlLabel control={<Checkbox checked={getObsBool('visit_type_embauche')} onChange={(e) => setObs('visit_type_embauche', e.target.checked)} disabled={!editMode} />} label="Embauche" />
                <FormControlLabel control={<Checkbox checked={getObsBool('visit_type_periodique')} onChange={(e) => setObs('visit_type_periodique', e.target.checked)} disabled={!editMode} />} label="Périodique" />
                <FormControlLabel control={<Checkbox checked={getObsBool('visit_type_reprise')} onChange={(e) => setObs('visit_type_reprise', e.target.checked)} disabled={!editMode} />} label="Reprise" />
                <TextField size="small" label="Médecin du travail" value={formData.observer_name} onChange={(e) => setFormData({ ...formData, observer_name: e.target.value })} disabled={!editMode} sx={{ minWidth: 220, ml: 2 }} />
              </Box>
              <Divider sx={{ mb: 3 }} />
            </Grid>

            {/* I. IDENTIFICATION DE L'AGENT */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>I. IDENTIFICATION DE L'AGENT</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Nom et prénoms" value={dmst.agent_name} disabled InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label="Âge (ans)" value={dmst.agent_age ?? ''} disabled InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Box display="flex" alignItems="center" gap={1} pt={1}>
                <Typography variant="body2">Sexe :</Typography>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('sex_m')} onChange={(e) => { setObs('sex_m', e.target.checked); if (e.target.checked) setObs('sex_f', false) }} disabled={!editMode} />} label="M" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('sex_f')} onChange={(e) => { setObs('sex_f', e.target.checked); if (e.target.checked) setObs('sex_m', false) }} disabled={!editMode} />} label="F" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth label="Matricule" value={dmst.agent_matricule} disabled InputProps={{ readOnly: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Téléphone" value={getObs('telephone')} onChange={(e) => setObs('telephone', e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Direction" value={formData.observation_direction || dmst.agent_direction || ''} onChange={(e) => setFormData({ ...formData, observation_direction: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Site" value={formData.observation_site || dmst.agent_site_name || ''} onChange={(e) => setFormData({ ...formData, observation_site: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Fonction / Poste" value={formData.observation_function || dmst.agent_function || ''} onChange={(e) => setFormData({ ...formData, observation_function: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Ancienneté au poste (ans)" value={getObs('seniority_years')} onChange={(e) => setObs('seniority_years', e.target.value)} disabled={!editMode} />
            </Grid>

            {/* II. ANTÉCÉDENTS ET TERRAINS PARTICULIERS */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>II. ANTÉCÉDENTS ET TERRAINS PARTICULIERS</Typography></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Antécédents médicaux" multiline rows={2} value={formData.medical_antecedents} onChange={(e) => setFormData({ ...formData, medical_antecedents: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Antécédents chirurgicaux" multiline rows={2} value={formData.surgical_antecedents} onChange={(e) => setFormData({ ...formData, surgical_antecedents: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Habitudes de vie :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
                <FormControlLabel control={<Checkbox checked={formData.sport_activity} onChange={(e) => setFormData({ ...formData, sport_activity: e.target.checked })} disabled={!editMode} />} label="Activité sportive" />
                <FormControlLabel control={<Checkbox checked={formData.physical_activity} onChange={(e) => setFormData({ ...formData, physical_activity: e.target.checked })} disabled={!editMode} />} label="Activité physique régulière" />
                <FormControlLabel control={<Checkbox checked={formData.tobacco} onChange={(e) => setFormData({ ...formData, tobacco: e.target.checked })} disabled={!editMode} />} label="Tabac" />
                <TextField size="small" placeholder="/j" value={getObs('tobacco_per_day')} onChange={(e) => setObs('tobacco_per_day', e.target.value)} disabled={!editMode} sx={{ width: 60 }} />
                <FormControlLabel control={<Checkbox checked={formData.alcohol_obs} onChange={(e) => setFormData({ ...formData, alcohol_obs: e.target.checked })} disabled={!editMode} />} label="Alcool" />
                <FormControlLabel control={<Checkbox checked={formData.coffee} onChange={(e) => setFormData({ ...formData, coffee: e.target.checked })} disabled={!editMode} />} label="Café" />
                <FormControlLabel control={<Checkbox checked={formData.tea} onChange={(e) => setFormData({ ...formData, tea: e.target.checked })} disabled={!editMode} />} label="Thé" />
                <TextField size="small" label="Autres" value={getObs('habits_other')} onChange={(e) => setObs('habits_other', e.target.value)} disabled={!editMode} sx={{ minWidth: 180 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Accidents du travail / Maladies professionnelles (12 derniers mois) :</Typography>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('at_mp_no')} onChange={(e) => { setObs('at_mp_no', e.target.checked); if (e.target.checked) setObs('at_mp_yes', false) }} disabled={!editMode} />} label="Non" />
                <FormControlLabel control={<Checkbox checked={getObsBool('at_mp_yes')} onChange={(e) => { setObs('at_mp_yes', e.target.checked); if (e.target.checked) setObs('at_mp_no', false) }} disabled={!editMode} />} label="Oui → Nature :" />
                <TextField fullWidth size="small" value={formData.at_mp_nature} onChange={(e) => setFormData({ ...formData, at_mp_nature: e.target.value })} disabled={!editMode} sx={{ maxWidth: 400 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Entreprises / Postes antérieurs (expositions particulières)" multiline rows={3} value={formData.previous_companies} onChange={(e) => setFormData({ ...formData, previous_companies: e.target.value })} disabled={!editMode} />
            </Grid>

            {/* III. EXPOSITIONS PROFESSIONNELLES */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>III. EXPOSITIONS PROFESSIONNELLES</Typography></Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Risques physiques :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_bruit')} onChange={(e) => setObs('exp_phys_bruit', e.target.checked)} disabled={!editMode} />} label="Bruit (> 85 dB)" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_vibrations')} onChange={(e) => setObs('exp_phys_vibrations', e.target.checked)} disabled={!editMode} />} label="Vibrations" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_chaleur_froid')} onChange={(e) => setObs('exp_phys_chaleur_froid', e.target.checked)} disabled={!editMode} />} label="Chaleur / Froid" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_rayonnements')} onChange={(e) => setObs('exp_phys_rayonnements', e.target.checked)} disabled={!editMode} />} label="Rayonnements" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_phys_ecran')} onChange={(e) => setObs('exp_phys_ecran', e.target.checked)} disabled={!editMode} />} label="Écran > 4h/j" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Risques chimiques et biologiques :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_poussieres')} onChange={(e) => setObs('exp_chim_poussieres', e.target.checked)} disabled={!editMode} />} label="Poussières" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_solvants')} onChange={(e) => setObs('exp_chim_solvants', e.target.checked)} disabled={!editMode} />} label="Solvants" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_cmr')} onChange={(e) => setObs('exp_chim_cmr', e.target.checked)} disabled={!editMode} />} label="CMR" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_biologiques')} onChange={(e) => setObs('exp_chim_biologiques', e.target.checked)} disabled={!editMode} />} label="Agents biologiques" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_chim_gaz')} onChange={(e) => setObs('exp_chim_gaz', e.target.checked)} disabled={!editMode} />} label="Gaz / Fumées" />
              </Box>
              <TextField fullWidth size="small" label="Préciser" value={getObs('exp_chim_preciser')} onChange={(e) => setObs('exp_chim_preciser', e.target.value)} disabled={!editMode} sx={{ mt: 1 }} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Contraintes biomécaniques :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_bio_port_charges')} onChange={(e) => setObs('exp_bio_port_charges', e.target.checked)} disabled={!editMode} />} label="Port charges > 15 kg" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_bio_gestes_repetitifs')} onChange={(e) => setObs('exp_bio_gestes_repetitifs', e.target.checked)} disabled={!editMode} />} label="Gestes répétitifs" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_bio_postures')} onChange={(e) => setObs('exp_bio_postures', e.target.checked)} disabled={!editMode} />} label="Postures contraignantes" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_bio_station_debout')} onChange={(e) => setObs('exp_bio_station_debout', e.target.checked)} disabled={!editMode} />} label="Station debout prolongée" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Risques psychosociaux :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_stress')} onChange={(e) => setObs('exp_psy_stress', e.target.checked)} disabled={!editMode} />} label="Stress élevé" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_charge_mentale')} onChange={(e) => setObs('exp_psy_charge_mentale', e.target.checked)} disabled={!editMode} />} label="Charge mentale" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_isole')} onChange={(e) => setObs('exp_psy_isole', e.target.checked)} disabled={!editMode} />} label="Travail isolé" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_relations')} onChange={(e) => setObs('exp_psy_relations', e.target.checked)} disabled={!editMode} />} label="Relations difficiles" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_psy_harcelement')} onChange={(e) => setObs('exp_psy_harcelement', e.target.checked)} disabled={!editMode} />} label="Harcèlement" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Organisation du travail :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_org_nuit')} onChange={(e) => setObs('exp_org_nuit', e.target.checked)} disabled={!editMode} />} label="Travail de nuit" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_org_poste')} onChange={(e) => setObs('exp_org_poste', e.target.checked)} disabled={!editMode} />} label="Travail posté (3×8)" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_org_irreguliers')} onChange={(e) => setObs('exp_org_irreguliers', e.target.checked)} disabled={!editMode} />} label="Horaires irréguliers" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exp_org_astreintes')} onChange={(e) => setObs('exp_org_astreintes', e.target.checked)} disabled={!editMode} />} label="Astreintes" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Équipements de protection (EPI) :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_gants')} onChange={(e) => setObs('epi_gants', e.target.checked)} disabled={!editMode} />} label="Gants" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_masque')} onChange={(e) => setObs('epi_masque', e.target.checked)} disabled={!editMode} />} label="Masque" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_lunettes')} onChange={(e) => setObs('epi_lunettes', e.target.checked)} disabled={!editMode} />} label="Lunettes" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_casque')} onChange={(e) => setObs('epi_casque', e.target.checked)} disabled={!editMode} />} label="Casque" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_auditif')} onChange={(e) => setObs('epi_auditif', e.target.checked)} disabled={!editMode} />} label="Protections auditives" />
                <FormControlLabel control={<Checkbox checked={getObsBool('epi_chaussures')} onChange={(e) => setObs('epi_chaussures', e.target.checked)} disabled={!editMode} />} label="Chaussures sécurité" />
              </Box>
            </Grid>

            {/* IV. PLAINTES FONCTIONNELLES ACTUELLES */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>IV. PLAINTES FONCTIONNELLES ACTUELLES</Typography></Grid>
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={1}>
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_aucune')} onChange={(e) => setObs('plaintes_aucune', e.target.checked)} disabled={!editMode} />} label="Aucune plainte" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_symptomes')} onChange={(e) => setObs('plaintes_symptomes', e.target.checked)} disabled={!editMode} />} label="Présence de symptômes" />
              </Box>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_douleurs_ms')} onChange={(e) => setObs('plaintes_douleurs_ms', e.target.checked)} disabled={!editMode} />} label="Douleurs musculo-squelettiques" />
                <TextField size="small" label="Localisation" value={getObs('plaintes_douleurs_localisation')} onChange={(e) => setObs('plaintes_douleurs_localisation', e.target.value)} disabled={!editMode} sx={{ width: 200 }} />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_respiratoires')} onChange={(e) => setObs('plaintes_respiratoires', e.target.checked)} disabled={!editMode} />} label="Troubles respiratoires" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_cutanes')} onChange={(e) => setObs('plaintes_cutanes', e.target.checked)} disabled={!editMode} />} label="Troubles cutanés" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_orl')} onChange={(e) => setObs('plaintes_orl', e.target.checked)} disabled={!editMode} />} label="Troubles ORL / Oculaires" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_cephalees')} onChange={(e) => setObs('plaintes_cephalees', e.target.checked)} disabled={!editMode} />} label="Céphalées" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_vertiges')} onChange={(e) => setObs('plaintes_vertiges', e.target.checked)} disabled={!editMode} />} label="Vertiges" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_fatigue')} onChange={(e) => setObs('plaintes_fatigue', e.target.checked)} disabled={!editMode} />} label="Fatigue chronique" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_stress')} onChange={(e) => setObs('plaintes_stress', e.target.checked)} disabled={!editMode} />} label="Stress / Anxiété / Troubles du sommeil" />
                <FormControlLabel control={<Checkbox checked={getObsBool('plaintes_digestifs')} onChange={(e) => setObs('plaintes_digestifs', e.target.checked)} disabled={!editMode} />} label="Troubles digestifs" />
              </Box>
              <TextField fullWidth label="Détails / Précisions" multiline rows={2} value={getObs('plaintes_details')} onChange={(e) => setObs('plaintes_details', e.target.value)} disabled={!editMode} sx={{ mt: 1 }} />
            </Grid>

            {/* V. ÉTAT GÉNÉRAL ET CONSTANTES */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>V. ÉTAT GÉNÉRAL ET CONSTANTES</Typography></Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="TA (mmHg)" placeholder="___/___" value={[formData.blood_pressure_systolic, formData.blood_pressure_diastolic].map((x) => x ?? '').join('/').replace(/^\/$/, '')} onChange={(e) => { const v = e.target.value; const [s, d] = v.split('/'); setFormData(prev => ({ ...prev, blood_pressure_systolic: (s || '').trim(), blood_pressure_diastolic: (d || '').trim() })) }} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="T° (°C)" value={formData.temperature} onChange={(e) => setFormData({ ...formData, temperature: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="FC (/min)" value={formData.heart_rate} onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="Poids (kg)" value={formData.weight} onChange={(e) => { const weight = e.target.value; setFormData(prev => { const next = { ...prev, weight }; if (weight && prev.height) { const h = parseFloat(prev.height) / 100; const w = parseFloat(weight); if (h > 0 && w > 0) next.bmi = (w / (h * h)).toFixed(2); } return next }) }} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="Taille (cm)" value={formData.height} onChange={(e) => { const height = e.target.value; setFormData(prev => { const next = { ...prev, height }; if (height && prev.weight) { const h = parseFloat(height) / 100; const w = parseFloat(prev.weight); if (h > 0 && w > 0) next.bmi = (w / (h * h)).toFixed(2); } return next }) }} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="IMC (kg/m²)" value={formData.bmi} onChange={(e) => setFormData({ ...formData, bmi: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="Tour de taille (cm)" value={getObs('tour_taille')} onChange={(e) => setObs('tour_taille', e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="Périmètre ombilical (cm)" value={getObs('perimetre_ombilical')} onChange={(e) => setObs('perimetre_ombilical', e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="SpO₂ (%)" value={getObs('spo2')} onChange={(e) => setObs('spo2', e.target.value)} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="Dextro (jn) g/L" value={formData.dextro_jn} onChange={(e) => setFormData({ ...formData, dextro_jn: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField fullWidth size="small" label="Dextro (pp) g/L" value={formData.dextro_pp} onChange={(e) => setFormData({ ...formData, dextro_pp: e.target.value })} disabled={!editMode} />
            </Grid>

            {/* TEST D'ACUITÉ VISUELLE */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>TEST D'ACUITÉ VISUELLE</Typography></Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 700 }}>
                <Table size="small">
                  <TableHead><TableRow><TableCell></TableCell><TableCell>Acuité OD</TableCell><TableCell>Acuité OG</TableCell><TableCell>Acuité binoculaire</TableCell></TableRow></TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>De loin :</TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_od_loin')} onChange={(e) => setObs('av_od_loin', e.target.value)} disabled={!editMode} /></TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_og_loin')} onChange={(e) => setObs('av_og_loin', e.target.value)} disabled={!editMode} /></TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_bin_loin')} onChange={(e) => setObs('av_bin_loin', e.target.value)} disabled={!editMode} /></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>De près :</TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_od_pres')} onChange={(e) => setObs('av_od_pres', e.target.value)} disabled={!editMode} /></TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_og_pres')} onChange={(e) => setObs('av_og_pres', e.target.value)} disabled={!editMode} /></TableCell>
                      <TableCell><TextField size="small" fullWidth placeholder="/10" value={getObsNum('av_bin_pres')} onChange={(e) => setObs('av_bin_pres', e.target.value)} disabled={!editMode} /></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} sx={{ mt: 2 }}>
                <Typography variant="body2">Vision des couleurs :</Typography>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('vision_couleurs_normale')} onChange={(e) => setObs('vision_couleurs_normale', e.target.checked)} disabled={!editMode} />} label="Normale" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('vision_couleurs_daltonisme')} onChange={(e) => setObs('vision_couleurs_daltonisme', e.target.checked)} disabled={!editMode} />} label="Daltonisme" />
                <TextField size="small" placeholder="type" value={getObs('daltonisme_type')} onChange={(e) => setObs('daltonisme_type', e.target.value)} disabled={!editMode} sx={{ width: 120 }} />
                <Typography variant="body2" sx={{ ml: 2 }}>Port de lunettes / lentilles :</Typography>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('lunettes_non')} onChange={(e) => { setObs('lunettes_non', e.target.checked); if (e.target.checked) setObs('lunettes_oui', false) }} disabled={!editMode} />} label="Non" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('lunettes_oui')} onChange={(e) => { setObs('lunettes_oui', e.target.checked); if (e.target.checked) setObs('lunettes_non', false) }} disabled={!editMode} />} label="Oui" />
                <TextField size="small" label="Correction" value={getObs('lunettes_correction')} onChange={(e) => setObs('lunettes_correction', e.target.value)} disabled={!editMode} sx={{ width: 180 }} />
              </Box>
            </Grid>

            {/* VI. EXAMEN CLINIQUE */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>VI. EXAMEN CLINIQUE</Typography></Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>État général :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                <FormControlLabel control={<Checkbox checked={getObsBool('exam_etat_bon')} onChange={(e) => setObs('exam_etat_bon', e.target.checked)} disabled={!editMode} />} label="Bon" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exam_etat_moyen')} onChange={(e) => setObs('exam_etat_moyen', e.target.checked)} disabled={!editMode} />} label="Moyen" />
                <FormControlLabel control={<Checkbox checked={getObsBool('exam_etat_altere')} onChange={(e) => setObs('exam_etat_altere', e.target.checked)} disabled={!editMode} />} label="Altéré" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Appareil cardiovasculaire :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_normal')} onChange={(e) => setObs('exam_cardio_normal', e.target.checked)} disabled={!editMode} />} label="Normal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_souffle')} onChange={(e) => setObs('exam_cardio_souffle', e.target.checked)} disabled={!editMode} />} label="Souffle cardiaque" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_arythmie')} onChange={(e) => setObs('exam_cardio_arythmie', e.target.checked)} disabled={!editMode} />} label="Arythmie" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_oedemes')} onChange={(e) => setObs('exam_cardio_oedemes', e.target.checked)} disabled={!editMode} />} label="Œdèmes MI" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_cardio_varices')} onChange={(e) => setObs('exam_cardio_varices', e.target.checked)} disabled={!editMode} />} label="Varices" />
                <TextField size="small" label="Précisions" value={getObs('exam_cardio_precision')} onChange={(e) => setObs('exam_cardio_precision', e.target.value)} disabled={!editMode} sx={{ minWidth: 200 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Appareil respiratoire :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_normal')} onChange={(e) => setObs('exam_respi_normal', e.target.checked)} disabled={!editMode} />} label="Normal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_sibilants')} onChange={(e) => setObs('exam_respi_sibilants', e.target.checked)} disabled={!editMode} />} label="Sibilants / Wheezing" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_crepitants')} onChange={(e) => setObs('exam_respi_crepitants', e.target.checked)} disabled={!editMode} />} label="Crépitants" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_dyspnee')} onChange={(e) => setObs('exam_respi_dyspnee', e.target.checked)} disabled={!editMode} />} label="Dyspnée" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_respi_cyanose')} onChange={(e) => setObs('exam_respi_cyanose', e.target.checked)} disabled={!editMode} />} label="Cyanose" />
                <TextField size="small" label="Précisions" value={getObs('exam_respi_precision')} onChange={(e) => setObs('exam_respi_precision', e.target.value)} disabled={!editMode} sx={{ minWidth: 200 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Appareil locomoteur (TMS) :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_normal')} onChange={(e) => setObs('exam_loco_normal', e.target.checked)} disabled={!editMode} />} label="Mobilité normale, pas de douleur" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_cervical')} onChange={(e) => setObs('exam_loco_cervical', e.target.checked)} disabled={!editMode} />} label="Rachis cervical" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_dorsal')} onChange={(e) => setObs('exam_loco_dorsal', e.target.checked)} disabled={!editMode} />} label="Rachis dorsal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_lombaire')} onChange={(e) => setObs('exam_loco_lombaire', e.target.checked)} disabled={!editMode} />} label="Rachis lombaire" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_epaule')} onChange={(e) => setObs('exam_loco_epaule', e.target.checked)} disabled={!editMode} />} label="Épaule" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_coude')} onChange={(e) => setObs('exam_loco_coude', e.target.checked)} disabled={!editMode} />} label="Coude" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_poignet')} onChange={(e) => setObs('exam_loco_poignet', e.target.checked)} disabled={!editMode} />} label="Poignet/Main" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_hanche')} onChange={(e) => setObs('exam_loco_hanche', e.target.checked)} disabled={!editMode} />} label="Hanche" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_genou')} onChange={(e) => setObs('exam_loco_genou', e.target.checked)} disabled={!editMode} />} label="Genou" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_cheville')} onChange={(e) => setObs('exam_loco_cheville', e.target.checked)} disabled={!editMode} />} label="Cheville/Pied" />
              </Box>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Typography variant="body2">Tests TMS :</Typography>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_phalen')} onChange={(e) => setObs('exam_loco_phalen', e.target.checked)} disabled={!editMode} />} label="Phalen" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_tinel')} onChange={(e) => setObs('exam_loco_tinel', e.target.checked)} disabled={!editMode} />} label="Tinel" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_loco_lasegue')} onChange={(e) => setObs('exam_loco_lasegue', e.target.checked)} disabled={!editMode} />} label="Lasègue" />
                <TextField size="small" label="Autres" value={getObs('exam_loco_autres')} onChange={(e) => setObs('exam_loco_autres', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Peau et phanères :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_normal')} onChange={(e) => setObs('exam_peau_normal', e.target.checked)} disabled={!editMode} />} label="Normale" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_eczema')} onChange={(e) => setObs('exam_peau_eczema', e.target.checked)} disabled={!editMode} />} label="Eczéma / Dermatite" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_lesions')} onChange={(e) => setObs('exam_peau_lesions', e.target.checked)} disabled={!editMode} />} label="Lésions" />
                <TextField size="small" placeholder="préciser" value={getObs('exam_peau_lesions_preciser')} onChange={(e) => setObs('exam_peau_lesions_preciser', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_prurit')} onChange={(e) => setObs('exam_peau_prurit', e.target.checked)} disabled={!editMode} />} label="Prurit / Sécheresse" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_paleur')} onChange={(e) => setObs('exam_peau_paleur', e.target.checked)} disabled={!editMode} />} label="Pâleur" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_peau_ictere')} onChange={(e) => setObs('exam_peau_ictere', e.target.checked)} disabled={!editMode} />} label="Ictère" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Appareil ORL / Yeux :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_normal')} onChange={(e) => setObs('exam_orl_normal', e.target.checked)} disabled={!editMode} />} label="Normal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_irritation')} onChange={(e) => setObs('exam_orl_irritation', e.target.checked)} disabled={!editMode} />} label="Irritation oculaire" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_conjonctivite')} onChange={(e) => setObs('exam_orl_conjonctivite', e.target.checked)} disabled={!editMode} />} label="Conjonctivite" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_rhinite')} onChange={(e) => setObs('exam_orl_rhinite', e.target.checked)} disabled={!editMode} />} label="Rhinite" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_otite')} onChange={(e) => setObs('exam_orl_otite', e.target.checked)} disabled={!editMode} />} label="Otite / Bouchon cérumen" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_orl_pharyngite')} onChange={(e) => setObs('exam_orl_pharyngite', e.target.checked)} disabled={!editMode} />} label="Pharyngite" />
                <TextField size="small" label="Autres" value={getObs('exam_orl_autres')} onChange={(e) => setObs('exam_orl_autres', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Abdomen :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_souple')} onChange={(e) => setObs('exam_abdomen_souple', e.target.checked)} disabled={!editMode} />} label="Souple, indolore" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_douleur')} onChange={(e) => setObs('exam_abdomen_douleur', e.target.checked)} disabled={!editMode} />} label="Douleur abdominale" />
                <TextField size="small" label="Localisation" value={getObs('exam_abdomen_localisation')} onChange={(e) => setObs('exam_abdomen_localisation', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_hepatomegalie')} onChange={(e) => setObs('exam_abdomen_hepatomegalie', e.target.checked)} disabled={!editMode} />} label="Hépatomégalie" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_masse')} onChange={(e) => setObs('exam_abdomen_masse', e.target.checked)} disabled={!editMode} />} label="Masse palpable" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_abdomen_cicatrices')} onChange={(e) => setObs('exam_abdomen_cicatrices', e.target.checked)} disabled={!editMode} />} label="Cicatrices chirurgicales" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Système neurologique :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_normal')} onChange={(e) => setObs('exam_neuro_normal', e.target.checked)} disabled={!editMode} />} label="Normal" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_paresthesies')} onChange={(e) => setObs('exam_neuro_paresthesies', e.target.checked)} disabled={!editMode} />} label="Paresthésies" />
                <TextField size="small" label="Localisation" value={getObs('exam_neuro_paresthesies_loc')} onChange={(e) => setObs('exam_neuro_paresthesies_loc', e.target.value)} disabled={!editMode} sx={{ width: 150 }} />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_faiblesse')} onChange={(e) => setObs('exam_neuro_faiblesse', e.target.checked)} disabled={!editMode} />} label="Faiblesse musculaire" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_tremblements')} onChange={(e) => setObs('exam_neuro_tremblements', e.target.checked)} disabled={!editMode} />} label="Tremblements" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_neuro_equilibre')} onChange={(e) => setObs('exam_neuro_equilibre', e.target.checked)} disabled={!editMode} />} label="Troubles équilibre / coordination" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>État psychologique :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_normal')} onChange={(e) => setObs('exam_psy_normal', e.target.checked)} disabled={!editMode} />} label="Normal, contact adapté" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_anxiete')} onChange={(e) => setObs('exam_psy_anxiete', e.target.checked)} disabled={!editMode} />} label="Anxiété manifeste" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_depressif')} onChange={(e) => setObs('exam_psy_depressif', e.target.checked)} disabled={!editMode} />} label="Signes dépressifs" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_stress')} onChange={(e) => setObs('exam_psy_stress', e.target.checked)} disabled={!editMode} />} label="Stress élevé" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_fatigue')} onChange={(e) => setObs('exam_psy_fatigue', e.target.checked)} disabled={!editMode} />} label="Fatigue / Épuisement" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('exam_psy_burnout')} onChange={(e) => setObs('exam_psy_burnout', e.target.checked)} disabled={!editMode} />} label="Signes de burn-out" />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Synthèse / Observations complémentaires" multiline rows={3} value={formData.clinical_exam} onChange={(e) => setFormData({ ...formData, clinical_exam: e.target.value })} disabled={!editMode} />
            </Grid>

            {/* VII. EXAMENS COMPLÉMENTAIRES */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>VII. EXAMENS COMPLÉMENTAIRES</Typography></Grid>
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_audiometrie')} onChange={(e) => setObs('comp_audiometrie', e.target.checked)} disabled={!editMode} />} label="Audiométrie tonale" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_spiro')} onChange={(e) => setObs('comp_spiro', e.target.checked)} disabled={!editMode} />} label="Spirométrie / EFR" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_ecg')} onChange={(e) => setObs('comp_ecg', e.target.checked)} disabled={!editMode} />} label="ECG" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_radio_thorax')} onChange={(e) => setObs('comp_radio_thorax', e.target.checked)} disabled={!editMode} />} label="Radiographie thoracique" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_acuite')} onChange={(e) => setObs('comp_acuite', e.target.checked)} disabled={!editMode} />} label="Acuité visuelle" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_vision_couleurs')} onChange={(e) => setObs('comp_vision_couleurs', e.target.checked)} disabled={!editMode} />} label="Vision des couleurs" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_bilan_sang')} onChange={(e) => setObs('comp_bilan_sang', e.target.checked)} disabled={!editMode} />} label="Bilan biologique sanguin" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('comp_bilan_hepatique')} onChange={(e) => setObs('comp_bilan_hepatique', e.target.checked)} disabled={!editMode} />} label="Bilan hépatique" />
                <TextField size="small" label="Autres" value={getObs('comp_autres')} onChange={(e) => setObs('comp_autres', e.target.value)} disabled={!editMode} sx={{ minWidth: 200 }} />
              </Box>
              <TextField fullWidth label="Résultats et interprétation" multiline rows={3} value={getObs('comp_resultats')} onChange={(e) => setObs('comp_resultats', e.target.value)} disabled={!editMode} />
            </Grid>

            {/* VIII. CONCLUSION MÉDICALE */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>VIII. CONCLUSION MÉDICALE — AVIS D'APTITUDE</Typography></Grid>
            <Grid item xs={12}>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={2}>
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_apte} onChange={(e) => setFormData({ ...formData, medical_conclusion_apte: e.target.checked })} disabled={!editMode} />} label="APTE (sans restriction)" />
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_asr} onChange={(e) => setFormData({ ...formData, medical_conclusion_asr: e.target.checked })} disabled={!editMode} />} label="ASR (Apte avec Surveillance Renforcée)" />
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_aar} onChange={(e) => setFormData({ ...formData, medical_conclusion_aar: e.target.checked })} disabled={!editMode} />} label="AAR (Apte avec Aménagement / Restrictions)" />
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_int} onChange={(e) => setFormData({ ...formData, medical_conclusion_int: e.target.checked })} disabled={!editMode} />} label="INT (Inapte Temporaire)" />
                <TextField size="small" label="durée" value={getObs('int_duree')} onChange={(e) => setObs('int_duree', e.target.value)} disabled={!editMode} placeholder="durée" sx={{ width: 100 }} />
                <FormControlLabel control={<Checkbox checked={formData.medical_conclusion_ind} onChange={(e) => setFormData({ ...formData, medical_conclusion_ind: e.target.checked })} disabled={!editMode} />} label="IND (Inapte Définitif)" />
              </Box>
              <TextField fullWidth label="Restrictions / Aménagements si AAR" multiline rows={2} value={getObs('conclusion_restrictions')} onChange={(e) => setObs('conclusion_restrictions', e.target.value)} disabled={!editMode} sx={{ mb: 2 }} />
              <TextField fullWidth label="Recommandations et mesures préventives" multiline rows={2} value={getObs('conclusion_recommendations')} onChange={(e) => setObs('conclusion_recommendations', e.target.value)} disabled={!editMode} />
            </Grid>

            {/* IX. ÉDUCATION THÉRAPEUTIQUE ET SENSIBILISATION */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /><Typography variant="subtitle1" fontWeight="bold" gutterBottom>IX. ÉDUCATION THÉRAPEUTIQUE ET SENSIBILISATION</Typography></Grid>
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>Thèmes abordés :</Typography>
              <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_mhd} onChange={(e) => setFormData({ ...formData, education_mhd: e.target.checked })} disabled={!editMode} />} label="MHD" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_mhv} onChange={(e) => setFormData({ ...formData, education_mhv: e.target.checked })} disabled={!editMode} />} label="MHV" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_fdr_cvx} onChange={(e) => setFormData({ ...formData, education_fdr_cvx: e.target.checked })} disabled={!editMode} />} label="FDR-CVx" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_ergo} onChange={(e) => setFormData({ ...formData, education_ergo: e.target.checked })} disabled={!editMode} />} label="Ergo" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_spb_psy} onChange={(e) => setFormData({ ...formData, education_spb_psy: e.target.checked })} disabled={!editMode} />} label="SPB&Psy" />
                <FormControlLabel control={<Checkbox size="small" checked={formData.education_therapy} onChange={(e) => setFormData({ ...formData, education_therapy: e.target.checked })} disabled={!editMode} />} label="Thérapie / Suivi médical" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('education_epi')} onChange={(e) => setObs('education_epi', e.target.checked)} disabled={!editMode} />} label="Port des EPI" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('education_tms')} onChange={(e) => setObs('education_tms', e.target.checked)} disabled={!editMode} />} label="Prévention TMS" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('education_stress')} onChange={(e) => setObs('education_stress', e.target.checked)} disabled={!editMode} />} label="Gestion du stress" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('education_sommeil')} onChange={(e) => setObs('education_sommeil', e.target.checked)} disabled={!editMode} />} label="Hygiène du sommeil" />
                <TextField size="small" label="Autres" value={formData.education_other} onChange={(e) => setFormData({ ...formData, education_other: e.target.value })} disabled={!editMode} sx={{ minWidth: 180 }} />
              </Box>
              <Box display="flex" flexWrap="wrap" alignItems="center" gap={2}>
                <Typography variant="body2" fontWeight="bold">Date prochaine visite :</Typography>
                <TextField size="small" type="date" value={getObs('next_visit_date')} onChange={(e) => setObs('next_visit_date', e.target.value)} disabled={!editMode} InputLabelProps={{ shrink: true }} sx={{ width: 160 }} />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('next_visit_type_periodique')} onChange={(e) => setObs('next_visit_type_periodique', e.target.checked)} disabled={!editMode} />} label="Périodique" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('next_visit_type_surveillance')} onChange={(e) => setObs('next_visit_type_surveillance', e.target.checked)} disabled={!editMode} />} label="Surveillance renforcée" />
                <FormControlLabel control={<Checkbox size="small" checked={getObsBool('next_visit_type_specialisee')} onChange={(e) => setObs('next_visit_type_specialisee', e.target.checked)} disabled={!editMode} />} label="Spécialisée" />
              </Box>
            </Grid>

            {/* Signatures */}
            <Grid item xs={12}><Divider sx={{ my: 2 }} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="LE MÉDECIN DU TRAVAIL — Signature et cachet" value={formData.observer_name} onChange={(e) => setFormData({ ...formData, observer_name: e.target.value })} disabled={!editMode} />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Document confidentiel — Secret médical — Article L. 4624-1 du Code du Travail</Typography>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MedicalServicesIcon />}
              onClick={handleOpenVisitDialog}
            >
              Programmer une visite
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Diagnostic</TableCell>
                  <TableCell>Avis</TableCell>
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
                      <TableCell>{visit.avis_display || '-'}</TableCell>
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

      </Paper>

      {/* Dialog Programmer une visite */}
      <Dialog open={openVisitDialog} onClose={() => setOpenVisitDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Programmer une visite médicale</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Type de visite *</InputLabel>
                <Select
                  value={visitForm.visit_type}
                  onChange={(e) => setVisitForm({ ...visitForm, visit_type: e.target.value })}
                  label="Type de visite *"
                >
                  {visitTypes.map((vt) => (
                    <MenuItem key={vt.id} value={String(vt.id)}>{vt.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date *"
                type="date"
                value={visitForm.scheduled_date}
                onChange={(e) => setVisitForm({ ...visitForm, scheduled_date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heure *"
                type="time"
                value={visitForm.scheduled_time}
                onChange={(e) => setVisitForm({ ...visitForm, scheduled_time: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Raison de la visite"
                multiline
                rows={3}
                value={visitForm.reason}
                onChange={(e) => setVisitForm({ ...visitForm, reason: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenVisitDialog(false)}>Annuler</Button>
          <Button
            variant="contained"
            onClick={handleSubmitVisit}
            disabled={!visitForm.visit_type || !visitForm.scheduled_date || !visitForm.scheduled_time}
          >
            Programmer
          </Button>
        </DialogActions>
      </Dialog>

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

      {/* Section d'impression cachée */}
      <Box
        id="print-section"
        className="print-section"
        sx={{
          display: 'none',
          width: '210mm',
          padding: '20mm',
          backgroundColor: '#ffffff',
          '@media print': {
            display: 'block !important',
            padding: '20mm',
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            zIndex: 9999,
          },
        }}
      >
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{ flex: '0 0 80px', mr: 2, display: 'flex', alignItems: 'center' }}>
            <img 
              src="/coly.png" 
              alt="Logo" 
              style={{ width: '80px', height: 'auto', maxWidth: '80px' }}
              onError={(e) => {
                // Ne pas afficher l'URL en cas d'erreur (évite le https en haut à droite)
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              backgroundColor: '#0D47A1',
              color: 'white',
              padding: '10px 20px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '16px',
              borderRadius: '50px', // Forme ovale
              minHeight: '50px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            FICHE D'OBSERVATION MÉDICALE — SERVICE DE SANTÉ AU TRAVAIL
          </Box>
          <Box sx={{ flex: '0 0 140px', textAlign: 'right', ml: 2 }}>
            <Typography variant="body2">Fait à Dakar, le {formData.observation_date ? new Date(formData.observation_date).toLocaleDateString('fr-FR') : new Date().toLocaleDateString('fr-FR')}</Typography>
            <Typography variant="body2">Type : {[obs.visit_type_embauche && 'Embauche', obs.visit_type_periodique && 'Périodique', obs.visit_type_reprise && 'Reprise'].filter(Boolean).join(', ') || '-'}</Typography>
            <Typography variant="body2">Médecin : {formData.observer_name || ''}</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>I. IDENTIFICATION DE L'AGENT</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography><strong>Nom et prénoms :</strong> {dmst.agent_name}</Typography></Grid>
            <Grid item xs={2}><Typography><strong>Âge :</strong> {dmst.agent_age ?? ''} ans</Typography></Grid>
            <Grid item xs={2}><Typography><strong>Sexe :</strong> {obs.sex_m ? 'M' : obs.sex_f ? 'F' : ''}</Typography></Grid>
            <Grid item xs={2}><Typography><strong>Matricule :</strong> {dmst.agent_matricule}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>Téléphone :</strong> {String(obs.telephone || '')}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>Direction :</strong> {formData.observation_direction || dmst.agent_direction || ''}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>Site :</strong> {formData.observation_site || dmst.agent_site_name || ''}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>Fonction / Poste :</strong> {formData.observation_function || dmst.agent_function || ''}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>Ancienneté au poste :</strong> {String(obs.seniority_years || '')} ans</Typography></Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>II. ANTÉCÉDENTS ET TERRAINS PARTICULIERS</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}><Typography><strong>Antécédents médicaux :</strong> {formData.medical_antecedents || ''}</Typography></Grid>
            <Grid item xs={6}><Typography><strong>Antécédents chirurgicaux :</strong> {formData.surgical_antecedents || ''}</Typography></Grid>
            <Grid item xs={12}>
              <Typography><strong>Habitudes de vie :</strong> {[formData.sport_activity && 'Activité sportive', formData.physical_activity && 'Activité physique régulière', formData.tobacco && `Tabac (${obs.tobacco_per_day || ''}/j)`, formData.alcohol_obs && 'Alcool', formData.coffee && 'Café', formData.tea && 'Thé', obs.habits_other].filter(Boolean).join(' — ') || 'Aucune'}</Typography>
            </Grid>
            <Grid item xs={12}><Typography><strong>AT/MP (12 derniers mois) :</strong> {obs.at_mp_no ? 'Non' : obs.at_mp_yes ? `Oui → Nature : ${formData.at_mp_nature || ''}` : ''}</Typography></Grid>
            <Grid item xs={12}><Typography><strong>Entreprises / Postes antérieurs :</strong> {formData.previous_companies || ''}</Typography></Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>III. EXPOSITIONS PROFESSIONNELLES</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Risques physiques :</strong> {[obs.exp_phys_bruit && 'Bruit', obs.exp_phys_vibrations && 'Vibrations', obs.exp_phys_chaleur_froid && 'Chaleur/Froid', obs.exp_phys_rayonnements && 'Rayonnements', obs.exp_phys_ecran && 'Écran >4h/j'].filter(Boolean).join(', ') || '-'}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Chimiques/biologiques :</strong> {[obs.exp_chim_poussieres && 'Poussières', obs.exp_chim_solvants && 'Solvants', obs.exp_chim_cmr && 'CMR', obs.exp_chim_biologiques && 'Agents biologiques', obs.exp_chim_gaz && 'Gaz/Fumées'].filter(Boolean).join(', ') || '-'} {obs.exp_chim_preciser ? ` — ${obs.exp_chim_preciser}` : ''}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Biomécaniques :</strong> {[obs.exp_bio_port_charges && 'Port charges', obs.exp_bio_gestes_repetitifs && 'Gestes répétitifs', obs.exp_bio_postures && 'Postures', obs.exp_bio_station_debout && 'Station debout'].filter(Boolean).join(', ') || '-'}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Psychosociaux :</strong> {[obs.exp_psy_stress && 'Stress', obs.exp_psy_charge_mentale && 'Charge mentale', obs.exp_psy_isole && 'Travail isolé', obs.exp_psy_relations && 'Relations difficiles', obs.exp_psy_harcelement && 'Harcèlement'].filter(Boolean).join(', ') || '-'}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}><strong>EPI :</strong> {[obs.epi_gants && 'Gants', obs.epi_masque && 'Masque', obs.epi_lunettes && 'Lunettes', obs.epi_casque && 'Casque', obs.epi_auditif && 'Protections auditives', obs.epi_chaussures && 'Chaussures sécurité'].filter(Boolean).join(', ') || '-'}</Typography>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>IV. PLAINTES FONCTIONNELLES ACTUELLES</Typography>
          <Typography sx={{ mb: 2 }}>{obs.plaintes_aucune ? 'Aucune plainte' : [obs.plaintes_douleurs_ms && `Douleurs MS (${obs.plaintes_douleurs_localisation || ''})`, obs.plaintes_respiratoires && 'Troubles respiratoires', obs.plaintes_cutanes && 'Troubles cutanés', obs.plaintes_orl && 'ORL/Oculaires', obs.plaintes_cephalees && 'Céphalées', obs.plaintes_vertiges && 'Vertiges', obs.plaintes_fatigue && 'Fatigue chronique', obs.plaintes_stress && 'Stress/Anxiété/Sommeil', obs.plaintes_digestifs && 'Troubles digestifs'].filter(Boolean).join(' ; ') || '-'} {obs.plaintes_details ? ` — ${obs.plaintes_details}` : ''}</Typography>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>V. ÉTAT GÉNÉRAL ET CONSTANTES</Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}><Typography><strong>TA :</strong> {formData.blood_pressure_systolic || ''}/{formData.blood_pressure_diastolic || ''} mmHg</Typography></Grid>
            <Grid item xs={2}><Typography><strong>T° :</strong> {formData.temperature || ''} °C</Typography></Grid>
            <Grid item xs={2}><Typography><strong>FC :</strong> {formData.heart_rate || ''} /min</Typography></Grid>
            <Grid item xs={2}><Typography><strong>Poids :</strong> {formData.weight || ''} kg</Typography></Grid>
            <Grid item xs={2}><Typography><strong>Taille :</strong> {formData.height || ''} cm</Typography></Grid>
            <Grid item xs={2}><Typography><strong>IMC :</strong> {formData.bmi || ''} kg/m²</Typography></Grid>
            <Grid item xs={2}><Typography><strong>Tour de taille :</strong> {String(obs.tour_taille || '')} cm</Typography></Grid>
            <Grid item xs={2}><Typography><strong>Périmètre ombilical :</strong> {String(obs.perimetre_ombilical || '')} cm</Typography></Grid>
            <Grid item xs={2}><Typography><strong>SpO₂ :</strong> {String(obs.spo2 || '')} %</Typography></Grid>
            <Grid item xs={2}><Typography><strong>Dextro (jn) :</strong> {formData.dextro_jn || ''} g/L</Typography></Grid>
            <Grid item xs={2}><Typography><strong>Dextro (pp) :</strong> {formData.dextro_pp || ''} g/L</Typography></Grid>
          </Grid>
          <Typography variant="body2" gutterBottom><strong>Acuité visuelle :</strong> OD loin {String(obs.av_od_loin || '')}/10, près {String(obs.av_od_pres || '')}/10 — OG loin {String(obs.av_og_loin || '')}/10, près {String(obs.av_og_pres || '')}/10 — Binoculaire loin {String(obs.av_bin_loin || '')}/10, près {String(obs.av_bin_pres || '')}/10. Vision des couleurs : {obs.vision_couleurs_normale ? 'Normale' : obs.vision_couleurs_daltonisme ? `Daltonisme (${obs.daltonisme_type || ''})` : '-'}. Lunettes/lentilles : {obs.lunettes_oui ? `Oui — ${obs.lunettes_correction || ''}` : obs.lunettes_non ? 'Non' : '-'}</Typography>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>VI. EXAMEN CLINIQUE</Typography>
          <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{formData.clinical_exam || ''}</Typography>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>VII. EXAMENS COMPLÉMENTAIRES</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{[obs.comp_audiometrie && 'Audiométrie tonale', obs.comp_spiro && 'Spirométrie/EFR', obs.comp_ecg && 'ECG', obs.comp_radio_thorax && 'Radiographie thoracique', obs.comp_acuite && 'Acuité visuelle', obs.comp_vision_couleurs && 'Vision des couleurs', obs.comp_bilan_sang && 'Bilan biologique', obs.comp_bilan_hepatique && 'Bilan hépatique', obs.comp_autres].filter(Boolean).join(' ; ') || '-'}</Typography>
          <Typography sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>{String(obs.comp_resultats || '')}</Typography>

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>VIII. CONCLUSION MÉDICALE — AVIS D'APTITUDE</Typography>
          <Typography sx={{ mb: 1 }}>{[formData.medical_conclusion_apte && 'APTE', formData.medical_conclusion_asr && 'ASR', formData.medical_conclusion_aar && 'AAR', formData.medical_conclusion_int && `INT (durée : ${obs.int_duree || ''})`, formData.medical_conclusion_ind && 'IND'].filter(Boolean).join('  ') || 'Aucun'}</Typography>
          {obs.conclusion_restrictions && <Typography sx={{ mb: 1 }}><strong>Restrictions / Aménagements :</strong> {String(obs.conclusion_restrictions)}</Typography>}
          {obs.conclusion_recommendations && <Typography sx={{ mb: 2 }}><strong>Recommandations :</strong> {String(obs.conclusion_recommendations)}</Typography>}

          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" fontWeight="bold" gutterBottom>IX. ÉDUCATION THÉRAPEUTIQUE ET SENSIBILISATION</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Thèmes :</strong> {[formData.education_mhd && 'MHD', formData.education_mhv && 'MHV', formData.education_fdr_cvx && 'FDR-CVx', formData.education_ergo && 'Ergo', formData.education_spb_psy && 'SPB&Psy', formData.education_therapy && 'Thérapie', obs.education_epi && 'Port EPI', obs.education_tms && 'Prévention TMS', obs.education_stress && 'Gestion stress', obs.education_sommeil && 'Hygiène sommeil', formData.education_other].filter(Boolean).join(', ') || 'Aucun'}</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}><strong>Date prochaine visite :</strong> {obs.next_visit_date ? new Date(String(obs.next_visit_date)).toLocaleDateString('fr-FR') : ''} — Type : {[obs.next_visit_type_periodique && 'Périodique', obs.next_visit_type_surveillance && 'Surveillance renforcée', obs.next_visit_type_specialisee && 'Spécialisée'].filter(Boolean).join(', ') || '-'}</Typography>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #ccc' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mt: 2 }}>
              <Box><Typography variant="body2"><strong>L'AGENT — Signature (pour information)</strong></Typography></Box>
              <Box sx={{ textAlign: 'right', minWidth: '250px' }}>
                <Typography variant="body2" sx={{ mb: 1 }}><strong>LE MÉDECIN DU TRAVAIL — Signature et cachet</strong></Typography>
                <Typography variant="body2">{formData.observer_name || ''}</Typography>
                <Box sx={{ mt: 2, height: '40px', borderBottom: '1px solid #000', width: '200px', mx: 'auto' }} />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
