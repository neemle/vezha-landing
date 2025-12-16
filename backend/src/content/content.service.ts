import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandingContentEntity } from './landing-content.entity';
import { DEFAULT_CONTENT, LandingContentPayload } from './default-content';

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectRepository(LandingContentEntity)
    private readonly contentRepo: Repository<LandingContentEntity>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureSeed();
  }

  async getContent(locale?: string): Promise<LandingContentPayload> {
    const requested = this.normalizeLocale(locale);
    const found = await this.contentRepo.findOne({ where: { locale: requested } });
    if (found) {
      return this.parsePayload(found.payload);
    }

    const fallback = DEFAULT_CONTENT[requested] ?? DEFAULT_CONTENT.en;
    await this.upsertContent(fallback.locale, fallback);
    return fallback;
  }

  async getRaw(locale?: string): Promise<LandingContentPayload | LandingContentPayload[]> {
    if (locale) {
      return this.getContent(locale);
    }
    return this.contentRepo.find().then((records) => records.map((item) => this.parsePayload(item.payload)));
  }

  async upsertContent(locale: string, payload: LandingContentPayload): Promise<LandingContentPayload> {
    const normalized = this.normalizeLocale(locale);
    const withLocale: LandingContentPayload = { ...payload, locale: normalized };
    const entity =
      (await this.contentRepo.findOne({ where: { locale: normalized } })) ?? this.contentRepo.create({ locale: normalized });
    entity.payload = JSON.stringify(withLocale);
    await this.contentRepo.save(entity);
    this.logger.log(`Stored content for locale ${normalized}`);
    return withLocale;
  }

  private parsePayload(raw: string): LandingContentPayload {
    try {
      return JSON.parse(raw) as LandingContentPayload;
    } catch (error) {
      this.logger.error('Failed to parse content payload, returning default EN', error as Error);
      return DEFAULT_CONTENT.en;
    }
  }

  private normalizeLocale(locale?: string): string {
    if (!locale) return 'en';
    const lower = locale.toLowerCase();
    if (lower.startsWith('uk')) return 'ua';
    if (lower.startsWith('ua')) return 'ua';
    if (lower.startsWith('en')) return 'en';
    return lower;
  }

  private async ensureSeed(): Promise<void> {
    const existing = await this.contentRepo.find();
    if (existing.length > 0) return;
    await Promise.all(
      Object.values(DEFAULT_CONTENT).map((payload) => {
        const entity = this.contentRepo.create({ locale: payload.locale, payload: JSON.stringify(payload) });
        return this.contentRepo.save(entity);
      }),
    );
    this.logger.log('Seeded default landing content for EN/UA');
  }
}
