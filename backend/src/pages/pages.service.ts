import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePageCategoryDto } from './dto/create-page-category.dto';
import { UpdatePageCategoryDto } from './dto/update-page-category.dto';
import { UpsertPageCategoryTranslationDto } from './dto/upsert-page-category-translation.dto';
import { CreateStaticPageDto } from './dto/create-static-page.dto';
import { UpdateStaticPageDto } from './dto/update-static-page.dto';
import { UpsertStaticPageTranslationDto } from './dto/upsert-static-page-translation.dto';
import { PageCategoryEntity } from './page-category.entity';
import { PageCategoryTranslationEntity } from './page-category-translation.entity';
import { StaticPageEntity } from './static-page.entity';
import { StaticPageTranslationEntity } from './static-page-translation.entity';

export type AdminCategoryListItem = {
  id: number;
  code: string;
  active: boolean;
  title: string;
  titleLocale: string;
  hasLocaleTranslation: boolean;
};

export type AdminStaticPageListItem = {
  id: number;
  slug: string;
  published: boolean;
  title: string;
  titleLocale: string;
  hasLocaleTranslation: boolean;
  category: {
    id: number;
    code: string;
    title: string;
    titleLocale: string;
  };
};

export type AdminStaticPage = {
  id: number;
  slug: string;
  published: boolean;
  categoryId: number;
  title: string;
  content: string;
  translationLocale: string;
  hasLocaleTranslation: boolean;
};

export type PublicStaticPage = {
  slug: string;
  title: string;
  content: string;
  locale: string;
};

export type FooterLinkCategory = {
  code: string;
  title: string;
  titleLocale: string;
  pages: Array<{ slug: string; title: string; titleLocale: string }>;
};

export type FooterLinksResponse = {
  locale: string;
  categories: FooterLinkCategory[];
};

