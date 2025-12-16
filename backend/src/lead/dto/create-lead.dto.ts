import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateLeadDto {
  @ApiPropertyOptional({ description: 'Contact name', maxLength: 120, example: 'Olena / Daniel' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @ApiProperty({ description: 'Contact email', maxLength: 160, example: 'you@company.com' })
  @IsEmail()
  @MaxLength(160)
  email!: string;

  @ApiPropertyOptional({ description: 'Phone number', maxLength: 60, example: '+380...' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Additional message / infrastructure notes',
    maxLength: 1000,
    example: 'Monitoring for Bitrix24 and VPN gateway',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;

  @ApiPropertyOptional({ description: 'Content language (en/ua)', maxLength: 5, example: 'en' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  lang?: string;
}
