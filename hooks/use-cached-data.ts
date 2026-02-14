'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useUsersStore } from '@/stores/users-store'
import { useUnitsStore } from '@/stores/units-store'
import { useSuppliersStore } from '@/stores/suppliers-store'
import { useFoldersStore } from '@/stores/folders-store'
import { useCareGroupsStore } from '@/stores/care-groups-store'
import { useProfessionalsStore } from '@/stores/professionals-store'
import { useNotificationsStore, type Notification } from '@/stores/notifications-store'
import { useCareStore, type Care } from '@/stores/care-store'
import type { User, Unit, Supplier, Folder, CareGroup, Professional } from '@/types/entities'
import type { LegacyListResponse, Pagination } from '@/types/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const API_ENDPOINTS = {
  users: `${API_BASE}/api/users`,
  units: `${API_BASE}/api/units`,
  suppliers: `${API_BASE}/api/suppliers`,
  folders: `${API_BASE}/api/folders`,
  careGroups: `${API_BASE}/api/care-groups`,
  professionals: `${API_BASE}/api/professionals`,
  notifications: `${API_BASE}/api/notifications`,
  care: `${API_BASE}/api/care`,
} as const

const LEGACY_PERSISTED_CACHE_KEYS = [
  'users-cache',
  'units-cache',
  'suppliers-cache',
  'folders-cache',
  'care-groups-cache',
  'professionals-cache',
  'notifications-cache',
  'care-cache',
] as const

const FETCH_PAGE_LIMIT = 100
const MAX_FETCH_PAGES = 50
let legacyCacheStorageCleared = false

interface UseCachedDataResult<T> {
  data: T[]
  isLoading: boolean
  error: string | null
  errorCount: number
  refetch: () => Promise<void>
  invalidate: () => void
  resetErrors: () => void
}

interface ApiListResponse<T> extends Partial<LegacyListResponse<T>> {
  meta?: Pagination
}

interface BaseCache<T> {
  data: T[]
  isLoading: boolean
  error: string | null
  errorCount: number
}

