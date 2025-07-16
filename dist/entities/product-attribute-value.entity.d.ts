import { Attribute } from './attribute.entity';
import { Product } from './product.entity';
export declare class ProductAttributeValue {
    id: string;
    productId: string;
    attributeId: string;
    value: unknown;
    product: Product;
    attribute: Attribute;
    createdAt: Date;
    updatedAt: Date;
}
