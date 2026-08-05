import { useParams, useNavigate } from 'react-router-dom'
import { Box, Button, Typography, Avatar } from '@mui/material'
import { ArrowBack as ArrowBackIcon, Videocam as VideocamIcon } from '@mui/icons-material'

const JITSI_DOMAIN = 'meet.jit.si'

export default function ConsultationRoom() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const navigate = useNavigate()
  const decoded = meetingId ? decodeURIComponent(meetingId) : ''
  const meetingLink = decoded ? `https://${JITSI_DOMAIN}/${decoded}` : ''

  if (!decoded) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Avatar sx={{ bgcolor: 'rgba(215,38,61,0.12)', color: '#D7263D', width: 56, height: 56, mx: 'auto', mb: 2 }}>
          <VideocamIcon />
        </Avatar>
        <Typography color="error" fontWeight={600}>Lien de consultation invalide.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/consultation-en-ligne')} sx={{ mt: 2 }}>
          Retour aux consultations
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 3px rgba(10,37,64,0.08)' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.25, bgcolor: 'background.paper', borderBottom: 1, borderColor: 'divider' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/consultation-en-ligne')} size="small">
          Quitter la visio
        </Button>
        <Typography variant="body2" color="text.secondary">
          Consultation en ligne — autorisez le micro et la caméra si demandé
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <iframe
          title="Salle de consultation"
          src={meetingLink}
          allow="camera; microphone; fullscreen; display-capture"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
          }}
        />
      </Box>
    </Box>
  )
}
