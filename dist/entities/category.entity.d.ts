import { Product } from './product.entity';
import { CategoryAttribute } from './category-attribute.entity';
export declare class Category {
    id: string;
    name: string;
    description: string;
    parentId: string;
    parent: Category;
    children: Category[];
    products: Product[];
    categoryAttributes: CategoryAttribute[];
    createdAt: Date;
    updatedAt: Date;
    directAttributeCount?: number;
    productCount?: number;
}
