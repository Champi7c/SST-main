import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormControlLabel,
  Checkbox,
  Switch,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  InputAdornment,
  Avatar,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import KeyIcon from '@mui/icons-material/Key'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import SearchIcon from '@mui/icons-material/Search'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import client, { getApiErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface AdminUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: string
  role_display: string
  phone: string | null
  is_active: boolean
  is_superuser: boolean
  permissions: string[]
  date_joined: string
  last_login: string | null
}

interface Permission {
  id: number
  name: string
  codename: string
  app_label: string
  model: string
  full_code: string
}

const ROLES = [
  { value: 'super_admin', label: 'Super Administrateur' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'medecin', label: 'Médecin du Travail' },
  { value: 'infirmier', label: 'Infirmier SST' },
  { value: 'consultant', label: 'Consultant SST' },
  { value: 'rh', label: 'Ressources Humaines' },
  { value: 'hse', label: 'Responsable HSE' },
  { value: 'direction', label: 'Direction Générale' },
]

const APP_LABELS: Record<string, string> = {
  accounts: 'Comptes utilisateurs',
  companies: 'Entreprises',
  medical: 'Médical',
  visits: 'Visites (DMST)',
  accidents: 'ATMP',
  vaccination: 'Vaccination',
  prevention: 'GRILLE EVRP',
  training: 'Formation',
  reporting: 'Reporting',
  audit: 'Audit',
  consultations: 'Consultation en ligne',
}

interface UserFormState {
  username: string
  email: string
  first_name: string
  last_name: string
  phone: string
  role: string
  is_active: boolean
  is_superuser: boolean
  password: string
  password_confirm: string
  permission_ids: number[]
}

const emptyForm: UserFormState = {
  username: '',
  email: '',
  first_name: '',
  last_name: '',
  phone: '',
  role: 'consultant',
  is_active: true,
  is_superuser: false,
  password: '',
  password_confirm: '',
  permission_ids: [],
}

