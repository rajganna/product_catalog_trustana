import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { ProductAttributeValue } from '../entities/product-attribute-value.entity';
import { Product } from '../entities/product.entity';
export declare class ProductSearchOptimizationService {
    private readonly productRepository;
    private readonly categoryRepository;
    private readonly attributeValueRepository;
    constructor(productRepository: Repository<Product>, categoryRepository: Repository<Category>, attributeValueRepository: Repository<ProductAttributeValue>);
    updateProductSearchFields(productId: string): Promise<void>;
    bulkUpdateSearchFields(productIds?: string[]): Promise<void>;
    private calculateSearchFields;
    private calculateSearchVector;
    private calculateCategoryPath;
    private calculatePriceRange;
    private calculateAttributeIndex;
    private calculateTags;
    private calculateSearchScore;
}
