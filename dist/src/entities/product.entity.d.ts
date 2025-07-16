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
    createdAt: Date;
    updatedAt: Date;
}
