import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreatePageCategoryDto {
  @ApiProperty({ example: 'legal', description: 'Stable category code used for grouping' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'code must be lowercase kebab-case (e.g. legal or company-info)',
  })
  code!: string;

  @ApiProperty({ example: 'Legal', description: 'English category title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

