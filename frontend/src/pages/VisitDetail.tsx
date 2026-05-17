import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Alert,
  Divider,
  Snackbar,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  PersonOff as PersonOffIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface VisitDetailData {
  id: number
  agent: number
  agent_name: string
  agent_matricule: string
  visit_type: number
  visit_type_name: string
  scheduled_date: string
  actual_date: string | null
  status: string
  status_display: string
  reason: string | null
  temperature: number | null
  blood_pressure_systolic: number | null
  blood_pressure_diastolic: number | null
  heart_rate: number | null
  blood_sugar: number | null
  weight: number | null
  height: number | null
  diagnosis: string | null
  prescriptions: string | null
  recommendations: string | null
  avis: string | null
  avis_display: string | null
  avis_details: string | null
  alert_rh: boolean
  alert_direction: boolean
  alert_reason: string | null
  doctor_name: string | null
  nurse_name: string | null
  notes: string | null
  is_validated: boolean
  created_at: string
  updated_at: string
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value == null || value === '') return null
  return (
    <Grid item xs={12} sm={6}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body1">{value}</Typography>
    </Grid>
  )
}

export default function VisitDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<VisitDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const { hasMedicalAccess } = useAuth()

  const handleAction = async (action: 'complete' | 'mark_absent' | 'cancel') => {
    if (!id) return
    setActionLoading(true)
    try {
      const response = await client.post(`/visits/visits/${id}/${action}/`)
      setVisit(response.data)
      const messages = {
        complete: 'Visite marquée comme réalisée',
        mark_absent: 'Agent marqué comme absent',
        cancel: 'Visite annulée',
      }
      setSnackbar({ open: true, message: messages[action], severity: 'success' })
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Erreur lors de l\'action'
      setSnackbar({ open: true, message: msg, severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  useEffect(() => {
    if (!id) return
    const fetchVisit = async () => {
      try {
        const response = await client.get(`/visits/visits/${id}/`)
        setVisit(response.data)
      } catch (err: any) {
        setError(err?.response?.status === 404 ? 'Visite introuvable' : 'Erreur lors du chargement')
      } finally {
        setLoading(false)
      }
    }
    fetchVisit()
  }, [id])

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

  if (error || !visit) {
    return (
      <Box>
        <Alert severity="error">{error || 'Visite introuvable'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mt: 2 }}>
          Retour
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)}>
          Retour
        </Button>
        <Typography variant="h4">Détail de la visite médicale</Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box display="flex" flexWrap="wrap" alignItems="center" gap={1} mb={2}>
          <Chip label={visit.status_display} color={visit.status === 'completed' ? 'success' : 'default'} size="small" />
          {visit.avis_display && <Chip label={visit.avis_display} variant="outlined" size="small" />}
          {visit.alert_rh && <Chip label="Alerte RH" color="warning" size="small" />}
          {visit.alert_direction && <Chip label="Alerte Direction" color="error" size="small" />}
        </Box>

        <Typography variant="h6" gutterBottom>Agent</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Field label="Nom" value={visit.agent_name} />
          <Field label="Matricule" value={visit.agent_matricule} />
          <Field label="Type de visite" value={visit.visit_type_name} />
          <Field label="Date programmée" value={visit.scheduled_date ? new Date(visit.scheduled_date).toLocaleString('fr-FR') : null} />
          <Field label="Date réelle" value={visit.actual_date ? new Date(visit.actual_date).toLocaleString('fr-FR') : null} />
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6" gutterBottom>Constantes et bilan</Typography>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Field label="Raison de la visite" value={visit.reason} />
          <Field label="Température (°C)" value={visit.temperature} />
          <Field label="Tension (mmHg)" value={visit.blood_pressure_systolic != null && visit.blood_pressure_diastolic != null ? `${visit.blood_pressure_systolic} / ${visit.blood_pressure_diastolic}` : null} />
          <Field label="Fréquence cardiaque" value={visit.heart_rate} />
          <Field label="Glycémie (g/L)" value={visit.blood_sugar} />
          <Field label="Poids (kg)" value={visit.weight} />
          <Field label="Taille (cm)" value={visit.height} />
        </Grid>

        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Field label="Diagnostic" value={visit.diagnosis} />
          <Field label="Prescriptions" value={visit.prescriptions} />
          <Field label="Recommandations" value={visit.recommendations} />
          <Field label="Détails de l'avis" value={visit.avis_details} />
          <Field label="Notes" value={visit.notes} />
        </Grid>

        {(visit.alert_rh || visit.alert_direction) && visit.alert_reason && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom color="warning.main">Alerte</Typography>
            <Typography variant="body1">{visit.alert_reason}</Typography>
          </>
        )}

        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2}>
          <Field label="Médecin" value={visit.doctor_name} />
          <Field label="Infirmier(ère)" value={visit.nurse_name} />
          <Field label="Créée le" value={visit.created_at ? new Date(visit.created_at).toLocaleString('fr-FR') : null} />
          <Field label="Modifiée le" value={visit.updated_at ? new Date(visit.updated_at).toLocaleString('fr-FR') : null} />
        </Grid>

        {visit.status !== 'completed' && visit.status !== 'cancelled' && (
          <>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
              {visit.status !== 'absent' && (
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleIcon />}
                  onClick={() => handleAction('complete')}
                  disabled={actionLoading}
                >
                  Marquer comme réalisée
                </Button>
              )}
              <Button
                variant="outlined"
                color="warning"
                startIcon={<PersonOffIcon />}
                onClick={() => handleAction('mark_absent')}
                disabled={actionLoading}
              >
                Marquer absent
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => handleAction('cancel')}
                disabled={actionLoading}
              >
                Annuler la visite
              </Button>
            </Box>
          </>
        )}

        <Box sx={{ mt: 3 }}>
          <Button variant="outlined" onClick={() => navigate(`/dmst/${visit.agent}`)}>
            Voir le dossier médical de l'agent
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar(s => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
