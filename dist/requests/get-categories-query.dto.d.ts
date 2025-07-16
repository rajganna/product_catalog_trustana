export declare class GetCategoriesQueryDto {
    keyword?: string;
    parentId?: string;
    includeAttributeCount?: boolean;
    includeProductCount?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
}
