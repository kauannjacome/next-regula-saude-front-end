// ==========================================
// CLIENTE DE API - AXIOS CONFIGURADO
// ==========================================
// Configurado para apontar para o backend NestJS separado

import axios from 'axios'
import { getSession } from 'next-auth/react'

// ==========================================
// PROTEÇÃO CONTRA REQUISIÇÕES EXCESSIVAS
// ==========================================
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const MAX_REQUESTS_PER_MINUTE = 30
const WINDOW_MS = 60 * 1000

function canMakeRequest(endpoint: string): boolean {
  const now = Date.now()
  const record = requestCounts.get(endpoint)

  if (!record || now > record.resetTime) {
    requestCounts.set(endpoint, { count: 1, resetTime: now + WINDOW_MS })
    return true
  }

  record.count++
  if (record.count > MAX_REQUESTS_PER_MINUTE) {
    console.warn(`[API] Limite excedido para ${endpoint}: ${record.count} req/min`)
    return false
  }

  return true
}

// ==========================================
// CRIAR O CLIENTE DE API
// ==========================================
const apiClient = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ==========================================
// INTERCEPTOR DE REQUISIÇÃO (ANTES DE ENVIAR)
// ==========================================
apiClient.interceptors.request.use(
  async (config) => {
    const endpoint = config.url || 'unknown'
    if (!canMakeRequest(endpoint)) {
      return Promise.reject(new Error('Muitas requisições. Aguarde um momento.'))
    }

    try {
      const session = await getSession()
      if (session?.accessToken) {
        config.headers['Authorization'] = `Bearer ${session.accessToken}`
      }
    } catch (error) {
      console.error('Erro ao obter sessão:', error)
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ==========================================
// INTERCEPTOR DE RESPOSTA (DEPOIS DE RECEBER)
// ==========================================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }

    if (error.response?.status === 429) {
      console.warn('[API] Rate limit atingido no servidor')
      const retryAfter = error.response.headers['retry-after'] || 60
      error.message = `Muitas requisições. Tente novamente em ${retryAfter} segundos.`
    }

    return Promise.reject(error)
  }
)

export default apiClient
