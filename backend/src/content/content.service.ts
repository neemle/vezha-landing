import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandingContentEntity } from './landing-content.entity';
import { DEFAULT_CONTENT, LandingContentPayload } from './default-content';

export type LandingLocaleStatus = { locale: string; active: boolean };

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

  async listLocales(): Promise<LandingLocaleStatus[]> {
    const records = await this.contentRepo.find({ order: { locale: 'ASC' } });
    return records.map((record) => {
      const locale = this.normalizeLocale(record.locale);
      const active = this.resolveLocaleActive(locale, record.payload);
      return { locale, active };
    });
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
      const parsed: unknown = JSON.parse(raw);
      if (this.isLandingContentPayload(parsed)) {
        return parsed;
      }
      this.logger.error('Invalid content payload structure, returning default EN');
    } catch (error: unknown) {
      const trace = error instanceof Error ? error.stack ?? error.message : String(error);
      this.logger.error('Failed to parse content payload, returning default EN', trace);
      return DEFAULT_CONTENT.en;
    }
    return DEFAULT_CONTENT.en;
  }

  private resolveLocaleActive(locale: string, payload: string): boolean {
    if (locale === 'en') return true;
    const parsed = this.tryParseRecord(payload);
    if (!parsed) return true;
    const active = parsed['active'];
    if (typeof active === 'boolean') return active;
    return true;
  }

  private tryParseRecord(raw: string): Record<string, unknown> | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!this.isRecord(parsed)) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isLandingContentPayload(value: unknown): value is LandingContentPayload {
    if (!this.isRecord(value)) return false;
    if (typeof value['locale'] !== 'string') return false;

    if (!this.isLandingHero(value['hero'])) return false;

    const painPoints = value['painPoints'];
    if (!this.isArray(painPoints, (item) => this.isLandingBlock(item))) return false;

    const features = value['features'];
    if (!this.isArray(features, (item) => this.isLandingBlock(item))) return false;

    if (!this.isComparison(value['comparison'])) return false;
    if (!this.isMetrics(value['metrics'])) return false;

    const howItWorks = value['howItWorks'];
    if (!this.isArray(howItWorks, (item) => this.isHowItWorksItem(item))) return false;

    if (!this.isContact(value['contact'])) return false;
    if (!this.isSeo(value['seo'])) return false;

    return true;
  }

  private isLandingHero(value: unknown): value is LandingContentPayload['hero'] {
    if (!this.isRecord(value)) return false;
    if (typeof value['title'] !== 'string') return false;
    if (typeof value['subtitle'] !== 'string') return false;
    if (typeof value['priceNote'] !== 'string') return false;
    if (typeof value['badge'] !== 'string') return false;
    if (!this.isArray(value['bullets'], (item) => typeof item === 'string')) return false;
    if (typeof value['primaryCta'] !== 'string') return false;
    if (typeof value['telegramLabel'] !== 'string') return false;
    if (typeof value['emailLabel'] !== 'string') return false;
    if (typeof value['telegramUrl'] !== 'string') return false;
    if (typeof value['email'] !== 'string') return false;
    return true;
  }

  private isLandingBlock(value: unknown): value is LandingContentPayload['painPoints'][number] {
    if (!this.isRecord(value)) return false;
    if (typeof value['title'] !== 'string') return false;
    if (typeof value['description'] !== 'string') return false;
    if (typeof value['icon'] !== 'string') return false;
    return true;
  }

  private isComparison(value: unknown): value is LandingContentPayload['comparison'] {
    if (!this.isRecord(value)) return false;
    if (typeof value['highlight'] !== 'string') return false;
    if (!this.isComparisonSysadmin(value['sysadmin'])) return false;
    if (!this.isComparisonVezha(value['vezha'])) return false;
    return true;
  }

  private isComparisonSysadmin(value: unknown): value is LandingContentPayload['comparison']['sysadmin'] {
    if (!this.isRecord(value)) return false;
    if (typeof value['title'] !== 'string') return false;
    if (typeof value['description'] !== 'string') return false;
    if (typeof value['price'] !== 'string') return false;
    return true;
  }

  private isComparisonVezha(value: unknown): value is LandingContentPayload['comparison']['vezha'] {
    if (!this.isRecord(value)) return false;
    if (typeof value['title'] !== 'string') return false;
    if (typeof value['description'] !== 'string') return false;
    if (typeof value['price'] !== 'string') return false;
    if (typeof value['badge'] !== 'string') return false;
    return true;
  }

  private isMetrics(value: unknown): value is LandingContentPayload['metrics'] {
    if (!this.isRecord(value)) return false;
    if (typeof value['note'] !== 'string') return false;
    if (!this.isArray(value['stats'], (item) => this.isMetricsStat(item))) return false;
    return true;
  }

  private isMetricsStat(value: unknown): value is LandingContentPayload['metrics']['stats'][number] {
    if (!this.isRecord(value)) return false;
    if (typeof value['label'] !== 'string') return false;
    if (typeof value['value'] !== 'string') return false;
    return true;
  }

  private isHowItWorksItem(value: unknown): value is LandingContentPayload['howItWorks'][number] {
    if (!this.isRecord(value)) return false;
    if (typeof value['title'] !== 'string') return false;
    if (typeof value['description'] !== 'string') return false;
    return true;
  }

  private isContact(value: unknown): value is LandingContentPayload['contact'] {
    if (!this.isRecord(value)) return false;
    if (typeof value['title'] !== 'string') return false;
    if (typeof value['subtitle'] !== 'string') return false;
    if (typeof value['thankYou'] !== 'string') return false;
    if (typeof value['telegramLabel'] !== 'string') return false;
    if (typeof value['telegramUrl'] !== 'string') return false;
    if (typeof value['emailLabel'] !== 'string') return false;
    if (typeof value['email'] !== 'string') return false;
    if (!this.isContactForm(value['form'])) return false;
    return true;
  }

  private isContactForm(value: unknown): value is LandingContentPayload['contact']['form'] {
    if (!this.isRecord(value)) return false;
    if (typeof value['nameLabel'] !== 'string') return false;
    if (typeof value['emailLabel'] !== 'string') return false;
    if (typeof value['phoneLabel'] !== 'string') return false;
    if (typeof value['messageLabel'] !== 'string') return false;
    if (typeof value['submitLabel'] !== 'string') return false;
    const errors = value['errors'];
    if (!this.isRecord(errors)) return false;
    if (typeof errors['requiredEmail'] !== 'string') return false;
    if (typeof errors['invalidEmail'] !== 'string') return false;
    return true;
  }

  private isSeo(value: unknown): value is LandingContentPayload['seo'] {
    if (!this.isRecord(value)) return false;
    if (typeof value['title'] !== 'string') return false;
    if (typeof value['description'] !== 'string') return false;
    return true;
  }

  private isArray<T>(value: unknown, guard: (value: unknown) => value is T): value is T[] {
    if (!Array.isArray(value)) return false;
    return value.every((item) => guard(item));
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
