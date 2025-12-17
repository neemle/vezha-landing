import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AdminGuard } from '../admin/admin.guard';
import { CreatePageCategoryDto } from './dto/create-page-category.dto';
import { UpdatePageCategoryDto } from './dto/update-page-category.dto';
import { UpsertPageCategoryTranslationDto } from './dto/upsert-page-category-translation.dto';
import { PagesService, AdminCategoryListItem } from './pages.service';

@ApiTags('Admin Page Categories')
@ApiSecurity('x-admin-token')
@ApiHeader({ name: 'x-admin-token', description: 'Admin access token', required: true })
@UseGuards(AdminGuard)
@Controller('admin/page-categories')
export class AdminPageCategoriesController {
  constructor(private readonly pages: PagesService) {}

  @ApiOperation({ summary: 'List page categories (localized with EN fallback)' })
  @ApiOkResponse({ description: 'Category list' })
  @ApiQuery({ name: 'locale', required: false, description: 'Preferred locale for title resolution' })
  @Get()
  list(@Query('locale') locale?: string): Promise<AdminCategoryListItem[]> {
    return this.pages.listCategories(locale);
  }

  @ApiOperation({ summary: 'Create a page category (EN title required)' })
  @ApiBody({ type: CreatePageCategoryDto })
  @ApiOkResponse({ description: 'Created category' })
  @Post()
  create(@Body() dto: CreatePageCategoryDto): Promise<AdminCategoryListItem> {
    return this.pages.createCategory(dto);
  }

  @ApiOperation({ summary: 'Update category properties (e.g. active)' })
  @ApiBody({ type: UpdatePageCategoryDto })
  @ApiOkResponse({ description: 'Updated category' })
  @ApiQuery({ name: 'locale', required: false, description: 'Preferred locale for title resolution' })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePageCategoryDto,
    @Query('locale') locale?: string,
  ): Promise<AdminCategoryListItem> {
    return this.pages.updateCategory(id, dto, locale);
  }

  @ApiOperation({ summary: 'Upsert category translation (any locale, EN fallback)' })
  @ApiBody({ type: UpsertPageCategoryTranslationDto })
  @ApiOkResponse({ description: 'Updated category' })
  @ApiQuery({ name: 'locale', required: false, description: 'Preferred locale for title resolution' })
  @Put(':id/translations')
  upsertTranslation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpsertPageCategoryTranslationDto,
    @Query('locale') locale?: string,
  ): Promise<AdminCategoryListItem> {
    return this.pages.upsertCategoryTranslation(id, dto, locale);
  }
}

