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
exports.AttributeController = void 0;
const common_1 = require("@nestjs/common");
const get_attributes_query_dto_1 = require("../requests/get-attributes-query.dto");
const attribute_service_1 = require("../services/attribute.service");
let AttributeController = class AttributeController {
    constructor(attributeService) {
        this.attributeService = attributeService;
    }
    async getAttributes(query) {
        return this.attributeService.getAttributes(query);
    }
};
exports.AttributeController = AttributeController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [get_attributes_query_dto_1.GetAttributesQueryDto]),
    __metadata("design:returntype", Promise)
], AttributeController.prototype, "getAttributes", null);
exports.AttributeController = AttributeController = __decorate([
    (0, common_1.Controller)('attributes'),
    __metadata("design:paramtypes", [attribute_service_1.AttributeService])
], AttributeController);
//# sourceMappingURL=attribute.controller.js.map