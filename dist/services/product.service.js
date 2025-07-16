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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../entities/product.entity");
const product_search_optimization_service_1 = require("./product-search-optimization.service");
let ProductService = class ProductService {
    constructor(productRepository, searchOptimizationService) {
        this.productRepository = productRepository;
        this.searchOptimizationService = searchOptimizationService;
    }
    async searchProducts(searchQuery, pagination) {
        var _a, _b, _c;
        const page = (pagination === null || pagination === void 0 ? void 0 : pagination.offset) ? Math.floor(pagination.offset / (pagination.limit || 20)) + 1 : ((_a = searchQuery.page) !== null && _a !== void 0 ? _a : 1);
        const limit = (_c = (_b = pagination === null || pagination === void 0 ? void 0 : pagination.limit) !== null && _b !== void 0 ? _b : searchQuery.limit) !== null && _c !== void 0 ? _c : 20;
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .where('product.isActive = :isActive', { isActive: true });
        this.applyKeywordFilter(queryBuilder, searchQuery.keyword);
        this.applyCategoryFilter(queryBuilder, searchQuery.categoryIds);
        this.applyPriceFilter(queryBuilder, searchQuery.priceMin, searchQuery.priceMax);
        this.applyAttributeFilter(queryBuilder, searchQuery.attributes);
        this.applySorting(queryBuilder, searchQuery.sortBy, searchQuery.sortOrder, searchQuery.keyword);
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        const [products, total] = await queryBuilder.getManyAndCount();
        return {
            data: products,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    applyKeywordFilter(queryBuilder, keyword) {
        if (keyword) {
            queryBuilder.andWhere('product.searchVector ILIKE :keyword', {
                keyword: `%${keyword.toLowerCase()}%`,
            });
        }
    }
    applyCategoryFilter(queryBuilder, categoryIds) {
        if (categoryIds) {
            const categoryArray = Array.isArray(categoryIds) ? categoryIds : [categoryIds];
            if (categoryArray.length > 0) {
                const categoryConditions = categoryArray.map((_, index) => `product.categoryPath LIKE :categoryPath${index}`).join(' OR ');
                queryBuilder.andWhere(`(${categoryConditions})`);
                categoryArray.forEach((categoryId, index) => {
                    queryBuilder.setParameter(`categoryPath${index}`, `%${categoryId}%`);
                });
            }
        }
    }
    applyPriceFilter(queryBuilder, priceMin, priceMax) {
        if (priceMin !== undefined) {
            queryBuilder.andWhere('product.price >= :priceMin', { priceMin });
        }
        if (priceMax !== undefined) {
            queryBuilder.andWhere('product.price <= :priceMax', { priceMax });
        }
    }
    applyAttributeFilter(queryBuilder, attributes) {
        if (attributes && Object.keys(attributes).length > 0) {
            Object.entries(attributes).forEach(([attributeName, values], index) => {
                if (values && values.length > 0) {
                    const attrKey = attributeName.toLowerCase();
                    const attrValues = values.map(v => v.toLowerCase());
                    queryBuilder.andWhere(`product.attributeIndex::jsonb ? :attrKey${index} AND product.attributeIndex::jsonb ->> :attrKey${index} ~ :attrPattern${index}`, {
                        [`attrKey${index}`]: attrKey,
                        [`attrPattern${index}`]: attrValues.join('|'),
                    });
                }
            });
        }
    }
    applySorting(queryBuilder, sortBy = 'name', sortOrder = 'ASC', keyword) {
        if (sortBy === 'relevance') {
            if (keyword) {
                queryBuilder.orderBy('product.searchScore', 'DESC')
                    .addOrderBy('product.name', sortOrder);
            }
            else {
                queryBuilder.orderBy('product.searchScore', 'DESC');
            }
        }
        else {
            queryBuilder.orderBy(`product.${sortBy}`, sortOrder);
        }
    }
    async findById(id) {
        return this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.attributeValues', 'attributeValues')
            .where('product.id = :id', { id })
            .getOne();
    }
    async getProductById(id) {
        return this.findById(id);
    }
    async findByCategory(categoryId) {
        return this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.attributeValues', 'attributeValues')
            .where('product.categoryId = :categoryId', { categoryId })
            .getMany();
    }
    async getRecommendations(productId, limit = 5) {
        const product = await this.productRepository.findOne({
            where: { id: productId },
            relations: ['category'],
        });
        if (!product) {
            return [];
        }
        return this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .where('product.categoryId = :categoryId', { categoryId: product.categoryId })
            .andWhere('product.id != :productId', { productId })
            .andWhere('product.price BETWEEN :minPrice AND :maxPrice', {
            minPrice: product.price * 0.5,
            maxPrice: product.price * 1.5,
        })
            .orderBy('RANDOM()')
            .limit(limit)
            .getMany();
    }
    async createProduct(productData) {
        const product = await this.productRepository.save(productData);
        await this.searchOptimizationService.updateProductSearchFields(product.id);
        return product;
    }
    async updateProduct(id, productData) {
        const { category, attributeValues, ...updateData } = productData;
        await this.productRepository.update(id, updateData);
        await this.searchOptimizationService.updateProductSearchFields(id);
        const updatedProduct = await this.findById(id);
        if (!updatedProduct) {
            throw new Error(`Product with ID ${id} not found after update`);
        }
        return updatedProduct;
    }
    async bulkUpdateSearchFields(productIds) {
        return this.searchOptimizationService.bulkUpdateSearchFields(productIds);
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository, typeof (_a = typeof product_search_optimization_service_1.ProductSearchOptimizationService !== "undefined" && product_search_optimization_service_1.ProductSearchOptimizationService) === "function" ? _a : Object])
], ProductService);
//# sourceMappingURL=product.service.js.map