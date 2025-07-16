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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAttributeValue = void 0;
const typeorm_1 = require("typeorm");
const attribute_entity_1 = require("./attribute.entity");
const product_entity_1 = require("./product.entity");
let ProductAttributeValue = class ProductAttributeValue {
};
exports.ProductAttributeValue = ProductAttributeValue;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "productId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], ProductAttributeValue.prototype, "attributeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb' }),
    __metadata("design:type", Object)
], ProductAttributeValue.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => product_entity_1.Product, product => product.attributeValues),
    (0, typeorm_1.JoinColumn)({ name: 'productId' }),
    __metadata("design:type", product_entity_1.Product)
], ProductAttributeValue.prototype, "product", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => attribute_entity_1.Attribute, attribute => attribute.productAttributeValues),
    (0, typeorm_1.JoinColumn)({ name: 'attributeId' }),
    __metadata("design:type", attribute_entity_1.Attribute)
], ProductAttributeValue.prototype, "attribute", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ProductAttributeValue.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ProductAttributeValue.prototype, "updatedAt", void 0);
exports.ProductAttributeValue = ProductAttributeValue = __decorate([
    (0, typeorm_1.Entity)('product_attribute_values'),
    (0, typeorm_1.Unique)(['productId', 'attributeId'])
], ProductAttributeValue);
//# sourceMappingURL=product-attribute-value.entity.js.map