import type { Supplier } from '@/types/entities'
import { createEntityStore } from './create-store'

export const useSuppliersStore = createEntityStore<Supplier>({
  name: 'suppliers',
})
