import { useState } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
} from '@mui/material'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import { useAuth } from '../contexts/AuthContext'

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || ''
const LOGO_SRC = `${base}/coly.png`

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [logoError, setLogoError] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        background:
          'radial-gradient(1200px 600px at 10% 10%, #123a63 0%, #0A2540 45%, #071A2E 100%)',
      }}
    >
      {/* décor discret */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          '&::before, &::after': {
            content: '""',
            position: 'absolute',
            borderRadius: '50%',
          },
          '&::before': {
            width: 480,
            height: 480,
            top: -160,
            right: -120,
            background: 'radial-gradient(circle, rgba(215,38,61,0.28) 0%, rgba(215,38,61,0) 70%)',
          },
          '&::after': {
            width: 420,
            height: 420,
            bottom: -140,
            left: -120,
            background: 'radial-gradient(circle, rgba(46,125,209,0.25) 0%, rgba(46,125,209,0) 70%)',
          },
        }}
      />

      <Paper
        elevation={0}
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 920,
          borderRadius: 5,
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 30px 60px rgba(0,0,0,0.35)',
        }}
      >
        {/* Panneau bleu institutionnel */}
        <Box
          sx={{
            flex: 1,
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            justifyContent: 'space-between',
            p: 5,
            color: '#fff',
            backgroundImage: 'linear-gradient(160deg, #0F4C86 0%, #0A2540 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HealthAndSafetyIcon sx={{ fontSize: 32 }} />
            <Typography variant="h6" fontWeight={800}>
              Plateforme SST
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800} sx={{ mb: 2, lineHeight: 1.2 }}>
              La santé et la sécurité de vos agents, pilotées simplement.
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.85 }}>
              Dossiers médicaux, visites, accidents du travail, vaccination, formation et
              reporting réunis dans un seul espace sécurisé.
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              '& > span': {
                width: 34,
                height: 4,
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.35)',
              },
              '& > span:first-of-type': { backgroundColor: '#D7263D', width: 46 },
            }}
          >
            <span />
            <span />
            <span />
          </Box>
        </Box>

        {/* Panneau formulaire (blanc) */}
        <Box
          sx={{
            flex: 1,
            backgroundColor: '#fff',
            p: { xs: 3, sm: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            {!logoError ? (
              <Box
                component="img"
                src={LOGO_SRC}
                alt="Logo"
                onError={() => setLogoError(true)}
                sx={{ height: 56, width: 'auto', maxWidth: 200, objectFit: 'contain', mb: 2, display: 'block' }}
              />
            ) : (
              <HealthAndSafetyIcon sx={{ fontSize: 44, color: 'secondary.main', mb: 1 }} />
            )}
            <Typography component="h1" variant="h5" fontWeight={800} color="secondary.dark">
              Connexion
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Accédez à votre espace Plateforme SST
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nom d'utilisateur"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Mot de passe"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 3, py: 1.3, fontSize: '0.95rem' }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}
