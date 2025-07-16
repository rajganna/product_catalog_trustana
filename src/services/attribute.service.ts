import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { PaginationParams } from '../decorators/pagination'
import { Attribute, Category, CategoryAttribute, LinkType } from '../entities'
import { GetAttributesQueryDto } from '../requests/get-attributes-query.dto'
import {
  AttributeResponse,
  PaginatedAttributeResponse,
} from '../responses/attribute.response'
import { CacheService } from './cache.service'

/**
 * Refactored AttributeService with improved structure and maintainability
 * - Reduced cognitive complexity by breaking down large methods
 * - Improved code organization with helper methods
 * - Better separation of concerns
 * - More readable and maintainable code
 */
@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(CategoryAttribute)
    private readonly categoryAttributeRepository: Repository<CategoryAttribute>,
    private readonly cacheService: CacheService,
  ) { } async getAttributes(
    query: GetAttributesQueryDto,
    pagination?: PaginationParams,
  ): Promise<PaginatedAttributeResponse> {
    // Use pagination params if provided, otherwise fall back to query params
    const page = pagination?.offset ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : (query.page ?? 1)
    const limit = pagination?.limit ?? query.limit ?? 10

    const cacheKey = this.cacheService.keys.attributes({
      categoryIds: query.categoryIds,
      linkTypes: query.linkTypes,
      keyword: query.keyword,
      page,
      limit,
      sortBy: query.sortBy ?? 'name',
      sortOrder: query.sortOrder ?? 'ASC',
    })

    const cached =
      await this.cacheService.get<PaginatedAttributeResponse>(cacheKey)
    if (cached) {
      return cached
    }

    const result = await this.fetchAttributesFromDatabase(query, pagination)

    await this.cacheService.set(
      cacheKey,
      result,
      this.cacheService['TTL'].ATTRIBUTES,
    )

    return result
  } private async fetchAttributesFromDatabase(
    query: GetAttributesQueryDto,
    pagination?: PaginationParams,
  ): Promise<PaginatedAttributeResponse> {
    const page = pagination?.offset ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : (query.page ?? 1)
    const limit = pagination?.limit ?? query.limit ?? 10

    const {
      categoryIds,
      linkTypes,
      keyword,
      sortBy = 'name',
      sortOrder = 'ASC',
      notApplicable = false,
    } = query

    if (categoryIds && categoryIds.length > 0) {
      return this.getAttributesForCategories(categoryIds, {
        linkTypes,
        keyword,
        page,
        limit,
        sortBy,
        sortOrder,
        notApplicable
      })
    }

    return this.getAllAttributes(linkTypes, keyword, page, limit, sortBy, sortOrder)
  }

  private async getAttributesForCategories(
    categoryIds: string[],
    options: {
      linkTypes?: LinkType[]
      keyword?: string
      page?: number
      limit?: number
      sortBy?: string
      sortOrder?: 'ASC' | 'DESC'
      notApplicable?: boolean
    }
  ): Promise<PaginatedAttributeResponse> {
    const {
      linkTypes,
      keyword,
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'ASC',
      notApplicable = false,
    } = options

    let attributes: Attribute[]
    let total: number

    if (notApplicable) {
      attributes = await this.getNotApplicableAttributes(
        categoryIds,
        keyword,
        page,
        limit,
        sortBy,
        sortOrder,
      )
      total = await this.countNotApplicableAttributes(categoryIds, keyword)
    } else {
      attributes = await this.getApplicableAttributes(
        categoryIds,
        linkTypes,
        keyword,
        page,
        limit,
        sortBy,
        sortOrder,
      )
      total = await this.countApplicableAttributes(
        categoryIds,
        linkTypes,
        keyword,
      )
    }

    const data = attributes.map(attr => this.transformToResponse(attr, categoryIds))

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  private async getAllAttributes(
    linkTypes?: LinkType[],
    keyword?: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<PaginatedAttributeResponse> {
    let attributes: Attribute[]
    let total: number

    if (linkTypes && linkTypes.length > 0) {
      attributes = await this.getAttributesByLinkTypes(
        linkTypes,
        keyword,
        page,
        limit,
        sortBy,
        sortOrder,
      )
      total = await this.countAttributesByLinkTypes(linkTypes, keyword)
    } else {
      const queryBuilder = this.attributeRepository
        .createQueryBuilder('attribute')
        .where('attribute.isActive = :isActive', { isActive: true })

      if (keyword) {
        queryBuilder.andWhere(
          '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
          { keyword: `%${keyword}%` },
        )
      }

      total = await queryBuilder.getCount()

      queryBuilder
        .orderBy(`attribute.${sortBy}`, sortOrder)
        .skip((page - 1) * limit)
        .take(limit)

      attributes = await queryBuilder.getMany()
    }

    const data = attributes.map(attr => this.transformToResponse(attr))

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }
  }

  private async getApplicableAttributes(
    categoryIds: string[],
    linkTypes?: LinkType[],
    keyword?: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<Attribute[]> {
    const linkTypeFilter = this.createLinkTypeFilter(linkTypes)
    const allRelevantCategoryIds = await this.getAllRelevantCategoryIds(categoryIds)

    const attributeMap = new Map<string, Attribute>()

    // Get linked attributes (direct/inherited)
    if (linkTypeFilter.shouldIncludeDirect || linkTypeFilter.shouldIncludeInherited) {
      const linkedAttributes = await this.getLinkedAttributes(
        categoryIds,
        allRelevantCategoryIds,
        linkTypeFilter,
        keyword
      )
      linkedAttributes.forEach(attr => attributeMap.set(attr.id, attr))
    }

    // Get global attributes
    if (linkTypeFilter.shouldIncludeGlobal) {
      const globalAttributes = await this.getGlobalAttributes(keyword)
      globalAttributes.forEach(attr => attributeMap.set(attr.id, attr))
    }

    const allAttributes = Array.from(attributeMap.values())
    this.sortAttributes(allAttributes, sortBy, sortOrder)

    return this.applyPagination(allAttributes, page, limit)
  }

  private createLinkTypeFilter(linkTypes?: LinkType[]) {
    return {
      shouldIncludeDirect: !linkTypes || linkTypes.includes(LinkType.DIRECT),
      shouldIncludeInherited: !linkTypes || linkTypes.includes(LinkType.INHERITED),
      shouldIncludeGlobal: !linkTypes || linkTypes.includes(LinkType.GLOBAL),
    }
  }

  private async getLinkedAttributes(
    categoryIds: string[],
    allRelevantCategoryIds: string[],
    linkTypeFilter: { shouldIncludeDirect: boolean; shouldIncludeInherited: boolean },
    keyword?: string
  ): Promise<Attribute[]> {
    const queryBuilder = this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoinAndSelect('attribute.categoryAttributes', 'categoryAttribute')
      .leftJoinAndSelect('categoryAttribute.category', 'category')
      .where('attribute.isActive = :isActive', { isActive: true })

    const conditions = this.buildLinkTypeConditions(
      categoryIds,
      allRelevantCategoryIds,
      linkTypeFilter,
      queryBuilder
    )

    if (conditions.length === 0) {
      return []
    }

    queryBuilder.andWhere(`(${conditions.join(' OR ')})`)

    if (keyword) {
      queryBuilder.andWhere(
        '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
        { keyword: `%${keyword}%` }
      )
    }

    return queryBuilder.getMany()
  }

  private buildLinkTypeConditions(
    categoryIds: string[],
    allRelevantCategoryIds: string[],
    linkTypeFilter: { shouldIncludeDirect: boolean; shouldIncludeInherited: boolean },
    queryBuilder: any
  ): string[] {
    const conditions: string[] = []

    if (linkTypeFilter.shouldIncludeDirect) {
      conditions.push('(categoryAttribute.categoryId IN (:...categoryIds) AND categoryAttribute.linkType = :directType)')
      queryBuilder.setParameter('categoryIds', categoryIds)
      queryBuilder.setParameter('directType', LinkType.DIRECT)
    }

    if (linkTypeFilter.shouldIncludeInherited && allRelevantCategoryIds.length > categoryIds.length) {
      const ancestorIds = allRelevantCategoryIds.filter(id => !categoryIds.includes(id))
      if (ancestorIds.length > 0) {
        conditions.push('(categoryAttribute.categoryId IN (:...ancestorIds) AND categoryAttribute.linkType = :inheritedType)')
        queryBuilder.setParameter('ancestorIds', ancestorIds)
        queryBuilder.setParameter('inheritedType', LinkType.INHERITED)
      }
    }

    return conditions
  }

  private async getGlobalAttributes(keyword?: string): Promise<Attribute[]> {
    const globalQuery = this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoin('attribute.categoryAttributes', 'categoryAttribute')
      .where('attribute.isActive = :isActive', { isActive: true })
      .andWhere('categoryAttribute.id IS NULL')

    if (keyword) {
      globalQuery.andWhere(
        '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
        { keyword: `%${keyword}%` }
      )
    }

    return globalQuery.getMany()
  }

  private sortAttributes(attributes: Attribute[], sortBy: string, sortOrder: 'ASC' | 'DESC'): void {
    attributes.sort((a, b) => {
      const aValue = (a[sortBy as keyof Attribute] || '') as string
      const bValue = (b[sortBy as keyof Attribute] || '') as string

      if (sortOrder === 'DESC') {
        return bValue.localeCompare(aValue)
      }
      return aValue.localeCompare(bValue)
    })
  }

  private applyPagination<T>(items: T[], page: number, limit: number): T[] {
    const startIndex = (page - 1) * limit
    return items.slice(startIndex, startIndex + limit)
  }

  private async getAllRelevantCategoryIds(categoryIds: string[]): Promise<string[]> {
    const allIds = new Set<string>(categoryIds)

    for (const categoryId of categoryIds) {
      const ancestors = await this.getAncestorCategories(categoryId)
      ancestors.forEach(id => allIds.add(id))
    }

    return Array.from(allIds)
  }


  private async getAncestorCategories(categoryId: string): Promise<string[]> {
    const ancestors: string[] = []

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      select: ['parentId']
    })

    if (category?.parentId) {
      ancestors.push(category.parentId)
      const parentAncestors = await this.getAncestorCategories(category.parentId)
      ancestors.push(...parentAncestors)
    }

    return ancestors
  }

  private async countApplicableAttributes(
    categoryIds: string[],
    linkTypes?: LinkType[],
    keyword?: string,
  ): Promise<number> {
    const linkTypeFilter = this.createLinkTypeFilter(linkTypes)
    const allRelevantCategoryIds = await this.getAllRelevantCategoryIds(categoryIds)

    const attributeIds = new Set<string>()

    // Count linked attributes
    if (linkTypeFilter.shouldIncludeDirect || linkTypeFilter.shouldIncludeInherited) {
      const linkedAttributeIds = await this.countLinkedAttributes(
        categoryIds,
        allRelevantCategoryIds,
        linkTypeFilter,
        keyword
      )
      linkedAttributeIds.forEach(id => attributeIds.add(id))
    }

    // Count global attributes
    if (linkTypeFilter.shouldIncludeGlobal) {
      const globalAttributeIds = await this.countGlobalAttributes(keyword)
      globalAttributeIds.forEach(id => attributeIds.add(id))
    }

    return attributeIds.size
  }

  private async countLinkedAttributes(
    categoryIds: string[],
    allRelevantCategoryIds: string[],
    linkTypeFilter: { shouldIncludeDirect: boolean; shouldIncludeInherited: boolean },
    keyword?: string
  ): Promise<string[]> {
    const queryBuilder = this.attributeRepository
      .createQueryBuilder('attribute')
      .innerJoin('attribute.categoryAttributes', 'categoryAttribute')
      .where('attribute.isActive = :isActive', { isActive: true })

    const conditions = this.buildLinkTypeConditions(
      categoryIds,
      allRelevantCategoryIds,
      linkTypeFilter,
      queryBuilder
    )

    if (conditions.length === 0) {
      return []
    }

    queryBuilder.andWhere(`(${conditions.join(' OR ')})`)

    if (keyword) {
      queryBuilder.andWhere(
        '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
        { keyword: `%${keyword}%` }
      )
    }

    const result = await queryBuilder.select('DISTINCT attribute.id').getRawMany()
    return result.map(attr => attr.attribute_id)
  }

  private async countGlobalAttributes(keyword?: string): Promise<string[]> {
    const globalQuery = this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoin('attribute.categoryAttributes', 'categoryAttribute')
      .where('attribute.isActive = :isActive', { isActive: true })
      .andWhere('categoryAttribute.id IS NULL')

    if (keyword) {
      globalQuery.andWhere(
        '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
        { keyword: `%${keyword}%` }
      )
    }

    const result = await globalQuery.select('attribute.id').getRawMany()
    return result.map(attr => attr.attribute_id)
  }

  private async getNotApplicableAttributes(
    categoryIds: string[],
    keyword?: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<Attribute[]> {
    const queryBuilder = this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoin('attribute.categoryAttributes', 'categoryAttribute',
        'categoryAttribute.categoryId IN (:...categoryIds)', { categoryIds })
      .where('categoryAttribute.id IS NULL')
      .andWhere('attribute.isActive = :isActive', { isActive: true })

    if (keyword) {
      queryBuilder.andWhere(
        '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
        { keyword: `%${keyword}%` }
      )
    }

    queryBuilder
      .orderBy(`attribute.${sortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit)

    return await queryBuilder.getMany()
  }

  private async countNotApplicableAttributes(
    categoryIds: string[],
    keyword?: string,
  ): Promise<number> {
    const queryBuilder = this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoin('attribute.categoryAttributes', 'categoryAttribute',
        'categoryAttribute.categoryId IN (:...categoryIds)', { categoryIds })
      .where('categoryAttribute.id IS NULL')
      .andWhere('attribute.isActive = :isActive', { isActive: true })

    if (keyword) {
      queryBuilder.andWhere(
        '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
        { keyword: `%${keyword}%` }
      )
    }

    return await queryBuilder.getCount()
  }

  private transformToResponse(attribute: Attribute, categoryIds?: string[]): AttributeResponse {
    const response: AttributeResponse = {
      id: attribute.id,
      name: attribute.name,
      description: attribute.description,
      type: attribute.type,
      options: attribute.options,
      isRequired: attribute.isRequired,
      isActive: attribute.isActive,
      createdAt: attribute.createdAt,
      updatedAt: attribute.updatedAt,
    }

    if (categoryIds && categoryIds.length > 0 && attribute.categoryAttributes?.length > 0) {
      const relevantRelation = attribute.categoryAttributes.find(ca =>
        categoryIds.includes(ca.categoryId)
      )

      if (relevantRelation) {
        response.linkType = relevantRelation.linkType
        response.categoryId = relevantRelation.categoryId
        response.categoryName = relevantRelation.category?.name
      }
    }

    return response
  }

  async invalidateAttributeCaches(): Promise<void> {
    await this.cacheService.invalidateAttributes()
    await this.cacheService.clearPattern('category:*:attributes')
  }

  async invalidateCategoryAttributeCache(categoryId: string): Promise<void> {
    const cacheKey = this.cacheService.keys.categoryAttributes(categoryId)
    await this.cacheService.del(cacheKey)
    await this.cacheService.clearPattern(`attributes:*cat:*${categoryId}*`)
  }

  private async getAttributesByLinkTypes(
    linkTypes: LinkType[],
    keyword?: string,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<Attribute[]> {
    const linkTypeFilter = this.createLinkTypeFilter(linkTypes)
    const attributeMap = new Map<string, Attribute>()

    // Get linked attributes
    if (linkTypeFilter.shouldIncludeDirect || linkTypeFilter.shouldIncludeInherited) {
      const linkedAttributes = await this.getAttributesBySpecificLinkTypes(linkTypes, keyword)
      linkedAttributes.forEach(attr => attributeMap.set(attr.id, attr))
    }

    // Get global attributes
    if (linkTypeFilter.shouldIncludeGlobal) {
      const globalAttributes = await this.getGlobalAttributes(keyword)
      globalAttributes.forEach(attr => attributeMap.set(attr.id, attr))
    }

    const allAttributes = Array.from(attributeMap.values())
    this.sortAttributes(allAttributes, sortBy, sortOrder)

    return this.applyPagination(allAttributes, page, limit)
  }

  private async getAttributesBySpecificLinkTypes(
    linkTypes: LinkType[],
    keyword?: string
  ): Promise<Attribute[]> {
    const queryBuilder = this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoinAndSelect('attribute.categoryAttributes', 'categoryAttribute')
      .where('attribute.isActive = :isActive', { isActive: true })

    const conditions: string[] = []

    if (linkTypes.includes(LinkType.DIRECT)) {
      conditions.push('categoryAttribute.linkType = :directType')
      queryBuilder.setParameter('directType', LinkType.DIRECT)
    }

    if (linkTypes.includes(LinkType.INHERITED)) {
      conditions.push('categoryAttribute.linkType = :inheritedType')
      queryBuilder.setParameter('inheritedType', LinkType.INHERITED)
    }

    if (conditions.length > 0) {
      queryBuilder.andWhere(`(${conditions.join(' OR ')})`)
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
        { keyword: `%${keyword}%` }
      )
    }

    return queryBuilder.getMany()
  }

  private async countAttributesByLinkTypes(
    linkTypes: LinkType[],
    keyword?: string,
  ): Promise<number> {
    const linkTypeFilter = this.createLinkTypeFilter(linkTypes)
    const attributeIds = new Set<string>()

    // Count linked attributes
    if (linkTypeFilter.shouldIncludeDirect || linkTypeFilter.shouldIncludeInherited) {
      const linkedAttributeIds = await this.countAttributesBySpecificLinkTypes(linkTypes, keyword)
      linkedAttributeIds.forEach(id => attributeIds.add(id))
    }

    // Count global attributes
    if (linkTypeFilter.shouldIncludeGlobal) {
      const globalAttributeIds = await this.countGlobalAttributes(keyword)
      globalAttributeIds.forEach(id => attributeIds.add(id))
    }

    return attributeIds.size
  }

  private async countAttributesBySpecificLinkTypes(
    linkTypes: LinkType[],
    keyword?: string
  ): Promise<string[]> {
    const queryBuilder = this.attributeRepository
      .createQueryBuilder('attribute')
      .leftJoin('attribute.categoryAttributes', 'categoryAttribute')
      .where('attribute.isActive = :isActive', { isActive: true })

    const conditions: string[] = []

    if (linkTypes.includes(LinkType.DIRECT)) {
      conditions.push('categoryAttribute.linkType = :directType')
      queryBuilder.setParameter('directType', LinkType.DIRECT)
    }

    if (linkTypes.includes(LinkType.INHERITED)) {
      conditions.push('categoryAttribute.linkType = :inheritedType')
      queryBuilder.setParameter('inheritedType', LinkType.INHERITED)
    }

    if (conditions.length > 0) {
      queryBuilder.andWhere(`(${conditions.join(' OR ')})`)
    }

    if (keyword) {
      queryBuilder.andWhere(
        '(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))',
        { keyword: `%${keyword}%` }
      )
    }

    const result = await queryBuilder.select('DISTINCT attribute.id').getRawMany()
    return result.map(attr => attr.attribute_id)
  }
}
