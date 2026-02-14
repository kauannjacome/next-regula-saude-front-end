// ==========================================
// TIPOS: ENTIDADES DO SISTEMA
// ==========================================
// Definições de tipos para todas as entidades principais
// Usado em stores, hooks e componentes

// -----------------------------------------
// USUÁRIO
// -----------------------------------------
export interface User {
  id: string
  uuid?: string
  name: string
  email: string
  roleDisplayName?: string
  status?: string
  avatarUploadId?: number
  avatarUpload?: {
    id: number
    fileUrl: string
    fileName: string
  }
  position?: string
  registryType?: string
  registryNumber?: string
  registryState?: string
  phone?: string
  cpf?: string
  unitId?: number
  unit?: {
    id: number
    name: string
  }
  subscriberId?: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  employments?: Array<{
    tenantRole?: { name: string; displayName: string }
  }>
}

// -----------------------------------------
// UNIDADE DE SAÚDE
// -----------------------------------------
export interface Unit {
  id: number
  uuid?: string
  name: string
  cnes?: string
  address?: string
  city?: string
  state?: string
  phone?: string
  email?: string
  type?: string
  subscriberId?: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

// -----------------------------------------
// FORNECEDOR
// -----------------------------------------
export interface Supplier {
  id: number
  uuid?: string
  name: string
  tradeName?: string
  cnpj?: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  subscriberId?: number
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
}

// -----------------------------------------
// PASTA (FOLDER)
// -----------------------------------------
export interface Folder {
  id: number
  uuid?: string
  name: string
  idCode?: string
  description?: string
  subscriberId?: number
  responsibleId?: string
  responsible?: {
    id: string
    name: string
  }
  startDate?: string
  endDate?: string
  createdAt?: string
  updatedAt?: string
  deletedAt?: string | null
  _count?: {
    regulations: number
  }
}

// -----------------------------------------
// GRUPO DE CUIDADO
// -----------------------------------------
export interface CareGroup {
  id: number
  uuid?: string
  name: string
  description?: string
  color?: string
  subscriberId?: number
  createdAt?: string
  updatedAt?: string
  _count?: {
    citizens: number
  }
}

// -----------------------------------------
// PROFISSIONAL
// -----------------------------------------
export interface Professional {
  id: number
  uuid?: string
  name: string
  specialty?: string
  cns?: string
  crm?: string
  email?: string
  phone?: string
  unitId?: number
  unit?: {
    id: number
    name: string
  }
  subscriberId?: number
  createdAt?: string
  updatedAt?: string
}

// -----------------------------------------
// CIDADÃO
// -----------------------------------------
export interface Citizen {
  id: number
  uuid?: string
  name: string
  cpf?: string
  cns?: string
  birthDate?: string
  sex?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  careGroupId?: number
  careGroup?: CareGroup
  subscriberId?: number
  createdAt?: string
  updatedAt?: string
}

// -----------------------------------------
// REGULAÇÃO
// -----------------------------------------
export interface Regulation {
  id: number
  uuid?: string
  idCode?: string
  protocolNumber?: string
  status: string
  priority: string
  description?: string
  notes?: string
  clinicalIndication?: string
  cid?: string
  resourceOrigin?: string
  citizenId?: number
  citizen?: Citizen
  unitId?: number
  unit?: Unit
  folderId?: number
  folder?: Folder
  supplierId?: number
  supplier?: Supplier
  creatorId?: string
  creator?: User
  responsibleId?: number
  responsible?: Citizen
  analyzedId?: string
  analyzer?: User
  subscriberId?: number
  requestDate?: string
  completedDate?: string
  createdAt?: string
  updatedAt?: string
}

// -----------------------------------------
// CACHE ENTRY (para stores)
// -----------------------------------------
export interface CacheEntry<T> {
  data: T[]
  timestamp: number
  isLoading: boolean
  error: string | null
  // Controle de erros para evitar requisições infinitas
  errorCount: number
  errorTimestamp: number
}

// Helper para criar entrada de cache vazia
export function createEmptyCacheEntry<T>(): CacheEntry<T> {
  return {
    data: [],
    timestamp: 0,
    isLoading: false,
    error: null,
    errorCount: 0,
    errorTimestamp: 0,
  }
}
