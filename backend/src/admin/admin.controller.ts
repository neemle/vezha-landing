import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Res, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { ContentService } from '../content/content.service';
import { LeadService } from '../lead/lead.service';
import { UpdateContentDto } from '../content/dto/update-content.dto';
import { CreateDraftLocaleDto } from '../content/dto/create-draft-locale.dto';
import { AdminGuard } from './admin.guard';
import { LeadEntity } from '../lead/lead.entity';
import { UpdateLeadFlagDto } from '../lead/dto/update-lead-flag.dto';
import type { LeadExportState } from '../lead/lead.service';

@ApiTags('Admin')
@ApiSecurity('x-admin-token')
@ApiHeader({ name: 'x-admin-token', description: 'Admin access token', required: true })
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly contentService: ContentService,
    private readonly leadService: LeadService,
  ) {}

  @ApiOperation({ summary: 'Get stored content (all locales or specific locale)' })
  @ApiOkResponse({ description: 'Stored landing content records' })
  @Get('content')
  getContent(@Query('locale') locale?: string) {
    return this.contentService.getRaw(locale);
  }

  @ApiOperation({ summary: 'Update landing content for a locale' })
  @ApiOkResponse({ description: 'Upserts the content payload for the given locale' })
  @ApiBody({ type: UpdateContentDto })
  @Put('content')
  updateContent(@Body() dto: UpdateContentDto) {
    return this.contentService.upsertContent(dto.locale, dto.content);
  }

  @ApiOperation({ summary: 'Create a draft locale by auto-translating existing content' })
  @ApiOkResponse({ description: 'Draft content payload stored for the new locale (active=false)' })
  @ApiBody({ type: CreateDraftLocaleDto })
  @Post('content/locales')
  createDraftLocale(@Body() dto: CreateDraftLocaleDto) {
    return this.contentService.createDraftLocale(dto.locale, dto.sourceLocale);
  }

  @ApiOperation({ summary: 'List submitted leads' })
  @ApiOkResponse({ description: 'All leads ordered by newest first', type: [LeadEntity] })
  @ApiQuery({
    name: 'exported',
    required: false,
    description: 'Filter by exported status (all/exported/unexported)',
    enum: ['all', 'exported', 'unexported'],
  })
  @ApiQuery({
    name: 'includeBad',
    required: false,
    description: 'When false, bad leads are excluded.',
    schema: { type: 'boolean', default: true },
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search across email, name, phone',
  })
  @Get('leads')
  listLeads(
    @Query('exported') exported?: LeadExportState,
    @Query('includeBad') includeBad?: string,
    @Query('search') search?: string,
  ) {
    const includeBadBool = includeBad === undefined ? undefined : includeBad === 'true';
    const exportedState: LeadExportState =
      exported === 'exported' || exported === 'unexported' ? exported : 'all';
    return this.leadService.list({ exported: exportedState, includeBad: includeBadBool, search });
  }

  @ApiOperation({ summary: 'Export unexported leads to CSV and mark them exported' })
  @ApiProduces('text/csv')
  @Get('leads/export')
  async exportLeads(@Res({ passthrough: true }) res: Response): Promise<string> {
    const leads = await this.leadService.exportPending();
    const csv = this.toCsv(leads);
    const stamp = new Date().toISOString().replace(/[-:T]/g, '').split('.')[0];
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="leads-${stamp}.csv"`);
    return csv;
  }

  @ApiOperation({ summary: 'Mark lead as bad/good' })
  @ApiOkResponse({ description: 'Lead updated', type: LeadEntity })
  @Patch('leads/:id/bad')
  markLead(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLeadFlagDto,
  ) {
    return this.leadService.setBadFlag(id, dto.bad);
  }

  private toCsv(leads: LeadEntity[]): string {
    const headers = ['id', 'name', 'email', 'phone', 'message', 'lang', 'referrer', 'bad', 'createdAt', 'exportedAt'];
    const escape = (value: unknown) => {
      if (value === null || value === undefined) return '';
      const str = String(value).replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('"')) return `"${str}"`;
      return str;
    };
    const rows = leads.map((lead) =>
      [
        lead.id,
        lead.name ?? '',
        lead.email,
        lead.phone ?? '',
        lead.message ?? '',
        lead.lang ?? '',
        lead.referrer ?? '',
        lead.bad ? 'true' : 'false',
        lead.createdAt?.toISOString() ?? '',
        lead.exportedAt?.toISOString() ?? '',
      ].map(escape).join(','),
    );
    return [headers.join(','), ...rows].join('\n');
  }
}
