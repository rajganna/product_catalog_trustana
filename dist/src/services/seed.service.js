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
exports.SeedService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entities_1 = require("../entities");
let SeedService = class SeedService {
    constructor(categoryRepository, attributeRepository, productRepository, categoryAttributeRepository, productAttributeValueRepository) {
        this.categoryRepository = categoryRepository;
        this.attributeRepository = attributeRepository;
        this.productRepository = productRepository;
        this.categoryAttributeRepository = categoryAttributeRepository;
        this.productAttributeValueRepository = productAttributeValueRepository;
    }
    async seedData() {
        try {
            await this.productAttributeValueRepository.query('DELETE FROM product_attribute_values');
            await this.categoryAttributeRepository.query('DELETE FROM category_attributes');
            await this.productRepository.query('DELETE FROM products');
            await this.attributeRepository.query('DELETE FROM attributes');
            await this.categoryRepository.query('DELETE FROM categories');
            const electronics = await this.categoryRepository.save({
                name: 'Electronics',
                description: 'Electronic devices and gadgets',
            });
            const phones = await this.categoryRepository.save({
                name: 'Smartphones',
                description: 'Mobile phones and smartphones',
                parentId: electronics.id,
            });
            const laptops = await this.categoryRepository.save({
                name: 'Laptops',
                description: 'Laptop computers',
                parentId: electronics.id,
            });
            const clothing = await this.categoryRepository.save({
                name: 'Clothing',
                description: 'Apparel and clothing items',
            });
            const shoes = await this.categoryRepository.save({
                name: 'Shoes',
                description: 'Footwear and shoes',
                parentId: clothing.id,
            });
            const brandAttribute = await this.attributeRepository.save({
                name: 'Brand',
                description: 'Product brand or manufacturer',
                type: entities_1.AttributeType.TEXT,
                isRequired: true,
            });
            const colorAttribute = await this.attributeRepository.save({
                name: 'Color',
                description: 'Product color',
                type: entities_1.AttributeType.SELECT,
                options: {
                    values: ['Black', 'White', 'Blue', 'Red', 'Green', 'Silver', 'Gold'],
                },
                isRequired: false,
            });
            const weightAttribute = await this.attributeRepository.save({
                name: 'Weight',
                description: 'Product weight in grams',
                type: entities_1.AttributeType.NUMBER,
                isRequired: false,
            });
            const screenSizeAttribute = await this.attributeRepository.save({
                name: 'Screen Size',
                description: 'Screen size in inches',
                type: entities_1.AttributeType.NUMBER,
                isRequired: false,
            });
            const storageAttribute = await this.attributeRepository.save({
                name: 'Storage',
                description: 'Storage capacity',
                type: entities_1.AttributeType.SELECT,
                options: {
                    values: ['64GB', '128GB', '256GB', '512GB', '1TB'],
                },
                isRequired: false,
            });
            const sizeAttribute = await this.attributeRepository.save({
                name: 'Size',
                description: 'Product size',
                type: entities_1.AttributeType.SELECT,
                options: {
                    values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
                },
                isRequired: false,
            });
            const materialAttribute = await this.attributeRepository.save({
                name: 'Material',
                description: 'Product material',
                type: entities_1.AttributeType.TEXT,
                isRequired: false,
            });
            await this.categoryAttributeRepository.save({
                categoryId: electronics.id,
                attributeId: brandAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: electronics.id,
                attributeId: colorAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: electronics.id,
                attributeId: weightAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: phones.id,
                attributeId: screenSizeAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: phones.id,
                attributeId: storageAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: laptops.id,
                attributeId: screenSizeAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: laptops.id,
                attributeId: storageAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: clothing.id,
                attributeId: sizeAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: clothing.id,
                attributeId: materialAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: clothing.id,
                attributeId: colorAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: shoes.id,
                attributeId: sizeAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            await this.categoryAttributeRepository.save({
                categoryId: shoes.id,
                attributeId: materialAttribute.id,
                linkType: entities_1.LinkType.DIRECT,
            });
            const iphone = await this.productRepository.save({
                name: 'iPhone 14 Pro',
                description: 'Latest iPhone model',
                sku: 'IPHONE-14-PRO',
                price: 999.99,
                categoryId: phones.id,
            });
            const macbook = await this.productRepository.save({
                name: 'MacBook Pro 16"',
                description: 'Professional laptop',
                sku: 'MACBOOK-PRO-16',
                price: 2499.99,
                categoryId: laptops.id,
            });
            await this.productRepository.save({
                name: 'Cotton T-Shirt',
                description: 'Comfortable cotton t-shirt',
                sku: 'TSHIRT-COTTON',
                price: 29.99,
                categoryId: clothing.id,
            });
            await this.productRepository.save({
                name: 'Running Sneakers',
                description: 'Comfortable running shoes',
                sku: 'SNEAKERS-RUN',
                price: 89.99,
                categoryId: shoes.id,
            });
            await this.productAttributeValueRepository.save({
                productId: iphone.id,
                attributeId: brandAttribute.id,
                value: 'Apple',
            });
            await this.productAttributeValueRepository.save({
                productId: iphone.id,
                attributeId: colorAttribute.id,
                value: 'Silver',
            });
            await this.productAttributeValueRepository.save({
                productId: iphone.id,
                attributeId: screenSizeAttribute.id,
                value: 6.1,
            });
            await this.productAttributeValueRepository.save({
                productId: iphone.id,
                attributeId: storageAttribute.id,
                value: '256GB',
            });
            await this.productAttributeValueRepository.save({
                productId: macbook.id,
                attributeId: brandAttribute.id,
                value: 'Apple',
            });
            await this.productAttributeValueRepository.save({
                productId: macbook.id,
                attributeId: colorAttribute.id,
                value: 'Silver',
            });
            await this.productAttributeValueRepository.save({
                productId: macbook.id,
                attributeId: screenSizeAttribute.id,
                value: 16,
            });
            await this.productAttributeValueRepository.save({
                productId: macbook.id,
                attributeId: storageAttribute.id,
                value: '512GB',
            });
            return 'Sample data seeded successfully!';
        }
        catch (error) {
            throw new Error(`Failed to seed data: ${error.message}`);
        }
    }
};
exports.SeedService = SeedService;
exports.SeedService = SeedService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entities_1.Category)),
    __param(1, (0, typeorm_1.InjectRepository)(entities_1.Attribute)),
    __param(2, (0, typeorm_1.InjectRepository)(entities_1.Product)),
    __param(3, (0, typeorm_1.InjectRepository)(entities_1.CategoryAttribute)),
    __param(4, (0, typeorm_1.InjectRepository)(entities_1.ProductAttributeValue)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeedService);
//# sourceMappingURL=seed.service.js.map