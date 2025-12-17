import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../admin/admin.guard';
import { CreateStaticPageDto } from './dto/create-static-page.dto';
import { UpdateStaticPageDto } from './dto/update-static-page.dto';
import { UpsertStaticPageTranslationDto } from './dto/upsert-static-page-translation.dto';
import { PagesService, AdminStaticPage, AdminStaticPageListItem } from './pages.service';

@ApiTags('Admin Pages')
@ApiSecurity('x-admin-token')
@ApiHeader({ name: 'x-admin-token', description: 'Admin access token', required: true })
@UseGuards(AdminGuard)
@Controller('admin/pages')
export class AdminPagesController {
  constructor(private readonly pages: PagesService) {}

  @ApiOperation({ summary: 'List pages (localized with EN fallback)' })
  @ApiOkResponse({ description: 'Page list' })
  @ApiQuery({ name: 'locale', required: false, description: 'Preferred locale for title resolution' })
  @Get()
  list(@Query('locale') locale?: string): Promise<AdminStaticPageListItem[]> {
    return this.pages.listPages(locale);
  }

  @ApiOperation({ summary: 'Get page for editing (localized with EN fallback)' })
  @ApiOkResponse({ description: 'Page record' })
  @ApiQuery({ name: 'locale', required: false, description: 'Preferred locale for translation resolution' })
  @Get(':id')
  get(@Param('id', ParseIntPipe) id: number, @Query('locale') locale?: string): Promise<AdminStaticPage> {
    return this.pages.getPageForAdmin(id, locale);
  }

  @ApiOperation({ summary: 'Create a new page (EN title/content required)' })
  @ApiBody({ type: CreateStaticPageDto })
  @ApiOkResponse({ description: 'Created page' })
  @Post()
  create(@Body() dto: CreateStaticPageDto): Promise<AdminStaticPage> {
    return this.pages.createPage(dto);
  }

  @ApiOperation({ summary: 'Update page base properties (slug/category/published)' })
  @ApiBody({ type: UpdateStaticPageDto })
  @ApiOkResponse({ description: 'Updated page' })
  @ApiQuery({ name: 'locale', required: false, description: 'Preferred locale for translation resolution' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStaticPageDto,
    @Query('locale') locale?: string,
  ): Promise<AdminStaticPage> {
    return this.pages.updatePageBase(id, dto, locale);
  }

  @ApiOperation({ summary: 'Upsert page translation (any locale, EN fallback)' })
  @ApiBody({ type: UpsertStaticPageTranslationDto })
  @ApiOkResponse({ description: 'Updated page translation' })
  @Put(':id/translations')
  upsertTranslation(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertStaticPageTranslationDto): Promise<AdminStaticPage> {
    return this.pages.upsertPageTranslation(id, dto);
  }
}

