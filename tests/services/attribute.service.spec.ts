import { Test, TestingModule } from '@nestjs/testing'
import { getRepositoryToken } from '@nestjs/typeorm'
import { Repository, SelectQueryBuilder } from 'typeorm'
import { PaginationParams } from '../../src/decorators/pagination'
import { Attribute, AttributeType, Category, CategoryAttribute, LinkType } from '../../src/entities'
import { GetAttributesQueryDto } from '../../src/requests/get-attributes-query.dto'
import { PaginatedAttributeResponse } from '../../src/responses/attribute.response'
import { AttributeService } from '../../src/services/attribute.service'
import { CacheService } from '../../src/services/cache.service'

describe('AttributeService', () => {
  let service: AttributeService
  let attributeRepository: jest.Mocked<Repository<Attribute>>
  let categoryRepository: jest.Mocked<Repository<Category>>
  let categoryAttributeRepository: jest.Mocked<Repository<CategoryAttribute>>
  let cacheService: jest.Mocked<CacheService>
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Attribute>>

  // Mock data
  const mockAttribute: Attribute = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Storage',
    description: 'Storage capacity',
    type: AttributeType.SELECT,
    options: { values: ['64GB', '128GB', '256GB'] },
    isRequired: false,
    isActive: true,
    searchVector: 'storage capacity',
    categoryPaths: '/electronics/smartphones',
    relevanceScore: 1.0,
    categoryAttributes: [],
    productAttributeValues: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockCategory: Category = {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Smartphones',
    description: 'Mobile phones',
    parentId: '22222222-2222-2222-2222-222222222222',
    parent: {} as Category,
    children: [],
    products: [],
    categoryAttributes: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockCategoryAttribute: CategoryAttribute = {
    id: '333e4567-e89b-12d3-a456-426614174000',
    categoryId: '11111111-1111-1111-1111-111111111111',
    attributeId: '123e4567-e89b-12d3-a456-426614174000',
    linkType: LinkType.DIRECT,
    category: mockCategory,
    attribute: mockAttribute,
    createdAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockAttributeWithCategoryLink: Attribute = {
    ...mockAttribute,
    categoryAttributes: [mockCategoryAttribute],
  }

  const mockGlobalAttribute: Attribute = {
    id: '444e4567-e89b-12d3-a456-426614174000',
    name: 'Brand',
    description: 'Product brand',
    type: AttributeType.TEXT,
    options: null,
    isRequired: true,
    isActive: true,
    searchVector: 'brand product',
    categoryPaths: '',
    relevanceScore: 1.0,
    categoryAttributes: [],
    productAttributeValues: [],
    createdAt: new Date('2025-01-01T00:00:00Z'),
    updatedAt: new Date('2025-01-01T00:00:00Z'),
  }

  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttributeService,
        {
          provide: getRepositoryToken(Attribute),
          useValue: {
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
            findOne: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Category),
          useValue: {
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CategoryAttribute),
          useValue: {
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            keys: {
              attributes: jest.fn().mockReturnValue('cache-key'),
              categoryAttributes: jest.fn().mockReturnValue('category-cache-key'),
            },
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            invalidateAttributes: jest.fn(),
            clearPattern: jest.fn(),
            TTL: {
              ATTRIBUTES: 3600,
            },
          },
        },
      ],
    }).compile()

    service = module.get<AttributeService>(AttributeService)
    attributeRepository = module.get(getRepositoryToken(Attribute))
    categoryRepository = module.get(getRepositoryToken(Category))
    categoryAttributeRepository = module.get(getRepositoryToken(CategoryAttribute))
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
      expect(attributeRepository).toBeDefined()
      expect(categoryRepository).toBeDefined()
      expect(categoryAttributeRepository).toBeDefined()
      expect(cacheService).toBeDefined()
    })
  })

  describe('getAttributes', () => {
    it('should return cached result when available', async () => {
      // Arrange
      const query: GetAttributesQueryDto = { categoryIds: ['11111111-1111-1111-1111-111111111111'] }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const cachedResult: PaginatedAttributeResponse = {
        data: [{
          id: mockAttribute.id,
          name: mockAttribute.name,
          description: mockAttribute.description,
          type: mockAttribute.type,
          options: mockAttribute.options,
          isRequired: mockAttribute.isRequired,
          isActive: mockAttribute.isActive,
          createdAt: mockAttribute.createdAt,
          updatedAt: mockAttribute.updatedAt,
        }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      // cacheService.keys.attributes is already mocked to return 'cache-key'
      cacheService.get.mockResolvedValue(cachedResult)

      // Act
      const result = await service.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(cachedResult)
      expect(cacheService.get).toHaveBeenCalledWith('cache-key')
      expect(cacheService.keys.attributes).toHaveBeenCalledWith({
        categoryIds: query.categoryIds,
        linkTypes: query.linkTypes,
        keyword: query.keyword,
        page: 1,
        limit: 10,
        sortBy: 'name',
        sortOrder: 'ASC',
      })
    })

    it('should fetch from database and cache result when cache miss', async () => {
      // Arrange
      const query: GetAttributesQueryDto = { categoryIds: ['11111111-1111-1111-1111-111111111111'] }
      const pagination: PaginationParams = { offset: 0, limit: 10 }
      const mockResult: PaginatedAttributeResponse = {
        data: [{
          id: mockAttribute.id,
          name: mockAttribute.name,
          description: mockAttribute.description,
          type: mockAttribute.type,
          options: mockAttribute.options,
          isRequired: mockAttribute.isRequired,
          isActive: mockAttribute.isActive,
          createdAt: mockAttribute.createdAt,
          updatedAt: mockAttribute.updatedAt,
        }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }

      // cacheService.keys.attributes is already mocked
      cacheService.get.mockResolvedValue(null)

      // Mock the private fetchAttributesFromDatabase method
      jest.spyOn(service as any, 'fetchAttributesFromDatabase').mockResolvedValue(mockResult)

      // Act
      const result = await service.getAttributes(query, pagination)

      // Assert
      expect(result).toEqual(mockResult)
      expect(cacheService.set).toHaveBeenCalledWith('cache-key', mockResult, 3600)
    })

    it('should use pagination params over query params', async () => {
      // Arrange
      const query: GetAttributesQueryDto = { page: 5, limit: 20 }
      const pagination: PaginationParams = { offset: 30, limit: 15 }

      // cacheService.keys.attributes is already mocked
      cacheService.get.mockResolvedValue(null)
      jest.spyOn(service as any, 'fetchAttributesFromDatabase').mockResolvedValue({
        data: [],
        total: 0,
        page: 3,
        limit: 15,
        totalPages: 0,
      })

      // Act
      await service.getAttributes(query, pagination)

      // Assert
      expect(cacheService.keys.attributes).toHaveBeenCalledWith({
        categoryIds: query.categoryIds,
        linkTypes: query.linkTypes,
        keyword: query.keyword,
        page: 3, // Math.floor(30 / 15) + 1
        limit: 15,
        sortBy: 'name',
        sortOrder: 'ASC',
      })
    })
  })

  describe('fetchAttributesFromDatabase', () => {
    it('should fetch all attributes when no categoryIds provided', async () => {
      // Arrange
      const query: GetAttributesQueryDto = { keyword: 'storage' }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      // Mock the query builder for the attributeRepository.createQueryBuilder call
      const specificQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(1),
        getMany: jest.fn().mockResolvedValue([mockAttribute]),
      }

      attributeRepository.createQueryBuilder.mockReturnValue(specificQueryBuilder as any)

      // Act
      const result = await (service as any).fetchAttributesFromDatabase(query, pagination)

      // Assert
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(10)
      expect(result.totalPages).toBe(1)

      // Check that the data is properly transformed
      expect(result.data[0]).toEqual({
        id: mockAttribute.id,
        name: mockAttribute.name,
        description: mockAttribute.description,
        type: mockAttribute.type,
        options: mockAttribute.options,
        isRequired: mockAttribute.isRequired,
        isActive: mockAttribute.isActive,
        createdAt: mockAttribute.createdAt,
        updatedAt: mockAttribute.updatedAt,
      })

      expect(specificQueryBuilder.where).toHaveBeenCalledWith('attribute.isActive = :isActive', { isActive: true })
      expect(specificQueryBuilder.andWhere).toHaveBeenCalledWith(
        '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
        { keyword: '%storage%' }
      )
    })

    it('should fetch applicable attributes when categoryIds provided', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        linkTypes: [LinkType.DIRECT]
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      jest.spyOn(service as any, 'getApplicableAttributes').mockResolvedValue([mockAttributeWithCategoryLink])
      jest.spyOn(service as any, 'countApplicableAttributes').mockResolvedValue(1)

      // Act
      const result = await (service as any).fetchAttributesFromDatabase(query, pagination)

      // Assert
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(service['getApplicableAttributes']).toHaveBeenCalledWith(
        ['11111111-1111-1111-1111-111111111111'],
        [LinkType.DIRECT],
        undefined,
        1,
        10,
        'name',
        'ASC'
      )
    })

    it('should fetch not applicable attributes when notApplicable is true', async () => {
      // Arrange
      const query: GetAttributesQueryDto = {
        categoryIds: ['11111111-1111-1111-1111-111111111111'],
        notApplicable: true
      }
      const pagination: PaginationParams = { offset: 0, limit: 10 }

      jest.spyOn(service as any, 'getNotApplicableAttributes').mockResolvedValue([mockGlobalAttribute])
      jest.spyOn(service as any, 'countNotApplicableAttributes').mockResolvedValue(1)

      // Act
      const result = await (service as any).fetchAttributesFromDatabase(query, pagination)

      // Assert
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(service['getNotApplicableAttributes']).toHaveBeenCalledWith(
        ['11111111-1111-1111-1111-111111111111'],
        undefined,
        1,
        10,
        'name',
        'ASC'
      )
    })
  })
})
