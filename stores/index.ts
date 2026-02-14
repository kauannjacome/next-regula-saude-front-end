// ==========================================
// STORES: EXPORTAÇÃO CENTRALIZADA
// ==========================================
// Todos os stores Zustand do sistema

// Stores de UI e Auth
export { useUIStore } from './ui-store'
export { useAuthStore } from './auth-store'

// Stores de Entidades
export { useUsersStore } from './users-store'
export { useUnitsStore } from './units-store'
export { useSuppliersStore } from './suppliers-store'
export { useFoldersStore } from './folders-store'
export { useCareGroupsStore } from './care-groups-store'
export { useProfessionalsStore } from './professionals-store'
export { useNotificationsStore } from './notifications-store'
export { useCareStore } from './care-store'

// Tipos exportados
export type { Notification } from './notifications-store'
export type { Care } from './care-store'

// Factory para criar stores
export { createEntityStore, type EntityStoreState } from './create-store'
