import axios from 'axios'

const API_KEY = import.meta.env.VITE_PRESTASHOP_KEY
const apiClient = axios.create({
  baseURL: '/api',
  params: {
    ws_key: API_KEY,
  },
  headers: {
    'Content-Type': 'application/xml',
    'Accept': 'application/xml',
  },
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  },
)

export default apiClient
