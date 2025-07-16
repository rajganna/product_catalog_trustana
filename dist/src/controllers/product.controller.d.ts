import { Product } from '../entities/product.entity';
import { PaginatedProductResponse, ProductService } from '../services/product.service';
export interface ProductSearchDto {
    keyword?: string;
    categoryIds?: string | string[];
    priceMin?: number;
    priceMax?: number;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'price' | 'createdAt' | 'relevance';
    sortOrder?: 'ASC' | 'DESC';
}
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    searchProducts(searchDto: ProductSearchDto, queryParams: Record<string, any>): Promise<PaginatedProductResponse>;
    getProductById(id: string): Promise<Product>;
    private parseCategoryIds;
    private extractAttributeFilters;
}
