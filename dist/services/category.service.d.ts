import { Repository } from 'typeorm';
import { PaginationParams } from '../decorators/pagination';
import { Category, CategoryAttribute, Product } from '../entities';
import { GetCategoriesQueryDto } from '../requests/get-categories-query.dto';
import { GetCategoryTreeQueryDto } from '../requests/get-category-tree-query.dto';
import { CategoryResponse, PaginatedCategoryResponse } from '../responses/category.response';
import { CacheService } from './cache.service';
export declare class CategoryService {
    private readonly categoryRepository;
    private readonly categoryAttributeRepository;
    private readonly productRepository;
    private readonly cacheService;
    constructor(categoryRepository: Repository<Category>, categoryAttributeRepository: Repository<CategoryAttribute>, productRepository: Repository<Product>, cacheService: CacheService);
    getCategories(query: GetCategoriesQueryDto, pagination?: PaginationParams): Promise<PaginatedCategoryResponse>;
    private fetchCategoriesFromDatabase;
    getCategoryTree(query: GetCategoryTreeQueryDto): Promise<CategoryResponse[]>;
    private fetchCategoryTreeFromDatabase;
    private buildCategoryTreeQuery;
    invalidateCategoryTreeCaches(): Promise<void>;
    invalidateSpecificCategoryCache(categoryId: string): Promise<void>;
}
