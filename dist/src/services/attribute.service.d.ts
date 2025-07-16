import { Repository } from 'typeorm';
import { Attribute, Category, CategoryAttribute } from '../entities';
import { GetAttributesQueryDto } from '../requests/get-attributes-query.dto';
import { PaginatedAttributeResponse } from '../responses/attribute.response';
import { CacheService } from './cache.service';
export declare class AttributeService {
    private readonly attributeRepository;
    private readonly categoryRepository;
    private readonly categoryAttributeRepository;
    private readonly cacheService;
    constructor(attributeRepository: Repository<Attribute>, categoryRepository: Repository<Category>, categoryAttributeRepository: Repository<CategoryAttribute>, cacheService: CacheService);
    getAttributes(query: GetAttributesQueryDto): Promise<PaginatedAttributeResponse>;
    private fetchAttributesFromDatabase;
    private getApplicableAttributes;
    private countApplicableAttributes;
    private getNotApplicableAttributes;
    private countNotApplicableAttributes;
    private transformToResponse;
    invalidateAttributeCaches(): Promise<void>;
    invalidateCategoryAttributeCache(categoryId: string): Promise<void>;
}
