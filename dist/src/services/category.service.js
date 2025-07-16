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