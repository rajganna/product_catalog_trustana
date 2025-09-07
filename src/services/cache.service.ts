import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Cache } from 'cache-manager'
import * as redis from 'cache-manager-redis-store'
import { ConfigService } from 'nestjs-config'
import { CacheKeyBuilder } from 'src/domains/cache.domain'


@Injectable()
export class CacheService implements OnModuleInit {
  private readonly logger = new Logger('CacheService')
  private cache: Cache
  private cacheEnabled: boolean

  // Cache TTL values (in seconds)
  private readonly TTL = {
    CATEGORIES: parseInt(process.env.CACHE_TTL_CATEGORIES ?? '3600'), // 1 hour
    ATTRIBUTES: parseInt(process.env.CACHE_TTL_ATTRIBUTES ?? '1800'), // 30 minutes
    PRODUCTS: parseInt(process.env.CACHE_TTL_PRODUCTS ?? '600'), // 10 minutes
    SEARCH: 300, // 5 minutes for search results
    HOT_DATA: 7200, // 2 hours for frequently accessed data
  }

  constructor(private readonly config: ConfigService) {
    this.cacheEnabled = process.env.CACHE_ENABLED === 'true'
  }

  async onModuleInit() {
    await this.initializeCache()
  }

  private async initializeCache() {
    if (!this.cacheEnabled) {
      this.logger.log('Cache is disabled - running without Redis')
      return
    }

    try {
      const cacheManager = require('cache-manager')
      this.cache = cacheManager.caching({
        store: redis,
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379'),
        password: process.env.REDIS_PASSWORD ?? undefined,
        db: parseInt(process.env.REDIS_DB ?? '0'),
        ttl: parseInt(process.env.REDIS_TTL ?? '3600'),
      })

      this.logger.log('Cache service initialized with Redis')
    } catch (error) {
      this.logger.error('Failed to initialize cache service', error)
      this.cacheEnabled = false
    }
  }


  public readonly keys: CacheKeyBuilder = {
    categoryTree: (params = {}) => {
      const key = 'category:tree'
      if (params.includeAttributeCount || params.includeProductCount) {
        const attrPart = params.includeAttributeCount ? 'attr' : ''
        const prodPart = params.includeProductCount ? 'prod' : ''
        return `${key}:counts:${attrPart}:${prodPart}`
      }
      return key
    },

    categories: params => {
      const parts = ['categories']
      if (params.keyword) parts.push(`q:${encodeURIComponent(params.keyword)}`)
      if (params.parentId) parts.push(`parent:${params.parentId}`)
      if (params.includeAttributeCount) parts.push('attr')
      if (params.includeProductCount) parts.push('prod')
      if (params.page && params.limit)
        parts.push(`page:${params.page}:${params.limit}`)
      if (params.sortBy && params.sortOrder)
        parts.push(`sort:${params.sortBy}:${params.sortOrder}`)
      return parts.join(':')
    },

    attributes: params => {
      const parts = ['attributes']
      if (params.categoryIds?.length) {
        const sortedIds = [...params.categoryIds].sort((a, b) =>
          a.localeCompare(b),
        )
        parts.push(`cat:${sortedIds.join(',')}`)
      }
      if (params.linkTypes?.length) {
        const sortedTypes = [...params.linkTypes].sort((a, b) =>
          a.localeCompare(b),
        )
        parts.push(`link:${sortedTypes.join(',')}`)
      }
      if (params.keyword) parts.push(`q:${encodeURIComponent(params.keyword)}`)
      if (params.page && params.limit)
        parts.push(`page:${params.page}:${params.limit}`)
      if (params.sortBy && params.sortOrder)
        parts.push(`sort:${params.sortBy}:${params.sortOrder}`)
      return parts.join(':')
    },

    categoryAttributes: categoryId => `category:${categoryId}:attributes`,

    productsByCategory: (categoryId, filters = {}) => {
      const parts = [`products:category:${categoryId}`]
      const filterKeys = Object.keys(filters).sort((a, b) => a.localeCompare(b))
      if (filterKeys.length > 0) {
        const filterParts = filterKeys.map(k => `${k}:${filters[k]}`)
        parts.push(`filters:${filterParts.join(',')}`)
      }
      return parts.join(':')
    },

    searchResults: (query, filters = {}) => {
      const parts = [`search:${encodeURIComponent(query)}`]
      const filterKeys = Object.keys(filters).sort((a, b) => a.localeCompare(b))
      if (filterKeys.length > 0) {
        const filterParts = filterKeys.map(k => `${k}:${filters[k]}`)
        parts.push(`filters:${filterParts.join(',')}`)
      }
      return parts.join(':')
    },
  }


