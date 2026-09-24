import axios, { AxiosError } from 'axios'
import { appConfig } from '@/lib/config'

export const apiClient = axios.create({
  baseURL: appConfig.apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const message = error.response?.data?.message
    const fallback = error.message || 'Request failed'
    return Promise.reject(new Error(message ?? fallback))
  },
)
