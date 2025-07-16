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
exports.CategoryAttribute = exports.LinkType = void 0;
const typeorm_1 = require("typeorm");
const category_entity_1 = require("./category.entity");
const attribute_entity_1 = require("./attribute.entity");
var LinkType;
(function (LinkType) {
    LinkType["DIRECT"] = "direct";
    LinkType["INHERITED"] = "inherited";
    LinkType["GLOBAL"] = "global";
})(LinkType || (exports.LinkType = LinkType = {}));
let CategoryAttribute = class CategoryAttribute {
};
exports.CategoryAttribute = CategoryAttribute;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CategoryAttribute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], CategoryAttribute.prototype, "categoryId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], CategoryAttribute.prototype, "attributeId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LinkType,
        default: LinkType.DIRECT,
    }),
    __metadata("design:type", String)
], CategoryAttribute.prototype, "linkType", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => category_entity_1.Category, category => category.categoryAttributes),
    (0, typeorm_1.JoinColumn)({ name: 'categoryId' }),
    __metadata("design:type", category_entity_1.Category)
], CategoryAttribute.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => attribute_entity_1.Attribute, attribute => attribute.categoryAttributes),
    (0, typeorm_1.JoinColumn)({ name: 'attributeId' }),
    __metadata("design:type", attribute_entity_1.Attribute)
], CategoryAttribute.prototype, "attribute", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CategoryAttribute.prototype, "createdAt", void 0);
exports.CategoryAttribute = CategoryAttribute = __decorate([
    (0, typeorm_1.Entity)('category_attributes'),
    (0, typeorm_1.Unique)(['categoryId', 'attributeId'])
], CategoryAttribute);
//# sourceMappingURL=category-attribute.entity.js.map