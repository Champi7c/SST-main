import { useEffect, useState, useCallback } from 'react'
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Tooltip,
  LinearProgress,
  Avatar,
  Chip,
} from '@mui/material'
import {
  People as PeopleIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Vaccines as VaccinesIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  AccessTime as AccessTimeIcon,
  CalendarMonth as CalendarMonthIcon,
} from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const POLL_INTERVAL_MS = 30_000 // 30 secondes

interface DashboardStats {
  total_agents: number
  total_visits: number
  completed_visits: number
  scheduled_visits: number
  absent_visits: number
  agents_seen: number
  visit_completion_rate: number
  total_accidents: number
  work_stoppages: number
  agents_under_surveillance: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [now, setNow] = useState(new Date())
  const { user } = useAuth()

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
    else setRefreshing(true)
    try {
      const response = await client.get('/reporting/dashboard-stats/')
      setStats(response.data?.stats ?? response.data)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    const interval = setInterval(() => fetchStats(false), POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchStats])

  useEffect(() => {
    const onFocus = () => fetchStats(false)
    window.addEventListener('focus', onFocus)
    const onVisibility = () => { if (document.visibilityState === 'visible') fetchStats(false) }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [fetchStats])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    )
  }

  const statCards = [
    {
      title: 'Agents',
      value: stats?.total_agents || 0,
      icon: <PeopleIcon />,
      color: '#0F4C86',
    },
    {
      title: 'Visites médicales',
      value: stats?.total_visits || 0,
      icon: <EventIcon />,
      color: '#1E8E5A',
    },
    {
      title: 'ATMP',
      value: stats?.total_accidents || 0,
      icon: <WarningIcon />,
      color: '#D7263D',
    },
    {
      title: 'Sous surveillance',
      value: stats?.agents_under_surveillance || 0,
      icon: <VaccinesIcon />,
      color: '#E08A00',
    },
  ]

  const completionRate =
    typeof stats?.visit_completion_rate === 'number' ? stats.visit_completion_rate : 0

  const formattedDate = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedDateCapitalized = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)
  const formattedTime = now.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <Box>
      {/* Bandeau d'accueil */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3,
          borderRadius: 4,
          color: '#fff',
          backgroundImage: 'linear-gradient(120deg, #0A2540 0%, #0F4C86 60%, #1565C0 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(215,38,61,0.35) 0%, rgba(215,38,61,0) 70%)',
          }}
        />
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} position="relative">
          <Box>
            <Typography variant="h4" fontWeight={800} gutterBottom>
              Tableau de bord
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.85 }}>
              Bienvenue, {user?.full_name}
            </Typography>
            <Chip
              size="small"
              icon={<TrendingUpIcon sx={{ color: '#fff !important', fontSize: 16 }} />}
              label="Données mises à jour automatiquement"
              sx={{ mt: 1.5, bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 600 }}
            />
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                textAlign: 'right',
                px: 2,
                py: 1,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.75}>
                <AccessTimeIcon sx={{ fontSize: 18 }} />
                <Typography
                  variant="h6"
                  fontWeight={800}
                  sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}
                >
                  {formattedTime}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.75} sx={{ mt: 0.25 }}>
                <CalendarMonthIcon sx={{ fontSize: 14, opacity: 0.85 }} />
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  {formattedDateCapitalized}
                </Typography>
              </Box>
            </Box>
            <Tooltip title={refreshing ? 'Actualisation…' : 'Actualiser maintenant'}>
              <span>
                <IconButton
                  onClick={() => fetchStats(false)}
                  disabled={refreshing}
                  aria-label="Actualiser"
                  sx={{ bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}
                >
                  {refreshing ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : <RefreshIcon />}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={2.5}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card
              sx={{
                height: '100%',
                '&:hover': { boxShadow: '0 10px 24px rgba(10,37,64,0.14)', transform: 'translateY(-3px)' },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="text.secondary" variant="body2" fontWeight={600} gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={800}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: `${card.color}1a`, color: card.color, width: 48, height: 48 }}>
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Paper sx={{ p: { xs: 2.5, sm: 3 } }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Statistiques des visites médicales
            </Typography>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ bgcolor: 'rgba(30,142,90,0.12)', color: '#1E8E5A' }}>
                    <CheckCircleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Visites réalisées
                    </Typography>
                    <Typography variant="h5" fontWeight={800}>
                      {stats?.completed_visits || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ bgcolor: 'rgba(15,76,134,0.12)', color: '#0F4C86' }}>
                    <ScheduleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Visites programmées
                    </Typography>
                    <Typography variant="h5" fontWeight={800}>
                      {stats?.scheduled_visits || 0}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    Taux de réalisation
                  </Typography>
                  <Typography variant="body2" fontWeight={800}>
                    {completionRate.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, completionRate)}
                  sx={{
                    bgcolor: 'rgba(15,76,134,0.1)',
                    '& .MuiLinearProgress-bar': { backgroundColor: '#D7263D' },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
