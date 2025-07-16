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
    async getAttributes(query, pagination) {
        var _a, _b, _c, _d, _e;
        const page = (pagination === null || pagination === void 0 ? void 0 : pagination.offset) ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : ((_a = query.page) !== null && _a !== void 0 ? _a : 1);
        const limit = (_c = (_b = pagination === null || pagination === void 0 ? void 0 : pagination.limit) !== null && _b !== void 0 ? _b : query.limit) !== null && _c !== void 0 ? _c : 10;
        const cacheKey = this.cacheService.keys.attributes({
            categoryIds: query.categoryIds,
            linkTypes: query.linkTypes,
            keyword: query.keyword,
            page,
            limit,
            sortBy: (_d = query.sortBy) !== null && _d !== void 0 ? _d : 'name',
            sortOrder: (_e = query.sortOrder) !== null && _e !== void 0 ? _e : 'ASC',
        });
        const cached = await this.cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
        const result = await this.fetchAttributesFromDatabase(query, pagination);
        await this.cacheService.set(cacheKey, result, this.cacheService['TTL'].ATTRIBUTES);
        return result;
    }
    async fetchAttributesFromDatabase(query, pagination) {
        var _a, _b, _c;
        const page = (pagination === null || pagination === void 0 ? void 0 : pagination.offset) ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : ((_a = query.page) !== null && _a !== void 0 ? _a : 1);
        const limit = (_c = (_b = pagination === null || pagination === void 0 ? void 0 : pagination.limit) !== null && _b !== void 0 ? _b : query.limit) !== null && _c !== void 0 ? _c : 10;
        const { categoryIds, linkTypes, keyword, sortBy = 'name', sortOrder = 'ASC', notApplicable = false, } = query;
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
        const data = attributes.map(attr => this.transformToResponse(attr, categoryIds));
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getApplicableAttributes(categoryIds, linkTypes, keyword, page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC') {
        let allApplicableAttributes = [];
        const allRelevantCategoryIds = await this.getAllRelevantCategoryIds(categoryIds);
        const queryBuilder = this.attributeRepository
            .createQueryBuilder('attribute')
            .leftJoinAndSelect('attribute.categoryAttributes', 'categoryAttribute')
            .leftJoinAndSelect('categoryAttribute.category', 'category')
            .where('attribute.isActive = :isActive', { isActive: true });
        const shouldIncludeDirect = !linkTypes || linkTypes.includes(entities_1.LinkType.DIRECT);
        const shouldIncludeInherited = !linkTypes || linkTypes.includes(entities_1.LinkType.INHERITED);
        const shouldIncludeGlobal = !linkTypes || linkTypes.includes(entities_1.LinkType.GLOBAL);
        const conditions = [];
        if (shouldIncludeDirect || shouldIncludeInherited) {
            if (shouldIncludeDirect) {
                conditions.push('(categoryAttribute.categoryId IN (:...categoryIds) AND categoryAttribute.linkType = :directType)');
            }
            if (shouldIncludeInherited && allRelevantCategoryIds.length > categoryIds.length) {
                const ancestorIds = allRelevantCategoryIds.filter(id => !categoryIds.includes(id));
                if (ancestorIds.length > 0) {
                    conditions.push('(categoryAttribute.categoryId IN (:...ancestorIds) AND categoryAttribute.linkType = :inheritedType)');
                    queryBuilder.setParameter('ancestorIds', ancestorIds);
                }
            }
        }
        if (conditions.length > 0) {
            queryBuilder.andWhere(`(${conditions.join(' OR ')})`);
            queryBuilder.setParameter('categoryIds', categoryIds);
            if (shouldIncludeDirect) {
                queryBuilder.setParameter('directType', entities_1.LinkType.DIRECT);
            }
            if (shouldIncludeInherited) {
                queryBuilder.setParameter('inheritedType', entities_1.LinkType.INHERITED);
            }
        }
        else if (!shouldIncludeGlobal) {
            queryBuilder.andWhere('1 = 0');
        }
        if (keyword) {
            queryBuilder.andWhere('(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))', { keyword: `%${keyword}%` });
        }
        let linkedAttributes = [];
        if (conditions.length > 0) {
            linkedAttributes = await queryBuilder.getMany();
        }
        let globalAttributes = [];
        if (shouldIncludeGlobal) {
            const globalQuery = this.attributeRepository
                .createQueryBuilder('attribute')
                .leftJoin('attribute.categoryAttributes', 'categoryAttribute')
                .where('attribute.isActive = :isActive', { isActive: true })
                .andWhere('categoryAttribute.id IS NULL');
            if (keyword) {
                globalQuery.andWhere('(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))', { keyword: `%${keyword}%` });
            }
            globalAttributes = await globalQuery.getMany();
        }
        const attributeMap = new Map();
        linkedAttributes.forEach(attr => attributeMap.set(attr.id, attr));
        globalAttributes.forEach(attr => attributeMap.set(attr.id, attr));
        allApplicableAttributes = Array.from(attributeMap.values());
        allApplicableAttributes.sort((a, b) => {
            const aValue = (a[sortBy] || '');
            const bValue = (b[sortBy] || '');
            if (sortOrder === 'DESC') {
                return bValue.localeCompare(aValue);
            }
            return aValue.localeCompare(bValue);
        });
        const startIndex = (page - 1) * limit;
        return allApplicableAttributes.slice(startIndex, startIndex + limit);
    }
    async getAllRelevantCategoryIds(categoryIds) {
        const allIds = new Set(categoryIds);
        for (const categoryId of categoryIds) {
            const ancestors = await this.getAncestorCategories(categoryId);
            ancestors.forEach(id => allIds.add(id));
        }
        return Array.from(allIds);
    }
    async getAncestorCategories(categoryId) {
        const ancestors = [];
        const category = await this.categoryRepository.findOne({
            where: { id: categoryId },
            select: ['parentId']
        });
        if (category === null || category === void 0 ? void 0 : category.parentId) {
            ancestors.push(category.parentId);
            const parentAncestors = await this.getAncestorCategories(category.parentId);
            ancestors.push(...parentAncestors);
        }
        return ancestors;
    }
    async countApplicableAttributes(categoryIds, linkTypes, keyword) {
        const allRelevantCategoryIds = await this.getAllRelevantCategoryIds(categoryIds);
        const shouldIncludeDirect = !linkTypes || linkTypes.includes(entities_1.LinkType.DIRECT);
        const shouldIncludeInherited = !linkTypes || linkTypes.includes(entities_1.LinkType.INHERITED);
        const shouldIncludeGlobal = !linkTypes || linkTypes.includes(entities_1.LinkType.GLOBAL);
        const attributeIds = new Set();
        if (shouldIncludeDirect || shouldIncludeInherited) {
            const queryBuilder = this.attributeRepository
                .createQueryBuilder('attribute')
                .innerJoin('attribute.categoryAttributes', 'categoryAttribute')
                .where('attribute.isActive = :isActive', { isActive: true });
            const conditions = [];
            if (shouldIncludeDirect) {
                conditions.push('(categoryAttribute.categoryId IN (:...categoryIds) AND categoryAttribute.linkType = :directType)');
            }
            if (shouldIncludeInherited && allRelevantCategoryIds.length > categoryIds.length) {
                const ancestorIds = allRelevantCategoryIds.filter(id => !categoryIds.includes(id));
                if (ancestorIds.length > 0) {
                    conditions.push('(categoryAttribute.categoryId IN (:...ancestorIds) AND categoryAttribute.linkType = :inheritedType)');
                    queryBuilder.setParameter('ancestorIds', ancestorIds);
                }
            }
            if (conditions.length > 0) {
                queryBuilder.andWhere(`(${conditions.join(' OR ')})`);
                queryBuilder.setParameter('categoryIds', categoryIds);
                if (shouldIncludeDirect) {
                    queryBuilder.setParameter('directType', entities_1.LinkType.DIRECT);
                }
                if (shouldIncludeInherited) {
                    queryBuilder.setParameter('inheritedType', entities_1.LinkType.INHERITED);
                }
                if (keyword) {
                    queryBuilder.andWhere('(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))', { keyword: `%${keyword}%` });
                }
                const linkedAttributes = await queryBuilder.select('DISTINCT attribute.id').getRawMany();
                linkedAttributes.forEach(attr => attributeIds.add(attr.attribute_id));
            }
        }
        if (shouldIncludeGlobal) {
            const globalQuery = this.attributeRepository
                .createQueryBuilder('attribute')
                .leftJoin('attribute.categoryAttributes', 'categoryAttribute')
                .where('attribute.isActive = :isActive', { isActive: true })
                .andWhere('categoryAttribute.id IS NULL');
            if (keyword) {
                globalQuery.andWhere('(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))', { keyword: `%${keyword}%` });
            }
            const globalAttributes = await globalQuery.select('attribute.id').getRawMany();
            globalAttributes.forEach(attr => attributeIds.add(attr.attribute_id));
        }
        return attributeIds.size;
    }
    async getNotApplicableAttributes(categoryIds, keyword, page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC') {
        const queryBuilder = this.attributeRepository
            .createQueryBuilder('attribute')
            .leftJoin('attribute.categoryAttributes', 'categoryAttribute', 'categoryAttribute.categoryId IN (:...categoryIds)', { categoryIds })
            .where('categoryAttribute.id IS NULL')
            .andWhere('attribute.isActive = :isActive', { isActive: true });
        if (keyword) {
            queryBuilder.andWhere('(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))', { keyword: `%${keyword}%` });
        }
        queryBuilder
            .orderBy(`attribute.${sortBy}`, sortOrder)
            .skip((page - 1) * limit)
            .take(limit);
        return await queryBuilder.getMany();
    }
    async countNotApplicableAttributes(categoryIds, keyword) {
        const queryBuilder = this.attributeRepository
            .createQueryBuilder('attribute')
            .leftJoin('attribute.categoryAttributes', 'categoryAttribute', 'categoryAttribute.categoryId IN (:...categoryIds)', { categoryIds })
            .where('categoryAttribute.id IS NULL')
            .andWhere('attribute.isActive = :isActive', { isActive: true });
        if (keyword) {
            queryBuilder.andWhere('(LOWER(attribute.name) LIKE LOWER(:keyword) OR LOWER(attribute.description) LIKE LOWER(:keyword))', { keyword: `%${keyword}%` });
        }
        return await queryBuilder.getCount();
    }
    transformToResponse(attribute, categoryIds) {
        var _a, _b;
        const response = {
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
        if (categoryIds && categoryIds.length > 0 && ((_a = attribute.categoryAttributes) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            const relevantRelation = attribute.categoryAttributes.find(ca => categoryIds.includes(ca.categoryId));
            if (relevantRelation) {
                response.linkType = relevantRelation.linkType;
                response.categoryId = relevantRelation.categoryId;
                response.categoryName = (_b = relevantRelation.category) === null || _b === void 0 ? void 0 : _b.name;
            }
        }
        return response;
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