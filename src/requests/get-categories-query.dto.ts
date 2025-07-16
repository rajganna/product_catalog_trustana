import { Transform } from 'class-transformer'
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator'
import { AsString } from '../decorators/default-transformer'

export class GetCategoriesQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsString()
  parentId?: string

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeAttributeCount?: boolean

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeProductCount?: boolean

  @IsOptional()
  @IsString()
  @IsIn(['name', 'createdAt', 'updatedAt'])
  @AsString('name')
  sortBy?: string

  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  @AsString('ASC')
  sortOrder?: 'ASC' | 'DESC'

  // Legacy support for non-pagination params
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  page?: number

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number
}
