import {
  BadRequestException,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common'
import { Pagination, PaginationParams } from '../decorators/pagination'
import { PaginatedProductResponse, ProductSearchQuery } from '../domains/product.domain'
import { Product } from '../entities/product.entity'
import { ProductSearchDto } from '../requests/product-search.dto'
import { ProductService } from '../services/product.service'

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) { }

  @Get('search')
  async searchProducts(
    @Query() searchDto: ProductSearchDto,
    @Pagination() pagination: PaginationParams,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Query() queryParams: Record<string, any>,
  ): Promise<PaginatedProductResponse> {
    // Extract attribute filters from query params
    const attributes = this.extractAttributeFilters(queryParams)

    // Use pagination params if provided, otherwise fall back to query params
    const page = pagination?.offset ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : (searchDto.page ?? 1)
    const limit = Math.min(pagination?.limit ?? searchDto.limit ?? 20, 100) // Cap at 100 items per page

    const searchQuery: ProductSearchQuery = {
      keyword: searchDto.keyword,
      categoryIds: searchDto.categoryIds,
      priceMin: searchDto.priceMin,
      priceMax: searchDto.priceMax,
      attributes,
      page,
      limit,
      sortBy: searchDto.sortBy ?? 'name',
      sortOrder: searchDto.sortOrder ?? 'ASC',
    }

    return this.productService.searchProducts(searchQuery, pagination)
  }

  @Get(':id')
  async getProductById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Product> {
    const product = await this.productService.getProductById(id)

    if (!product) {
      throw new BadRequestException('Product not found')
    }

    return product
  }

  private extractAttributeFilters(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryParams?: Record<string, any>,
  ): Record<string, string[]> {
    if (!queryParams) return {}

    const attributes: Record<string, string[]> = {}

    for (const [key, value] of Object.entries(queryParams)) {
      if (key.startsWith('attr_') && value) {
        const attributeName = key.substring(5)
        if (typeof value === 'string') {
          attributes[attributeName] = value.includes(',')
            ? value
              .split(',')
              .map(v => v.trim())
              .filter(Boolean)
            : [value]
        } else if (Array.isArray(value)) {
          attributes[attributeName] = value.map(String)
        }
      }
    }

    return attributes
  }
}