export default function Admin() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [tab, setTab] = useState(0)
  const [form, setForm] = useState<UserFormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  const [resetPwdTarget, setResetPwdTarget] = useState<AdminUser | null>(null)
  const [resetPwd, setResetPwd] = useState({ new_password: '', new_password_confirm: '' })
  const [resetPwdError, setResetPwdError] = useState('')

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const loadData = () => {
    setLoading(true)
    Promise.all([
      client.get('/auth/users/?page_size=500'),
      client.get('/auth/permissions/'),
    ])
      .then(([usersRes, permsRes]) => {
        setUsers(usersRes.data.results ?? usersRes.data)
        setPermissions(permsRes.data.results ?? permsRes.data)
      })
      .catch((err) => {
        setSnackbar({ open: true, message: getApiErrorMessage(err), severity: 'error' })
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const permissionsByApp = useMemo(() => {
    const grouped: Record<string, Permission[]> = {}
    for (const p of permissions) {
      if (!grouped[p.app_label]) grouped[p.app_label] = []
      grouped[p.app_label].push(p)
    }
    return grouped
  }, [permissions])

  const permissionIdByCode = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of permissions) map[p.full_code] = p.id
    return map
  }, [permissions])

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.username.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      const matchesRole = !roleFilter || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  const openCreateDialog = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setFormError('')
    setTab(0)
    setDialogOpen(true)
  }

  const openEditDialog = (u: AdminUser) => {
    setEditingUser(u)
    setForm({
      username: u.username,
      email: u.email,
      first_name: u.first_name,
      last_name: u.last_name,
      phone: u.phone || '',
      role: u.role,
      is_active: u.is_active,
      is_superuser: u.is_superuser,
      password: '',
      password_confirm: '',
      permission_ids: u.permissions.map((code) => permissionIdByCode[code]).filter(Boolean),
    })
    setFormError('')
    setTab(0)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
  }

  const togglePermission = (id: number) => {
    setForm((f) => ({
      ...f,
      permission_ids: f.permission_ids.includes(id)
        ? f.permission_ids.filter((p) => p !== id)
        : [...f.permission_ids, id],
    }))
  }

  const toggleAllInApp = (app: string, checked: boolean) => {
    const appIds = (permissionsByApp[app] || []).map((p) => p.id)
    setForm((f) => ({
      ...f,
      permission_ids: checked
        ? Array.from(new Set([...f.permission_ids, ...appIds]))
        : f.permission_ids.filter((id) => !appIds.includes(id)),
    }))
  }

  const handleSave = async () => {
    setFormError('')
    if (!editingUser && form.password !== form.password_confirm) {
      setFormError('Les mots de passe ne correspondent pas.')
      return
    }
    setSaving(true)
    try {
      if (editingUser) {
        const payload: any = {
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          role: form.role,
          is_active: form.is_active,
          is_superuser: form.is_superuser,
          permission_ids: form.permission_ids,
        }
        await client.patch(`/auth/users/${editingUser.id}/`, payload)
        setSnackbar({ open: true, message: 'Utilisateur mis à jour avec succès.', severity: 'success' })
      } else {
        const payload: any = {
          username: form.username,
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
          role: form.role,
          is_superuser: form.is_superuser,
          password: form.password,
          password_confirm: form.password_confirm,
          permission_ids: form.permission_ids,
        }
        await client.post('/auth/users/', payload)
        setSnackbar({ open: true, message: 'Utilisateur créé avec succès.', severity: 'success' })
      }
      setDialogOpen(false)
      loadData()
    } catch (err) {
      setFormError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await client.delete(`/auth/users/${deleteTarget.id}/`)
      setSnackbar({ open: true, message: 'Utilisateur supprimé.', severity: 'success' })
      setDeleteTarget(null)
      loadData()
    } catch (err) {
      setSnackbar({ open: true, message: getApiErrorMessage(err), severity: 'error' })
    }
  }

  const handleResetPassword = async () => {
    if (!resetPwdTarget) return
    setResetPwdError('')
    if (resetPwd.new_password !== resetPwd.new_password_confirm) {
      setResetPwdError('Les mots de passe ne correspondent pas.')
      return
    }
    try {
      await client.post(`/auth/users/${resetPwdTarget.id}/reset_password/`, resetPwd)
      setSnackbar({ open: true, message: 'Mot de passe réinitialisé.', severity: 'success' })
      setResetPwdTarget(null)
      setResetPwd({ new_password: '', new_password_confirm: '' })
    } catch (err) {
      setResetPwdError(getApiErrorMessage(err))
    }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar sx={{ bgcolor: 'rgba(15,76,134,0.12)', color: '#0F4C86', width: 48, height: 48 }}>
            <AdminPanelSettingsIcon />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight={800}>Administration</Typography>
            <Typography variant="body2" color="text.secondary">
              Gestion des utilisateurs, rôles et permissions
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateDialog}>
          Nouvel utilisateur
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Rechercher un utilisateur..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 240 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Rôle</InputLabel>
          <Select value={roleFilter} label="Rôle" onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="">Tous les rôles</MenuItem>
            {ROLES.map((r) => (
              <MenuItem key={r.value} value={r.value}>
                {r.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Utilisateur</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Permissions</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>Chargement...</TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>Aucun utilisateur trouvé.</TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {u.full_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{u.username}
                    </Typography>
                  </TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.role_display}
                      size="small"
                      color={u.role === 'super_admin' || u.role === 'admin' ? 'primary' : 'default'}
                    />
                    {u.is_superuser && (
                      <Chip label="Super-utilisateur" size="small" color="secondary" sx={{ ml: 0.5 }} />
                    )}
                  </TableCell>
                  <TableCell>{u.permissions.length} permission(s)</TableCell>
                  <TableCell>
                    <Chip label={u.is_active ? 'Actif' : 'Inactif'} size="small" color={u.is_active ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Réinitialiser le mot de passe">
                      <IconButton size="small" onClick={() => setResetPwdTarget(u)}>
                        <KeyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Modifier">
                      <IconButton size="small" onClick={() => openEditDialog(u)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Supprimer">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          disabled={u.id === currentUser?.id}
                          onClick={() => setDeleteTarget(u)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog création / édition */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingUser ? `Modifier ${editingUser.full_name}` : 'Nouvel utilisateur'}</DialogTitle>
        <DialogContent dividers>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Informations" />
            <Tab label="Permissions" />
          </Tabs>

          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}

          {tab === 0 && (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                label="Nom d'utilisateur"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                disabled={!!editingUser}
                required
              />
              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <TextField
                label="Prénom"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
              <TextField
                label="Nom"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
              <TextField
                label="Téléphone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <FormControl>
                <InputLabel>Rôle</InputLabel>
                <Select value={form.role} label="Rôle" onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!editingUser && (
                <>
                  <TextField
                    label="Mot de passe"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <TextField
                    label="Confirmer le mot de passe"
                    type="password"
                    value={form.password_confirm}
                    onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                    required
                  />
                </>
              )}

              <FormControlLabel
                control={
                  <Switch
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                }
                label="Compte actif"
              />

              {(currentUser?.is_superuser || currentUser?.role === 'super_admin') && (
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.is_superuser}
                      onChange={(e) => setForm({ ...form, is_superuser: e.target.checked })}
                    />
                  }
                  label="Super-utilisateur (accès total)"
                />
              )}
            </Box>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Sélectionnez les droits accordés à cet utilisateur, module par module.
              </Typography>
              {Object.keys(permissionsByApp)
                .sort()
                .map((app) => {
                  const appPerms = permissionsByApp[app]
                  const selectedCount = appPerms.filter((p) => form.permission_ids.includes(p.id)).length
                  return (
                    <Accordion key={app} disableGutters>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                          <FormControlLabel
                            onClick={(e) => e.stopPropagation()}
                            control={
                              <Checkbox
                                checked={selectedCount === appPerms.length}
                                indeterminate={selectedCount > 0 && selectedCount < appPerms.length}
                                onChange={(e) => toggleAllInApp(app, e.target.checked)}
                              />
                            }
                            label=""
                            sx={{ mr: 0 }}
                          />
                          <Typography sx={{ flexGrow: 1 }}>{APP_LABELS[app] || app}</Typography>
                          <Chip label={`${selectedCount}/${appPerms.length}`} size="small" />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 0.5 }}>
                          {appPerms.map((p) => (
                            <FormControlLabel
                              key={p.id}
                              control={
                                <Checkbox
                                  checked={form.permission_ids.includes(p.id)}
                                  onChange={() => togglePermission(p.id)}
                                />
                              }
                              label={p.name}
                            />
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )
                })}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog suppression */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Supprimer l'utilisateur</DialogTitle>
        <DialogContent>
          <Typography>
            Voulez-vous vraiment supprimer <strong>{deleteTarget?.full_name}</strong> ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog reset mot de passe */}
      <Dialog open={!!resetPwdTarget} onClose={() => setResetPwdTarget(null)}>
        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Nouveau mot de passe pour <strong>{resetPwdTarget?.full_name}</strong>
          </Typography>
          {resetPwdError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resetPwdError}
            </Alert>
          )}
          <TextField
            label="Nouveau mot de passe"
            type="password"
            fullWidth
            sx={{ mb: 2 }}
            value={resetPwd.new_password}
            onChange={(e) => setResetPwd({ ...resetPwd, new_password: e.target.value })}
          />
          <TextField
            label="Confirmer le mot de passe"
            type="password"
            fullWidth
            value={resetPwd.new_password_confirm}
            onChange={(e) => setResetPwd({ ...resetPwd, new_password_confirm: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetPwdTarget(null)}>Annuler</Button>
          <Button variant="contained" onClick={handleResetPassword}>
            Réinitialiser
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
