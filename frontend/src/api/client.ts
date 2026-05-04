import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })
          localStorage.setItem('access_token', response.data.access)
          error.config.headers.Authorization = `Bearer ${response.data.access}`
          return axios(error.config)
        } catch (refreshError) {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          window.location.href = '/login'
        }
      } else {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

/** Retourne un message d'erreur lisible à partir d'une erreur API (400, 403, etc.). */
export function getApiErrorMessage(error: any): string {
  const status = error?.response?.status
  const d = error?.response?.data
  if (!d) return error?.message || 'Erreur lors de la requête'

  // Si DRF detail string
  if (typeof d.detail === 'string') return d.detail

  // Si DRF non_field_errors
  if (d.non_field_errors) {
    const errs = Array.isArray(d.non_field_errors) ? d.non_field_errors : [d.non_field_errors]
    return errs.join(' · ')
  }

  // Si c'est un objet de erreurs par champ
  if (typeof d === 'object') {
    const messages: string[] = []
    for (const [field, msgs] of Object.entries(d)) {
      const arr = Array.isArray(msgs) ? msgs : [msgs]
      messages.push(`${field}: ${arr.join(', ')}`)
    }
    if (messages.length > 0) {
      return messages.slice(0, 3).join(' · ')
    }
  }

  // Fallback générique
  return 'Erreur de validation'
}

export default client
