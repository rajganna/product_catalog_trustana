import { Repository } from 'typeorm';
import { PaginationParams } from '../decorators/pagination';
import { Attribute, CategoryAttribute } from '../entities';
import { GetAttributesQueryDto } from '../requests/get-attributes-query.dto';
import { PaginatedAttributeResponse } from '../responses/attribute.response';
import { AttributeService } from '../services/attribute.service';
export declare class AttributeController {
    private readonly attributeService;
    private readonly attributeRepository;
    private readonly categoryAttributeRepository;
    constructor(attributeService: AttributeService, attributeRepository: Repository<Attribute>, categoryAttributeRepository: Repository<CategoryAttribute>);
    getAttributes(query: GetAttributesQueryDto, pagination: PaginationParams): Promise<PaginatedAttributeResponse>;
}
