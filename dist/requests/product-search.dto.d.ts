export declare class ProductSearchDto {
    keyword?: string;
    categoryIds?: string | string[];
    priceMin?: number;
    priceMax?: number;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'price' | 'createdAt' | 'relevance';
    sortOrder?: 'ASC' | 'DESC';
}
