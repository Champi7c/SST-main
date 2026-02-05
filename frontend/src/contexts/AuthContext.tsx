import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { isDemoMode, setDemoMode } from '../api/mockData'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  role_display: string
  full_name: string
}

const DEMO_USER: User = {
  id: 0,
  username: 'demo',
  email: 'demo@example.com',
  first_name: 'Démo',
  last_name: 'Utilisateur',
  role: 'super_admin',
  role_display: 'Super administrateur',
  full_name: 'Démo Utilisateur',
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isDemo: boolean
  login: (username: string, password: string) => Promise<void>
  loginDemo: () => void
  logout: () => void
  hasMedicalAccess: boolean
  canManageUsers: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

axios.defaults.baseURL = API_URL

// Intercepteur pour ajouter le token JWT
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (isDemoMode()) {
      setUser(DEMO_USER)
      setLoading(false)
      return
    }
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/auth/users/me/')
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      const response = await axios.post('/auth/login/', { username, password })
      const { access, refresh } = response.data
      localStorage.setItem('access_token', access)
      localStorage.setItem('refresh_token', refresh)
      await fetchUser()
      navigate('/')
    } catch (error: any) {
      throw new Error(error.response?.data?.detail || 'Erreur de connexion')
    }
  }

  const loginDemo = () => {
    setDemoMode(true)
    setUser(DEMO_USER)
    navigate('/')
  }

  const logout = () => {
    setDemoMode(false)
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    navigate('/login')
  }

  const hasMedicalAccess = user?.role ? ['super_admin', 'medecin', 'infirmier'].includes(user.role) : false
  const canManageUsers = user?.role ? ['super_admin', 'admin'].includes(user.role) : false
  const isDemo = isDemoMode()

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, login, loginDemo, logout, hasMedicalAccess, canManageUsers }}>
      {children}
    </AuthContext.Provider>
  )
}
