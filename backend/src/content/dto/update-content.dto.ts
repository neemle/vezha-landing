import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsObject, IsString } from 'class-validator';
import type { LandingContentPayload } from '../default-content';

export class UpdateContentDto {
  @ApiProperty({ enum: ['en', 'ua'], description: 'Locale to update', example: 'en' })
  @IsString()
  @IsIn(['en', 'ua'])
  locale!: string;

  @ApiProperty({ type: Object, description: 'Localized content payload body' })
  @IsNotEmpty()
  @IsObject()
  content!: LandingContentPayload;
}
