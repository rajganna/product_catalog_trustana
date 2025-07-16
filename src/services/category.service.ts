import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { CATEGORY_QUERIES } from '../constants/category-queries'
import { PaginationParams } from '../decorators/pagination'
import { Category, CategoryAttribute, Product } from '../entities'
import { GetCategoriesQueryDto } from '../requests/get-categories-query.dto'
import { GetCategoryTreeQueryDto } from '../requests/get-category-tree-query.dto'
import { CategoryResponse, PaginatedCategoryResponse } from '../responses/category.response'
import { CacheService } from './cache.service'

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(CategoryAttribute)
    private readonly categoryAttributeRepository: Repository<CategoryAttribute>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cacheService: CacheService,
  ) { }

  async getCategories(
    query: GetCategoriesQueryDto,
    pagination?: PaginationParams,
  ): Promise<PaginatedCategoryResponse> {
    // Use pagination params if provided, otherwise fall back to query params
    const page = pagination?.offset ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : (query.page ?? 1)
    const limit = pagination?.limit ?? query.limit ?? 10

    const cacheKey = this.cacheService.keys.categories({
      keyword: query.keyword,
      parentId: query.parentId,
      includeAttributeCount: query.includeAttributeCount,
      includeProductCount: query.includeProductCount,
      page,
      limit,
      sortBy: query.sortBy ?? 'name',
      sortOrder: query.sortOrder ?? 'ASC',
    })

    const cached = await this.cacheService.get<PaginatedCategoryResponse>(cacheKey)
    if (cached) {
      return cached
    }

    const result = await this.fetchCategoriesFromDatabase(query, pagination)

    await this.cacheService.set(
      cacheKey,
      result,
      this.cacheService['TTL'].CATEGORIES,
    )

    return result
  }

  private async fetchCategoriesFromDatabase(
    query: GetCategoriesQueryDto,
    pagination?: PaginationParams,
  ): Promise<PaginatedCategoryResponse> {
    // Use pagination params if provided, otherwise fall back to query params
    const page = pagination?.offset ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : (query.page ?? 1)
    const limit = pagination?.limit ?? query.limit ?? 10

    const {
      keyword,
      parentId,
      includeAttributeCount = false,
      includeProductCount = false,
      sortBy = 'name',
      sortOrder = 'ASC',
    } = query

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .where('1=1') // Always true base condition

    // Apply filters
    if (keyword) {
      queryBuilder.andWhere(
        '(LOWER(category.name) LIKE LOWER(:keyword) OR LOWER(category.description) LIKE LOWER(:keyword))',
        { keyword: `%${keyword}%` }
      )
    }

    if (parentId) {
      queryBuilder.andWhere('category.parentId = :parentId', { parentId })
    } else if (parentId === null) {
      queryBuilder.andWhere('category.parentId IS NULL')
    }

    // Count total before applying pagination
    const total = await queryBuilder.getCount()

    // Apply sorting
    queryBuilder.orderBy(`category.${sortBy}`, sortOrder)

    // Apply pagination
    queryBuilder.skip((page - 1) * limit).take(limit)

    const categories = await queryBuilder.getMany()

    // Transform to response with optional counts
    const data = await Promise.all(
      categories.map(async (category) => {
        const response: CategoryResponse = {
          id: category.id,
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        }

        if (includeAttributeCount) {
          const attributeCount = await this.categoryAttributeRepository
            .createQueryBuilder('ca')
            .innerJoin('ca.attribute', 'attr')
            .where('ca.categoryId = :categoryId', { categoryId: category.id })
            .andWhere('attr.isActive = :isActive', { isActive: true })
            .getCount()
          response.directAttributeCount = attributeCount
        }

        if (includeProductCount) {
          const productCount = await this.productRepository
            .createQueryBuilder('product')
            .where('product.categoryId = :categoryId', { categoryId: category.id })
            .andWhere('product.isActive = :isActive', { isActive: true })
            .getCount()
          response.productCount = productCount
        }

        return response
      })
    )

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  async getCategoryTree(
    query: GetCategoryTreeQueryDto,
  ): Promise<CategoryResponse[]> {
    // Use boolean values from DTO
    const includeAttributeCount = query.includeAttributeCount === true
    const includeProductCount = query.includeProductCount === true

    // Build cache key
    const cacheKey = this.cacheService.keys.categoryTree({
      includeAttributeCount,
      includeProductCount,
    })

    // Try to get from cache first
    const cached = await this.cacheService.get<CategoryResponse[]>(cacheKey)
    if (cached) {
      return cached
    }

    // If not in cache, fetch from database
    const result = await this.fetchCategoryTreeFromDatabase(
      includeAttributeCount,
      includeProductCount,
    )

    // Cache the result
    await this.cacheService.set(
      cacheKey,
      result,
      this.cacheService['TTL'].CATEGORIES,
    )

    return result
  }

  private async fetchCategoryTreeFromDatabase(
    includeAttributeCount: boolean,
    includeProductCount: boolean,
  ): Promise<CategoryResponse[]> {
    const simplifiedQuery = this.buildCategoryTreeQuery(
      includeAttributeCount,
      includeProductCount,
    )
    const result = await this.categoryRepository.query(simplifiedQuery)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return result.map((row: any) => row.category_json)
  }

  private buildCategoryTreeQuery(
    includeAttributeCount: boolean,
    includeProductCount: boolean,
  ): string {
    return CATEGORY_QUERIES.BUILD_CATEGORY_TREE(
      includeAttributeCount,
      includeProductCount,
    )
  }

  /**
   * Invalidate category tree caches when data changes
   */
  async invalidateCategoryTreeCaches(): Promise<void> {
    await this.cacheService.invalidateCategory()
  }

  /**
   * Invalidate specific category caches
   */
  async invalidateSpecificCategoryCache(categoryId: string): Promise<void> {
    await this.cacheService.invalidateCategory(categoryId)
  }
}
