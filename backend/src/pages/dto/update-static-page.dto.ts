import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

export class UpdateStaticPageDto {
  @ApiPropertyOptional({ example: 'about', description: 'Stable URL slug (kebab-case)' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case (e.g. about or terms-of-service)' })
  slug?: string;

  @ApiPropertyOptional({ example: 1, description: 'Category id' })
  @IsOptional()
  @IsInt()
  @Min(1)
  categoryId?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

