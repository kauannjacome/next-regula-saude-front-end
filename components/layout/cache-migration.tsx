'use client'

import { useEffect } from 'react'

const LEGACY_CACHE_KEYS = [
  'users-cache',
  'units-cache',
  'suppliers-cache',
  'folders-cache',
  'care-groups-cache',
  'professionals-cache',
  'notifications-cache',
  'care-cache',
] as const

let hasMigrated = false

export function CacheMigration() {
  useEffect(() => {
    if (hasMigrated) return

    try {
      for (const key of LEGACY_CACHE_KEYS) {
        window.localStorage.removeItem(key)
      }
    } catch {
      // Ignore browser storage errors.
    } finally {
      hasMigrated = true
    }
  }, [])

  return null
}
