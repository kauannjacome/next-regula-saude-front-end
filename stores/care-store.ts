import { createEntityStore } from './create-store'

export interface Care {
  id: number
  uuid?: string
  citizenId: number
  citizen?: {
    id: number
    name: string
    cpf?: string
  }
  professionalId?: string
  professional?: {
    id: string
    name: string
  }
  careGroupId?: number
  careGroup?: {
    id: number
    name: string
  }
  unitId?: number
  unit?: {
    id: number
    name: string
  }
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  type?: string
  description?: string
  notes?: string
  scheduledDate?: string
  completedDate?: string
  subscriberId?: number
  createdAt?: string
  updatedAt?: string
}

export const useCareStore = createEntityStore<Care>({
  name: 'care',
  ttl: 30 * 60 * 1000,
})
