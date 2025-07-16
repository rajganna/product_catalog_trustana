import { IsOptional, IsBoolean } from 'class-validator'

export class GetCategoryTreeQueryDto {
  @IsOptional()
  @IsBoolean()
  includeAttributeCount?: boolean

  @IsOptional()
  @IsBoolean()
  includeProductCount?: boolean
}
