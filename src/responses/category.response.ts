export class CategoryResponse {
  id: string
  name: string
  description?: string
  parentId?: string
  children?: CategoryResponse[]
  directAttributeCount?: number
  productCount?: number
  createdAt: Date
  updatedAt: Date
}

export class PaginatedCategoryResponse {
  data: CategoryResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
}
