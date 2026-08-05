import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Chip,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import MedicalServicesIcon from '@mui/icons-material/MedicalServices'
import WarningIcon from '@mui/icons-material/Warning'
import VaccinesIcon from '@mui/icons-material/Vaccines'
import SecurityIcon from '@mui/icons-material/Security'
import SchoolIcon from '@mui/icons-material/School'
import AssessmentIcon from '@mui/icons-material/Assessment'
import VideoCallIcon from '@mui/icons-material/VideoCall'
import SettingsIcon from '@mui/icons-material/Settings'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import LogoutIcon from '@mui/icons-material/Logout'
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety'
import { useAuth } from '../contexts/AuthContext'

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || ''
const LOGO_SRC = `${base}/coly.png`

const drawerWidth = 252

const baseMenuItems = [
  { text: 'Tableau de bord', icon: <DashboardIcon />, path: '/' },
  { text: 'Agents', icon: <PeopleIcon />, path: '/agents' },
  { text: 'DMST par agent', icon: <MedicalServicesIcon />, path: '/visits' },
  { text: 'ATMP', icon: <WarningIcon />, path: '/accidents' },
  { text: 'Vaccination', icon: <VaccinesIcon />, path: '/vaccination' },
  { text: 'GRILLE EVRP', icon: <SecurityIcon />, path: '/prevention' },
  { text: 'Formation', icon: <SchoolIcon />, path: '/training' },
  { text: 'Reporting', icon: <AssessmentIcon />, path: '/reporting' },
  { text: 'Consultation en ligne', icon: <VideoCallIcon />, path: '/consultation-en-ligne' },
  { text: 'Paramètres', icon: <SettingsIcon />, path: '/settings' },
]

const adminMenuItem = { text: 'Administration', icon: <AdminPanelSettingsIcon />, path: '/admin' }

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [logoError, setLogoError] = useState(false)
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = isAdmin ? [...baseMenuItems, adminMenuItem] : baseMenuItems

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleMenuClose()
  }

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5, py: 2 }}>
        {!logoError ? (
          <Box
            component="img"
            src={LOGO_SRC}
            alt="Logo"
            onError={() => setLogoError(true)}
            sx={{ height: 34, width: 'auto', objectFit: 'contain', display: 'block', bgcolor: '#fff', borderRadius: 1.5, p: 0.5 }}
          />
        ) : (
          <HealthAndSafetyIcon sx={{ fontSize: 26 }} />
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" noWrap fontWeight={800} sx={{ color: '#fff', lineHeight: 1.1 }}>
            Plateforme SST
          </Typography>
          <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.55)' }}>
            Santé &amp; Sécurité au Travail
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
      <List sx={{ flexGrow: 1, py: 1.5 }}>
        {menuItems.map((item) => {
          const selected = location.pathname === item.path
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                selected={selected}
                onClick={() => {
                  navigate(item.path)
                  setMobileOpen(false)
                }}
                sx={{
                  color: selected ? '#fff' : 'rgba(232,241,251,0.82)',
                }}
              >
                <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: selected ? 700 : 500 }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Box sx={{ p: 2, pt: 0 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 1.5 }} />
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
          © {new Date().getFullYear()} Plateforme SST
        </Typography>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box
            component="button"
            onClick={() => navigate('/')}
            sx={{
              display: { xs: 'flex', sm: 'none' },
              alignItems: 'center',
              mr: 2,
              p: 0,
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              color: 'inherit',
            }}
          >
            {!logoError ? (
              <Box
                component="img"
                src={LOGO_SRC}
                alt="Logo"
                onError={() => setLogoError(true)}
                sx={{ height: 26, width: 'auto', objectFit: 'contain', bgcolor: '#fff', borderRadius: 1, p: 0.4 }}
              />
            ) : (
              <HealthAndSafetyIcon sx={{ fontSize: 26 }} />
            )}
          </Box>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.15rem' }, fontWeight: 700 }}>
            {menuItems.find((item) => item.path === location.pathname)?.text || 'Plateforme SST'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1.5 } }}>
            {user?.role_display && (
              <Chip
                label={user.role_display}
                size="small"
                sx={{
                  display: { xs: 'none', md: 'flex' },
                  bgcolor: 'rgba(255,255,255,0.14)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            )}
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
              {user?.full_name}
            </Typography>
            <IconButton onClick={handleMenuClick} size="small">
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                {user?.first_name?.[0]}
                {user?.last_name?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              PaperProps={{ sx: { mt: 1, borderRadius: 2, minWidth: 180 } }}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" color="error" />
                </ListItemIcon>
                <ListItemText>Déconnexion</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minWidth: 0,
          overflowX: 'hidden',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
