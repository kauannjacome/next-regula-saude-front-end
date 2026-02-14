// ==========================================
// CONFIGURAÇÃO DE AMBIENTE - FRONTEND
// ==========================================

const skip2FA = process.env.SKIP_2FA === 'true'

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  SKIP_2FA: skip2FA,
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000',
  APP_NAME: process.env.APP_NAME || 'NextSaude',
} as const

export const isProduction = env.NODE_ENV === 'production'
