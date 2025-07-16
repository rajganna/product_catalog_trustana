import { GetAttributesQueryDto } from '../requests/get-attributes-query.dto';
import { PaginatedAttributeResponse } from '../responses/attribute.response';
import { AttributeService } from '../services/attribute.service';
export declare class AttributeController {
    private readonly attributeService;
    constructor(attributeService: AttributeService);
    getAttributes(query: GetAttributesQueryDto): Promise<PaginatedAttributeResponse>;
}
