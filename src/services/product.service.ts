import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginationParams } from '../decorators/pagination';
import { PaginatedProductResponse, ProductSearchQuery } from '../domains/product.domain';
import { Product } from '../entities/product.entity';


@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) { }

  /**
   * Search products with advanced filtering and pagination
   */
  async searchProducts(
    searchQuery: ProductSearchQuery,
    pagination?: PaginationParams,
  ): Promise<PaginatedProductResponse> {
    const paginationOptions = this.normalizePagination(searchQuery, pagination);

    const queryBuilder = this.createBaseSearchQuery();

    this.applySearchFilters(queryBuilder, searchQuery);
    this.applySorting(queryBuilder, searchQuery.sortBy, searchQuery.sortOrder, searchQuery.keyword);
    this.applyPagination(queryBuilder, paginationOptions);

    const [products, total] = await queryBuilder.getManyAndCount();

    return this.buildPaginatedResponse(products, total, paginationOptions);
  }

  /**
   * Find product by ID with all related data
   */
  async findById(id: string): Promise<Product | null> {
    if (!id) {
      return null;
    }

    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.attributeValues', 'attributeValues')
      .where('product.id = :id', { id })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getOne();
  }

  /**
   * Get product by ID (alias for findById for backward compatibility)
   */
  async getProductById(id: string): Promise<Product | null> {
    return this.findById(id);
  }

  /**
   * Find products by category
   */
  async findByCategory(categoryId: string): Promise<Product[]> {
    if (!categoryId) {
      return [];
    }

    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.attributeValues', 'attributeValues')
      .where('product.categoryId = :categoryId', { categoryId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .orderBy('product.name', 'ASC')
      .getMany();
  }

  /**
   * Get product recommendations based on category and price similarity
   */
  async getRecommendations(productId: string, limit: number = 5): Promise<Product[]> {
    if (!productId || limit <= 0) {
      return [];
    }

    const product = await this.getProductForRecommendations(productId);
    if (!product) {
      return [];
    }

    const priceRange = this.calculatePriceRange(product.price);

    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.categoryId = :categoryId', { categoryId: product.categoryId })
      .andWhere('product.id != :productId', { productId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .andWhere('product.price BETWEEN :minPrice AND :maxPrice', priceRange)
      .orderBy('RANDOM()')
      .limit(limit)
      .getMany();
  }

  /**
   * Additional utility methods for enhanced functionality
   */

  /**
   * Get products count by category
   */
  async getProductCountByCategory(categoryId: string): Promise<number> {
    if (!categoryId) return 0;

    return this.productRepository
      .createQueryBuilder('product')
      .where('product.categoryId = :categoryId', { categoryId })
      .andWhere('product.isActive = :isActive', { isActive: true })
      .getCount();
  }

  /**
   * Search products with advanced filtering (without pagination for exports)
   */
  async searchAllProducts(searchQuery: ProductSearchQuery): Promise<Product[]> {
    const queryBuilder = this.createBaseSearchQuery();

    this.applySearchFilters(queryBuilder, searchQuery);
    this.applySorting(queryBuilder, searchQuery.sortBy, searchQuery.sortOrder, searchQuery.keyword);

    return queryBuilder.getMany();
  }

  /**
   * Get featured/trending products
   */
  async getFeaturedProducts(limit: number = 10): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true })
      .orderBy('product.searchScore', 'DESC')
      .addOrderBy('product.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get products in price range
   */
  async getProductsInPriceRange(minPrice: number, maxPrice: number, limit?: number): Promise<Product[]> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.price BETWEEN :minPrice AND :maxPrice', { minPrice, maxPrice })
      .orderBy('product.price', 'ASC');

    if (limit) {
      queryBuilder.limit(limit);
    }

    return queryBuilder.getMany();
  }

  /**
   * Helper Methods for improved code organization
   */

  /**
   * Normalize pagination parameters from different sources
   */
  private normalizePagination(searchQuery: ProductSearchQuery, pagination?: PaginationParams) {
    const page = pagination?.offset
      ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1
      : (searchQuery.page ?? 1);
    const limit = pagination?.limit ?? searchQuery.limit ?? 20;

    return { page, limit };
  }

  /**
   * Create base search query with standard joins
   */
  private createBaseSearchQuery() {
    return this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .where('product.isActive = :isActive', { isActive: true });
  }

  /**
   * Apply all search filters to the query builder
   */
  private applySearchFilters(queryBuilder: any, searchQuery: ProductSearchQuery): void {
    this.applyKeywordFilter(queryBuilder, searchQuery.keyword);
    this.applyCategoryFilter(queryBuilder, searchQuery.categoryIds);
    this.applyPriceFilter(queryBuilder, searchQuery.priceMin, searchQuery.priceMax);
    this.applyAttributeFilter(queryBuilder, searchQuery.attributes);
  }

  /**
   * Apply keyword search filter with improved search logic
   */
  private applyKeywordFilter(queryBuilder: any, keyword?: string): void {
    if (keyword?.trim()) {
      const searchTerm = keyword.toLowerCase();
      queryBuilder.andWhere(
        '(product.searchVector ILIKE :keyword OR LOWER(product.name) LIKE :keyword OR LOWER(product.description) LIKE :keyword)',
        { keyword: `%${searchTerm}%` }
      );
    }
  }

  /**
   * Apply category filter with support for multiple categories
   */
  private applyCategoryFilter(queryBuilder: any, categoryIds?: string | string[]): void {
    if (!categoryIds) return;

    const categoryArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
    if (categoryArray.length === 0) return;

    if (categoryArray.length === 1) {
      queryBuilder.andWhere('product.categoryPath LIKE :categoryPath', {
        categoryPath: `%${categoryArray[0]}%`
      });
    } else {
      const categoryConditions = categoryArray.map((_, index) =>
        `product.categoryPath LIKE :categoryPath${index}`
      ).join(' OR ');

      queryBuilder.andWhere(`(${categoryConditions})`);

      categoryArray.forEach((categoryId, index) => {
        queryBuilder.setParameter(`categoryPath${index}`, `%${categoryId}%`);
      });
    }
  }

  /**
   * Apply price range filter with validation
   */
  private applyPriceFilter(queryBuilder: any, priceMin?: number, priceMax?: number): void {
    if (priceMin !== undefined && priceMin >= 0) {
      queryBuilder.andWhere('product.price >= :priceMin', { priceMin });
    }
    if (priceMax !== undefined && priceMax >= 0) {
      queryBuilder.andWhere('product.price <= :priceMax', { priceMax });
    }
  }

  /**
   * Apply attribute filters with improved JSON querying
   */
  private applyAttributeFilter(queryBuilder: any, attributes?: Record<string, string[]>): void {
    if (!attributes || Object.keys(attributes).length === 0) return;

    Object.entries(attributes).forEach(([attributeName, values], index) => {
      if (values && values.length > 0) {
        const attrKey = attributeName.toLowerCase();
        const attrValues = values.map(v => v.toLowerCase());

        queryBuilder.andWhere(
          `product.attributeIndex::jsonb ? :attrKey${index} AND product.attributeIndex::jsonb ->> :attrKey${index} ~ :attrPattern${index}`,
          {
            [`attrKey${index}`]: attrKey,
            [`attrPattern${index}`]: attrValues.join('|'),
          }
        );
      }
    });
  }

  /**
   * Apply sorting with improved relevance scoring
   */
  private applySorting(queryBuilder: any, sortBy = 'name', sortOrder = 'ASC', keyword?: string): void {
    const order = sortOrder.toUpperCase() as 'ASC' | 'DESC';

    switch (sortBy) {
      case 'relevance':
        if (keyword?.trim()) {
          queryBuilder
            .orderBy('product.searchScore', 'DESC')
            .addOrderBy('product.name', order);
        } else {
          queryBuilder.orderBy('product.searchScore', 'DESC');
        }
        break;
      case 'price':
        queryBuilder.orderBy('product.price', order);
        break;
      case 'createdAt':
        queryBuilder.orderBy('product.createdAt', order);
        break;
      case 'name':
      default:
        queryBuilder.orderBy('product.name', order);
        break;
    }
  }

  /**
   * Apply pagination to query builder
   */
  private applyPagination(queryBuilder: any, paginationOptions: { page: number; limit: number }): void {
    const offset = (paginationOptions.page - 1) * paginationOptions.limit;
    queryBuilder.skip(offset).take(paginationOptions.limit);
  }

  /**
   * Build paginated response object
   */
  private buildPaginatedResponse(
    products: Product[],
    total: number,
    paginationOptions: { page: number; limit: number }
  ): PaginatedProductResponse {
    return {
      data: products,
      total,
      page: paginationOptions.page,
      limit: paginationOptions.limit,
      totalPages: Math.ceil(total / paginationOptions.limit),
    };
  }

  /**
   * Get product data needed for recommendations
   */
  private async getProductForRecommendations(productId: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id: productId, isActive: true },
      select: ['id', 'categoryId', 'price'],
    });
  }

  /**
   * Calculate price range for recommendations (±50%)
   */
  private calculatePriceRange(basePrice: number): { minPrice: number; maxPrice: number } {
    return {
      minPrice: Math.max(0, basePrice * 0.5),
      maxPrice: basePrice * 1.5,
    };
  }

  /**
   * Validate search query parameters
   */
  private validateSearchQuery(searchQuery: ProductSearchQuery): void {
    // Add validation logic here if needed
    if (searchQuery.priceMin !== undefined && searchQuery.priceMax !== undefined) {
      if (searchQuery.priceMin > searchQuery.priceMax) {
        throw new Error('Minimum price cannot be greater than maximum price');
      }
    }
  }
}
