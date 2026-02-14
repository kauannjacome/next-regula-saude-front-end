export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, string[]>
}
