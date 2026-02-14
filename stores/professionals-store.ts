import type { Professional } from '@/types/entities'
import { createEntityStore } from './create-store'

export const useProfessionalsStore = createEntityStore<Professional>({
  name: 'professionals',
})
