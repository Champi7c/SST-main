import { useState } from 'react'
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material'
import { useAuth } from '../contexts/AuthContext'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'

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
    <Container component="main" maxWidth="xs" sx={{ px: { xs: 1.5, sm: 2 } }}>
      <Box
        sx={{
          marginTop: { xs: 4, sm: 8 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            {!logoError ? (
              <Box
                component="img"
                src={LOGO_SRC}
                alt="Logo"
                onError={() => setLogoError(true)}
                sx={{ height: 64, width: 'auto', maxWidth: 200, objectFit: 'contain', mb: 2, display: 'block' }}
              />
            ) : (
              <Box sx={{ textAlign: 'center', mb: 2 }}>
                <MedicalServicesIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  Placez <strong>coly.png</strong> dans <code style={{ fontSize: '0.75em' }}>frontend/public/</code>
                </Typography>
              </Box>
            )}
            <Typography component="h1" variant="h4">
              Plateforme SST
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Santé et Sécurité au Travail
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
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
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
