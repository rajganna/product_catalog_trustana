import { CategoryAttribute } from './category-attribute.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
export declare enum AttributeType {
    TEXT = "text",
    NUMBER = "number",
    BOOLEAN = "boolean",
    DATE = "date",
    SELECT = "select",
    MULTI_SELECT = "multi_select"
}
export declare class Attribute {
    id: string;
    name: string;
    description: string;
    type: AttributeType;
    options: Record<string, unknown> | null;
    isRequired: boolean;
    isActive: boolean;
    categoryAttributes: CategoryAttribute[];
    productAttributeValues: ProductAttributeValue[];
    createdAt: Date;
    updatedAt: Date;
}
