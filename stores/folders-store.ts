import type { Folder } from '@/types/entities'
import { createEntityStore } from './create-store'

export const useFoldersStore = createEntityStore<Folder>({
  name: 'folders',
})