interface BaseStore<T> {
  cache: BaseCache<T>
  setData: (data: T[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  invalidate: () => void
  isStale: () => boolean
  canRetry: () => boolean
  resetErrors: () => void
}

function clearLegacyPersistedCachesOnce() {
  if (legacyCacheStorageCleared) return
  if (typeof window === 'undefined') return

  try {
    for (const key of LEGACY_PERSISTED_CACHE_KEYS) {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage errors (private mode, quota, etc).
  } finally {
    legacyCacheStorageCleared = true
  }
}

function buildPaginatedUrl(endpoint: string, page: number, limit: number) {
  const hasQuery = endpoint.includes('?')
  const sep = hasQuery ? '&' : '?'
  return `${endpoint}${sep}page=${page}&limit=${limit}`
}

async function fetchAllPages<T>(endpoint: string, defaultErrorMessage: string, accessToken?: string): Promise<T[]> {
  const allItems: T[] = []
  let page = 1
  let totalPages = 1

  const headers: HeadersInit = {}
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  while (page <= totalPages && page <= MAX_FETCH_PAGES) {
    const response = await fetch(buildPaginatedUrl(endpoint, page, FETCH_PAGE_LIMIT), { headers })

    if (!response.ok) {
      let serverError = defaultErrorMessage
      try {
        const errorBody = await response.json()
        serverError = errorBody?.error || serverError
      } catch {
        // Ignore json parse error and use default message.
      }
      throw new Error(serverError)
    }

    const result = (await response.json()) as ApiListResponse<T> | T[]
    const pageData = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : []

    allItems.push(...pageData)

    const pagination = Array.isArray(result) ? null : (result.pagination || result.meta)
    if (!pagination || typeof pagination.totalPages !== 'number') {
      break
    }

    totalPages = pagination.totalPages
    if (page >= totalPages) {
      break
    }

    page += 1
  }

  if (page >= MAX_FETCH_PAGES && totalPages > MAX_FETCH_PAGES) {
    console.warn(
      `[useCachedData] Limite de paginas atingido em ${endpoint}: ${MAX_FETCH_PAGES}/${totalPages}`
    )
  }

  return allItems
}

function useCachedEntity<T>(
  useStore: () => BaseStore<T>,
  endpoint: string,
  defaultErrorMessage: string,
  debugKey: string
): UseCachedDataResult<T> {
  const { data: session } = useSession()
  const store = useStore()
  const fetchingRef = useRef(false)
  const scopeRef = useRef<string | null>(null)
  const accessToken = (session as any)?.accessToken as string | undefined

  const fetchData = useCallback(async () => {
    if (fetchingRef.current || store.cache.isLoading) return
    if (!store.canRetry()) {
      console.warn(`[${debugKey}] Maximo de tentativas atingido ou em cooldown`)
      return
    }

    fetchingRef.current = true
    store.setLoading(true)

    try {
      const data = await fetchAllPages<T>(endpoint, defaultErrorMessage, accessToken)
      store.setData(data)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      store.setError(message)
    } finally {
      fetchingRef.current = false
    }
  }, [debugKey, defaultErrorMessage, endpoint, store, accessToken])

  useEffect(() => {
    clearLegacyPersistedCachesOnce()
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    const scopeKey = `${userId}:${session?.user?.subscriberId || ''}`
    const scopeChanged = scopeRef.current !== scopeKey

    if (scopeChanged) {
      scopeRef.current = scopeKey
      store.invalidate()
    }

    if ((scopeChanged || store.isStale()) && !store.cache.isLoading && !fetchingRef.current && store.canRetry()) {
      void fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, session?.user?.subscriberId])

  return {
    data: store.cache.data,
    isLoading: store.cache.isLoading,
    error: store.cache.error,
    errorCount: store.cache.errorCount,
    refetch: fetchData,
    invalidate: store.invalidate,
    resetErrors: store.resetErrors,
  }
}

function toNotification(input: unknown): Notification {
  const raw = (input || {}) as Record<string, unknown>
  const read = Boolean(raw.read) || Boolean(raw.readAt)
  const type = typeof raw.type === 'string' ? raw.type.toLowerCase() : 'info'
  const normalizedType =
    type === 'warning' || type === 'error' || type === 'success' ? type : 'info'

  return {
    id: String(raw.id ?? raw.uuid ?? ''),
    title: String(raw.title ?? ''),
    message: String(raw.message ?? ''),
    type: normalizedType,
    read,
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    link: typeof raw.link === 'string' ? raw.link : undefined,
  }
}

export function useCachedUsers(): UseCachedDataResult<User> {
  return useCachedEntity<User>(useUsersStore, API_ENDPOINTS.users, 'Erro ao buscar usuarios', 'useCachedUsers')
}

export function useCachedUnits(): UseCachedDataResult<Unit> {
  return useCachedEntity<Unit>(useUnitsStore, API_ENDPOINTS.units, 'Erro ao buscar unidades', 'useCachedUnits')
}

export function useCachedSuppliers(): UseCachedDataResult<Supplier> {
  return useCachedEntity<Supplier>(
    useSuppliersStore,
    API_ENDPOINTS.suppliers,
    'Erro ao buscar fornecedores',
    'useCachedSuppliers'
  )
}

export function useCachedFolders(): UseCachedDataResult<Folder> {
  return useCachedEntity<Folder>(useFoldersStore, API_ENDPOINTS.folders, 'Erro ao buscar pastas', 'useCachedFolders')
}

export function useCachedCareGroups(): UseCachedDataResult<CareGroup> {
  return useCachedEntity<CareGroup>(
    useCareGroupsStore,
    API_ENDPOINTS.careGroups,
    'Erro ao buscar grupos de cuidado',
    'useCachedCareGroups'
  )
}

export function useCachedProfessionals(): UseCachedDataResult<Professional> {
  return useCachedEntity<Professional>(
    useProfessionalsStore,
    API_ENDPOINTS.professionals,
    'Erro ao buscar profissionais',
    'useCachedProfessionals'
  )
}

interface UseCachedNotificationsResult {
  data: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  errorCount: number
  refetch: () => Promise<void>
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  invalidate: () => void
  resetErrors: () => void
}

export function useCachedNotifications(): UseCachedNotificationsResult {
  const { data: session } = useSession()
  const store = useNotificationsStore()
  const fetchingRef = useRef(false)
  const scopeRef = useRef<string | null>(null)
  const accessToken = (session as any)?.accessToken as string | undefined

  const fetchData = useCallback(async () => {
    if (fetchingRef.current || store.cache.isLoading) return
    if (!store.canRetry()) {
      console.warn('[useCachedNotifications] Maximo de tentativas atingido ou em cooldown')
      return
    }

    fetchingRef.current = true
    store.setLoading(true)

    try {
      const data = await fetchAllPages<unknown>(API_ENDPOINTS.notifications, 'Erro ao buscar notificacoes', accessToken)
      store.setData(data.map(toNotification))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido'
      store.setError(message)
    } finally {
      fetchingRef.current = false
    }
  }, [store, accessToken])

  useEffect(() => {
    clearLegacyPersistedCachesOnce()
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    const scopeKey = `${userId}:${session?.user?.subscriberId || ''}`
    const scopeChanged = scopeRef.current !== scopeKey

    if (scopeChanged) {
      scopeRef.current = scopeKey
      store.invalidate()
    }

    if ((scopeChanged || store.isStale()) && !store.cache.isLoading && !fetchingRef.current && store.canRetry()) {
      void fetchData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, session?.user?.subscriberId])

  return {
    data: store.cache.data,
    unreadCount: store.cache.unreadCount,
    isLoading: store.cache.isLoading,
    error: store.cache.error,
    errorCount: store.cache.errorCount,
    refetch: fetchData,
    markAsRead: store.markAsRead,
    markAllAsRead: store.markAllAsRead,
    invalidate: store.invalidate,
    resetErrors: store.resetErrors,
  }
}

export function useCachedCare(): UseCachedDataResult<Care> {
  return useCachedEntity<Care>(useCareStore, API_ENDPOINTS.care, 'Erro ao buscar cuidados', 'useCachedCare')
}

export function useInvalidateAllCaches() {
  const usersStore = useUsersStore()
  const unitsStore = useUnitsStore()
  const suppliersStore = useSuppliersStore()
  const foldersStore = useFoldersStore()
  const careGroupsStore = useCareGroupsStore()
  const professionalsStore = useProfessionalsStore()
  const notificationsStore = useNotificationsStore()
  const careStore = useCareStore()

  return useCallback(() => {
    clearLegacyPersistedCachesOnce()
    usersStore.invalidate()
    unitsStore.invalidate()
    suppliersStore.invalidate()
    foldersStore.invalidate()
    careGroupsStore.invalidate()
    professionalsStore.invalidate()
    notificationsStore.invalidate()
    careStore.invalidate()
  }, [
    usersStore,
    unitsStore,
    suppliersStore,
    foldersStore,
    careGroupsStore,
    professionalsStore,
    notificationsStore,
    careStore,
  ])
}
