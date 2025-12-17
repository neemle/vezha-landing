import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ContentService, LandingLocaleStatus } from './content.service';
import type { LandingContentPayload } from './default-content';
import { DEFAULT_CONTENT } from './default-content';

@ApiTags('Content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @ApiOkResponse({
    description: 'List of available landing locales with active flag',
    schema: { example: [{ locale: 'en', active: true }, { locale: 'ua', active: true }] },
  })
  @Get('locales')
  async locales(): Promise<LandingLocaleStatus[]> {
    return this.contentService.listLocales();
  }

  @ApiQuery({
    name: 'lang',
    required: false,
    description: 'Preferred locale (en/ua). Defaults to Accept-Language header or en.',
  })
  @ApiOkResponse({
    description: 'Landing content for the requested locale',
    schema: { example: DEFAULT_CONTENT.en },
  })
  @Get()
  async fetch(@Query('lang') lang?: string, @Headers('accept-language') acceptLanguage?: string): Promise<LandingContentPayload> {
    const resolvedLang = lang ?? this.detectFromHeader(acceptLanguage);
    return this.contentService.getContent(resolvedLang);
  }

  private detectFromHeader(acceptLanguage?: string): string | undefined {
    if (!acceptLanguage) return undefined;
    const first = acceptLanguage.split(',')[0]?.trim().toLowerCase();
    if (!first) return undefined;
    if (first.startsWith('uk') || first.startsWith('ua')) return 'ua';
    if (first.startsWith('en')) return 'en';
    return undefined;
  }
}
