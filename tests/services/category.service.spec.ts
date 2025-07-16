import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PaginationParams } from '../../src/decorators/pagination'
import { Category, CategoryAttribute, Product } from '../../src/entities'
import { GetCategoriesQueryDto } from '../../src/requests/get-categories-query.dto'
import { GetCategoryTreeQueryDto } from '../../src/requests/get-category-tree-query.dto'
import { CategoryResponse, PaginatedCategoryResponse } from '../../src/responses/category.response'
import { CacheService } from '../../src/services/cache.service'
import { CategoryService } from '../../src/services/category.service'

describe('CategoryService', () => {
  let service: CategoryService
  let categoryRepository: jest.Mocked<Repository<Category>>
  let categoryAttributeRepository: jest.Mocked<Repository<CategoryAttribute>>
  let productRepository: jest.Mocked<Repository<Product>>
  let cacheService: jest.Mocked<CacheService>

  // Mock data
  const mockCategory: Category = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    parentId: undefined as any, // Root category has no parent
    parent: null as any,
    children: [],
    products: [],
    categoryAttributes: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockChildCategory: Category = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Smartphones',
    description: 'Mobile phones and accessories',
    parentId: '11111111-1111-1111-1111-111111111111',
    parent: mockCategory,
    children: [],
    products: [],
    categoryAttributes: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockCategoryResponse: CategoryResponse = {
    id: mockCategory.id,
    name: mockCategory.name,
    description: mockCategory.description,
    parentId: mockCategory.parentId || undefined, // Handle the type conversion
    createdAt: mockCategory.createdAt,
    updatedAt: mockCategory.updatedAt,
  }

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getCount: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            query: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CategoryAttribute),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            find: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            keys: {
              categories: jest.fn().mockReturnValue('categories-cache-key'),
              categoryTree: jest.fn().mockReturnValue('category-tree-cache-key'),
            },
            get: jest.fn(),
            set: jest.fn(),
            invalidateCategory: jest.fn(),
            TTL: {
              CATEGORIES: 3600,
            },
          },
        },
      ],
    }).compile()

    service = module.get<CategoryService>(CategoryService)
    categoryRepository = module.get(getRepositoryToken(Category))
    categoryAttributeRepository = module.get(getRepositoryToken(CategoryAttribute))
    productRepository = module.get(getRepositoryToken(Product))
    cacheService = module.get(CacheService)

    // Reset all mocks
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('constructor', () => {
    it('should be defined', () => {
      expect(service).toBeDefined()
    })

    it('should inject all required dependencies', () => {
      expect(categoryRepository).toBeDefined()
      expect(categoryAttributeRepository).toBeDefined()
      expect(productRepository).toBeDefined()
      expect(cacheService).toBeDefined()
    })
  })

  describe('getCategories', () => {
    it('should return cached result when available', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { keyword: 'electronics' }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const cachedResult: PaginatedCategoryResponse = {
        data: [mockCategoryResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      cacheService.get.mockResolvedValue(cachedResult)

      // Act
      const result = await service.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(cachedResult)
      expect(cacheService.get).toHaveBeenCalledWith('categories-cache-key')
      expect(cacheService.keys.categories).toHaveBeenCalledWith({
        keyword: query.keyword,
        parentId: query.parentId,
        includeAttributeCount: query.includeAttributeCount,
        includeProductCount: query.includeProductCount,
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      })
    })

    it('should fetch from database and cache result when cache miss', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { keyword: 'electronics' }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const mockResult: PaginatedCategoryResponse = {
        data: [mockCategoryResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      cacheService.get.mockResolvedValue(null)
      jest.spyOn(service as any, 'fetchCategoriesFromDatabase').mockResolvedValue(mockResult)

      // Act
      const result = await service.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(mockResult)
      expect(cacheService.set).toHaveBeenCalledWith('categories-cache-key', mockResult, 3600)
    })

    it('should use pagination params over query params', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { page: 5, limit: 20 }
      const pagination: PaginationParams = { offset: 30, limit: 15 }

      cacheService.get.mockResolvedValue(null)
      jest.spyOn(service as any, 'fetchCategoriesFromDatabase').mockResolvedValue({
        data: [],
        total: 0,
        page: 3,
        limit: 15,
        totalPages: 0,
      })

      // Act
      await service.getCategories(query, pagination)

      // Assert
      expect(cacheService.keys.categories).toHaveBeenCalledWith({
        keyword: query.keyword,
        parentId: query.parentId,
        includeAttributeCount: query.includeAttributeCount,
        includeProductCount: query.includeProductCount,
        page: 3, // Math.floor(30 / 15) + 1
        limit: 15,
        sortBy: 'name',
        sortOrder: 'ASC',
      })
    })
  })

  describe('fetchCategoriesFromDatabase', () => {
    beforeEach(() => {
      // Reset query builder mock
      jest.clearAllMocks()
    })

    it('should fetch categories with basic query', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      }

      categoryRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await (service as any).fetchCategoriesFromDatabase(query, pagination)

      // Assert
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.totalPages).toBe(1)
      expect(result.data[0]).toEqual(mockCategoryResponse)

      expect(queryBuilder.where).toHaveBeenCalledWith('1=1')
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('category.name', 'ASC')
      expect(queryBuilder.skip).toHaveBeenCalledWith(0)
      expect(queryBuilder.take).toHaveBeenCalledWith(10)
    })

    it('should apply keyword filtering', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { keyword: 'electronics' }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      }

      categoryRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await (service as any).fetchCategoriesFromDatabase(query, pagination)

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(category.name) LIKE LOWER(:keyword) OR LOWER(category.description) LIKE LOWER(:keyword))',
        { keyword: '%electronics%' }
      )
    })

    it('should apply parent ID filtering', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { parentId: '11111111-1111-1111-1111-111111111111' }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockChildCategory]),
      }

      categoryRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await (service as any).fetchCategoriesFromDatabase(query, pagination)

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'category.parentId = :parentId',
        { parentId: '11111111-1111-1111-1111-111111111111' }
      )
    })

    it('should apply sorting by different fields', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { sortBy: 'createdAt', sortOrder: 'DESC' }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      }

      categoryRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await (service as any).fetchCategoriesFromDatabase(query, pagination)

      // Assert
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('category.createdAt', 'DESC')
    })

    it('should include attribute count when requested', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { includeAttributeCount: true }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const categoryQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      }

      const attributeQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(5),
      }

      categoryRepository.createQueryBuilder.mockReturnValue(categoryQueryBuilder as any)
      categoryAttributeRepository.createQueryBuilder.mockReturnValue(attributeQueryBuilder as any)

      // Act
      const result = await (service as any).fetchCategoriesFromDatabase(query, pagination)

      // Assert
      expect(result.data[0].directAttributeCount).toBe(5)
      expect(attributeQueryBuilder.innerJoin).toHaveBeenCalledWith('ca.attribute', 'attr')
      expect(attributeQueryBuilder.where).toHaveBeenCalledWith('ca.categoryId = :categoryId', { categoryId: mockCategory.id })
      expect(attributeQueryBuilder.andWhere).toHaveBeenCalledWith('attr.isActive = :isActive', { isActive: true })
    })

    it('should include product count when requested', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { includeProductCount: true }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const categoryQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      }

      const productQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(3),
      }

      categoryRepository.createQueryBuilder.mockReturnValue(categoryQueryBuilder as any)
      productRepository.createQueryBuilder.mockReturnValue(productQueryBuilder as any)

      // Act
      const result = await (service as any).fetchCategoriesFromDatabase(query, pagination)

      // Assert
      expect(result.data[0].productCount).toBe(3)
      expect(productQueryBuilder.where).toHaveBeenCalledWith('product.categoryId = :categoryId', { categoryId: mockCategory.id })
      expect(productQueryBuilder.andWhere).toHaveBeenCalledWith('product.isActive = :isActive', { isActive: true })
    })

    it('should handle pagination correctly', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {}
      const pagination: PaginationParams = { offset: 20, limit: 5 }

      const queryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(25),
        getMany: jest.fn().mockResolvedValue([mockCategory]),
      }

      categoryRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await (service as any).fetchCategoriesFromDatabase(query, pagination)

      // Assert
      expect(result.page).toBe(5) // Math.floor(20 / 5) + 1
      expect(result.limit).toBe(5)
      expect(result.totalPages).toBe(5) // Math.ceil(25 / 5)
      expect(queryBuilder.skip).toHaveBeenCalledWith(20) // (page - 1) * limit = (5 - 1) * 5
      expect(queryBuilder.take).toHaveBeenCalledWith(5)
    })
  })

  describe('getCategoryTree', () => {
    it('should return cached result when available', async () => {
      // Arrange
      const query: GetCategoryTreeQueryDto = { includeAttributeCount: true }
      const cachedResult: CategoryResponse[] = [mockCategoryResponse]

      cacheService.get.mockResolvedValue(cachedResult)

      // Act
      const result = await service.getCategoryTree(query)

      // Assert
      expect(result).toEqual(cachedResult)
      expect(cacheService.get).toHaveBeenCalledWith('category-tree-cache-key')
      expect(cacheService.keys.categoryTree).toHaveBeenCalledWith({
        includeAttributeCount: true,
        includeProductCount: false,
      })
    })

    it('should fetch from database and cache result when cache miss', async () => {
      // Arrange
      const query: GetCategoryTreeQueryDto = { includeAttributeCount: true, includeProductCount: true }
      const mockResult: CategoryResponse[] = [mockCategoryResponse]

      cacheService.get.mockResolvedValue(null)
      jest.spyOn(service as any, 'fetchCategoryTreeFromDatabase').mockResolvedValue(mockResult)

      // Act
      const result = await service.getCategoryTree(query)

      // Assert
      expect(result).toEqual(mockResult)
      expect(cacheService.set).toHaveBeenCalledWith('category-tree-cache-key', mockResult, 3600)
      expect(service['fetchCategoryTreeFromDatabase']).toHaveBeenCalledWith(true, true)
    })

    it('should handle boolean conversion correctly', async () => {
      // Arrange
      const query: GetCategoryTreeQueryDto = { includeAttributeCount: undefined, includeProductCount: false }

      cacheService.get.mockResolvedValue(null)
      jest.spyOn(service as any, 'fetchCategoryTreeFromDatabase').mockResolvedValue([])

      // Act
      await service.getCategoryTree(query)

      // Assert
      expect(cacheService.keys.categoryTree).toHaveBeenCalledWith({
        includeAttributeCount: false,
        includeProductCount: false,
      })
      expect(service['fetchCategoryTreeFromDatabase']).toHaveBeenCalledWith(false, false)
    })
  })

  describe('fetchCategoryTreeFromDatabase', () => {
    it('should execute raw SQL query and transform results', async () => {
      // Arrange
      const mockQueryResult = [
        { category_json: mockCategoryResponse },
      ]

      categoryRepository.query.mockResolvedValue(mockQueryResult)
      jest.spyOn(service as any, 'buildCategoryTreeQuery').mockReturnValue('SELECT * FROM categories')

      // Act
      const result = await (service as any).fetchCategoryTreeFromDatabase(true, false)

      // Assert
      expect(result).toEqual([mockCategoryResponse])
      expect(categoryRepository.query).toHaveBeenCalledWith('SELECT * FROM categories')
      expect(service['buildCategoryTreeQuery']).toHaveBeenCalledWith(true, false)
    })
  })

  describe('buildCategoryTreeQuery', () => {
    it('should build query without optional fields', () => {
      // Act
      const query = (service as any).buildCategoryTreeQuery(false, false)

      // Assert
      expect(query).toContain('WITH RECURSIVE category_tree AS')
      expect(query).toContain('JSON_BUILD_OBJECT')
      expect(query).not.toContain('directAttributeCount')
      expect(query).not.toContain('productCount')
      expect(query).not.toContain('LEFT JOIN (')
    })

    it('should build query with attribute count', () => {
      // Act
      const query = (service as any).buildCategoryTreeQuery(true, false)

      // Assert
      expect(query).toContain('WITH RECURSIVE category_tree AS')
      expect(query).toContain('directAttributeCount')
      expect(query).toContain('category_attributes ca')
      expect(query).toContain('INNER JOIN attributes a')
      expect(query).not.toContain('productCount')
    })

    it('should build query with product count', () => {
      // Act
      const query = (service as any).buildCategoryTreeQuery(false, true)

      // Assert
      expect(query).toContain('WITH RECURSIVE category_tree AS')
      expect(query).toContain('productCount')
      expect(query).toContain('FROM products p')
      expect(query).not.toContain('directAttributeCount')
    })

    it('should build query with both counts', () => {
      // Act
      const query = (service as any).buildCategoryTreeQuery(true, true)

      // Assert
      expect(query).toContain('WITH RECURSIVE category_tree AS')
      expect(query).toContain('directAttributeCount')
      expect(query).toContain('productCount')
      expect(query).toContain('category_attributes ca')
      expect(query).toContain('FROM products p')
    })
  })

  describe('cache invalidation', () => {
    describe('invalidateCategoryTreeCaches', () => {
      it('should invalidate category caches', async () => {
        // Act
        await service.invalidateCategoryTreeCaches()

        // Assert
        expect(cacheService.invalidateCategory).toHaveBeenCalledWith()
      })
    })

    describe('invalidateSpecificCategoryCache', () => {
      it('should invalidate specific category cache', async () => {
        // Arrange
        const categoryId = '11111111-1111-1111-1111-111111111111'

        // Act
        await service.invalidateSpecificCategoryCache(categoryId)

        // Assert
        expect(cacheService.invalidateCategory).toHaveBeenCalledWith(categoryId)
      })
    })
  })
})
