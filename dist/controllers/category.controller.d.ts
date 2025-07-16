import { PaginationParams } from '../decorators/pagination';
import { GetCategoriesQueryDto } from '../requests/get-categories-query.dto';
import { CategoryResponse, PaginatedCategoryResponse } from '../responses/category.response';
import { CategoryService } from '../services/category.service';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    getCategories(query: GetCategoriesQueryDto, pagination: PaginationParams): Promise<PaginatedCategoryResponse>;
    getCategoryTree(includeAttributeCount?: string, includeProductCount?: string): Promise<CategoryResponse[]>;
}
