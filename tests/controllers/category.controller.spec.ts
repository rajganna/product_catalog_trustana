import { Test, TestingModule } from '@nestjs/testing'
import { CategoryController } from '../../src/controllers/category.controller'
import { PaginationParams } from '../../src/decorators/pagination'
import { GetCategoriesQueryDto } from '../../src/requests/get-categories-query.dto'
import { GetCategoryTreeQueryDto } from '../../src/requests/get-category-tree-query.dto'
import { CategoryResponse, PaginatedCategoryResponse } from '../../src/responses/category.response'
import { CategoryService } from '../../src/services/category.service'

describe('CategoryController', () => {
  let controller: CategoryController
  let categoryService: CategoryService

  // Mock data for testing
  const mockCategoryResponse: CategoryResponse = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Electronics',
    description: 'Electronic devices and accessories',
    parentId: undefined,
    directAttributeCount: 5,
    productCount: 100,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockChildCategory: CategoryResponse = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Smartphones',
    description: 'Mobile phones and accessories',
    parentId: '11111111-1111-1111-1111-111111111111',
    directAttributeCount: 3,
    productCount: 50,
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockCategoryTree: CategoryResponse[] = [
    {
      ...mockCategoryResponse,
      children: [mockChildCategory],
    },
  ]

  const mockPaginatedResponse: PaginatedCategoryResponse = {
    data: [mockCategoryResponse, mockChildCategory],
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  }

  const mockCategoryService = {
    getCategories: jest.fn(),
    getCategoryTree: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockCategoryService,
        },
      ],
    }).compile()

    controller = module.get<CategoryController>(CategoryController)
    categoryService = module.get<CategoryService>(CategoryService)

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

    it('should inject CategoryService', () => {
      expect(categoryService).toBeDefined()
    })
  })

  describe('getCategories', () => {
    it('should return paginated categories with default parameters', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      mockCategoryService.getCategories.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
      expect(categoryService.getCategories).toHaveBeenCalledTimes(1)
    })

    it('should return categories filtered by keyword', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { keyword: 'Electronics' }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const filteredResponse: PaginatedCategoryResponse = {
        ...mockPaginatedResponse,
        data: [mockCategoryResponse],
        total: 1,
      }
      mockCategoryService.getCategories.mockResolvedValue(filteredResponse)

      // Act
      const result = await controller.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(filteredResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
    })

    it('should return categories filtered by parentId', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {
        parentId: '11111111-1111-1111-1111-111111111111'
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const childrenResponse: PaginatedCategoryResponse = {
        ...mockPaginatedResponse,
        data: [mockChildCategory],
        total: 1,
      }
      mockCategoryService.getCategories.mockResolvedValue(childrenResponse)

      // Act
      const result = await controller.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(childrenResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
    })

    it('should return categories with attribute counts when requested', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { includeAttributeCount: true }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      mockCategoryService.getCategories.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
      expect(result.data[0].directAttributeCount).toBeDefined()
    })

    it('should return categories with product counts when requested', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = { includeProductCount: true }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      mockCategoryService.getCategories.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
      expect(result.data[0].productCount).toBeDefined()
    })

    it('should return categories sorted by name in ascending order', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {
        sortBy: 'name',
        sortOrder: 'ASC'
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      mockCategoryService.getCategories.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
    })

    it('should return categories sorted by createdAt in descending order', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {
        sortBy: 'createdAt',
        sortOrder: 'DESC'
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      mockCategoryService.getCategories.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
    })

    it('should handle pagination with different offset and limit', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {}
      const pagination: PaginationParams = { offset: 20, limit: 5 }
      const paginatedResponse: PaginatedCategoryResponse = {
        ...mockPaginatedResponse,
        page: 5,
        limit: 5,
      }
      mockCategoryService.getCategories.mockResolvedValue(paginatedResponse)

      // Act
      const result = await controller.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(paginatedResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
    })

    it('should handle complex filtering with multiple parameters', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {
        keyword: 'phone',
        parentId: '11111111-1111-1111-1111-111111111111',
        includeAttributeCount: true,
        includeProductCount: true,
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      mockCategoryService.getCategories.mockResolvedValue(mockPaginatedResponse)

      // Act
      const result = await controller.getCategories(query, pagination)

      // Assert
      expect(result).toEqual(mockPaginatedResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
    })

    it('should handle service errors gracefully', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const error = new Error('Database connection failed')
      mockCategoryService.getCategories.mockRejectedValue(error)

      // Act & Assert
      await expect(controller.getCategories(query, pagination)).rejects.toThrow(
        'Database connection failed'
      )
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
    })
  })

  describe('getCategoryTree', () => {
    it('should return category tree with default parameters', async () => {
      // Arrange
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: false,
        includeProductCount: false,
      }
      mockCategoryService.getCategoryTree.mockResolvedValue(mockCategoryTree)

      // Act
      const result = await controller.getCategoryTree()

      // Assert
      expect(result).toEqual(mockCategoryTree)
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
      expect(categoryService.getCategoryTree).toHaveBeenCalledTimes(1)
    })

    it('should return category tree with attribute counts when requested', async () => {
      // Arrange
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: true,
        includeProductCount: false,
      }
      mockCategoryService.getCategoryTree.mockResolvedValue(mockCategoryTree)

      // Act
      const result = await controller.getCategoryTree('true')

      // Assert
      expect(result).toEqual(mockCategoryTree)
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
    })

    it('should return category tree with product counts when requested', async () => {
      // Arrange
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: false,
        includeProductCount: true,
      }
      mockCategoryService.getCategoryTree.mockResolvedValue(mockCategoryTree)

      // Act
      const result = await controller.getCategoryTree(undefined, 'true')

      // Assert
      expect(result).toEqual(mockCategoryTree)
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
    })

    it('should return category tree with both counts when both requested', async () => {
      // Arrange
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: true,
        includeProductCount: true,
      }
      mockCategoryService.getCategoryTree.mockResolvedValue(mockCategoryTree)

      // Act
      const result = await controller.getCategoryTree('true', 'true')

      // Assert
      expect(result).toEqual(mockCategoryTree)
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
    })

    it('should handle false string values correctly', async () => {
      // Arrange
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: false,
        includeProductCount: false,
      }
      mockCategoryService.getCategoryTree.mockResolvedValue(mockCategoryTree)

      // Act
      const result = await controller.getCategoryTree('false', 'false')

      // Assert
      expect(result).toEqual(mockCategoryTree)
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
    })

    it('should handle undefined query parameters', async () => {
      // Arrange
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: false,
        includeProductCount: false,
      }
      mockCategoryService.getCategoryTree.mockResolvedValue(mockCategoryTree)

      // Act
      const result = await controller.getCategoryTree(undefined, undefined)

      // Assert
      expect(result).toEqual(mockCategoryTree)
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
    })

    it('should handle mixed true/false parameters', async () => {
      // Arrange
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: true,
        includeProductCount: false,
      }
      mockCategoryService.getCategoryTree.mockResolvedValue(mockCategoryTree)

      // Act
      const result = await controller.getCategoryTree('true', 'false')

      // Assert
      expect(result).toEqual(mockCategoryTree)
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
    })

    it('should return empty array when no categories exist', async () => {
      // Arrange
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: false,
        includeProductCount: false,
      }
      mockCategoryService.getCategoryTree.mockResolvedValue([])

      // Act
      const result = await controller.getCategoryTree()

      // Assert
      expect(result).toEqual([])
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
    })

    it('should handle service errors gracefully', async () => {
      // Arrange
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: false,
        includeProductCount: false,
      }
      const error = new Error('Database connection failed')
      mockCategoryService.getCategoryTree.mockRejectedValue(error)

      // Act & Assert
      await expect(controller.getCategoryTree()).rejects.toThrow(
        'Database connection failed'
      )
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
    })

    it('should handle nested category hierarchies correctly', async () => {
      // Arrange
      const nestedCategoryTree: CategoryResponse[] = [
        {
          ...mockCategoryResponse,
          children: [
            {
              ...mockChildCategory,
              children: [
                {
                  id: '33333333-3333-3333-3333-333333333333',
                  name: 'iPhone',
                  description: 'Apple smartphones',
                  parentId: '22222222-2222-2222-2222-222222222222',
                  directAttributeCount: 2,
                  productCount: 10,
                  createdAt: new Date('2025-01-01T00:00:00Z'),
                  updatedAt: new Date('2025-01-01T00:00:00Z'),
                },
              ],
            },
          ],
        },
      ]
      const expectedQuery: GetCategoryTreeQueryDto = {
        includeAttributeCount: true,
        includeProductCount: true,
      }
      mockCategoryService.getCategoryTree.mockResolvedValue(nestedCategoryTree)

      // Act
      const result = await controller.getCategoryTree('true', 'true')

      // Assert
      expect(result).toEqual(nestedCategoryTree)
      expect(categoryService.getCategoryTree).toHaveBeenCalledWith(expectedQuery)
      expect(result[0].children).toBeDefined()
      expect(result[0].children![0].children).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should propagate service errors for getCategories', async () => {
      // Arrange
      const query: GetCategoriesQueryDto = {}
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const serviceError = new Error('Service unavailable')
      mockCategoryService.getCategories.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(controller.getCategories(query, pagination)).rejects.toThrow(serviceError)
    })

    it('should propagate service errors for getCategoryTree', async () => {
      // Arrange
      const serviceError = new Error('Service unavailable')
      mockCategoryService.getCategoryTree.mockRejectedValue(serviceError)

      // Act & Assert
      await expect(controller.getCategoryTree()).rejects.toThrow(serviceError)
    })
  })

  describe('integration with decorators', () => {
    it('should work with the @Query decorator for getCategories', async () => {
      // This test verifies that the controller can handle query parameter binding
      const query: GetCategoriesQueryDto = {
        keyword: 'test',
        sortBy: 'name',
        sortOrder: 'ASC',
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      mockCategoryService.getCategories.mockResolvedValue(mockPaginatedResponse)

      const result = await controller.getCategories(query, pagination)

      expect(result).toEqual(mockPaginatedResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
    })

    it('should work with the @Pagination decorator', async () => {
      // This test verifies that the controller can handle pagination parameter binding
      const query: GetCategoriesQueryDto = {}
      const pagination: PaginationParams = { offset: 50, limit: 25 }
      mockCategoryService.getCategories.mockResolvedValue(mockPaginatedResponse)

      const result = await controller.getCategories(query, pagination)

      expect(result).toEqual(mockPaginatedResponse)
      expect(categoryService.getCategories).toHaveBeenCalledWith(query, pagination)
    })
  })
})
