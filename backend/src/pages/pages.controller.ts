import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { PagesService, FooterLinksResponse, PublicStaticPage } from './pages.service';

@ApiTags('Pages')
@Controller('pages')
export class PagesController {
  constructor(private readonly pages: PagesService) {}

  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Preferred locale (fallback to en). Defaults to Accept-Language header or en.',
  })
  @ApiOkResponse({ description: 'Footer category list with page links' })
  @Get('footer')
  async footer(@Query('lang') lang?: string, @Headers('accept-language') acceptLanguage?: string): Promise<FooterLinksResponse> {
    const resolved = lang ?? this.detectFromHeader(acceptLanguage);
    return this.pages.getFooterLinks(resolved);
  }

  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Preferred locale (fallback to en). Defaults to Accept-Language header or en.',
  })
  @ApiOkResponse({ description: 'Public static page content' })
  @Get(':slug')
  async getPage(
    @Param('slug') slug: string,
    @Query('lang') lang?: string,
    @Headers('accept-language') acceptLanguage?: string,
  ): Promise<PublicStaticPage> {
    const resolved = lang ?? this.detectFromHeader(acceptLanguage);
    return this.pages.getPublicPageBySlug(slug, resolved);
  }

  private detectFromHeader(acceptLanguage?: string): string | undefined {
    if (!acceptLanguage) return undefined;
    const first = acceptLanguage.split(',')[0]?.trim().toLowerCase();
    if (!first) return undefined;
    const primary = first.split('-')[0] ?? first;
    if (primary === 'uk' || primary === 'ua') return 'ua';
    if (primary === 'en') return 'en';
    return primary;
  }
}

