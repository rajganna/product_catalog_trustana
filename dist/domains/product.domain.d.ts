import { Product } from '../entities/product.entity';
export interface ProductSearchFilters {
    name?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    tags?: string[];
    attributes?: {
        [key: string]: any;
    };
}
export interface ProductSearchOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface ProductSearchResult {
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface ProductSearchQuery {
    keyword?: string;
    categoryIds?: string | string[];
    priceMin?: number;
    priceMax?: number;
    attributes?: Record<string, string[]>;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'price' | 'createdAt' | 'relevance';
    sortOrder?: 'ASC' | 'DESC';
}
export interface PaginatedProductResponse {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
