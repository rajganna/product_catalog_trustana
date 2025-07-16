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
exports.ProductSearchOptimizationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const category_entity_1 = require("../entities/category.entity");
const product_attribute_value_entity_1 = require("../entities/product-attribute-value.entity");
const product_entity_1 = require("../entities/product.entity");
let ProductSearchOptimizationService = class ProductSearchOptimizationService {
    constructor(productRepository, categoryRepository, attributeValueRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.attributeValueRepository = attributeValueRepository;
    }
    async updateProductSearchFields(productId) {
        const product = await this.productRepository.findOne({
            where: { id: productId },
            relations: ['category', 'attributeValues', 'attributeValues.attribute'],
        });
        if (!product) {
            throw new Error(`Product with ID ${productId} not found`);
        }
        const updates = await this.calculateSearchFields(product);
        await this.productRepository.update(productId, updates);
    }
    async bulkUpdateSearchFields(productIds) {
        const query = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.attributeValues', 'attributeValues')
            .leftJoinAndSelect('attributeValues.attribute', 'attribute');
        if (productIds === null || productIds === void 0 ? void 0 : productIds.length) {
            query.where('product.id IN (:...productIds)', { productIds });
        }
        const products = await query.getMany();
        const batchSize = 100;
        for (let i = 0; i < products.length; i += batchSize) {
            const batch = products.slice(i, i + batchSize);
            const updatePromises = batch.map(async (product) => {
                const updates = await this.calculateSearchFields(product);
                return this.productRepository.update(product.id, updates);
            });
            await Promise.all(updatePromises);
            console.log(`Updated search fields for products ${i + 1}-${Math.min(i + batchSize, products.length)} of ${products.length}`);
        }
    }
    async calculateSearchFields(product) {
        const [searchVector, categoryPath, priceRange, attributeIndex, tags, searchScore] = await Promise.all([
            this.calculateSearchVector(product),
            this.calculateCategoryPath(product),
            this.calculatePriceRange(product.price),
            this.calculateAttributeIndex(product),
            this.calculateTags(product),
            this.calculateSearchScore(product),
        ]);
        return {
            searchVector,
            categoryPath,
            priceRange,
            attributeIndex,
            tags,
            searchScore,
        };
    }
    async calculateSearchVector(product) {
        var _a, _b;
        const searchableText = [];
        if (product.name)
            searchableText.push(product.name.toLowerCase());
        if (product.description)
            searchableText.push(product.description.toLowerCase());
        if (product.sku)
            searchableText.push(product.sku.toLowerCase());
        if ((_a = product.category) === null || _a === void 0 ? void 0 : _a.name) {
            searchableText.push(product.category.name.toLowerCase());
        }
        if ((_b = product.attributeValues) === null || _b === void 0 ? void 0 : _b.length) {
            product.attributeValues.forEach(av => {
                var _a;
                if ((_a = av.attribute) === null || _a === void 0 ? void 0 : _a.name)
                    searchableText.push(av.attribute.name.toLowerCase());
                if (av.value && typeof av.value === 'string')
                    searchableText.push(av.value.toLowerCase());
            });
        }
        const uniqueText = [...new Set(searchableText)];
        return uniqueText.join(' ');
    }
    async calculateCategoryPath(product) {
        if (!product.categoryId)
            return '';
        const categoryPath = [];
        let currentCategory = product.category;
        if (!currentCategory) {
            currentCategory = await this.categoryRepository.findOne({
                where: { id: product.categoryId },
            }) || undefined;
        }
        while (currentCategory) {
            categoryPath.unshift(currentCategory.name.toLowerCase());
            if (currentCategory.parentId) {
                const parentCategory = await this.categoryRepository.findOne({
                    where: { id: currentCategory.parentId },
                });
                currentCategory = parentCategory || undefined;
            }
            else {
                break;
            }
        }
        return categoryPath.join('/');
    }
    calculatePriceRange(price) {
        if (!price || price <= 0)
            return 'free';
        const ranges = [
            { max: 25, label: '0-25' },
            { max: 50, label: '25-50' },
            { max: 100, label: '50-100' },
            { max: 250, label: '100-250' },
            { max: 500, label: '250-500' },
            { max: 1000, label: '500-1000' },
            { max: 2500, label: '1000-2500' },
            { max: 5000, label: '2500-5000' },
            { max: Infinity, label: '5000+' },
        ];
        for (const range of ranges) {
            if (price <= range.max) {
                return range.label;
            }
        }
        return '5000+';
    }
    async calculateAttributeIndex(product) {
        var _a;
        const index = {};
        if ((_a = product.attributeValues) === null || _a === void 0 ? void 0 : _a.length) {
            product.attributeValues.forEach(av => {
                var _a;
                if (((_a = av.attribute) === null || _a === void 0 ? void 0 : _a.name) && av.value && typeof av.value === 'string') {
                    const attrName = av.attribute.name.toLowerCase();
                    if (!index[attrName]) {
                        index[attrName] = [];
                    }
                    index[attrName].push(av.value.toLowerCase());
                }
            });
        }
        return index;
    }
    async calculateTags(product) {
        var _a, _b;
        const tags = [];
        if (product.price) {
            if (product.price <= 25)
                tags.push('budget', 'affordable');
            else if (product.price <= 100)
                tags.push('mid-range');
            else if (product.price >= 1000)
                tags.push('premium', 'luxury');
        }
        if ((_a = product.category) === null || _a === void 0 ? void 0 : _a.name) {
            const categoryName = product.category.name.toLowerCase();
            tags.push(categoryName);
            if (categoryName.includes('electronic'))
                tags.push('tech', 'gadget');
            if (categoryName.includes('clothing'))
                tags.push('fashion', 'apparel');
            if (categoryName.includes('book'))
                tags.push('literature', 'reading');
        }
        if ((_b = product.attributeValues) === null || _b === void 0 ? void 0 : _b.length) {
            product.attributeValues.forEach(av => {
                var _a;
                if (((_a = av.attribute) === null || _a === void 0 ? void 0 : _a.name) && av.value && typeof av.value === 'string') {
                    const attrName = av.attribute.name.toLowerCase();
                    const value = av.value.toLowerCase();
                    if (attrName.includes('color'))
                        tags.push(`${value}-colored`);
                    if (attrName.includes('size'))
                        tags.push(`size-${value}`);
                    if (attrName.includes('brand'))
                        tags.push(`brand-${value}`);
                }
            });
        }
        return [...new Set(tags)].join(',');
    }
    async calculateSearchScore(product) {
        var _a;
        let score = 0;
        if (product.isActive)
            score += 10;
        if (product.name)
            score += 5;
        if (product.description)
            score += 3;
        if (product.price && product.price > 0)
            score += 2;
        if ((_a = product.attributeValues) === null || _a === void 0 ? void 0 : _a.length) {
            score += Math.min(product.attributeValues.length * 0.5, 5);
        }
        const daysSinceCreated = (Date.now() - product.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceCreated <= 30)
            score += 2;
        else if (daysSinceCreated <= 90)
            score += 1;
        return Math.round(score * 100) / 100;
    }
};
exports.ProductSearchOptimizationService = ProductSearchOptimizationService;
exports.ProductSearchOptimizationService = ProductSearchOptimizationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __param(1, (0, typeorm_1.InjectRepository)(category_entity_1.Category)),
    __param(2, (0, typeorm_1.InjectRepository)(product_attribute_value_entity_1.ProductAttributeValue)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ProductSearchOptimizationService);
//# sourceMappingURL=product-search-optimization.service.js.map