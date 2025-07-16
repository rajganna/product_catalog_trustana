import { Repository } from 'typeorm';
import { Attribute, Category, CategoryAttribute, Product, ProductAttributeValue } from '../entities';
export declare class SeedService {
    private readonly categoryRepository;
    private readonly attributeRepository;
    private readonly productRepository;
    private readonly categoryAttributeRepository;
    private readonly productAttributeValueRepository;
    constructor(categoryRepository: Repository<Category>, attributeRepository: Repository<Attribute>, productRepository: Repository<Product>, categoryAttributeRepository: Repository<CategoryAttribute>, productAttributeValueRepository: Repository<ProductAttributeValue>);
    seedData(): Promise<string>;
}
