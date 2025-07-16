export interface CacheKeyBuilder {
    categoryTree(params?: {
        includeAttributeCount?: boolean;
        includeProductCount?: boolean;
    }): string;
    attributes(params: {
        categoryIds?: string[];
        linkTypes?: string[];
        keyword?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: string;
    }): string;
    categoryAttributes(categoryId: string): string;
    productsByCategory(categoryId: string, filters?: Record<string, unknown>): string;
    searchResults(query: string, filters?: Record<string, unknown>): string;
}
