import { getSession } from 'next-auth/react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

/**
 * API Client para comunicação com o backend NestJS.
 * Injeta automaticamente o token JWT do NextAuth nos headers.
 */
class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Client-side: get token from session
    if (typeof window !== 'undefined') {
      const session = await getSession()
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`
      }
    }

    return headers
  }

  /**
   * Cria headers com token server-side (para uso em Server Components e auth.ts)
   */
  static createServerHeaders(accessToken?: string): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }
    return headers
  }

  private buildUrl(path: string): string {
    // Remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${this.baseUrl}${cleanPath}`
  }

  async get<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders()
    const response = await fetch(this.buildUrl(path), {
      method: 'GET',
      headers: { ...headers, ...options?.headers },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new ApiError(response.status, error.error || 'Request failed', error)
    }

    return response.json()
  }

  async post<T = unknown>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders()
    const response = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers: { ...headers, ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new ApiError(response.status, error.error || 'Request failed', error)
    }

    if (response.status === 204) return undefined as T
    return response.json()
  }

  async put<T = unknown>(path: string, body?: unknown, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders()
    const response = await fetch(this.buildUrl(path), {
      method: 'PUT',
      headers: { ...headers, ...options?.headers },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new ApiError(response.status, error.error || 'Request failed', error)
    }

    if (response.status === 204) return undefined as T
    return response.json()
  }

  async delete<T = unknown>(path: string, options?: RequestInit): Promise<T> {
    const headers = await this.getHeaders()
    const response = await fetch(this.buildUrl(path), {
      method: 'DELETE',
      headers: { ...headers, ...options?.headers },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new ApiError(response.status, error.error || 'Request failed', error)
    }

    if (response.status === 204) return undefined as T
    return response.json()
  }
}

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export const apiClient = new ApiClient(API_URL)
export const API_BASE_URL = API_URL
