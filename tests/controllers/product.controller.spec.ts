import { BadRequestException } from '@nestjs/common'
import { Test, TestingModule } from '@nestjs/testing'
import { ProductController } from '../../src/controllers/product.controller'
import { PaginationParams } from '../../src/decorators/pagination'
import { PaginatedProductResponse, ProductSearchQuery } from '../../src/domains/product.domain'
import { Product } from '../../src/entities/product.entity'
import { ProductSearchDto } from '../../src/requests/product-search.dto'
import { ProductService } from '../../src/services/product.service'

describe('ProductController', () => {
  let controller: ProductController
  let productService: ProductService

  // Mock data for testing
  const mockProduct: Product = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'iPhone 15 Pro',
    description: 'Latest iPhone with advanced features',
    sku: 'IPHONE-15-PRO-256',
    price: 999.99,
    categoryId: '11111111-1111-1111-1111-111111111111',
    category: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Smartphones',
      description: 'Mobile phones',
      parentId: '22222222-2222-2222-2222-222222222222',
      parent: {} as any,
      children: [],
      products: [],
      categoryAttributes: [],
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
    attributeValues: [],
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockProduct2: Product = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    name: 'Samsung Galaxy S24',
    description: 'Premium Android smartphone',
    sku: 'SAMSUNG-S24-128',
    price: 799.99,
    categoryId: '11111111-1111-1111-1111-111111111111',
    category: {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Smartphones',
      description: 'Mobile phones',
      parentId: '22222222-2222-2222-2222-222222222222',
      parent: {} as any,
      children: [],
      products: [],
      categoryAttributes: [],
      createdAt: new Date('2025-01-01T00:00:00Z'),
      updatedAt: new Date('2025-01-01T00:00:00Z'),
    },
    attributeValues: [],
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockPaginatedResponse: PaginatedProductResponse = {
    data: [mockProduct, mockProduct2],
    total: 2,
    page: 1,
    limit: 20,
    totalPages: 1,
  }

  const mockProductService = {
    searchProducts: jest.fn(),
    getProductById: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductController],
      providers: [
        {
          provide: ProductService,
          useValue: mockProductService,
        },
      ],
    }).compile()

    controller = module.get<ProductController>(ProductController)
    productService = module.get<ProductService>(ProductService)

    // Reset all mocks before each test
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('constructor', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined()
    })

    it('should inject ProductService', () => {
      expect(productService).toBeDefined()
    })
  })

  describe('searchProducts', () => {
    it('should return paginated products with default parameters', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {}
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: undefined,
        priceMin: undefined,
        priceMax: undefined,
        attributes: {},
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
      expect(productService.searchProducts).toHaveBeenCalledTimes(1)
    })

    it('should search products by keyword', async () => {
      // Arrange
      const searchDto: ProductSearchDto = { keyword: 'iPhone' }
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {}
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: 'iPhone',
        categoryIds: undefined,
        priceMin: undefined,
        priceMax: undefined,
        attributes: {},
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      const filteredResponse: PaginatedProductResponse = {
        ...mockPaginatedResponse,
        data: [mockProduct],
        total: 1,
      }
      mockProductService.searchProducts.mockResolvedValue(filteredResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(filteredResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should search products by single category ID', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {
        categoryIds: '11111111-1111-1111-1111-111111111111'
      }
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {}
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: '11111111-1111-1111-1111-111111111111',
        priceMin: undefined,
        priceMax: undefined,
        attributes: {},
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should search products by multiple category IDs', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222']
      }
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {}
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
        priceMin: undefined,
        priceMax: undefined,
        attributes: {},
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should search products with price range', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {
        priceMin: 500,
        priceMax: 1000
      }
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {}
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: undefined,
        priceMin: 500,
        priceMax: 1000,
        attributes: {},
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should extract single attribute filter from query params', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {
        attr_color: 'red',
        normalParam: 'ignored'
      }
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: undefined,
        priceMin: undefined,
        priceMax: undefined,
        attributes: { color: ['red'] },
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should extract multiple attribute values from comma-separated string', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {
        attr_storage: '64GB,128GB,256GB'
      }
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: undefined,
        priceMin: undefined,
        priceMax: undefined,
        attributes: { storage: ['64GB', '128GB', '256GB'] },
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should extract multiple attribute filters from query params', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {
        attr_brand: 'Apple,Samsung',
        attr_color: 'black',
        attr_storage: '256GB',
        someOtherParam: 'ignored'
      }
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: undefined,
        priceMin: undefined,
        priceMax: undefined,
        attributes: {
          brand: ['Apple', 'Samsung'],
          color: ['black'],
          storage: ['256GB']
        },
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should handle array attribute values from query params', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {
        attr_features: ['waterproof', 'wireless-charging']
      }
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: undefined,
        priceMin: undefined,
        priceMax: undefined,
        attributes: { features: ['waterproof', 'wireless-charging'] },
        page: 1,
        limit: 20,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should use pagination params over DTO params', async () => {
      // Arrange
      const searchDto: ProductSearchDto = { page: 5, limit: 50 }
      const pagination: PaginationParams = { offset: 40, limit: 10 }
      const queryParams = {}
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: undefined,
        priceMin: undefined,
        priceMax: undefined,
        attributes: {},
        page: 5, // calculated from offset: Math.floor(40 / 10) + 1
        limit: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should cap limit at 100 items per page', async () => {
      // Arrange
      const searchDto: ProductSearchDto = { limit: 200 }
      const pagination: PaginationParams = { offset: 0, limit: 150 }
      const queryParams = {}
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: undefined,
        priceMin: undefined,
        priceMax: undefined,
        attributes: {},
        page: 1,
        limit: 100, // capped at 100
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should handle sorting parameters', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {
        sortBy: 'price',
        sortOrder: 'DESC'
      }
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {}
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: undefined,
        categoryIds: undefined,
        priceMin: undefined,
        priceMax: undefined,
        attributes: {},
        page: 1,
        limit: 20,
        sortBy: 'price',
        sortOrder: 'DESC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should handle complex search with all parameters', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {
        keyword: 'smartphone',
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        priceMin: 500,
        priceMax: 1200,
        sortBy: 'price',
        sortOrder: 'ASC',
        page: 2,
        limit: 10
      }
      const pagination: PaginationParams = { offset: 10, limit: 10 }
      const queryParams = {
        attr_brand: 'Apple,Samsung',
        attr_storage: '128GB,256GB'
      }
      const expectedSearchQuery: ProductSearchQuery = {
        keyword: 'smartphone',
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        priceMin: 500,
        priceMax: 1200,
        attributes: {
          brand: ['Apple', 'Samsung'],
          storage: ['128GB', '256GB']
        },
        page: 2,
        limit: 10,
        sortBy: 'price',
        sortOrder: 'ASC',
      }
      mockProductService.searchProducts.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.searchProducts(searchDto, pagination, queryParams)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(productService.searchProducts).toHaveBeenCalledWith(expectedSearchQuery, pagination)
    })

    it('should handle service errors gracefully', async () => {
      // Arrange
      const searchDto: ProductSearchDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 20 }
      const queryParams = {}
      const error = new Error('Database connection failed')
      mockProductService.searchProducts.mockRejectedValue(error)

      // Act & Assert
      await expect(controller.searchProducts(searchDto, pagination, queryParams)).rejects.toThrow(
        'Database connection failed'
      )
      expect(productService.searchProducts).toHaveBeenCalledTimes(1)
    })
  })

  describe('getProductById', () => {
    it('should return product when found', async () => {
      // Arrange
      const productId = '123e4567-e89b-12d3-a456-426614174000'
      mockProductService.getProductById.mockResolvedValue(mockProduct)

      // Act
      const result = await controller.getProductById(productId)

      // Assert
      expect(result).toEqual(mockProduct)
      expect(productService.getProductById).toHaveBeenCalledWith(productId)
      expect(productService.getProductById).toHaveBeenCalledTimes(1)
    })

    it('should throw BadRequestException when product not found', async () => {
      // Arrange
      const productId = 'nonexistent-id'
      mockProductService.getProductById.mockResolvedValue(null)

      // Act & Assert
      await expect(controller.getProductById(productId)).rejects.toThrow(
        BadRequestException
      )
      await expect(controller.getProductById(productId)).rejects.toThrow(
        'Product not found'
      )
      expect(productService.getProductById).toHaveBeenCalledWith(productId)
    })

    it('should throw BadRequestException when product is undefined', async () => {
      // Arrange
      const productId = 'undefined-product'
      mockProductService.getProductById.mockResolvedValue(undefined)

      // Act & Assert
      await expect(controller.getProductById(productId)).rejects.toThrow(
        BadRequestException
      )
      expect(productService.getProductById).toHaveBeenCalledWith(productId)
    })

    it('should handle service errors gracefully', async () => {
      // Arrange
      const productId = '123e4567-e89b-12d3-a456-426614174000'
      const error = new Error('Database connection failed')
      mockProductService.getProductById.mockRejectedValue(error)

      // Act & Assert
      await expect(controller.getProductById(productId)).rejects.toThrow(
        'Database connection failed'
      )
      expect(productService.getProductById).toHaveBeenCalledWith(productId)
    })
  })

  describe('extractAttributeFilters (private method)', () => {
    it('should return empty object when queryParams is undefined', () => {
      // Act
      const result = (controller as any).extractAttributeFilters(undefined)

      // Assert
      expect(result).toEqual({})
    })

    it('should return empty object when queryParams is empty', () => {
      // Act
      const result = (controller as any).extractAttributeFilters({})

      // Assert
      expect(result).toEqual({})
    })

    it('should ignore non-attribute parameters', () => {
      // Arrange
      const queryParams = {
        keyword: 'test',
        page: '1',
        limit: '20',
        normalParam: 'value'
      }

      // Act
      const result = (controller as any).extractAttributeFilters(queryParams)

      // Assert
      expect(result).toEqual({})
    })

    it('should extract single attribute value', () => {
      // Arrange
      const queryParams = {
        attr_color: 'red'
      }

      // Act
      const result = (controller as any).extractAttributeFilters(queryParams)

      // Assert
      expect(result).toEqual({ color: ['red'] })
    })

    it('should extract comma-separated attribute values', () => {
      // Arrange
      const queryParams = {
        attr_size: 'small, medium, large'
      }

      // Act
      const result = (controller as any).extractAttributeFilters(queryParams)

      // Assert
      expect(result).toEqual({ size: ['small', 'medium', 'large'] })
    })

    it('should handle array attribute values', () => {
      // Arrange
      const queryParams = {
        attr_features: ['bluetooth', 'wifi', 'nfc']
      }

      // Act
      const result = (controller as any).extractAttributeFilters(queryParams)

      // Assert
      expect(result).toEqual({ features: ['bluetooth', 'wifi', 'nfc'] })
    })

    it('should filter out empty values', () => {
      // Arrange
      const queryParams = {
        attr_tags: 'tag1,,tag2, ,tag3'
      }

      // Act
      const result = (controller as any).extractAttributeFilters(queryParams)

      // Assert
      expect(result).toEqual({ tags: ['tag1', 'tag2', 'tag3'] })
    })

    it('should handle multiple attributes', () => {
      // Arrange
      const queryParams = {
        attr_brand: 'Apple',
        attr_color: 'black,white',
        attr_storage: ['64GB', '128GB'],
        normalParam: 'ignored'
      }

      // Act
      const result = (controller as any).extractAttributeFilters(queryParams)

      // Assert
      expect(result).toEqual({
        brand: ['Apple'],
        color: ['black', 'white'],
        storage: ['64GB', '128GB']
      })
    })

    it('should skip attributes with falsy values', () => {
      // Arrange
      const queryParams = {
        attr_valid: 'value',
        attr_empty: '',
        attr_null: null,
        attr_undefined: undefined
      }

      // Act
      const result = (controller as any).extractAttributeFilters(queryParams)

      // Assert
      expect(result).toEqual({ valid: ['value'] })
    })
  })
})
