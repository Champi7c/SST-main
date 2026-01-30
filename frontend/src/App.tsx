import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Agents from './pages/Agents'
import DMST from './pages/DMST'
import Visits from './pages/Visits'
import Accidents from './pages/Accidents'
import Vaccination from './pages/Vaccination'
import Prevention from './pages/Prevention'
import Training from './pages/Training'
import Reporting from './pages/Reporting'
import Settings from './pages/Settings'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div>Chargement...</div>
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="agents" element={<Agents />} />
        <Route path="dmst/:agentId" element={<DMST />} />
        <Route path="visits" element={<Visits />} />
        <Route path="accidents" element={<Accidents />} />
        <Route path="vaccination" element={<Vaccination />} />
        <Route path="prevention" element={<Prevention />} />
        <Route path="training" element={<Training />} />
        <Route path="reporting" element={<Reporting />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
