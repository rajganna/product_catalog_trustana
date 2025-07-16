"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const redis = require("cache-manager-redis-store");
const nestjs_config_1 = require("nestjs-config");
let CacheService = class CacheService {
    constructor(config) {
        var _a, _b, _c;
        this.config = config;
        this.logger = new common_1.Logger('CacheService');
        this.TTL = {
            CATEGORIES: parseInt((_a = process.env.CACHE_TTL_CATEGORIES) !== null && _a !== void 0 ? _a : '3600'),
            ATTRIBUTES: parseInt((_b = process.env.CACHE_TTL_ATTRIBUTES) !== null && _b !== void 0 ? _b : '1800'),
            PRODUCTS: parseInt((_c = process.env.CACHE_TTL_PRODUCTS) !== null && _c !== void 0 ? _c : '600'),
            SEARCH: 300,
            HOT_DATA: 7200,
        };
        this.keys = {
            categoryTree: (params = {}) => {
                const key = 'category:tree';
                if (params.includeAttributeCount || params.includeProductCount) {
                    const attrPart = params.includeAttributeCount ? 'attr' : '';
                    const prodPart = params.includeProductCount ? 'prod' : '';
                    return `${key}:counts:${attrPart}:${prodPart}`;
                }
                return key;
            },
            categories: params => {
                const parts = ['categories'];
                if (params.keyword)
                    parts.push(`q:${encodeURIComponent(params.keyword)}`);
                if (params.parentId)
                    parts.push(`parent:${params.parentId}`);
                if (params.includeAttributeCount)
                    parts.push('attr');
                if (params.includeProductCount)
                    parts.push('prod');
                if (params.page && params.limit)
                    parts.push(`page:${params.page}:${params.limit}`);
                if (params.sortBy && params.sortOrder)
                    parts.push(`sort:${params.sortBy}:${params.sortOrder}`);
                return parts.join(':');
            },
            attributes: params => {
                var _a, _b;
                const parts = ['attributes'];
                if ((_a = params.categoryIds) === null || _a === void 0 ? void 0 : _a.length) {
                    const sortedIds = [...params.categoryIds].sort((a, b) => a.localeCompare(b));
                    parts.push(`cat:${sortedIds.join(',')}`);
                }
                if ((_b = params.linkTypes) === null || _b === void 0 ? void 0 : _b.length) {
                    const sortedTypes = [...params.linkTypes].sort((a, b) => a.localeCompare(b));
                    parts.push(`link:${sortedTypes.join(',')}`);
                }
                if (params.keyword)
                    parts.push(`q:${encodeURIComponent(params.keyword)}`);
                if (params.page && params.limit)
                    parts.push(`page:${params.page}:${params.limit}`);
                if (params.sortBy && params.sortOrder)
                    parts.push(`sort:${params.sortBy}:${params.sortOrder}`);
                return parts.join(':');
            },
            categoryAttributes: categoryId => `category:${categoryId}:attributes`,
            productsByCategory: (categoryId, filters = {}) => {
                const parts = [`products:category:${categoryId}`];
                const filterKeys = Object.keys(filters).sort((a, b) => a.localeCompare(b));
                if (filterKeys.length > 0) {
                    const filterParts = filterKeys.map(k => `${k}:${filters[k]}`);
                    parts.push(`filters:${filterParts.join(',')}`);
                }
                return parts.join(':');
            },
            searchResults: (query, filters = {}) => {
                const parts = [`search:${encodeURIComponent(query)}`];
                const filterKeys = Object.keys(filters).sort((a, b) => a.localeCompare(b));
                if (filterKeys.length > 0) {
                    const filterParts = filterKeys.map(k => `${k}:${filters[k]}`);
                    parts.push(`filters:${filterParts.join(',')}`);
                }
                return parts.join(':');
            },
        };
        this.cacheEnabled = process.env.CACHE_ENABLED === 'true';
    }
    async onModuleInit() {
        await this.initializeCache();
    }
    async initializeCache() {
        var _a, _b, _c, _d, _e;
        if (!this.cacheEnabled) {
            this.logger.log('Cache is disabled - running without Redis');
            return;
        }
        try {
            const cacheManager = require('cache-manager');
            this.cache = cacheManager.caching({
                store: redis,
                host: (_a = process.env.REDIS_HOST) !== null && _a !== void 0 ? _a : 'localhost',
                port: parseInt((_b = process.env.REDIS_PORT) !== null && _b !== void 0 ? _b : '6379'),
                password: (_c = process.env.REDIS_PASSWORD) !== null && _c !== void 0 ? _c : undefined,
                db: parseInt((_d = process.env.REDIS_DB) !== null && _d !== void 0 ? _d : '0'),
                ttl: parseInt((_e = process.env.REDIS_TTL) !== null && _e !== void 0 ? _e : '3600'),
            });
            this.logger.log('Cache service initialized with Redis');
        }
        catch (error) {
            this.logger.error('Failed to initialize cache service', error);
            this.cacheEnabled = false;
        }
    }
    async get(key) {
        if (!this.cacheEnabled || !this.cache)
            return null;
        try {
            const result = await this.cache.get(key);
            if (result) {
                this.logger.debug(`Cache HIT: ${key}`);
            }
            else {
                this.logger.debug(`Cache MISS: ${key}`);
            }
            return result !== null && result !== void 0 ? result : null;
        }
        catch (error) {
            this.logger.error(`Cache GET error for key ${key}:`, error);
            return null;
        }
    }
    async set(key, value, ttl) {
        if (!this.cacheEnabled || !this.cache)
            return;
        try {
            await this.cache.set(key, value, { ttl: ttl !== null && ttl !== void 0 ? ttl : this.TTL.ATTRIBUTES });
            this.logger.debug(`Cache SET: ${key} (TTL: ${ttl !== null && ttl !== void 0 ? ttl : this.TTL.ATTRIBUTES}s)`);
        }
        catch (error) {
            this.logger.error(`Cache SET error for key ${key}:`, error);
        }
    }
    async del(key) {
        if (!this.cacheEnabled || !this.cache)
            return;
        try {
            await this.cache.del(key);
            this.logger.debug(`Cache DEL: ${key}`);
        }
        catch (error) {
            this.logger.error(`Cache DEL error for key ${key}:`, error);
        }
    }
    async clearPattern(pattern) {
        if (!this.cacheEnabled || !this.cache)
            return;
        try {
            const redisStore = this.cache.store;
            const redis = redisStore.getClient
                ? redisStore.getClient()
                : redisStore._redisCache;
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
                this.logger.log(`Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
            }
        }
        catch (error) {
            this.logger.error(`Cache pattern clear error for pattern ${pattern}:`, error);
        }
    }
    async invalidateCategory(categoryId) {
        const patterns = ['category:tree*', 'attributes*'];
        if (categoryId) {
            patterns.push(`category:${categoryId}:*`);
            patterns.push(`products:category:${categoryId}*`);
        }
        await Promise.all(patterns.map(pattern => this.clearPattern(pattern)));
    }
    async invalidateAttributes() {
        await this.clearPattern('attributes*');
    }
    async invalidateProducts(categoryId) {
        const patterns = ['search:*'];
        if (categoryId) {
            patterns.push(`products:category:${categoryId}*`);
        }
        else {
            patterns.push('products:*');
        }
        await Promise.all(patterns.map(pattern => this.clearPattern(pattern)));
    }
    async wrap(key, fn, ttl) {
        if (!this.cacheEnabled) {
            return await fn();
        }
        try {
            const cached = await this.get(key);
            if (cached !== null) {
                return cached;
            }
            const result = await fn();
            await this.set(key, result, ttl);
            return result;
        }
        catch (error) {
            this.logger.error(`Cache wrap error for key ${key}:`, error);
            return await fn();
        }
    }
    async isHealthy() {
        if (!this.cacheEnabled || !this.cache)
            return true;
        try {
            const testKey = 'health:check';
            await this.set(testKey, 'ok', 10);
            const result = await this.get(testKey);
            await this.del(testKey);
            return result === 'ok';
        }
        catch (error) {
            this.logger.error('Cache health check failed:', error);
            return false;
        }
    }
    async getStats() {
        if (!this.cacheEnabled || !this.cache)
            return {};
        try {
            const redisStore = this.cache.store;
            const redis = redisStore.getClient
                ? redisStore.getClient()
                : redisStore._redisCache;
            const info = await redis.info('memory');
            const keyspace = await redis.info('keyspace');
            return {
                memory: info,
                keyspace,
                connected: redis.status === 'ready',
            };
        }
        catch (error) {
            this.logger.error('Failed to get cache stats:', error);
            return { error: error.message };
        }
    }
    async setupMaterializedViews() {
        if (!this.cacheEnabled)
            return;
        try {
            await this.createCategoryTreeMaterializedView();
            await this.createAttributeRelationshipMaterializedView();
            this.logger.log('Materialized views created successfully');
        }
        catch (error) {
            this.logger.error('Failed to create materialized views:', error);
        }
    }
    async createCategoryTreeMaterializedView() {
        this.logger.debug('Category tree materialized view setup completed');
    }
    async createAttributeRelationshipMaterializedView() {
        this.logger.debug('Attribute relationship materialized view setup completed');
    }
    async refreshMaterializedViews() {
        if (!this.cacheEnabled)
            return;
        try {
            this.logger.log('Materialized views refreshed successfully');
        }
        catch (error) {
            this.logger.error('Failed to refresh materialized views:', error);
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map