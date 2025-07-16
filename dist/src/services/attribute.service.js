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
exports.AttributeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
const cache_service_1 = require("./cache.service");
let AttributeService = class AttributeService {
    constructor(attributeRepository, categoryRepository, categoryAttributeRepository, cacheService) {
        this.attributeRepository = attributeRepository;
        this.categoryRepository = categoryRepository;
        this.categoryAttributeRepository = categoryAttributeRepository;
        this.cacheService = cacheService;
    }
    async getAttributes(query) {
        var _a, _b, _c, _d;
        const cacheKey = this.cacheService.keys.attributes({
            categoryIds: query.categoryIds,
            linkTypes: query.linkTypes,
            keyword: query.keyword,
            page: (_a = query.page) !== null && _a !== void 0 ? _a : 1,
            limit: (_b = query.limit) !== null && _b !== void 0 ? _b : 10,
            sortBy: (_c = query.sortBy) !== null && _c !== void 0 ? _c : 'name',
            sortOrder: (_d = query.sortOrder) !== null && _d !== void 0 ? _d : 'ASC',
        });
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.fetchAttributesFromDatabase(query);
        await this.cacheService.set(cacheKey, result, this.cacheService['TTL'].ATTRIBUTES);
        return result;
    }
    async fetchAttributesFromDatabase(query) {
        const { categoryIds, linkTypes, keyword, page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC', notApplicable = false, } = query;
        let attributes = [];
        let total = 0;
        if (categoryIds && categoryIds.length > 0) {
            if (notApplicable) {
                attributes = await this.getNotApplicableAttributes(categoryIds, keyword, page, limit, sortBy, sortOrder);
                total = await this.countNotApplicableAttributes(categoryIds, keyword);
            }
            else {
                attributes = await this.getApplicableAttributes(categoryIds, linkTypes, keyword, page, limit, sortBy, sortOrder);
                total = await this.countApplicableAttributes(categoryIds, linkTypes, keyword);
            }
        }
        else {
            const queryBuilder = this.attributeRepository
                .createQueryBuilder('attribute')
                .where('attribute.isActive = :isActive', { isActive: true });
            if (keyword) {
                queryBuilder.andWhere('(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))', { keyword: `%${keyword}%` });
            }
            total = await queryBuilder.getCount();
            queryBuilder
                .orderBy(`attribute.${sortBy}`, sortOrder)
                .skip((page - 1) * limit)
                .take(limit);
            attributes = await queryBuilder.getMany();
        }
        const data = attributes.map(attr => this.transformToResponse(attr));
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getApplicableAttributes(categoryIds, linkTypes, keyword, page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC') {
        const selectedLinkTypes = linkTypes !== null && linkTypes !== void 0 ? linkTypes : [
            entities_1.LinkType.DIRECT,
            entities_1.LinkType.INHERITED,
            entities_1.LinkType.GLOBAL,
        ];
        const linkTypeConditions = selectedLinkTypes
            .map(type => `'${type}'`)
            .join(',');
        const searchCondition = keyword
            ? `AND (
          to_tsvector('english', COALESCE(a.name, '') || ' ' || COALESCE(a.description, ''))
          @@ plainto_tsquery('english', $2)
          OR LOWER(a.name) LIKE $3
          OR LOWER(a.description) LIKE $3
        )`
            : '';
        const parameters = [categoryIds];
        if (keyword) {
            parameters.push(keyword, `%${keyword.toLowerCase()}%`);
        }
        parameters.push(limit, (page - 1) * limit);
        const query = `
      WITH RECURSIVE category_hierarchy AS (
        -- Get all categories and their ancestors
        SELECT id, parent_id, ARRAY[id] as path, 0 as level
        FROM category
        WHERE id = ANY($1)

        UNION ALL

        SELECT c.id, c.parent_id, ch.path || c.id, ch.level + 1
        FROM category c
        INNER JOIN category_hierarchy ch ON c.id = ch.parent_id
        WHERE NOT c.id = ANY(ch.path) AND ch.level < 10
      ),
      attribute_links AS (
        -- Direct attributes
        SELECT DISTINCT
          a.id,
          a.name,
          a.description,
          a.type,
          a.options,
          a.is_required as "isRequired",
          a.is_active as "isActive",
          a.created_at as "createdAt",
          a.updated_at as "updatedAt",
          '${entities_1.LinkType.DIRECT}' as "linkType",
          ca.category_id as "categoryId",
          c.name as "categoryName",
          -- Use PostgreSQL's ranking for relevance scoring
          ${keyword
            ? `
            ts_rank(
              to_tsvector('english', COALESCE(a.name, '') || ' ' || COALESCE(a.description, '')),
              plainto_tsquery('english', $2)
            ) as relevance_score,
          `
            : '0 as relevance_score,'}
          1 as link_priority
        FROM attribute a
        INNER JOIN category_attribute ca ON a.id = ca.attribute_id
        INNER JOIN category c ON ca.category_id = c.id
        WHERE ca.category_id = ANY($1)
          AND a.is_active = true
          AND ('${entities_1.LinkType.DIRECT}' = ANY(ARRAY[${linkTypeConditions}]))
          ${searchCondition}

        UNION ALL

        -- Inherited attributes (using recursive CTE)
        SELECT DISTINCT
          a.id,
          a.name,
          a.description,
          a.type,
          a.options,
          a.is_required as "isRequired",
          a.is_active as "isActive",
          a.created_at as "createdAt",
          a.updated_at as "updatedAt",
          '${entities_1.LinkType.INHERITED}' as "linkType",
          ca.category_id as "categoryId",
          c.name as "categoryName",
          ${keyword
            ? `
            ts_rank(
              to_tsvector('english', COALESCE(a.name, '') || ' ' || COALESCE(a.description, '')),
              plainto_tsquery('english', $2)
            ) as relevance_score,
          `
            : '0 as relevance_score,'}
          2 as link_priority
        FROM attribute a
        INNER JOIN category_attribute ca ON a.id = ca.attribute_id
        INNER JOIN category c ON ca.category_id = c.id
        INNER JOIN category_hierarchy ch ON ca.category_id = ch.id
        WHERE ca.category_id != ANY($1) -- Exclude direct links
          AND a.is_active = true
          AND ('${entities_1.LinkType.INHERITED}' = ANY(ARRAY[${linkTypeConditions}]))
          ${searchCondition}

        UNION ALL

        -- Global attributes
        SELECT DISTINCT
          a.id,
          a.name,
          a.description,
          a.type,
          a.options,
          a.is_required as "isRequired",
          a.is_active as "isActive",
          a.created_at as "createdAt",
          a.updated_at as "updatedAt",
          '${entities_1.LinkType.GLOBAL}' as "linkType",
          NULL as "categoryId",
          NULL as "categoryName",
          ${keyword
            ? `
            ts_rank(
              to_tsvector('english', COALESCE(a.name, '') || ' ' || COALESCE(a.description, '')),
              plainto_tsquery('english', $2)
            ) as relevance_score,
          `
            : '0 as relevance_score,'}
          3 as link_priority
        FROM attribute a
        WHERE a.is_active = true
          AND NOT EXISTS (SELECT 1 FROM category_attribute ca WHERE ca.attribute_id = a.id)
          AND ('${entities_1.LinkType.GLOBAL}' = ANY(ARRAY[${linkTypeConditions}]))
          ${searchCondition}
      ),
      ranked_attributes AS (
        SELECT
          *,
          -- Use PostgreSQL's window functions for intelligent ranking
          ROW_NUMBER() OVER (
            PARTITION BY id
            ORDER BY link_priority, relevance_score DESC, name
          ) as rn
        FROM attribute_links
      ),
      final_results AS (
        SELECT
          id,
          name,
          description,
          type,
          options,
          "isRequired",
          "isActive",
          "createdAt",
          "updatedAt",
          "linkType",
          "categoryId",
          "categoryName"
        FROM ranked_attributes
        WHERE rn = 1
      )
      SELECT *
      FROM final_results
      ORDER BY
        ${keyword ? 'relevance_score DESC,' : ''}
        CASE WHEN $${parameters.length - 1} = 'name' THEN name END ${sortOrder},
        CASE WHEN $${parameters.length - 1} = 'createdAt' THEN "createdAt" END ${sortOrder},
        CASE WHEN $${parameters.length - 1} = 'updatedAt' THEN "updatedAt" END ${sortOrder},
        name -- fallback ordering
      LIMIT $${parameters.length - 1} OFFSET $${parameters.length}
    `;
        parameters.splice(-2, 0, sortBy);
        const result = await this.attributeRepository.query(query, parameters);
        return result;
    }
    async countApplicableAttributes(categoryIds, linkTypes, keyword) {
        const selectedLinkTypes = linkTypes !== null && linkTypes !== void 0 ? linkTypes : [
            entities_1.LinkType.DIRECT,
            entities_1.LinkType.INHERITED,
            entities_1.LinkType.GLOBAL,
        ];
        const linkTypeQueries = [];
        const parameters = {
            categoryIds,
            keyword: keyword ? `%${keyword.toLowerCase()}%` : null,
        };
        if (selectedLinkTypes.includes(entities_1.LinkType.DIRECT)) {
            linkTypeQueries.push(`
        SELECT DISTINCT a.id
        FROM attribute a
        INNER JOIN category_attribute ca ON a.id = ca.attribute_id
        WHERE ca.category_id = ANY($1)
          AND a.is_active = true
          ${keyword ? 'AND (LOWER(a.name) LIKE $2 OR LOWER(a.description) LIKE $2)' : ''}
      `);
        }
        if (selectedLinkTypes.includes(entities_1.LinkType.INHERITED)) {
            linkTypeQueries.push(`
        WITH RECURSIVE parent_categories AS (
          SELECT parent_id as category_id, 1 as level
          FROM category
          WHERE id = ANY($1) AND parent_id IS NOT NULL

          UNION ALL

          SELECT c.parent_id, pc.level + 1
          FROM category c
          INNER JOIN parent_categories pc ON c.id = pc.category_id
          WHERE c.parent_id IS NOT NULL AND pc.level < 10
        )
        SELECT DISTINCT a.id
        FROM attribute a
        INNER JOIN category_attribute ca ON a.id = ca.attribute_id
        INNER JOIN parent_categories pc ON ca.category_id = pc.category_id
        WHERE a.is_active = true
          ${keyword ? 'AND (LOWER(a.name) LIKE $2 OR LOWER(a.description) LIKE $2)' : ''}
      `);
        }
        if (selectedLinkTypes.includes(entities_1.LinkType.GLOBAL)) {
            linkTypeQueries.push(`
        SELECT DISTINCT a.id
        FROM attribute a
        WHERE a.is_active = true
          AND NOT EXISTS (
            SELECT 1 FROM category_attribute ca WHERE ca.attribute_id = a.id
          )
          ${keyword ? 'AND (LOWER(a.name) LIKE $2 OR LOWER(a.description) LIKE $2)' : ''}
      `);
        }
        if (linkTypeQueries.length === 0) {
            return 0;
        }
        const countQuery = `
      WITH combined_attributes AS (
        ${linkTypeQueries.join(' UNION ')}
      )
      SELECT COUNT(*) as total
      FROM combined_attributes
    `;
        const result = await this.attributeRepository.query(countQuery, [
            parameters.categoryIds,
            ...(keyword ? [parameters.keyword] : []),
        ]);
        return parseInt(result[0].total);
    }
    async getNotApplicableAttributes(categoryIds, keyword, page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC') {
        const query = `
      SELECT
        a.id,
        a.name,
        a.description,
        a.type,
        a.options,
        a.is_required as "isRequired",
        a.is_active as "isActive",
        a.created_at as "createdAt",
        a.updated_at as "updatedAt"
      FROM attribute a
      WHERE a.is_active = true
        ${keyword ? 'AND (LOWER(a.name) LIKE $2 OR LOWER(a.description) LIKE $2)' : ''}
        AND a.id NOT IN (
          SELECT DISTINCT ca.attribute_id
          FROM category_attribute ca
          WHERE ca.category_id = ANY($1)
        )
      ORDER BY a.${sortBy} ${sortOrder}
      LIMIT $${keyword ? '3' : '2'} OFFSET $${keyword ? '4' : '3'}
    `;
        const parameters = [
            categoryIds,
            ...(keyword ? [`%${keyword.toLowerCase()}%`] : []),
            limit,
            (page - 1) * limit,
        ];
        return await this.attributeRepository.query(query, parameters);
    }
    async countNotApplicableAttributes(categoryIds, keyword) {
        const query = `
      SELECT COUNT(*) as total
      FROM attribute a
      WHERE a.is_active = true
        ${keyword ? 'AND (LOWER(a.name) LIKE $2 OR LOWER(a.description) LIKE $2)' : ''}
        AND a.id NOT IN (
          SELECT DISTINCT ca.attribute_id
          FROM category_attribute ca
          WHERE ca.category_id = ANY($1)
        )
    `;
        const parameters = [
            categoryIds,
            ...(keyword ? [`%${keyword.toLowerCase()}%`] : []),
        ];
        const result = await this.attributeRepository.query(query, parameters);
        return parseInt(result[0].total);
    }
    transformToResponse(attribute) {
        return {
            id: attribute.id,
            name: attribute.name,
            description: attribute.description,
            type: attribute.type,
            options: attribute.options,
            isRequired: attribute.isRequired,
            isActive: attribute.isActive,
            createdAt: attribute.createdAt,
            updatedAt: attribute.updatedAt,
        };
    }
    async invalidateAttributeCaches() {
        await this.cacheService.invalidateAttributes();
        await this.cacheService.clearPattern('category:*:attributes');
    }
    async invalidateCategoryAttributeCache(categoryId) {
        const cacheKey = this.cacheService.keys.categoryAttributes(categoryId);
        await this.cacheService.del(cacheKey);
        await this.cacheService.clearPattern(`attributes:*cat:*${categoryId}*`);
    }
};
exports.AttributeService = AttributeService;
exports.AttributeService = AttributeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Attribute)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.CategoryAttribute)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        cache_service_1.CacheService])
], AttributeService);
//# sourceMappingURL=attribute.service.js.map