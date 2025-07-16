import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import {
  Attribute,
  AttributeType,
  Category,
  CategoryAttribute,
  LinkType,
  Product,
  ProductAttributeValue,
} from '../entities'

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(CategoryAttribute)
    private readonly categoryAttributeRepository: Repository<CategoryAttribute>,
    @InjectRepository(ProductAttributeValue)
    private readonly productAttributeValueRepository: Repository<ProductAttributeValue>,
  ) { }

  async seedData(): Promise<string> {
    try {
      // Clear existing data in the correct order (child tables first)
      await this.productAttributeValueRepository.query('DELETE FROM product_attribute_values')
      await this.categoryAttributeRepository.query('DELETE FROM category_attributes')
      await this.productRepository.query('DELETE FROM products')
      await this.attributeRepository.query('DELETE FROM attributes')
      await this.categoryRepository.query('DELETE FROM categories')

      // Create sample categories
      const electronics = await this.categoryRepository.save({
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
      })

      const phones = await this.categoryRepository.save({
        name: 'Smartphones',
        description: 'Mobile phones and smartphones',
        parentId: electronics.id,
      })

      const laptops = await this.categoryRepository.save({
        name: 'Laptops',
        description: 'Laptop computers',
        parentId: electronics.id,
      })

      const clothing = await this.categoryRepository.save({
        name: 'Clothing',
        description: 'Apparel and clothing items',
      })

      const shoes = await this.categoryRepository.save({
        name: 'Shoes',
        description: 'Footwear and shoes',
        parentId: clothing.id,
      })

      // Create sample attributes
      const brandAttribute = await this.attributeRepository.save({
        name: 'Brand',
        description: 'Product brand or manufacturer',
        type: AttributeType.TEXT,
        isRequired: true,
      })

      const colorAttribute = await this.attributeRepository.save({
        name: 'Color',
        description: 'Product color',
        type: AttributeType.SELECT,
        options: {
          values: ['Black', 'White', 'Blue', 'Red', 'Green', 'Silver', 'Gold'],
        },
        isRequired: false,
      })

      const weightAttribute = await this.attributeRepository.save({
        name: 'Weight',
        description: 'Product weight in grams',
        type: AttributeType.NUMBER,
        isRequired: false,
      })

      const screenSizeAttribute = await this.attributeRepository.save({
        name: 'Screen Size',
        description: 'Screen size in inches',
        type: AttributeType.NUMBER,
        isRequired: false,
      })

      const storageAttribute = await this.attributeRepository.save({
        name: 'Storage',
        description: 'Storage capacity',
        type: AttributeType.SELECT,
        options: {
          values: ['64GB', '128GB', '256GB', '512GB', '1TB'],
        },
        isRequired: false,
      })

      const sizeAttribute = await this.attributeRepository.save({
        name: 'Size',
        description: 'Product size',
        type: AttributeType.SELECT,
        options: {
          values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        },
        isRequired: false,
      })

      const materialAttribute = await this.attributeRepository.save({
        name: 'Material',
        description: 'Product material',
        type: AttributeType.TEXT,
        isRequired: false,
      })

      // Create category-attribute relationships with all link types

      // Electronics category gets brand, color, weight (direct)
      await this.categoryAttributeRepository.save({
        categoryId: electronics.id,
        attributeId: brandAttribute.id,
        linkType: LinkType.DIRECT,
      })

      await this.categoryAttributeRepository.save({
        categoryId: electronics.id,
        attributeId: colorAttribute.id,
        linkType: LinkType.DIRECT,
      })

      await this.categoryAttributeRepository.save({
        categoryId: electronics.id,
        attributeId: weightAttribute.id,
        linkType: LinkType.DIRECT,
      })

      // Phones get screen size and storage (direct)
      await this.categoryAttributeRepository.save({
        categoryId: phones.id,
        attributeId: screenSizeAttribute.id,
        linkType: LinkType.DIRECT,
      })

      await this.categoryAttributeRepository.save({
        categoryId: phones.id,
        attributeId: storageAttribute.id,
        linkType: LinkType.DIRECT,
      })

      // Phones inherit brand, color, weight from Electronics (inherited)
      await this.categoryAttributeRepository.save({
        categoryId: phones.id,
        attributeId: brandAttribute.id,
        linkType: LinkType.INHERITED,
      })

      await this.categoryAttributeRepository.save({
        categoryId: phones.id,
        attributeId: colorAttribute.id,
        linkType: LinkType.INHERITED,
      })

      await this.categoryAttributeRepository.save({
        categoryId: phones.id,
        attributeId: weightAttribute.id,
        linkType: LinkType.INHERITED,
      })

      // Laptops get screen size and storage (direct)
      await this.categoryAttributeRepository.save({
        categoryId: laptops.id,
        attributeId: screenSizeAttribute.id,
        linkType: LinkType.DIRECT,
      })

      await this.categoryAttributeRepository.save({
        categoryId: laptops.id,
        attributeId: storageAttribute.id,
        linkType: LinkType.DIRECT,
      })

      // Laptops inherit brand, color, weight from Electronics (inherited)
      await this.categoryAttributeRepository.save({
        categoryId: laptops.id,
        attributeId: brandAttribute.id,
        linkType: LinkType.INHERITED,
      })

      await this.categoryAttributeRepository.save({
        categoryId: laptops.id,
        attributeId: colorAttribute.id,
        linkType: LinkType.INHERITED,
      })

      await this.categoryAttributeRepository.save({
        categoryId: laptops.id,
        attributeId: weightAttribute.id,
        linkType: LinkType.INHERITED,
      })

      // Clothing gets size and material (direct)
      await this.categoryAttributeRepository.save({
        categoryId: clothing.id,
        attributeId: sizeAttribute.id,
        linkType: LinkType.DIRECT,
      })

      await this.categoryAttributeRepository.save({
        categoryId: clothing.id,
        attributeId: materialAttribute.id,
        linkType: LinkType.DIRECT,
      })

      await this.categoryAttributeRepository.save({
        categoryId: clothing.id,
        attributeId: colorAttribute.id,
        linkType: LinkType.DIRECT,
      })

      // Shoes get specific attributes (direct)
      await this.categoryAttributeRepository.save({
        categoryId: shoes.id,
        attributeId: sizeAttribute.id,
        linkType: LinkType.DIRECT,
      })

      await this.categoryAttributeRepository.save({
        categoryId: shoes.id,
        attributeId: materialAttribute.id,
        linkType: LinkType.DIRECT,
      })

      // Shoes inherit color from Clothing (inherited)
      await this.categoryAttributeRepository.save({
        categoryId: shoes.id,
        attributeId: colorAttribute.id,
        linkType: LinkType.INHERITED,
      })

      // Global attributes - brand attribute is also available globally
      await this.categoryAttributeRepository.save({
        categoryId: clothing.id,
        attributeId: brandAttribute.id,
        linkType: LinkType.GLOBAL,
      })

      await this.categoryAttributeRepository.save({
        categoryId: shoes.id,
        attributeId: brandAttribute.id,
        linkType: LinkType.GLOBAL,
      })

      // Create sample products
      const iphone = await this.productRepository.save({
        name: 'iPhone 14 Pro',
        description: 'Latest iPhone model',
        sku: 'IPHONE-14-PRO',
        price: 999.99,
        categoryId: phones.id,
      })

      const macbook = await this.productRepository.save({
        name: 'MacBook Pro 16"',
        description: 'Professional laptop',
        sku: 'MACBOOK-PRO-16',
        price: 2499.99,
        categoryId: laptops.id,
      })

      await this.productRepository.save({
        name: 'Cotton T-Shirt',
        description: 'Comfortable cotton t-shirt',
        sku: 'TSHIRT-COTTON',
        price: 29.99,
        categoryId: clothing.id,
      })

      await this.productRepository.save({
        name: 'Running Sneakers',
        description: 'Comfortable running shoes',
        sku: 'SNEAKERS-RUN',
        price: 89.99,
        categoryId: shoes.id,
      })

      // Create product attribute values
      await this.productAttributeValueRepository.save({
        productId: iphone.id,
        attributeId: brandAttribute.id,
        value: 'Apple',
      })

      await this.productAttributeValueRepository.save({
        productId: iphone.id,
        attributeId: colorAttribute.id,
        value: 'Silver',
      })

      await this.productAttributeValueRepository.save({
        productId: iphone.id,
        attributeId: screenSizeAttribute.id,
        value: 6.1,
      })

      await this.productAttributeValueRepository.save({
        productId: iphone.id,
        attributeId: storageAttribute.id,
        value: '256GB',
      })

      await this.productAttributeValueRepository.save({
        productId: macbook.id,
        attributeId: brandAttribute.id,
        value: 'Apple',
      })

      await this.productAttributeValueRepository.save({
        productId: macbook.id,
        attributeId: colorAttribute.id,
        value: 'Silver',
      })

      await this.productAttributeValueRepository.save({
        productId: macbook.id,
        attributeId: screenSizeAttribute.id,
        value: 16,
      })

      await this.productAttributeValueRepository.save({
        productId: macbook.id,
        attributeId: storageAttribute.id,
        value: '512GB',
      })

      return 'Sample data seeded successfully!'
    } catch (error) {
      throw new Error(`Failed to seed data: ${error.message}`)
    }
  }
}
