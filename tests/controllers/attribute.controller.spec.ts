import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { AttributeController } from '../../src/controllers/attribute.controller'
import { PaginationParams } from '../../src/decorators/pagination'
import { Attribute, AttributeType, CategoryAttribute, LinkType } from '../../src/entities'
import { GetAttributesQueryDto } from '../../src/requests/get-attributes-query.dto'
import { AttributeResponse, PaginatedAttributeResponse } from '../../src/responses/attribute.response'
import { AttributeService } from '../../src/services/attribute.service'

describe('AttributeController', () => {
  let controller: AttributeController
  let attributeService: AttributeService
  let attributeRepository: jest.Mocked<Repository<Attribute>>
  let categoryAttributeRepository: jest.Mocked<Repository<CategoryAttribute>>

  // Mock data following the actual response structure
  const mockAttributeResponse: AttributeResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Attribute',
    description: 'Test attribute description',
    type: AttributeType.TEXT,
    options: null,
    isRequired: false,
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockAttributeWithOptions: AttributeResponse = {
    id: '223e4567-e89b-12d3-a456-426614174000',
    name: 'Storage',
    description: 'Storage capacity',
    type: AttributeType.SELECT,
    options: {
      values: ['64GB', '128GB', '256GB', '512GB', '1TB']
    },
    isRequired: false,
    isActive: true,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockAttributeWithLinkInfo: AttributeResponse = {
    id: '323e4567-e89b-12d3-a456-426614174000',
    name: 'Brand',
    description: 'Product brand',
    type: AttributeType.TEXT,
    options: null,
    isRequired: true,
    isActive: true,
    linkType: LinkType.DIRECT,
    categoryId: '11111111-1111-1111-1111-111111111111',
    categoryName: 'Electronics',
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockPaginatedResponse: PaginatedAttributeResponse = {
    data: [mockAttributeResponse, mockAttributeWithOptions, mockAttributeWithLinkInfo],
    total: 3,
    page: 1,
    limit: 10,
    totalPages: 1,
  }

  const mockAttributeService = {
    getAttributes: jest.fn(),
  }

  const mockAttributeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  }

  const mockCategoryAttributeRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    count: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttributeController],
      providers: [
        {
          provide: AttributeService,
          useValue: mockAttributeService,
        },
        {
          provide: getRepositoryToken(Attribute),
          useValue: mockAttributeRepository,
        },
        {
          provide: getRepositoryToken(CategoryAttribute),
          useValue: mockCategoryAttributeRepository,
        },
      ],
    }).compile()

    controller = module.get<AttributeController>(AttributeController)
    attributeService = module.get<AttributeService>(AttributeService)
    attributeRepository = module.get(getRepositoryToken(Attribute))
    categoryAttributeRepository = module.get(getRepositoryToken(CategoryAttribute))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Constructor and Dependencies', () => {
    it('should be defined', () => {
      expect(controller).toBeDefined()
    })

    it('should have AttributeService injected', () => {
      expect(attributeService).toBeDefined()
    })

    it('should have Attribute repository injected', () => {
      expect(attributeRepository).toBeDefined()
    })

    it('should have CategoryAttribute repository injected', () => {
      expect(categoryAttributeRepository).toBeDefined()
    })
  })

  describe('getAttributes - Basic Functionality', () => {
    it('should return paginated attributes without filters', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
      expect(attributeService.getAttributes).toHaveBeenCalledTimes(1)
    })

    it('should handle empty query and pagination', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toBeDefined()
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })
  })

  describe('getAttributes - Category Filtering', () => {
    it('should filter by single category ID', async () => {
      // Arrange
      const categoryId = '11111111-1111-1111-1111-111111111111'
      const query: GetAttributesQueryDto = {
        categoryIds: [categoryId],
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should filter by multiple category IDs', async () => {
      // Arrange
      const categoryIds = [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
        '33333333-3333-3333-3333-333333333333'
      ]
      const query: GetAttributesQueryDto = {
        categoryIds,
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })
  })

  describe('getAttributes - Link Type Filtering', () => {
    it('should filter by direct link type only', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        linkTypes: [LinkType.DIRECT],
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const directAttributesResponse: PaginatedAttributeResponse = {
        data: [mockAttributeWithLinkInfo],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      mockAttributeService.getAttributes.mockResolvedValue(directAttributesResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(directAttributesResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should filter by inherited link type only', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        linkTypes: [LinkType.INHERITED],
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const inheritedAttributesResponse: PaginatedAttributeResponse = {
        data: [mockAttributeResponse],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      mockAttributeService.getAttributes.mockResolvedValue(inheritedAttributesResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(inheritedAttributesResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should filter by global link type only', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        linkTypes: [LinkType.GLOBAL],
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const globalAttributesResponse: PaginatedAttributeResponse = {
        data: [mockAttributeWithOptions],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      mockAttributeService.getAttributes.mockResolvedValue(globalAttributesResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(globalAttributesResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should filter by multiple link types', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        linkTypes: [LinkType.DIRECT, LinkType.INHERITED],
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should return all link types when no linkTypes specified', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        // No linkTypes specified should return all (direct + inherited + global)
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })
  })

  describe('getAttributes - Search and Sorting', () => {
    it('should filter by keyword search', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        keyword: 'storage',
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const searchResponse: PaginatedAttributeResponse = {
        data: [mockAttributeWithOptions],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      mockAttributeService.getAttributes.mockResolvedValue(searchResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(searchResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should handle sorting by name ascending', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should handle sorting by name descending', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        sortBy: 'name',
        sortOrder: 'DESC',
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should handle sorting by created date', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })
  })

  describe('getAttributes - Pagination', () => {
    it('should handle custom pagination parameters', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {}
      const pagination: PaginationParams = { offset: 20, limit: 5 }

      const customPaginatedResponse: PaginatedAttributeResponse = {
        data: [mockAttributeResponse],
        total: 25,
        page: 5,
        limit: 5,
        totalPages: 5,
      }

      mockAttributeService.getAttributes.mockResolvedValue(customPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(customPaginatedResponse)
      expect(result.page).toBe(5)
      expect(result.limit).toBe(5)
      expect(result.totalPages).toBe(5)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should handle page and limit from query when pagination not provided', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        page: 2,
        limit: 15,
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })
  })

  describe('getAttributes - Complex Scenarios', () => {
    it('should handle all filters combined', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        linkTypes: [LinkType.DIRECT, LinkType.GLOBAL],
        keyword: 'brand',
        sortBy: 'name',
        sortOrder: 'ASC',
        page: 1,
        limit: 20,
      }
      const pagination: PaginationParams = { offset: 0, limit: 20 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should handle empty results', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['nonexistent-category-id'],
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      const emptyResponse: PaginatedAttributeResponse = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      }

      mockAttributeService.getAttributes.mockResolvedValue(emptyResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(emptyResponse)
      expect(result.data).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    it('should handle large result sets with pagination', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {}
      const pagination: PaginationParams = { offset: 100, limit: 50 }

      const largeResultResponse: PaginatedAttributeResponse = {
        data: Array(50).fill(mockAttributeResponse),
        total: 1000,
        page: 3,
        limit: 50,
        totalPages: 20,
      }

      mockAttributeService.getAttributes.mockResolvedValue(largeResultResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(largeResultResponse)
      expect(result.data).toHaveLength(50)
      expect(result.total).toBe(1000)
      expect(result.totalPages).toBe(20)
    })
  })

  describe('getAttributes - Error Handling', () => {
    it('should propagate service errors', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const errorMessage = 'Database connection failed'

      mockAttributeService.getAttributes.mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(controller.getAttributes(query, pagination)).rejects.toThrow(errorMessage)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })

    it('should handle validation errors', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const validationError = new Error('Invalid category ID format')

      mockAttributeService.getAttributes.mockRejectedValue(validationError)

      // Act & Assert
      await expect(controller.getAttributes(query, pagination)).rejects.toThrow('Invalid category ID format')
    })

    it('should handle undefined pagination gracefully', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {}
      const pagination: PaginationParams = undefined as any

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(attributeService.getAttributes).toHaveBeenCalledWith(query, pagination)
    })
  })

  describe('Response Validation', () => {
    it('should return response with correct structure', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('limit')
      expect(result).toHaveProperty('totalPages')
      expect(Array.isArray(result.data)).toBe(true)
      expect(typeof result.total).toBe('number')
      expect(typeof result.page).toBe('number')
      expect(typeof result.limit).toBe('number')
      expect(typeof result.totalPages).toBe('number')
    })

    it('should return attributes with correct attribute structure', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      const attribute = result.data[0]
      expect(attribute).toHaveProperty('id')
      expect(attribute).toHaveProperty('name')
      expect(attribute).toHaveProperty('description')
      expect(attribute).toHaveProperty('type')
      expect(attribute).toHaveProperty('options')
      expect(attribute).toHaveProperty('isRequired')
      expect(attribute).toHaveProperty('isActive')
      expect(attribute).toHaveProperty('createdAt')
      expect(attribute).toHaveProperty('updatedAt')
    })

    it('should include link information when filtering by categories', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      mockAttributeService.getAttributes.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getAttributes(query, pagination)

      // Assert
      const attributeWithLinkInfo = result.data.find(attr => attr.linkType)
      expect(attributeWithLinkInfo).toBeDefined()
      expect(attributeWithLinkInfo?.linkType).toBe(LinkType.DIRECT)
      expect(attributeWithLinkInfo?.categoryId).toBeDefined()
      expect(attributeWithLinkInfo?.categoryName).toBeDefined()
    })
  })
})
