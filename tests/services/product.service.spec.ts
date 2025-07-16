import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PaginationParams } from '../../src/decorators/pagination'
import { ProductSearchQuery } from '../../src/domains/product.domain'
import { Category, Product } from '../../src/entities'
import { ProductService } from '../../src/services/product.service'

describe('ProductService', () => {
  let service: ProductService
  let productRepository: jest.Mocked<Repository<Product>>

  // Mock data
  const mockCategory: Category = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Electronics',
    description: 'Electronic devices',
    parentId: undefined as any,
    parent: null as any,
    children: [],
    products: [],
    categoryAttributes: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockProduct: Product = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'iPhone 15',
    description: 'Latest iPhone model',
    sku: 'IPHONE-15-128GB',
    price: 999.99,
    categoryId: '11111111-1111-1111-1111-111111111111',
    category: mockCategory,
    isActive: true,
    attributeValues: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockProduct2: Product = {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Samsung Galaxy S24',
    description: 'Samsung flagship phone',
    sku: 'SAMSUNG-S24-256GB',
    price: 899.99,
    categoryId: '11111111-1111-1111-1111-111111111111',
    category: mockCategory,
    isActive: true,
    attributeValues: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockQueryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
      ],
    }).compile()

    service = module.get<ProductService>(ProductService)
    productRepository = module.get(getRepositoryToken(Product))

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

    it('should inject product repository', () => {
      expect(productRepository).toBeDefined()
    })
  })

  describe('searchProducts', () => {
    it('should search products with basic query', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = {
        keyword: 'iphone',
        page: 1,
        limit: 10,
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await service.searchProducts(searchQuery, pagination)

      // Assert
      expect(result.data).toHaveLength(1)
      expect(result.data[0]).toEqual(mockProduct)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.totalPages).toBe(1)

      expect(queryBuilder.where).toHaveBeenCalledWith('product.isActive = :isActive', { isActive: true })

    })

    it('should apply keyword filter correctly', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = { keyword: 'Samsung Galaxy' }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct2], 1]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.searchProducts(searchQuery)

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(product.searchVector ILIKE :keyword OR LOWER(product.name) LIKE :keyword OR LOWER(product.description) LIKE :keyword)',
        { keyword: '%samsung galaxy%' }
      )
    })

    it('should apply category filter with single category', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = {
        categoryIds: '11111111-1111-1111-1111-111111111111',
      }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.searchProducts(searchQuery)

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.categoryPath LIKE :categoryPath', {
        categoryPath: '%11111111-1111-1111-1111-111111111111%'
      })
    })

    it('should apply category filter with multiple categories', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = {
        categoryIds: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
      }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.searchProducts(searchQuery)

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('(product.categoryPath LIKE :categoryPath0 OR product.categoryPath LIKE :categoryPath1)')
      expect(queryBuilder.setParameter).toHaveBeenCalledWith('categoryPath0', '%11111111-1111-1111-1111-111111111111%')
      expect(queryBuilder.setParameter).toHaveBeenCalledWith('categoryPath1', '%22222222-2222-2222-2222-222222222222%')
    })

    it('should apply price filters', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = {
        priceMin: 500,
        priceMax: 1000,
      }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.searchProducts(searchQuery)

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.price >= :priceMin', { priceMin: 500 })
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.price <= :priceMax', { priceMax: 1000 })
    })

    it('should apply attribute filters', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = {
        attributes: {
          brand: ['apple', 'samsung'],
          storage: ['128gb'],
        },
      }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.searchProducts(searchQuery)

      // Assert
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'product.attributeIndex::jsonb ? :attrKey0 AND product.attributeIndex::jsonb ->> :attrKey0 ~ :attrPattern0',
        {
          attrKey0: 'brand',
          attrPattern0: 'apple|samsung',
        }
      )
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        'product.attributeIndex::jsonb ? :attrKey1 AND product.attributeIndex::jsonb ->> :attrKey1 ~ :attrPattern1',
        {
          attrKey1: 'storage',
          attrPattern1: '128gb',
        }
      )
    })

    it('should apply relevance sorting with keyword', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = {
        keyword: 'iphone',
        sortBy: 'relevance',
        sortOrder: 'DESC',
      }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.searchProducts(searchQuery)

      // Assert
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('product.searchScore', 'DESC')
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('product.name', 'DESC')
    })

    it('should apply standard sorting', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = {
        sortBy: 'price',
        sortOrder: 'ASC',
      }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.searchProducts(searchQuery)

      // Assert
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('product.price', 'ASC')
    })

    it('should handle pagination correctly', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = { page: 3, limit: 5 }
      const pagination: PaginationParams = { offset: 10, limit: 5 }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 25]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await service.searchProducts(searchQuery, pagination)

      // Assert
      expect(result.page).toBe(3) // Math.floor(10 / 5) + 1
      expect(result.limit).toBe(5)
      expect(result.totalPages).toBe(5) // Math.ceil(25 / 5)
      expect(queryBuilder.skip).toHaveBeenCalledWith(10) // (page - 1) * limit = (3 - 1) * 5
      expect(queryBuilder.take).toHaveBeenCalledWith(5)
    })

    it('should use default pagination when not provided', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = {}

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockProduct], 1]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await service.searchProducts(searchQuery)

      // Assert
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
      expect(queryBuilder.skip).toHaveBeenCalledWith(0)
      expect(queryBuilder.take).toHaveBeenCalledWith(20)
    })
  })

  describe('findById', () => {
    it('should find product by id with relations', async () => {
      // Arrange
      const productId = '22222222-2222-2222-2222-222222222222'

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockProduct),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await service.findById(productId)

      // Assert
      expect(result).toEqual(mockProduct)
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.category', 'category')
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.attributeValues', 'attributeValues')
      expect(queryBuilder.where).toHaveBeenCalledWith('product.id = :id', { id: productId })
    })

    it('should return null when product not found', async () => {
      // Arrange
      const productId = 'nonexistent-id'

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await service.findById(productId)

      // Assert
      expect(result).toBeNull()
    })
  })

  describe('getProductById', () => {
    it('should delegate to findById', async () => {
      // Arrange
      const productId = '22222222-2222-2222-2222-222222222222'
      jest.spyOn(service, 'findById').mockResolvedValue(mockProduct)

      // Act
      const result = await service.getProductById(productId)

      // Assert
      expect(result).toEqual(mockProduct)
      expect(service.findById).toHaveBeenCalledWith(productId)
    })
  })

  describe('findByCategory', () => {
    it('should find products by category id', async () => {
      // Arrange
      const categoryId = '11111111-1111-1111-1111-111111111111'

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct, mockProduct2]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await service.findByCategory(categoryId)

      // Assert
      expect(result).toHaveLength(2)
      expect(result).toEqual([mockProduct, mockProduct2])
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.category', 'category')
      expect(queryBuilder.leftJoinAndSelect).toHaveBeenCalledWith('product.attributeValues', 'attributeValues')
      expect(queryBuilder.where).toHaveBeenCalledWith('product.categoryId = :categoryId', { categoryId })
    })

    it('should return empty array when no products found', async () => {
      // Arrange
      const categoryId = 'nonexistent-category'

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await service.findByCategory(categoryId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('getRecommendations', () => {
    it('should return recommendations based on category and price range', async () => {
      // Arrange
      const productId = '22222222-2222-2222-2222-222222222222'
      const limit = 3

      productRepository.findOne.mockResolvedValue(mockProduct)

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockProduct2]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await service.getRecommendations(productId, limit)

      // Assert
      expect(result).toEqual([mockProduct2])
      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId, isActive: true },
        select: ['id', 'categoryId', 'price'],
      })
      expect(queryBuilder.where).toHaveBeenCalledWith('product.categoryId = :categoryId', {
        categoryId: mockProduct.categoryId,
      })
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.id != :productId', { productId })
      expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.price BETWEEN :minPrice AND :maxPrice', {
        minPrice: mockProduct.price * 0.5,
        maxPrice: mockProduct.price * 1.5,
      })
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('RANDOM()')
      expect(queryBuilder.limit).toHaveBeenCalledWith(limit)
    })

    it('should return empty array when product not found', async () => {
      // Arrange
      const productId = 'nonexistent-id'

      productRepository.findOne.mockResolvedValue(null)

      // Act
      const result = await service.getRecommendations(productId)

      // Assert
      expect(result).toEqual([])
      expect(productRepository.findOne).toHaveBeenCalledWith({
        where: { id: productId, isActive: true },
        select: ['id', 'categoryId', 'price'],
      })
    })

    it('should use default limit when not provided', async () => {
      // Arrange
      const productId = '22222222-2222-2222-2222-222222222222'

      productRepository.findOne.mockResolvedValue(mockProduct)

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.getRecommendations(productId)

      // Assert
      expect(queryBuilder.limit).toHaveBeenCalledWith(5) // Default limit
    })
  })

  describe('private methods', () => {
    let queryBuilder: any

    beforeEach(() => {
      queryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
      }
    })

    describe('applyKeywordFilter', () => {
      it('should apply keyword filter when keyword provided', () => {
        // Act
        (service as any).applyKeywordFilter(queryBuilder, 'test keyword')

        // Assert
        expect(queryBuilder.andWhere).toHaveBeenCalledWith(
          '(product.searchVector ILIKE :keyword OR LOWER(product.name) LIKE :keyword OR LOWER(product.description) LIKE :keyword)',
          { keyword: '%test keyword%' }
        )
      })

      it('should not apply filter when keyword is undefined', () => {
        // Act
        (service as any).applyKeywordFilter(queryBuilder, undefined)

        // Assert
        expect(queryBuilder.andWhere).not.toHaveBeenCalled()
      })
    })

    describe('applyCategoryFilter', () => {
      it('should apply filter for single category ID as string', () => {
        // Act
        (service as any).applyCategoryFilter(queryBuilder, 'category-1')

        // Assert
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.categoryPath LIKE :categoryPath', {
          categoryPath: '%category-1%'
        })
      })

      it('should apply filter for multiple category IDs', () => {
        // Act
        (service as any).applyCategoryFilter(queryBuilder, ['category-1', 'category-2'])

        // Assert
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('(product.categoryPath LIKE :categoryPath0 OR product.categoryPath LIKE :categoryPath1)')
        expect(queryBuilder.setParameter).toHaveBeenCalledWith('categoryPath0', '%category-1%')
        expect(queryBuilder.setParameter).toHaveBeenCalledWith('categoryPath1', '%category-2%')
      })

      it('should not apply filter when no categories provided', () => {
        // Act
        (service as any).applyCategoryFilter(queryBuilder, undefined)

        // Assert
        expect(queryBuilder.andWhere).not.toHaveBeenCalled()
      })
    })

    describe('applyPriceFilter', () => {
      it('should apply minimum price filter', () => {
        // Act
        (service as any).applyPriceFilter(queryBuilder, 100, undefined)

        // Assert
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.price >= :priceMin', { priceMin: 100 })
      })

      it('should apply maximum price filter', () => {
        // Act
        (service as any).applyPriceFilter(queryBuilder, undefined, 500)

        // Assert
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.price <= :priceMax', { priceMax: 500 })
      })

      it('should apply both price filters', () => {
        // Act
        (service as any).applyPriceFilter(queryBuilder, 100, 500)

        // Assert
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.price >= :priceMin', { priceMin: 100 })
        expect(queryBuilder.andWhere).toHaveBeenCalledWith('product.price <= :priceMax', { priceMax: 500 })
      })
    })

    describe('applySorting', () => {
      it('should apply relevance sorting with keyword', () => {
        // Act
        (service as any).applySorting(queryBuilder, 'relevance', 'DESC', 'search term')

        // Assert
        expect(queryBuilder.orderBy).toHaveBeenCalledWith('product.searchScore', 'DESC')
        expect(queryBuilder.addOrderBy).toHaveBeenCalledWith('product.name', 'DESC')
      })

      it('should apply relevance sorting without keyword', () => {
        // Act
        (service as any).applySorting(queryBuilder, 'relevance', 'ASC', undefined)

        // Assert
        expect(queryBuilder.orderBy).toHaveBeenCalledWith('product.searchScore', 'DESC')
        expect(queryBuilder.addOrderBy).not.toHaveBeenCalled()
      })

      it('should apply standard sorting', () => {
        // Act
        (service as any).applySorting(queryBuilder, 'price', 'ASC')

        // Assert
        expect(queryBuilder.orderBy).toHaveBeenCalledWith('product.price', 'ASC')
      })

      it('should use default sorting parameters', () => {
        // Act
        (service as any).applySorting(queryBuilder)

        // Assert
        expect(queryBuilder.orderBy).toHaveBeenCalledWith('product.name', 'ASC')
      })
    })
  })

  describe('error handling', () => {
    it('should handle database errors in searchProducts', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = { keyword: 'test' }
      const error = new Error('Database connection failed')

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockRejectedValue(error),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act & Assert
      await expect(service.searchProducts(searchQuery)).rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in findById', async () => {
      // Arrange
      const productId = 'test-id'
      const error = new Error('Database connection failed')

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockRejectedValue(error),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act & Assert
      await expect(service.findById(productId)).rejects.toThrow('Database connection failed')
    })

    it('should handle database errors in getRecommendations', async () => {
      // Arrange
      const productId = 'test-id'
      const error = new Error('Database connection failed')

      productRepository.findOne.mockRejectedValue(error)

      // Act & Assert
      await expect(service.getRecommendations(productId)).rejects.toThrow('Database connection failed')
    })
  })

  describe('edge cases', () => {
    it('should handle empty search results', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = { keyword: 'nonexistent' }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      const result = await service.searchProducts(searchQuery)

      // Assert
      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
      expect(result.totalPages).toBe(0)
    })

    it('should handle empty category array', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = { categoryIds: [] }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.searchProducts(searchQuery)

      // Assert
      // Should not apply category filter for empty array
      expect(queryBuilder.setParameter).not.toHaveBeenCalledWith(expect.stringContaining('categoryPath'), expect.any(String))
    })

    it('should handle empty attributes object', async () => {
      // Arrange
      const searchQuery: ProductSearchQuery = { attributes: {} }

      const queryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        setParameter: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      }

      productRepository.createQueryBuilder.mockReturnValue(queryBuilder as any)

      // Act
      await service.searchProducts(searchQuery)

      // Assert
      // Should not apply any attribute filters
      const attributeFilterCalls = (queryBuilder.andWhere as jest.Mock).mock.calls.filter(call =>
        call[0]?.includes('attributeIndex::jsonb')
      )
      expect(attributeFilterCalls).toHaveLength(0)
    })
  })
})