type ResolvedText = { text: string; locale: string; hasLocaleTranslation: boolean };

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(PageCategoryEntity)
    private readonly categoryRepo: Repository<PageCategoryEntity>,
    @InjectRepository(PageCategoryTranslationEntity)
    private readonly categoryTranslationRepo: Repository<PageCategoryTranslationEntity>,
    @InjectRepository(StaticPageEntity)
    private readonly pageRepo: Repository<StaticPageEntity>,
    @InjectRepository(StaticPageTranslationEntity)
    private readonly pageTranslationRepo: Repository<StaticPageTranslationEntity>,
  ) {}

  async listCategories(locale?: string): Promise<AdminCategoryListItem[]> {
    const normalized = this.normalizeLocale(locale);
    const categories = await this.categoryRepo.find({
      order: { code: 'ASC' },
      relations: { translations: true },
    });

    return categories.map((category) => {
      const resolved = this.resolveCategoryTitle(category, normalized);
      return {
        id: category.id,
        code: category.code,
        active: category.active,
        title: resolved.text,
        titleLocale: resolved.locale,
        hasLocaleTranslation: resolved.hasLocaleTranslation,
      };
    });
  }

  async createCategory(dto: CreatePageCategoryDto): Promise<AdminCategoryListItem> {
    const code = dto.code.trim().toLowerCase();
    const existing = await this.categoryRepo.findOne({ where: { code } });
    if (existing) {
      throw new BadRequestException('Category code already exists');
    }

    const savedCategory = await this.categoryRepo.save(
      this.categoryRepo.create({
        code,
        active: dto.active ?? true,
      }),
    );
    await this.categoryTranslationRepo.save(
      this.categoryTranslationRepo.create({
        category: savedCategory,
        locale: 'en',
        title: dto.title.trim(),
      }),
    );

    const saved = await this.categoryRepo.findOne({ where: { id: savedCategory.id }, relations: { translations: true } });
    if (!saved) throw new NotFoundException('Category not found');
    const resolved = this.resolveCategoryTitle(saved, 'en');
    return {
      id: saved.id,
      code: saved.code,
      active: saved.active,
      title: resolved.text,
      titleLocale: resolved.locale,
      hasLocaleTranslation: resolved.hasLocaleTranslation,
    };
  }

  async updateCategory(id: number, dto: UpdatePageCategoryDto, locale?: string): Promise<AdminCategoryListItem> {
    const category = await this.categoryRepo.findOne({ where: { id }, relations: { translations: true } });
    if (!category) throw new NotFoundException('Category not found');
    if (dto.active !== undefined) category.active = dto.active;
    const saved = await this.categoryRepo.save(category);
    const normalized = this.normalizeLocale(locale);
    const resolved = this.resolveCategoryTitle(saved, normalized);
    return {
      id: saved.id,
      code: saved.code,
      active: saved.active,
      title: resolved.text,
      titleLocale: resolved.locale,
      hasLocaleTranslation: resolved.hasLocaleTranslation,
    };
  }

  async upsertCategoryTranslation(
    categoryId: number,
    dto: UpsertPageCategoryTranslationDto,
    locale?: string,
  ): Promise<AdminCategoryListItem> {
    const normalizedTranslationLocale = this.normalizeLocale(dto.locale);
    const category = await this.categoryRepo.findOne({ where: { id: categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const existing = await this.categoryTranslationRepo.findOne({
      where: { category: { id: categoryId }, locale: normalizedTranslationLocale },
      relations: { category: true },
    });
    if (existing) {
      existing.title = dto.title.trim();
      await this.categoryTranslationRepo.save(existing);
    } else {
      await this.categoryTranslationRepo.save(
        this.categoryTranslationRepo.create({
          category,
          locale: normalizedTranslationLocale,
          title: dto.title.trim(),
        }),
      );
    }

    const saved = await this.categoryRepo.findOne({ where: { id: categoryId }, relations: { translations: true } });
    if (!saved) throw new NotFoundException('Category not found');
    const normalizedResponseLocale = this.normalizeLocale(locale ?? normalizedTranslationLocale);
    const resolved = this.resolveCategoryTitle(saved, normalizedResponseLocale);
    return {
      id: saved.id,
      code: saved.code,
      active: saved.active,
      title: resolved.text,
      titleLocale: resolved.locale,
      hasLocaleTranslation: resolved.hasLocaleTranslation,
    };
  }

  async listPages(locale?: string): Promise<AdminStaticPageListItem[]> {
    const normalized = this.normalizeLocale(locale);
    const pages = await this.pageRepo.find({
      order: { slug: 'ASC' },
      relations: { category: { translations: true }, translations: true },
    });

    return pages.map((page) => this.toAdminPageListItem(page, normalized));
  }

  async createPage(dto: CreateStaticPageDto): Promise<AdminStaticPage> {
    const slug = dto.slug.trim().toLowerCase();
    const existing = await this.pageRepo.findOne({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Page slug already exists');
    }

    const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId }, relations: { translations: true } });
    if (!category) throw new BadRequestException('Category not found');

    const savedPage = await this.pageRepo.save(
      this.pageRepo.create({
        slug,
        published: dto.published ?? false,
        category,
      }),
    );
    await this.pageTranslationRepo.save(
      this.pageTranslationRepo.create({
        page: savedPage,
        locale: 'en',
        title: dto.title.trim(),
        content: dto.content.trim(),
      }),
    );
    return this.getPageForAdmin(savedPage.id, 'en');
  }

  async updatePageBase(id: number, dto: UpdateStaticPageDto, locale?: string): Promise<AdminStaticPage> {
    const page = await this.pageRepo.findOne({ where: { id }, relations: { category: true, translations: true } });
    if (!page) throw new NotFoundException('Page not found');

    if (dto.slug !== undefined) {
      const slug = dto.slug.trim().toLowerCase();
      if (slug !== page.slug) {
        const existing = await this.pageRepo.findOne({ where: { slug } });
        if (existing) throw new BadRequestException('Page slug already exists');
        page.slug = slug;
      }
    }

    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException('Category not found');
      page.category = category;
    }

    if (dto.published !== undefined) page.published = dto.published;

    await this.pageRepo.save(page);
    const normalized = this.normalizeLocale(locale);
    return this.getPageForAdmin(id, normalized);
  }

  async upsertPageTranslation(id: number, dto: UpsertStaticPageTranslationDto): Promise<AdminStaticPage> {
    const locale = this.normalizeLocale(dto.locale);
    const page = await this.pageRepo.findOne({ where: { id } });
    if (!page) throw new NotFoundException('Page not found');

    const existing = await this.pageTranslationRepo.findOne({
      where: { page: { id }, locale },
      relations: { page: true },
    });
    if (existing) {
      existing.title = dto.title.trim();
      existing.content = dto.content.trim();
      await this.pageTranslationRepo.save(existing);
    } else {
      await this.pageTranslationRepo.save(
        this.pageTranslationRepo.create({
          page,
          locale,
          title: dto.title.trim(),
          content: dto.content.trim(),
        }),
      );
    }
    return this.getPageForAdmin(id, locale);
  }

  async getPageForAdmin(id: number, locale?: string): Promise<AdminStaticPage> {
    const normalized = this.normalizeLocale(locale);
    const page = await this.pageRepo.findOne({ where: { id }, relations: { translations: true, category: true } });
    if (!page) throw new NotFoundException('Page not found');
    const resolved = this.resolvePageTranslation(page, normalized);
    return {
      id: page.id,
      slug: page.slug,
      published: page.published,
      categoryId: page.category.id,
      title: resolved.text.title,
      content: resolved.text.content,
      translationLocale: resolved.locale,
      hasLocaleTranslation: resolved.hasLocaleTranslation,
    };
  }

  async getPublicPageBySlug(slug: string, locale?: string): Promise<PublicStaticPage> {
    const normalized = this.normalizeLocale(locale);
    const normalizedSlug = slug.trim().toLowerCase();
    const page = await this.pageRepo.findOne({
      where: { slug: normalizedSlug },
      relations: { category: true, translations: true },
    });
    if (!page || !page.published || page.category.active === false) {
      throw new NotFoundException('Page not found');
    }
    if (page.translations.length === 0) {
      throw new NotFoundException('Page not found');
    }

    const resolved = this.resolvePageTranslation(page, normalized);
    return {
      slug: page.slug,
      title: resolved.text.title,
      content: resolved.text.content,
      locale: resolved.locale,
    };
  }

  async getFooterLinks(locale?: string): Promise<FooterLinksResponse> {
    const normalized = this.normalizeLocale(locale);
    const categories = await this.categoryRepo.find({
      where: { active: true },
      order: { code: 'ASC' },
      relations: { translations: true },
    });
    const pages = await this.pageRepo.find({
      where: { published: true },
      order: { slug: 'ASC' },
      relations: { category: true, translations: true },
    });

    const pagesByCategory = new Map<number, Array<{ slug: string; title: string; titleLocale: string }>>();
    for (const page of pages) {
      if (page.category.active === false) continue;
      if (page.translations.length === 0) continue;
      const resolved = this.resolvePageTranslation(page, normalized);
      const list = pagesByCategory.get(page.category.id) ?? [];
      list.push({ slug: page.slug, title: resolved.text.title, titleLocale: resolved.locale });
      pagesByCategory.set(page.category.id, list);
    }

    const footerCategories: FooterLinkCategory[] = [];
    for (const category of categories) {
      const links = pagesByCategory.get(category.id);
      if (!links || links.length === 0) continue;
      const resolvedTitle = this.resolveCategoryTitle(category, normalized);
      footerCategories.push({
        code: category.code,
        title: resolvedTitle.text,
        titleLocale: resolvedTitle.locale,
        pages: links,
      });
    }

    return { locale: normalized, categories: footerCategories };
  }

  private toAdminPageListItem(page: StaticPageEntity, locale: string): AdminStaticPageListItem {
    const resolvedPage = this.resolvePageTranslation(page, locale);
    const resolvedCategory = this.resolveCategoryTitle(page.category, locale);
    return {
      id: page.id,
      slug: page.slug,
      published: page.published,
      title: resolvedPage.text.title,
      titleLocale: resolvedPage.locale,
      hasLocaleTranslation: resolvedPage.hasLocaleTranslation,
      category: {
        id: page.category.id,
        code: page.category.code,
        title: resolvedCategory.text,
        titleLocale: resolvedCategory.locale,
      },
    };
  }

  private resolveCategoryTitle(category: PageCategoryEntity, locale: string): ResolvedText {
    const requested = category.translations.find((item) => item.locale === locale);
    if (requested) return { text: requested.title, locale: requested.locale, hasLocaleTranslation: true };
    const fallback = category.translations.find((item) => item.locale === 'en');
    if (fallback) return { text: fallback.title, locale: 'en', hasLocaleTranslation: false };
    return { text: category.code, locale: 'en', hasLocaleTranslation: false };
  }

  private resolvePageTranslation(
    page: StaticPageEntity,
    locale: string,
  ): { text: { title: string; content: string }; locale: string; hasLocaleTranslation: boolean } {
    const requested = page.translations.find((item) => item.locale === locale);
    if (requested) {
      return { text: { title: requested.title, content: requested.content }, locale: requested.locale, hasLocaleTranslation: true };
    }
    const fallback = page.translations.find((item) => item.locale === 'en');
    if (fallback) {
      return { text: { title: fallback.title, content: fallback.content }, locale: 'en', hasLocaleTranslation: false };
    }
    return { text: { title: page.slug, content: '' }, locale: 'en', hasLocaleTranslation: false };
  }

  private normalizeLocale(locale?: string): string {
    if (!locale) return 'en';
    const lower = locale.trim().toLowerCase();
    const primary = lower.split('-')[0] ?? lower;
    if (primary === 'uk' || primary === 'ua') return 'ua';
    if (primary === 'en') return 'en';
    return primary;
  }
}
