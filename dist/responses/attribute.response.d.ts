import { AttributeType, LinkType } from '../entities';
export declare class AttributeResponse {
    id: string;
    name: string;
    description?: string;
    type: AttributeType;
    options?: Record<string, unknown> | null;
    isRequired: boolean;
    isActive: boolean;
    linkType?: LinkType;
    categoryId?: string;
    categoryName?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare class PaginatedAttributeResponse {
    data: AttributeResponse[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
