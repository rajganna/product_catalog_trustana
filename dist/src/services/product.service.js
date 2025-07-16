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
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../entities/product.entity");
let ProductService = class ProductService {
    constructor(productRepository) {
        this.productRepository = productRepository;
    }
    async searchProducts(searchQuery) {
        const { page = 1, limit = 20, sortBy = 'name', sortOrder = 'ASC', } = searchQuery;
        const queryBuilder = this.productRepository
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.attributeValues', 'attributeValues');
        if (searchQuery.keyword) {
            queryBuilder.andWhere('product.name ILIKE :keyword', {
                keyword: `%${searchQuery.keyword}%`,
            });
        }
        if (searchQuery.categoryIds && searchQuery.categoryIds.length > 0) {
            queryBuilder.andWhere('product.categoryId IN (:...categoryIds)', {
                categoryIds: searchQuery.categoryIds,
            });
        }
        if (searchQuery.priceMin !== undefined) {
            queryBuilder.andWhere('product.price >= :priceMin', {
                priceMin: searchQuery.priceMin,
            });
        }
        if (searchQuery.priceMax !== undefined) {
            queryBuilder.andWhere('product.price <= :priceMax', {
                priceMax: searchQuery.priceMax,
            });
        }
        if (searchQuery.attributes && Object.keys(searchQuery.attributes).length > 0) {
            Object.entries(searchQuery.attributes).forEach(([attributeName, values], index) => {
                if (values && values.length > 0) {
                    const aliasName = `attr_${index}`;
                    queryBuilder
                        .leftJoin('product.attributeValues', aliasName)
                        .leftJoin(`${aliasName}.attribute`, `${aliasName}_attr`)
                        .andWhere(`${aliasName}_attr.name = :attrName${index}`, {
                        [`attrName${index}`]: attributeName,
                    })
                        .andWhere(`${aliasName}.value IN (:...attrValues${index})`, {
                        [`attrValues${index}`]: values,
                    });
                }
            });
        }
        if (sortBy === 'relevance') {
            queryBuilder.orderBy('product.name', sortOrder);
        }
        else {
            queryBuilder.orderBy(`product.${sortBy}`, sortOrder);
        }
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
    applyFilters(queryBuilder, filters) {
        if (filters.name) {
            queryBuilder.andWhere('product.name ILIKE :name', {
                name: `%${filters.name}%`,
            });
        }
        if (filters.categoryId) {
            queryBuilder.andWhere('product.categoryId = :categoryId', {
                categoryId: filters.categoryId,
            });
        }
        if (filters.minPrice !== undefined) {
            queryBuilder.andWhere('product.price >= :minPrice', {
                minPrice: filters.minPrice,
            });
        }
        if (filters.maxPrice !== undefined) {
            queryBuilder.andWhere('product.price <= :maxPrice', {
                maxPrice: filters.maxPrice,
            });
        }
        if (filters.inStock !== undefined) {
            if (filters.inStock) {
                queryBuilder.andWhere('product.stockQuantity > 0');
            }
            else {
                queryBuilder.andWhere('product.stockQuantity = 0');
            }
        }
        if (filters.tags && filters.tags.length > 0) {
            queryBuilder.andWhere('product.tags && :tags', {
                tags: filters.tags,
            });
        }
        if (filters.attributes && Object.keys(filters.attributes).length > 0) {
            Object.entries(filters.attributes).forEach(([key, value], index) => {
                const paramKey = `attrKey${index}`;
                const paramValue = `attrValue${index}`;
                queryBuilder.andWhere(`product.attributes->>:${paramKey} = :${paramValue}`, {
                    [paramKey]: key,
                    [paramValue]: value,
                });
            });
        }
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductService);
//# sourceMappingURL=product.service.js.map