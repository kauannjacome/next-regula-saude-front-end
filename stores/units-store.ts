import type { Unit } from '@/types/entities'
import { createEntityStore } from './create-store'

export const useUnitsStore = createEntityStore<Unit>({
  name: 'units',
})
