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
exports.CategoryController = void 0;
const common_1 = require("@nestjs/common");
const pagination_1 = require("../decorators/pagination");
const get_categories_query_dto_1 = require("../requests/get-categories-query.dto");
const category_service_1 = require("../services/category.service");
let CategoryController = class CategoryController {
    constructor(categoryService) {
        this.categoryService = categoryService;
    }
    async getCategories(query, pagination) {
        return this.categoryService.getCategories(query, pagination);
    }
    async getCategoryTree(includeAttributeCount, includeProductCount) {
        const query = {
            includeAttributeCount: includeAttributeCount === 'true',
            includeProductCount: includeProductCount === 'true',
        };
        return this.categoryService.getCategoryTree(query);
    }
};
exports.CategoryController = CategoryController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, pagination_1.Pagination)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_categories_query_dto_1.GetCategoriesQueryDto,
        pagination_1.PaginationParams]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('tree'),
    __param(0, (0, common_1.Query)('includeAttributeCount')),
    __param(1, (0, common_1.Query)('includeProductCount')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CategoryController.prototype, "getCategoryTree", null);
exports.CategoryController = CategoryController = __decorate([
    (0, common_1.Controller)('categories'),
    __metadata("design:paramtypes", [category_service_1.CategoryService])
], CategoryController);
//# sourceMappingURL=category.controller.js.map