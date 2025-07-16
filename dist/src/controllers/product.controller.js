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
exports.ProductController = void 0;
const common_1 = require("@nestjs/common");
const product_service_1 = require("../services/product.service");
let ProductController = class ProductController {
    constructor(productService) {
        this.productService = productService;
    }
    async searchProducts(searchDto, queryParams) {
        var _a, _b, _c, _d;
        const parsedCategoryIds = this.parseCategoryIds(searchDto.categoryIds);
        const attributes = this.extractAttributeFilters(queryParams);
        const searchQuery = {
            keyword: searchDto.keyword,
            categoryIds: parsedCategoryIds,
            priceMin: searchDto.priceMin,
            priceMax: searchDto.priceMax,
            attributes,
            page: (_a = searchDto.page) !== null && _a !== void 0 ? _a : 1,
            limit: Math.min((_b = searchDto.limit) !== null && _b !== void 0 ? _b : 20, 100),
            sortBy: (_c = searchDto.sortBy) !== null && _c !== void 0 ? _c : 'name',
            sortOrder: (_d = searchDto.sortOrder) !== null && _d !== void 0 ? _d : 'ASC',
        };
        return this.productService.searchProducts(searchQuery);
    }
    async getProductById(id) {
        const product = await this.productService.getProductById(id);
        if (!product) {
            throw new common_1.BadRequestException('Product not found');
        }
        return product;
    }
    parseCategoryIds(categoryIds) {
        if (!categoryIds)
            return undefined;
        if (typeof categoryIds === 'string') {
            return categoryIds.includes(',')
                ? categoryIds
                    .split(',')
                    .map(id => id.trim())
                    .filter(Boolean)
                : [categoryIds];
        }
        return categoryIds;
    }
    extractAttributeFilters(queryParams) {
        if (!queryParams)
            return {};
        const attributes = {};
        for (const [key, value] of Object.entries(queryParams)) {
            if (key.startsWith('attr_') && value) {
                const attributeName = key.substring(5);
                if (typeof value === 'string') {
                    attributes[attributeName] = value.includes(',')
                        ? value
                            .split(',')
                            .map(v => v.trim())
                            .filter(Boolean)
                        : [value];
                }
                else if (Array.isArray(value)) {
                    attributes[attributeName] = value.map(String);
                }
            }
        }
        return attributes;
    }
};
exports.ProductController = ProductController;
__decorate([
    (0, common_1.Get)('search'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "searchProducts", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ProductController.prototype, "getProductById", null);
exports.ProductController = ProductController = __decorate([
    (0, common_1.Controller)('products'),
    __metadata("design:paramtypes", [product_service_1.ProductService])
], ProductController);
//# sourceMappingURL=product.controller.js.map