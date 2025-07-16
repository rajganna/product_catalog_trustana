import { createParamDecorator } from '@nestjs/common';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsNumber, IsOptional, Max } from 'class-validator';

export class PaginationParams {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }: TransformFnParams) => parseInt(value, 10) || 20)
  @Max(200)
  public limit: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }: TransformFnParams) => parseInt(value, 10) || 0)
  public offset: number;
}

export const Pagination = createParamDecorator((_, ctx) => {
  const { query: { limit = 20, offset = 0 } = {} } = ctx.switchToHttp().getRequest();

  return {
    limit: Number(limit),
    offset: Number(offset),
  };
});
