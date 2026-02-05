import { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CircularProgress,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Snackbar,
  TextField,
} from '@mui/material'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { PictureAsPdf as PdfIcon, TableChart as ExcelIcon } from '@mui/icons-material'
import client from '../api/client'
import { useAuth } from '../contexts/AuthContext'

const CHART_COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#7b1fa2', '#00796b']

interface DashboardData {
  period: { start_date: string; end_date: string }
  stats: Record<string, number | string>
  distribution: {
    by_site: { id: number; name: string; agents_count: number; visits_count: number; accidents_count: number }[]
    by_service: { id: number; name: string; agents_count: number; visits_count: number }[]
  }
}

interface Company {
  id: number
  name: string
}
interface Site {
  id: number
  name: string
}
interface Service {
  id: number
  name: string
}

const API_BASE = import.meta.env?.VITE_API_URL || 'http://localhost:8000/api'

function formatStatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function Reporting() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [companies, setCompanies] = useState<Company[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [companyFilter, setCompanyFilter] = useState<string>('')
  const [siteFilter, setSiteFilter] = useState<string>('')
  const [serviceFilter, setServiceFilter] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split('T')[0])
  const [sstIndicators, setSstIndicators] = useState<{
    period: { start_date: string; end_date: string }
    frequency_rate: number
    severity_rate: number
    total_accidents: number
    total_work_stoppage_days: number
  } | null>(null)
  const [healthStatus, setHealthStatus] = useState<{
    total_agents: number
    agents_with_dmst: number
    agents_under_surveillance: number
    agents_with_pathologies: number
    agents_with_handicap: number
    pregnant_agents: number
  } | null>(null)
  const { hasMedicalAccess } = useAuth()

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    if (companyFilter) {
      client.get(`/companies/sites/?company=${companyFilter}`).then((r) => setSites(r.data.results || r.data)).catch(() => {})
      client.get(`/companies/services/?company=${companyFilter}`).then((r) => setServices(r.data.results || r.data)).catch(() => {})
    } else {
      setSites([])
      setServices([])
    }
  }, [companyFilter])

  useEffect(() => {
    fetchStats()
  }, [companyFilter, siteFilter, serviceFilter, startDate, endDate, hasMedicalAccess])

  const fetchCompanies = async () => {
    try {
      const r = await client.get('/companies/companies/')
      setCompanies(r.data.results || r.data)
    } catch {
      /**/
    }
  }

  const fetchStats = async () => {
    setLoading(true)
    const params: Record<string, string> = {
      start_date: startDate,
      end_date: endDate,
    }
    if (companyFilter) params.company = companyFilter
    if (siteFilter) params.site = siteFilter
    if (serviceFilter) params.service = serviceFilter
    const healthParams: Record<string, string> = {}
    if (companyFilter) healthParams.company = companyFilter
    if (siteFilter) healthParams.site = siteFilter
    if (serviceFilter) healthParams.service = serviceFilter

    try {
      const [dashboardRes, sstRes] = await Promise.all([
        client.get('/reporting/dashboard-stats/', { params }),
        client.get('/reporting/sst-indicators/', { params }),
      ])
      setData(dashboardRes.data)
      setSstIndicators(sstRes.data)
    } catch (e) {
      console.error(e)
      setSnackbar({ open: true, message: 'Erreur chargement indicateurs', severity: 'error' })
      setData(null)
      setSstIndicators(null)
    } finally {
      setLoading(false)
    }

    if (hasMedicalAccess) {
      try {
        const r = await client.get('/reporting/health-status/', {
          params: Object.keys(healthParams).length ? healthParams : undefined,
        })
        setHealthStatus(r.data)
      } catch {
        setHealthStatus(null)
      }
    } else {
      setHealthStatus(null)
    }
  }

  const buildExportUrl = (format: 'excel' | 'pdf') => {
    const base = `${API_BASE}/reporting/export/${format === 'excel' ? 'excel' : 'pdf'}/`
    const params = new URLSearchParams()
    params.set('start_date', startDate)
    params.set('end_date', endDate)
    if (companyFilter) params.set('company', companyFilter)
    if (siteFilter) params.set('site', siteFilter)
    if (serviceFilter) params.set('service', serviceFilter)
    return `${base}?${params.toString()}`
  }

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(format)
    try {
      const token = localStorage.getItem('access_token')
      const url = buildExportUrl(format)
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const contentType = format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'
      const href = URL.createObjectURL(new Blob([blob], { type: contentType }))
      const a = document.createElement('a')
      a.href = href
      a.download = format === 'excel' ? 'dashboard_sst.xlsx' : 'dashboard_sst.pdf'
      a.click()
      URL.revokeObjectURL(href)
      setSnackbar({ open: true, message: `Export ${format === 'excel' ? 'Excel' : 'PDF'} téléchargé`, severity: 'success' })
    } catch (e) {
      setSnackbar({ open: true, message: 'Erreur lors de l\'export', severity: 'error' })
    } finally {
      setExporting(null)
    }
  }

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Typography variant="h4">Reporting et tableaux de bord</Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<ExcelIcon />}
            onClick={() => handleExport('excel')}
            disabled={!!exporting}
          >
            Export Excel
          </Button>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={() => handleExport('pdf')}
            disabled={!!exporting}
          >
            Export PDF
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Filtres</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Début"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              size="small"
              label="Fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Entreprise</InputLabel>
              <Select
                value={companyFilter}
                onChange={(e) => {
                  setCompanyFilter(e.target.value)
                  setSiteFilter('')
                  setServiceFilter('')
                }}
                label="Entreprise"
              >
                <MenuItem value="">Toutes</MenuItem>
                {companies.map((c) => (
                  <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" disabled={!companyFilter}>
              <InputLabel>Site</InputLabel>
              <Select
                value={siteFilter}
                onChange={(e) => {
                  setSiteFilter(e.target.value)
                  setServiceFilter('')
                }}
                label="Site"
              >
                <MenuItem value="">Tous</MenuItem>
                {sites.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small" disabled={!companyFilter}>
              <InputLabel>Service</InputLabel>
              <Select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                label="Service"
              >
                <MenuItem value="">Tous</MenuItem>
                {services.map((s) => (
                  <MenuItem key={s.id} value={String(s.id)}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {data?.period && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Période : {data.period.start_date} → {data.period.end_date}
        </Typography>
      )}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {data?.stats &&
          Object.entries(data.stats).map(([key, value]) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    {formatStatKey(key)}
                  </Typography>
                  <Typography variant="h5">{value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {data?.stats && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Indicateurs clés (graphique)
          </Typography>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={[
                { name: 'Agents', value: Number(data.stats.total_agents) || 0 },
                { name: 'Visites', value: Number(data.stats.total_visits) || 0 },
                { name: 'Réalisées', value: Number(data.stats.completed_visits) || 0 },
                { name: 'Accidents', value: Number(data.stats.total_accidents) || 0 },
                { name: 'Surveillance', value: Number(data.stats.agents_under_surveillance) || 0 },
                { name: 'Alertes vacc.', value: (Number(data.stats.vaccination_alerts_due_soon) || 0) + (Number(data.stats.vaccination_alerts_overdue) || 0) },
                { name: 'Formations expirées', value: Number(data.stats.trainings_expired) || 0 },
              ].filter((d) => d.value >= 0)}
              margin={{ top: 16, right: 16, left: 16, bottom: 16 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill={CHART_COLORS[0]} name="Valeur" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {data?.distribution?.by_site && data.distribution.by_site.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Répartition par site (effectifs)
          </Typography>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={data.distribution.by_site.map((s) => ({ name: s.name, value: s.agents_count }))}
                dataKey="value"
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
              >
                {data.distribution.by_site.map((_, idx) => (
                  <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {sstIndicators && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Indicateurs SST (taux fréquence / gravité)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Période AT : {sstIndicators.period?.start_date} → {sstIndicators.period?.end_date}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Taux de fréquence (× 1 000 000 h)</Typography>
                  <Typography variant="h5">{sstIndicators.frequency_rate}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Taux de gravité (× 1 000 h)</Typography>
                  <Typography variant="h5">{sstIndicators.severity_rate}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Accidents (période)</Typography>
                  <Typography variant="h5">{sstIndicators.total_accidents}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Jours d&apos;arrêt (période)</Typography>
                  <Typography variant="h5">{sstIndicators.total_work_stoppage_days}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {hasMedicalAccess && healthStatus && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            État de santé (agrégats, personnel médical uniquement)
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Agents avec DMST</Typography>
                  <Typography variant="h5">{healthStatus.agents_with_dmst}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Sous surveillance</Typography>
                  <Typography variant="h5">{healthStatus.agents_under_surveillance}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Avec pathologies</Typography>
                  <Typography variant="h5">{healthStatus.agents_with_pathologies}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Avec handicap</Typography>
                  <Typography variant="h5">{healthStatus.agents_with_handicap}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography color="text.secondary" variant="body2">Femmes enceintes</Typography>
                  <Typography variant="h5">{healthStatus.pregnant_agents}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              Répartition par site
            </Typography>
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Site</TableCell>
                    <TableCell align="right">Agents</TableCell>
                    <TableCell align="right">Visites</TableCell>
                    <TableCell align="right">Accidents</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.distribution?.by_site || []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="right">{row.agents_count}</TableCell>
                      <TableCell align="right">{row.visits_count}</TableCell>
                      <TableCell align="right">{row.accidents_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ overflow: 'hidden' }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              Répartition par service
            </Typography>
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell align="right">Agents</TableCell>
                    <TableCell align="right">Visites</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.distribution?.by_service || []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell align="right">{row.agents_count}</TableCell>
                      <TableCell align="right">{row.visits_count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

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
