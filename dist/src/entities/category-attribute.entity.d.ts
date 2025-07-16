import { Category } from './category.entity';
import { Attribute } from './attribute.entity';
export declare enum LinkType {
    DIRECT = "direct",
    INHERITED = "inherited",
    GLOBAL = "global"
}
export declare class CategoryAttribute {
    id: string;
    categoryId: string;
    attributeId: string;
    linkType: LinkType;
    category: Category;
    attribute: Attribute;
    createdAt: Date;
}
