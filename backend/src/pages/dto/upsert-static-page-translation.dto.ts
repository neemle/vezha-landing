import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class UpsertStaticPageTranslationDto {
  @ApiProperty({ example: 'ua', description: 'Locale code (e.g. en, ua)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z-]{2,8}$/, { message: 'locale must be a short language code (e.g. en, ua, pl)' })
  locale!: string;

  @ApiProperty({ example: 'Про нас' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: '<p>Ми ...</p>' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}

