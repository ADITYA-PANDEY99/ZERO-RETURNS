import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Auth token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zeroreturns-token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Dashboard
export const getDashboardKPIs = () => api.get('/dashboard/kpis')
export const getDashboardHeatmap = () => api.get('/dashboard/heatmap')
export const getDashboardTrends = () => api.get('/dashboard/trends')
export const getDashboardSummary = () => api.get('/dashboard/summary')

// Orders
export const getOrders = (params) => api.get('/orders', { params })
export const getOrderById = (id) => api.get(`/orders/${id}`)
export const getOrderAnalysis = (id) => api.get(`/orders/${id}/analysis`)
export const applyFix = (id, fix) => api.post(`/orders/${id}/fix`, fix)

// Analytics
export const getAnalyticsCharts = (params) => api.get('/analytics/charts', { params })
export const getComparison = (params) => api.get('/analytics/comparison', { params })
export const runWhatIf = (data) => api.post('/analytics/whatif', data)
export const generateReport = (data) => api.post('/analytics/report/generate', data)

// Upload
export const uploadCSV = (formData) => api.post('/upload/csv', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const getUploadStatus = (jobId) => api.get(`/upload/${jobId}/status`)

// Chatbot
export const sendChatMessage = (data) => api.post('/chatbot/message', data)
export const uploadChatData = (formData) => api.post('/chatbot/upload-data', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// Auth
export const login = (data) => api.post('/auth/login', data)
export const signup = (data) => api.post('/auth/signup', data)
export const logout = () => api.post('/auth/logout')
export const getCurrentUser = () => api.get('/auth/me')

export default api
