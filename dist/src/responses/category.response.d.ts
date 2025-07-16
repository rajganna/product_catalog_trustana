export declare class CategoryResponse {
    id: string;
    name: string;
    description?: string;
    parentId?: string;
    children?: CategoryResponse[];
    directAttributeCount?: number;
    productCount?: number;
    createdAt: Date;
    updatedAt: Date;
}
