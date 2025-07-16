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
exports.AttributeSearchOptimizationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const attribute_entity_1 = require("../entities/attribute.entity");
const category_entity_1 = require("../entities/category.entity");
let AttributeSearchOptimizationService = class AttributeSearchOptimizationService {
    constructor(attributeRepository, categoryRepository) {
        this.attributeRepository = attributeRepository;
        this.categoryRepository = categoryRepository;
    }
    async refreshAttributeSearchOptimization() {
        const queryRunner = this.attributeRepository.manager.connection.createQueryRunner();
        try {
            await this.refreshCategoryHierarchyView(queryRunner);
            await this.refreshAttributeCategoryMappingView(queryRunner);
            await this.refreshAttributeSearchVectorView(queryRunner);
            console.log('✅ Attribute search optimization refreshed successfully');
        }
        catch (error) {
            console.error('❌ Error refreshing attribute search optimization:', error);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async updateAttributeSearchVector(attributeId) {
        const attribute = await this.attributeRepository.findOne({
            where: { id: attributeId },
            relations: ['categoryAttributes', 'categoryAttributes.category'],
        });
        if (!attribute) {
            throw new Error(`Attribute with ID ${attributeId} not found`);
        }
        const searchVector = await this.calculateAttributeSearchVector(attribute);
        const categoryPaths = await this.calculateAttributeCategoryPaths(attribute);
        const relevanceScore = this.calculateAttributeRelevanceScore(attribute);
        await this.attributeRepository.update(attributeId, {
            searchVector,
            categoryPaths: categoryPaths.join('|'),
            relevanceScore,
        });
    }
    async bulkUpdateAttributeSearchVectors() {
        const attributes = await this.attributeRepository.find({
            relations: ['categoryAttributes', 'categoryAttributes.category'],
        });
        const batchSize = 100;
        for (let i = 0; i < attributes.length; i += batchSize) {
            const batch = attributes.slice(i, i + batchSize);
            const updatePromises = batch.map(async (attribute) => {
                const searchVector = await this.calculateAttributeSearchVector(attribute);
                const categoryPaths = await this.calculateAttributeCategoryPaths(attribute);
                const relevanceScore = this.calculateAttributeRelevanceScore(attribute);
                return this.attributeRepository.update(attribute.id, {
                    searchVector,
                    categoryPaths: categoryPaths.join('|'),
                    relevanceScore,
                });
            });
            await Promise.all(updatePromises);
            console.log(`Updated search vectors for attributes ${i + 1}-${Math.min(i + batchSize, attributes.length)} of ${attributes.length}`);
        }
    }
    async refreshCategoryHierarchyView(queryRunner) {
        await queryRunner.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_hierarchy');
    }
    async refreshAttributeCategoryMappingView(queryRunner) {
        await queryRunner.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_attribute_category_mapping');
    }
    async refreshAttributeSearchVectorView(queryRunner) {
        await queryRunner.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_attribute_search_vectors');
    }
    async calculateAttributeSearchVector(attribute) {
        var _a;
        const searchableText = [];
        if (attribute.name)
            searchableText.push(attribute.name.toLowerCase());
        if (attribute.description)
            searchableText.push(attribute.description.toLowerCase());
        if (attribute.type)
            searchableText.push(attribute.type.toLowerCase());
        if ((_a = attribute.categoryAttributes) === null || _a === void 0 ? void 0 : _a.length) {
            attribute.categoryAttributes.forEach((ca) => {
                var _a;
                if ((_a = ca.category) === null || _a === void 0 ? void 0 : _a.name) {
                    searchableText.push(ca.category.name.toLowerCase());
                }
            });
        }
        if (attribute.options && typeof attribute.options === 'object') {
            Object.values(attribute.options).forEach(option => {
                if (typeof option === 'string') {
                    searchableText.push(option.toLowerCase());
                }
            });
        }
        return [...new Set(searchableText)].join(' ');
    }
    async calculateAttributeCategoryPaths(attribute) {
        var _a;
        const paths = [];
        if ((_a = attribute.categoryAttributes) === null || _a === void 0 ? void 0 : _a.length) {
            for (const ca of attribute.categoryAttributes) {
                if (ca.category) {
                    const path = await this.getCategoryPath(ca.category.id);
                    paths.push(path);
                }
            }
        }
        return [...new Set(paths)];
    }
    async getCategoryPath(categoryId) {
        var _a;
        const result = await this.categoryRepository.manager.query(`
      SELECT category_path
      FROM mv_category_hierarchy
      WHERE category_id = $1
    `, [categoryId]);
        return ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.category_path) || '';
    }
    calculateAttributeRelevanceScore(attribute) {
        var _a;
        let score = 0;
        if (attribute.isActive)
            score += 10;
        if (attribute.name)
            score += 5;
        if (attribute.description)
            score += 3;
        if (attribute.isRequired)
            score += 2;
        if ((_a = attribute.categoryAttributes) === null || _a === void 0 ? void 0 : _a.length) {
            score += Math.min(attribute.categoryAttributes.length * 2, 10);
        }
        if (attribute.options && Object.keys(attribute.options).length > 0) {
            score += Math.min(Object.keys(attribute.options).length * 0.5, 5);
        }
        const daysSinceCreated = (Date.now() - attribute.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated <= 30)
            score += 2;
        else if (daysSinceCreated <= 90)
            score += 1;
        return Math.round(score * 100) / 100;
    }
};
exports.AttributeSearchOptimizationService = AttributeSearchOptimizationService;
exports.AttributeSearchOptimizationService = AttributeSearchOptimizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attribute_entity_1.Attribute)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AttributeSearchOptimizationService);
//# sourceMappingURL=attribute-search-optimization.service.js.map