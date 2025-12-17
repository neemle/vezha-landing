import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Min } from 'class-validator';

export class CreateStaticPageDto {
  @ApiProperty({ example: 'about', description: 'Stable URL slug (kebab-case)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'slug must be lowercase kebab-case (e.g. about or terms-of-service)' })
  slug!: string;

  @ApiProperty({ example: 1, description: 'Category id' })
  @IsInt()
  @Min(1)
  categoryId!: number;

  @ApiProperty({ example: true, required: false, default: false })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @ApiProperty({ example: 'About', description: 'English page title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: '<p>About us...</p>', description: 'English page HTML content' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

