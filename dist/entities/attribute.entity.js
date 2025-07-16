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
exports.Attribute = exports.AttributeType = void 0;
const typeorm_1 = require("typeorm");
const category_attribute_entity_1 = require("./category-attribute.entity");
const product_attribute_value_entity_1 = require("./product-attribute-value.entity");
var AttributeType;
(function (AttributeType) {
    AttributeType["TEXT"] = "text";
    AttributeType["NUMBER"] = "number";
    AttributeType["BOOLEAN"] = "boolean";
    AttributeType["DATE"] = "date";
    AttributeType["SELECT"] = "select";
    AttributeType["MULTI_SELECT"] = "multi_select";
})(AttributeType || (exports.AttributeType = AttributeType = {}));
let Attribute = class Attribute {
};
exports.Attribute = Attribute;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Attribute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Attribute.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], Attribute.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AttributeType,
        default: AttributeType.TEXT,
    }),
    __metadata("design:type", String)
], Attribute.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], Attribute.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Attribute.prototype, "isRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Attribute.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Attribute.prototype, "searchVector", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Attribute.prototype, "categoryPaths", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', default: 0 }),
    __metadata("design:type", Number)
], Attribute.prototype, "relevanceScore", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => category_attribute_entity_1.CategoryAttribute, categoryAttribute => categoryAttribute.attribute),
    __metadata("design:type", Array)
], Attribute.prototype, "categoryAttributes", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_attribute_value_entity_1.ProductAttributeValue, productAttributeValue => productAttributeValue.attribute),
    __metadata("design:type", Array)
], Attribute.prototype, "productAttributeValues", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Attribute.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Attribute.prototype, "updatedAt", void 0);
exports.Attribute = Attribute = __decorate([
    (0, typeorm_1.Entity)('attributes')
], Attribute);
//# sourceMappingURL=attribute.entity.js.map