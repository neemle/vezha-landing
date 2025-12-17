import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString, Matches } from 'class-validator';
import type { LandingContentPayload } from '../default-content';

export class UpdateContentDto {
  @ApiProperty({ description: 'Locale to update (e.g. en, ua, pl)', example: 'en' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z-]{2,8}$/, { message: 'locale must be a short language code (e.g. en, ua, pl)' })
  locale!: string;

  @ApiProperty({ type: Object, description: 'Localized content payload body' })
  @IsNotEmpty()
  @IsObject()
  content!: LandingContentPayload;
}
