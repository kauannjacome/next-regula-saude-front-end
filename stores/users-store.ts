import type { User } from '@/types/entities'
import { createEntityStore } from './create-store'

export const useUsersStore = createEntityStore<User>({
  name: 'users',
})
