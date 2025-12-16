import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadService } from './lead.service';
import { LeadEntity } from './lead.entity';

@ApiTags('Leads')
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @ApiOperation({ summary: 'Submit a lead/contact request' })
  @ApiCreatedResponse({ description: 'Lead created', type: LeadEntity })
  @Post()
  createLead(@Body() dto: CreateLeadDto): Promise<LeadEntity> {
    return this.leadService.create(dto);
  }
}
