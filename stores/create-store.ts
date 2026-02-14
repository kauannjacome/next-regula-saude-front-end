import { create } from 'zustand'
import type { CacheEntry } from '@/types/entities'

const DEFAULT_CACHE_TTL = 45 * 60 * 1000
const ERROR_COOLDOWN_BASE = 30 * 1000
const MAX_ERROR_RETRIES = 5

export interface EntityStoreState<T> {
  cache: CacheEntry<T>
  setData: (data: T[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  invalidate: () => void
  isStale: () => boolean
  canRetry: () => boolean
  resetErrors: () => void
}

interface CreateEntityStoreConfig {
  name: string
  ttl?: number
}

export function createEntityStore<T>(config: CreateEntityStoreConfig) {
  const { ttl = DEFAULT_CACHE_TTL } = config

  const initialCache: CacheEntry<T> = {
    data: [],
    timestamp: 0,
    isLoading: false,
    error: null,
    errorCount: 0,
    errorTimestamp: 0,
  }

  return create<EntityStoreState<T>>()((set, get) => ({
    cache: initialCache,

    setData: (data) =>
      set({
        cache: {
          data,
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

    invalidate: () =>
      set({
        cache: { ...initialCache },
      }),

    isStale: () => {
      const { timestamp } = get().cache
      if (!timestamp) return true
      return Date.now() - timestamp > ttl
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
}
