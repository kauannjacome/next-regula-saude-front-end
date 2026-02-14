import { create } from 'zustand'

const CACHE_TTL = 5 * 60 * 1000
const ERROR_COOLDOWN_BASE = 30 * 1000
const MAX_ERROR_RETRIES = 5

export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  read: boolean
  createdAt: string
  link?: string
}

interface NotificationsCacheEntry {
  data: Notification[]
  unreadCount: number
  timestamp: number
  isLoading: boolean
  error: string | null
  errorCount: number
  errorTimestamp: number
}

interface NotificationsState {
  cache: NotificationsCacheEntry
  setData: (data: Notification[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  invalidate: () => void
  isStale: () => boolean
  canRetry: () => boolean
  resetErrors: () => void
}

const initialCache: NotificationsCacheEntry = {
  data: [],
  unreadCount: 0,
  timestamp: 0,
  isLoading: false,
  error: null,
  errorCount: 0,
  errorTimestamp: 0,
}

export const useNotificationsStore = create<NotificationsState>()((set, get) => ({
  cache: initialCache,

  setData: (data) =>
    set({
      cache: {
        data,
        unreadCount: data.filter((n) => !n.read).length,
        timestamp: Date.now(),
        isLoading: false,
        error: null,
        errorCount: 0,
        errorTimestamp: 0,
      },
    }),

  setLoading: (isLoading) =>
    set((state) => ({
      cache: { ...state.cache, isLoading },
    })),

  setError: (error) =>
    set((state) => ({
      cache: {
        ...state.cache,
        error,
        isLoading: false,
        errorCount: state.cache.errorCount + 1,
        errorTimestamp: Date.now(),
      },
    })),

  markAsRead: (id) =>
    set((state) => {
      const newData = state.cache.data.map((n) => (n.id === id ? { ...n, read: true } : n))
      return {
        cache: {
          ...state.cache,
          data: newData,
          unreadCount: newData.filter((n) => !n.read).length,
        },
      }
    }),

  markAllAsRead: () =>
    set((state) => {
      const newData = state.cache.data.map((n) => ({ ...n, read: true }))
      return {
        cache: {
          ...state.cache,
          data: newData,
          unreadCount: 0,
        },
      }
    }),

  invalidate: () =>
    set({
      cache: { ...initialCache },
    }),

  isStale: () => {
    const { timestamp } = get().cache
    if (!timestamp) return true
    return Date.now() - timestamp > CACHE_TTL
  },

  canRetry: () => {
    const { errorCount, errorTimestamp } = get().cache

    if (errorCount >= MAX_ERROR_RETRIES) {
      return false
    }

    if (errorCount === 0) {
      return true
    }

    const cooldown = ERROR_COOLDOWN_BASE * Math.pow(2, errorCount - 1)
    return Date.now() - errorTimestamp > cooldown
  },

  resetErrors: () =>
    set((state) => ({
      cache: {
        ...state.cache,
        error: null,
        errorCount: 0,
        errorTimestamp: 0,
      },
    })),
}))
