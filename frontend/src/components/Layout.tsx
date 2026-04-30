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
import LogoutIcon from '@mui/icons-material/Logout'
import { useAuth } from '../contexts/AuthContext'

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || ''
const LOGO_SRC = `${base}/coly.png`

const drawerWidth = 240

const menuItems = [
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

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [logoError, setLogoError] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
    <div>
      <Toolbar sx={{ gap: 1.5 }}>
        {!logoError ? (
          <Box
            component="img"
            src={LOGO_SRC}
            alt="Logo"
            onError={() => setLogoError(true)}
            sx={{ height: 36, width: 'auto', objectFit: 'contain', display: 'block' }}
          />
        ) : (
          <MedicalServicesIcon sx={{ fontSize: 28 }} />
        )}
        <Typography variant="h6" noWrap component="div">
          Plateforme SST
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  )

  return (
    <Box sx={{ display: 'flex' }}>
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
              display: 'flex',
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
                sx={{ height: 28, width: 'auto', objectFit: 'contain' }}
              />
            ) : (
              <MedicalServicesIcon sx={{ fontSize: 28 }} />
            )}
          </Box>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Plateforme SST'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>{user?.full_name}</Typography>
            <IconButton onClick={handleMenuClick} size="small">
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
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
