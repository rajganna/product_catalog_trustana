import { Category } from './category.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
export declare class Product {
    id: string;
    name: string;
    description: string;
    sku: string;
    price: number;
    categoryId: string;
    category: Category;
    attributeValues: ProductAttributeValue[];
    isActive: boolean;
    searchVector: string;
    categoryPath: string;
    priceRange: string;
    attributeIndex: Record<string, string[]>;
    tags: string;
    searchScore: number;
    createdAt: Date;
    updatedAt: Date;
}
