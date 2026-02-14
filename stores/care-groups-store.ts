import type { CareGroup } from '@/types/entities'
import { createEntityStore } from './create-store'

export const useCareGroupsStore = createEntityStore<CareGroup>({
  name: 'care-groups',
})
