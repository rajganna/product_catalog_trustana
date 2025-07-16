import { PaginationParams } from '../decorators/pagination';
import { PaginatedProductResponse } from '../domains/product.domain';
import { Product } from '../entities/product.entity';
import { ProductSearchDto } from '../requests/product-search.dto';
import { ProductService } from '../services/product.service';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    searchProducts(searchDto: ProductSearchDto, pagination: PaginationParams, queryParams: Record<string, any>): Promise<PaginatedProductResponse>;
    getProductById(id: string): Promise<Product>;
    private extractAttributeFilters;
}
