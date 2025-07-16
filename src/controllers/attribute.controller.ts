import { Controller, Get, Query } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Pagination, PaginationParams } from '../decorators/pagination'
import { Attribute, CategoryAttribute } from '../entities'
import { GetAttributesQueryDto } from '../requests/get-attributes-query.dto'
import { PaginatedAttributeResponse } from '../responses/attribute.response'
import { AttributeService } from '../services/attribute.service'

@Controller('attributes')
export class AttributeController {
  constructor(
    private readonly attributeService: AttributeService,
    @InjectRepository(Attribute)
    private readonly attributeRepository: Repository<Attribute>,
    @InjectRepository(CategoryAttribute)
    private readonly categoryAttributeRepository: Repository<CategoryAttribute>,
  ) { }


  @Get()
  async getAttributes(
    @Query() query: GetAttributesQueryDto,
    @Pagination() pagination: PaginationParams,
  ): Promise<PaginatedAttributeResponse> {
    return this.attributeService.getAttributes(query, pagination)
  }
}
