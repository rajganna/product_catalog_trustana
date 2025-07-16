import { Repository } from 'typeorm';
import { PaginationParams } from '../decorators/pagination';
import { PaginatedProductResponse, ProductSearchQuery } from '../domains/product.domain';
import { Product } from '../entities/product.entity';
import { ProductSearchOptimizationService } from './product-search-optimization.service';
export declare class ProductService {
    private readonly productRepository;
    private readonly searchOptimizationService;
    constructor(productRepository: Repository<Product>, searchOptimizationService: ProductSearchOptimizationService);
    searchProducts(searchQuery: ProductSearchQuery, pagination?: PaginationParams): Promise<PaginatedProductResponse>;
    private applyKeywordFilter;
    private applyCategoryFilter;
    private applyPriceFilter;
    private applyAttributeFilter;
    private applySorting;
    findById(id: string): Promise<Product | null>;
    getProductById(id: string): Promise<Product | null>;
    findByCategory(categoryId: string): Promise<Product[]>;
    getRecommendations(productId: string, limit?: number): Promise<Product[]>;
    createProduct(productData: Partial<Product>): Promise<Product>;
    updateProduct(id: string, productData: Partial<Product>): Promise<Product>;
    bulkUpdateSearchFields(productIds?: string[]): Promise<void>;
}
