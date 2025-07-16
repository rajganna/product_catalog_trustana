import { CategoryResponse } from '../responses/category.response';
import { CategoryService } from '../services/category.service';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    getCategoryTree(includeAttributeCount?: string, includeProductCount?: string): Promise<CategoryResponse[]>;
}
