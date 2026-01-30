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
} from '@mui/material'
import {
  People as PeopleIcon,
  Event as EventIcon,
  Warning as WarningIcon,
  Vaccines as VaccinesIcon,
  Refresh as RefreshIcon,
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
  const { user } = useAuth()

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
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Visites médicales',
      value: stats?.total_visits || 0,
      icon: <EventIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Accidents de travail',
      value: stats?.total_accidents || 0,
      icon: <WarningIcon sx={{ fontSize: 40 }} />,
      color: '#d32f2f',
    },
    {
      title: 'Sous surveillance',
      value: stats?.agents_under_surveillance || 0,
      icon: <VaccinesIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
  ]

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Tableau de bord
          </Typography>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            Bienvenue, {user?.full_name} · Données mises à jour automatiquement
          </Typography>
        </Box>
        <Tooltip title={refreshing ? 'Actualisation…' : 'Actualiser maintenant'}>
          <span>
            <IconButton onClick={() => fetchStats(false)} disabled={refreshing} aria-label="Actualiser">
              {refreshing ? (
                <CircularProgress size={24} sx={{ color: 'action.active' }} />
              ) : (
                <RefreshIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      <Grid container spacing={3}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4">{card.value}</Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Statistiques des visites médicales
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Visites réalisées
                </Typography>
                <Typography variant="h5">{stats?.completed_visits || 0}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Visites programmées
                </Typography>
                <Typography variant="h5">{stats?.scheduled_visits || 0}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" color="text.secondary">
                  Taux de réalisation
                </Typography>
                <Typography variant="h5">
                  {typeof stats?.visit_completion_rate === 'number'
                    ? stats.visit_completion_rate.toFixed(1)
                    : 0}%
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
