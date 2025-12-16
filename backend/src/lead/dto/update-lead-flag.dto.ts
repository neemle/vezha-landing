import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateLeadFlagDto {
  @ApiProperty({ description: 'Mark lead as bad (exclude from export)' })
  @IsBoolean()
  bad!: boolean;
}
