import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateDraftLocaleDto {
  @ApiProperty({ description: 'New locale code to create (e.g. pl, es, de)', example: 'pl' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z-]{2,8}$/, { message: 'locale must be a short language code (e.g. en, ua, pl)' })
  locale!: string;

  @ApiProperty({
    description: 'Source locale to translate from (defaults to en)',
    example: 'en',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z-]{2,8}$/, { message: 'sourceLocale must be a short language code (e.g. en, ua, pl)' })
  sourceLocale?: string;
}