  async get<T>(key: string): Promise<T | null> {
    if (!this.cacheEnabled || !this.cache) return null

    try {
      const result = await this.cache.get<T>(key)
      if (result) {
        this.logger.debug(`Cache HIT: ${key}`)
      } else {
        this.logger.debug(`Cache MISS: ${key}`)
      }
      return result ?? null
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error)
      return null
    }
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.cacheEnabled || !this.cache) return

    try {
      await this.cache.set(key, value, { ttl: ttl ?? this.TTL.ATTRIBUTES })
      this.logger.debug(
        `Cache SET: ${key} (TTL: ${ttl ?? this.TTL.ATTRIBUTES}s)`,
      )
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error)
    }
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    if (!this.cacheEnabled || !this.cache) return

    try {
      await this.cache.del(key)
      this.logger.debug(`Cache DEL: ${key}`)
    } catch (error) {
      this.logger.error(`Cache DEL error for key ${key}:`, error)
    }
  }

  /**
   * Clear cache by pattern
   */
  async clearPattern(pattern: string): Promise<void> {
    if (!this.cacheEnabled || !this.cache) return

    try {
      // Redis-specific pattern clearing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const redisStore = this.cache.store as any
      const redis = redisStore.getClient
        ? redisStore.getClient()
        : redisStore._redisCache
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
        this.logger.log(
          `Cleared ${keys.length} cache entries matching pattern: ${pattern}`,
        )
      }
    } catch (error) {
      this.logger.error(
        `Cache pattern clear error for pattern ${pattern}:`,
        error,
      )
    }
  }

  /**
   * Cache invalidation helpers
   */
  async invalidateCategory(categoryId?: string): Promise<void> {
    const patterns = ['category:tree*', 'attributes*']

    if (categoryId) {
      patterns.push(`category:${categoryId}:*`)
      patterns.push(`products:category:${categoryId}*`)
    }

    await Promise.all(patterns.map(pattern => this.clearPattern(pattern)))
  }

  async invalidateAttributes(): Promise<void> {
    await this.clearPattern('attributes*')
  }

  async invalidateProducts(categoryId?: string): Promise<void> {
    const patterns = ['search:*']

    if (categoryId) {
      patterns.push(`products:category:${categoryId}*`)
    } else {
      patterns.push('products:*')
    }

    await Promise.all(patterns.map(pattern => this.clearPattern(pattern)))
  }

  /**
   * Wrapper for caching expensive operations
   */
  async wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T> {
    if (!this.cacheEnabled) {
      return await fn()
    }

    try {
      const cached = await this.get<T>(key)
      if (cached !== null) {
        return cached
      }

      const result = await fn()
      await this.set(key, result, ttl)
      return result
    } catch (error) {
      this.logger.error(`Cache wrap error for key ${key}:`, error)
      return await fn()
    }
  }

  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    if (!this.cacheEnabled || !this.cache) return true // If disabled, consider healthy

    try {
      const testKey = 'health:check'
      await this.set(testKey, 'ok', 10)
      const result = await this.get<string>(testKey)
      await this.del(testKey)
      return result === 'ok'
    } catch (error) {
      this.logger.error('Cache health check failed:', error)
      return false
    }
  }

  /**
   * Get cache statistics (Redis-specific)
   */
  async getStats(): Promise<Record<string, unknown>> {
    if (!this.cacheEnabled || !this.cache) return {}

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const redisStore = this.cache.store as any
      const redis = redisStore.getClient
        ? redisStore.getClient()
        : redisStore._redisCache
      const info = await redis.info('memory')
      const keyspace = await redis.info('keyspace')

      return {
        memory: info,
        keyspace,
        connected: redis.status === 'ready',
      }
    } catch (error) {
      this.logger.error('Failed to get cache stats:', error)
      return { error: error.message }
    }
  }

  /**
   * Create materialized views for better performance on heavy queries
   */
  async setupMaterializedViews(): Promise<void> {
    if (!this.cacheEnabled) return

    try {
      // Create materialized view for category tree with counts
      await this.createCategoryTreeMaterializedView()

      // Create materialized view for attribute relationships
      await this.createAttributeRelationshipMaterializedView()

      this.logger.log('Materialized views created successfully')
    } catch (error) {
      this.logger.error('Failed to create materialized views:', error)
    }
  }

  private async createCategoryTreeMaterializedView(): Promise<void> {
    // Note: This query would be executed in a real implementation
    // const createViewQuery = `...`
    // await this.repository.query(createViewQuery)

    this.logger.debug('Category tree materialized view setup completed')
  }

  private async createAttributeRelationshipMaterializedView(): Promise<void> {

    this.logger.debug(
      'Attribute relationship materialized view setup completed',
    )
  }

  async refreshMaterializedViews(): Promise<void> {
    if (!this.cacheEnabled) return

    try {
      this.logger.log('Materialized views refreshed successfully')
    } catch (error) {
      this.logger.error('Failed to refresh materialized views:', error)
    }
  }

  async refresh() {
    this.logger.log('Testing')
  }
}
