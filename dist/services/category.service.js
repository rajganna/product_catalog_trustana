"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const cache_service_1 = require("./cache.service");
let CategoryService = class CategoryService {
    constructor(categoryRepository, categoryAttributeRepository, productRepository, cacheService) {
        this.categoryRepository = categoryRepository;
        this.categoryAttributeRepository = categoryAttributeRepository;
        this.productRepository = productRepository;
        this.cacheService = cacheService;
    }
    async getCategories(query, pagination) {
        var _a, _b, _c, _d, _e;
        const page = (pagination === null || pagination === void 0 ? void 0 : pagination.offset) ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : ((_a = query.page) !== null && _a !== void 0 ? _a : 1);
        const limit = (_c = (_b = pagination === null || pagination === void 0 ? void 0 : pagination.limit) !== null && _b !== void 0 ? _b : query.limit) !== null && _c !== void 0 ? _c : 10;
        const cacheKey = this.cacheService.keys.categories({
            keyword: query.keyword,
            parentId: query.parentId,
            includeAttributeCount: query.includeAttributeCount,
            includeProductCount: query.includeProductCount,
            page,
            limit,
            sortBy: (_d = query.sortBy) !== null && _d !== void 0 ? _d : 'name',
            sortOrder: (_e = query.sortOrder) !== null && _e !== void 0 ? _e : 'ASC',
        });
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.fetchCategoriesFromDatabase(query, pagination);
        await this.cacheService.set(cacheKey, result, this.cacheService['TTL'].CATEGORIES);
        return result;
    }
    async fetchCategoriesFromDatabase(query, pagination) {
        var _a, _b, _c;
        const page = (pagination === null || pagination === void 0 ? void 0 : pagination.offset) ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : ((_a = query.page) !== null && _a !== void 0 ? _a : 1);
        const limit = (_c = (_b = pagination === null || pagination === void 0 ? void 0 : pagination.limit) !== null && _b !== void 0 ? _b : query.limit) !== null && _c !== void 0 ? _c : 10;
        const { keyword, parentId, includeAttributeCount = false, includeProductCount = false, sortBy = 'name', sortOrder = 'ASC', } = query;
        const queryBuilder = this.categoryRepository
            .createQueryBuilder('category')
            .where('1=1');
        if (keyword) {
            queryBuilder.andWhere('(LOWER(category.name) LIKE LOWER(:keyword) OR LOWER(category.description) LIKE LOWER(:keyword))', { keyword: `%${keyword}%` });
        }
        if (parentId) {
            queryBuilder.andWhere('category.parentId = :parentId', { parentId });
        }
        else if (parentId === null) {
            queryBuilder.andWhere('category.parentId IS NULL');
        }
        const total = await queryBuilder.getCount();
        queryBuilder.orderBy(`category.${sortBy}`, sortOrder);
        queryBuilder.skip((page - 1) * limit).take(limit);
        const categories = await queryBuilder.getMany();
        const data = await Promise.all(categories.map(async (category) => {
            const response = {
                id: category.id,
                name: category.name,
                description: category.description,
                parentId: category.parentId,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            };
            if (includeAttributeCount) {
                const attributeCount = await this.categoryAttributeRepository
                    .createQueryBuilder('ca')
                    .innerJoin('ca.attribute', 'attr')
                    .where('ca.categoryId = :categoryId', { categoryId: category.id })
                    .andWhere('attr.isActive = :isActive', { isActive: true })
                    .getCount();
                response.directAttributeCount = attributeCount;
            }
            if (includeProductCount) {
                const productCount = await this.productRepository
                    .createQueryBuilder('product')
                    .where('product.categoryId = :categoryId', { categoryId: category.id })
                    .andWhere('product.isActive = :isActive', { isActive: true })
                    .getCount();
                response.productCount = productCount;
            }
            return response;
        }));
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getCategoryTree(query) {
        const includeAttributeCount = query.includeAttributeCount === true;
        const includeProductCount = query.includeProductCount === true;
        const cacheKey = this.cacheService.keys.categoryTree({
            includeAttributeCount,
            includeProductCount,
        });
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.fetchCategoryTreeFromDatabase(includeAttributeCount, includeProductCount);
        await this.cacheService.set(cacheKey, result, this.cacheService['TTL'].CATEGORIES);
        return result;
    }
    async fetchCategoryTreeFromDatabase(includeAttributeCount, includeProductCount) {
        const simplifiedQuery = this.buildCategoryTreeQuery(includeAttributeCount, includeProductCount);
        const result = await this.categoryRepository.query(simplifiedQuery);
        return result.map((row) => row.category_json);
    }
    buildCategoryTreeQuery(includeAttributeCount, includeProductCount) {
        const attributeCountFields = includeAttributeCount
            ? `, COALESCE(ac.attribute_count, 0) as "directAttributeCount"`
            : '';
        const productCountFields = includeProductCount
            ? `, COALESCE(pc.product_count, 0) as "productCount"`
            : '';
        const attributeCountJoin = includeAttributeCount
            ? `
      LEFT JOIN (
        SELECT
          ca."categoryId",
          COUNT(*) as attribute_count
        FROM category_attributes ca
        INNER JOIN attributes a ON ca."attributeId" = a.id
        WHERE a."isActive" = true
        GROUP BY ca."categoryId"
      ) ac ON ct.id = ac."categoryId"`
            : '';
        const productCountJoin = includeProductCount
            ? `
      LEFT JOIN (
        SELECT
          p."categoryId",
          COUNT(*) as product_count
        FROM products p
        WHERE p."isActive" = true
        GROUP BY p."categoryId"
      ) pc ON ct.id = pc."categoryId"`
            : '';
        const attributeCountInJson = includeAttributeCount
            ? `, 'directAttributeCount', root."directAttributeCount"`
            : '';
        const productCountInJson = includeProductCount
            ? `, 'productCount', root."productCount"`
            : '';
        const childAttributeCountInJson = includeAttributeCount
            ? `, 'directAttributeCount', child."directAttributeCount"`
            : '';
        const childProductCountInJson = includeProductCount
            ? `, 'productCount', child."productCount"`
            : '';
        const grandchildAttributeCountInJson = includeAttributeCount
            ? `, 'directAttributeCount', grandchild."directAttributeCount"`
            : '';
        const grandchildProductCountInJson = includeProductCount
            ? `, 'productCount', grandchild."productCount"`
            : '';
        return `
      WITH RECURSIVE category_tree AS (
        SELECT
          c.id,
          c.name,
          c.description,
          c."parentId" as "parentId",
          c."createdAt" as "createdAt",
          c."updatedAt" as "updatedAt",
          0 as level,
          ARRAY[c.id] as path
        FROM categories c
        WHERE c."parentId" IS NULL

        UNION ALL

        SELECT
          c.id,
          c.name,
          c.description,
          c."parentId" as "parentId",
          c."createdAt" as "createdAt",
          c."updatedAt" as "updatedAt",
          ct.level + 1,
          ct.path || c.id
        FROM categories c
        INNER JOIN category_tree ct ON c."parentId" = ct.id
        WHERE NOT c.id = ANY(ct.path) AND ct.level < 10
      ),
      enriched_categories AS (
        SELECT
          ct.*${attributeCountFields}${productCountFields}
        FROM category_tree ct
        ${attributeCountJoin}
        ${productCountJoin}
      )
      SELECT
        JSON_BUILD_OBJECT(
          'id', root.id,
          'name', root.name,
          'description', root.description,
          'parentId', root."parentId",
          'createdAt', root."createdAt",
          'updatedAt', root."updatedAt"${attributeCountInJson}${productCountInJson},
          'children', COALESCE(
            (
              WITH children_tree AS (
                SELECT
                  JSON_BUILD_OBJECT(
                    'id', child.id,
                    'name', child.name,
                    'description', child.description,
                    'parentId', child."parentId",
                    'createdAt', child."createdAt",
                    'updatedAt', child."updatedAt"${childAttributeCountInJson}${childProductCountInJson},
                    'children', COALESCE(
                      (
                        SELECT JSON_AGG(
                          JSON_BUILD_OBJECT(
                            'id', grandchild.id,
                            'name', grandchild.name,
                            'description', grandchild.description,
                            'parentId', grandchild."parentId",
                            'createdAt', grandchild."createdAt",
                            'updatedAt', grandchild."updatedAt"${grandchildAttributeCountInJson}${grandchildProductCountInJson},
                            'children', '[]'::json
                          ) ORDER BY grandchild.name
                        )
                        FROM enriched_categories grandchild
                        WHERE grandchild."parentId" = child.id
                      ),
                      '[]'::json
                    )
                  ) as child_json
                FROM enriched_categories child
                WHERE child."parentId" = root.id
                ORDER BY child.name
              )
              SELECT JSON_AGG(child_json)
              FROM children_tree
            ),
            '[]'::json
          )
        ) as category_json
      FROM enriched_categories root
      WHERE root."parentId" IS NULL
      ORDER BY root.name
    `;
    }
    async invalidateCategoryTreeCaches() {
        await this.cacheService.invalidateCategory();
    }
    async invalidateSpecificCategoryCache(categoryId) {
        await this.cacheService.invalidateCategory(categoryId);
    }
};
exports.CategoryService = CategoryService;
exports.CategoryService = CategoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Category)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.CategoryAttribute)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService])
], CategoryService);
//# sourceMappingURL=category.service.js.map