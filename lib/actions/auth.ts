'use server'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

async function apiCall(path: string, body: Record<string, unknown>) {
  try {
    const res = await fetch(`${API_URL}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return await res.json()
  } catch (error) {
    console.error(`Erro ao chamar ${path}:`, error)
    return { success: false, message: 'Erro ao processar solicitação' }
  }
}

export async function forgotPassword(email: string) {
  return apiCall('/auth/forgot-password', { email })
}

export async function resetPassword(token: string, newPassword: string) {
  return apiCall('/auth/reset-password', { token, newPassword })
}

export async function requestUnlockByEmail(email: string) {
  return apiCall('/auth/request-unlock', { email })
}

export async function confirmUnlock(token: string) {
  return apiCall('/auth/confirm-unlock', { token })
}

export async function adminUnlock(userId: string, adminUserId: string) {
  return apiCall('/auth/admin-unlock', { userId, adminUserId })
}
