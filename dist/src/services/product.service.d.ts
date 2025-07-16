import { PaginatedProductResponse, ProductSearchQuery } from 'src/domains/product.domain';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
export declare class ProductService {
    private readonly productRepository;
    constructor(productRepository: Repository<Product>);
    searchProducts(searchQuery: ProductSearchQuery): Promise<PaginatedProductResponse>;
    findById(id: string): Promise<Product | null>;
    getProductById(id: string): Promise<Product | null>;
    findByCategory(categoryId: string): Promise<Product[]>;
    getRecommendations(productId: string, limit?: number): Promise<Product[]>;
    private applyFilters;
}
