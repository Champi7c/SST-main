import axios, { AxiosRequestConfig } from 'axios'
import { isDemoMode, getMockResponse } from './mockData'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const realClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token
realClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs
realClient.interceptors.response.use(
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

/** En mode démo, retourne les mocks ; sinon appelle le backend. */
async function demoAwareRequest(
  method: 'get' | 'post' | 'put' | 'patch' | 'delete',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
) {
  if (isDemoMode()) {
    const res = getMockResponse(method, url, data, config)
    return Promise.resolve(res as any)
  }
  if (method === 'get') return realClient.get(url, config)
  if (method === 'post') return realClient.post(url, data, config)
  if (method === 'put') return realClient.put(url, data, config)
  if (method === 'patch') return realClient.patch(url, data, config)
  return realClient.delete(url, config)
}

const client = {
  get: (url: string, config?: AxiosRequestConfig) => demoAwareRequest('get', url, undefined, config),
  post: (url: string, data?: any, config?: AxiosRequestConfig) => demoAwareRequest('post', url, data, config),
  put: (url: string, data?: any, config?: AxiosRequestConfig) => demoAwareRequest('put', url, data, config),
  patch: (url: string, data?: any, config?: AxiosRequestConfig) => demoAwareRequest('patch', url, data, config),
  delete: (url: string, config?: AxiosRequestConfig) => demoAwareRequest('delete', url, undefined, config),
}

/** Retourne un message d'erreur lisible à partir d'une erreur API (400, etc.). */
export function getApiErrorMessage(error: any): string {
  const d = error?.response?.data
  if (!d) return error?.message || 'Erreur lors de la requête'
  if (typeof d.detail === 'string') return d.detail
  if (typeof d.detail === 'object' && d.detail !== null) {
    const arr = Array.isArray(d.detail) ? d.detail : Object.entries(d.detail).flatMap(([k, v]) => [`${k}: ${Array.isArray(v) ? v[0] : v}`])
    return arr.slice(0, 3).join(' · ')
  }
  const first = Object.entries(d).find(([, v]) => v != null)
  if (first) {
    const [k, v] = first
    const msg = Array.isArray(v) ? v[0] : String(v)
    return `${k}: ${msg}`
  }
  return 'Erreur de validation'
}

export default client
