export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ListResponse<T> {
  data: T[]
  pagination: Pagination
}

export interface LegacyListResponse<T> extends ListResponse<T> {
  meta?: Pagination
  total?: number
  page?: number
  limit?: number
  totalPages?: number
}
