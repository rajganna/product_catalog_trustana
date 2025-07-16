import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';
import { CacheKeyBuilder } from 'src/domains/cache.domain';
export declare class CacheService implements OnModuleInit {
    private readonly config;
    private readonly logger;
    private cache;
    private cacheEnabled;
    private readonly TTL;
    constructor(config: ConfigService);
    onModuleInit(): Promise<void>;
    private initializeCache;
    readonly keys: CacheKeyBuilder;
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    del(key: string): Promise<void>;
    clearPattern(pattern: string): Promise<void>;
    invalidateCategory(categoryId?: string): Promise<void>;
    invalidateAttributes(): Promise<void>;
    invalidateProducts(categoryId?: string): Promise<void>;
    wrap<T>(key: string, fn: () => Promise<T>, ttl?: number): Promise<T>;
    isHealthy(): Promise<boolean>;
    getStats(): Promise<Record<string, unknown>>;
    setupMaterializedViews(): Promise<void>;
    private createCategoryTreeMaterializedView;
    private createAttributeRelationshipMaterializedView;
    refreshMaterializedViews(): Promise<void>;
}
