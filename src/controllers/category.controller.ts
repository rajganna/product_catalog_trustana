import { Controller, Get, Query } from '@nestjs/common'
import { Pagination, PaginationParams } from '../decorators/pagination'
import { GetCategoriesQueryDto } from '../requests/get-categories-query.dto'
import { GetCategoryTreeQueryDto } from '../requests/get-category-tree-query.dto'
import { CategoryResponse, PaginatedCategoryResponse } from '../responses/category.response'
import { CategoryService } from '../services/category.service'

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }

  @Get()
  async getCategories(
    @Query() query: GetCategoriesQueryDto,
    @Pagination() pagination: PaginationParams,
  ): Promise<PaginatedCategoryResponse> {
    return this.categoryService.getCategories(query, pagination)
  }

  @Get('tree')
  async getCategoryTree(
    @Query('includeAttributeCount') includeAttributeCount?: string,
    @Query('includeProductCount') includeProductCount?: string,
  ): Promise<CategoryResponse[]> {
    const query: GetCategoryTreeQueryDto = {
      includeAttributeCount: includeAttributeCount === 'true',
      includeProductCount: includeProductCount === 'true',
    }

    return this.categoryService.getCategoryTree(query)
  }
}
