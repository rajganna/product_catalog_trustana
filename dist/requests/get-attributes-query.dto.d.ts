import { LinkType } from '../entities';
export declare class GetAttributesQueryDto {
    categoryIds?: string[];
    linkTypes?: LinkType[];
    keyword?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    notApplicable?: boolean;
}
