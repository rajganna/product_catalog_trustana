import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator'
import { LinkType } from '../entities'

export class GetAttributesQueryDto {
  /**
   * Filter by category nodes (single node or multiple nodes)
   * Supports both single UUID string or array of UUID strings
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined
    if (typeof value === 'string') return [value]
    return Array.isArray(value) ? value : [value]
  })
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[]

  /**
   * Filter by specific link types (direct, inherited, global)
   * When no link type is supplied, returns all applicable attributes (direct + inherited + global)
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined
    if (typeof value === 'string') return [value]
    return Array.isArray(value) ? value : [value]
  })
  @IsArray()
  @IsEnum(LinkType, { each: true })
  linkTypes?: LinkType[]

  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10

  @IsOptional()
  @IsString()
  sortBy?: string = 'name'

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'ASC'

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  notApplicable?: boolean
}
