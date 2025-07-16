import { Repository } from 'typeorm';
import { Category, CategoryAttribute, Product } from '../entities';
import { GetCategoryTreeQueryDto } from '../requests/get-category-tree-query.dto';
import { CategoryResponse } from '../responses/category.response';
import { CacheService } from './cache.service';
export declare class CategoryService {
    private readonly categoryRepository;
    private readonly categoryAttributeRepository;
    private readonly productRepository;
    private readonly cacheService;
    constructor(categoryRepository: Repository<Category>, categoryAttributeRepository: Repository<CategoryAttribute>, productRepository: Repository<Product>, cacheService: CacheService);
    getCategoryTree(query: GetCategoryTreeQueryDto): Promise<CategoryResponse[]>;
    private fetchCategoryTreeFromDatabase;
    private buildCategoryTreeQuery;
    invalidateCategoryTreeCaches(): Promise<void>;
    invalidateSpecificCategoryCache(categoryId: string): Promise<void>;
}
