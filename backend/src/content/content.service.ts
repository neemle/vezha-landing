import { BadGatewayException, BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LandingContentEntity } from './landing-content.entity';
import { DEFAULT_CONTENT, LandingContentPayload } from './default-content';
import { LibreTranslateService } from './libre-translate.service';

export type LandingLocaleStatus = { locale: string; active: boolean };

@Injectable()
export class ContentService {
  private readonly logger = new Logger(ContentService.name);

  constructor(
    @InjectRepository(LandingContentEntity)
    private readonly contentRepo: Repository<LandingContentEntity>,
    private readonly libreTranslate: LibreTranslateService,
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

  async createDraftLocale(targetLocale: string, sourceLocale?: string): Promise<LandingContentPayload> {
    const normalizedTarget = this.normalizeLocale(targetLocale);
    const normalizedSource = this.normalizeLocale(sourceLocale ?? 'en');
    if (normalizedTarget === normalizedSource) {
      throw new BadRequestException('Target locale must differ from source locale');
    }

    const existingTarget = await this.contentRepo.findOne({ where: { locale: normalizedTarget } });
    if (existingTarget) {
      throw new BadRequestException('Locale already exists');
    }

    const sourcePayload = await this.getContent(normalizedSource);
    const resolvedSourceLocale = this.normalizeLocale(sourcePayload.locale);

    try {
      const translated = await this.translateLandingContent(sourcePayload, resolvedSourceLocale, normalizedTarget);
      const draft: LandingContentPayload & { active: boolean } = { ...translated, active: false };
      return await this.upsertContent(normalizedTarget, draft);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to create draft locale ${normalizedTarget}: ${message}`);
      throw new BadGatewayException('Failed to translate content');
    }
  }

  private async translateLandingContent(
    sourcePayload: LandingContentPayload,
    sourceLocale: string,
    targetLocale: string,
  ): Promise<LandingContentPayload> {
    const texts = this.collectTranslatableStrings(sourcePayload);
    const translatedTexts = await this.libreTranslate.translateTexts(texts, sourceLocale, targetLocale);
    return this.applyTranslations(sourcePayload, translatedTexts, targetLocale);
  }

  private collectTranslatableStrings(payload: LandingContentPayload): string[] {
    const texts: string[] = [];

    texts.push(payload.hero.title);
    texts.push(payload.hero.subtitle);
    texts.push(payload.hero.priceNote);
    texts.push(payload.hero.badge);
    for (const bullet of payload.hero.bullets) {
      texts.push(bullet);
    }
    texts.push(payload.hero.primaryCta);
    texts.push(payload.hero.telegramLabel);
    texts.push(payload.hero.emailLabel);

    for (const point of payload.painPoints) {
      texts.push(point.title);
      texts.push(point.description);
    }

    for (const feature of payload.features) {
      texts.push(feature.title);
      texts.push(feature.description);
    }

    texts.push(payload.comparison.highlight);
    texts.push(payload.comparison.sysadmin.title);
    texts.push(payload.comparison.sysadmin.description);
    texts.push(payload.comparison.vezha.title);
    texts.push(payload.comparison.vezha.description);
    texts.push(payload.comparison.vezha.badge);

    texts.push(payload.metrics.note);
    for (const stat of payload.metrics.stats) {
      texts.push(stat.label);
    }

    for (const step of payload.howItWorks) {
      texts.push(step.title);
      texts.push(step.description);
    }

    texts.push(payload.contact.title);
    texts.push(payload.contact.subtitle);
    texts.push(payload.contact.thankYou);
    texts.push(payload.contact.telegramLabel);
    texts.push(payload.contact.emailLabel);

    texts.push(payload.contact.form.nameLabel);
    texts.push(payload.contact.form.emailLabel);
    texts.push(payload.contact.form.phoneLabel);
    texts.push(payload.contact.form.messageLabel);
    texts.push(payload.contact.form.submitLabel);
    texts.push(payload.contact.form.errors.requiredEmail);
    texts.push(payload.contact.form.errors.invalidEmail);

    for (const navItem of payload.nav) {
      texts.push(navItem.label);
    }

    texts.push(payload.sections.pain.eyebrow);
    texts.push(payload.sections.pain.heading);
    texts.push(payload.sections.pain.ctaTitle);
    texts.push(payload.sections.features.eyebrow);
    texts.push(payload.sections.features.heading);
    texts.push(payload.sections.comparison.heading);
    texts.push(payload.sections.metrics.eyebrow);
    texts.push(payload.sections.metrics.heading);
    texts.push(payload.sections.howItWorks.eyebrow);
    texts.push(payload.sections.howItWorks.heading);
    texts.push(payload.sections.contact.eyebrow);
    texts.push(payload.sections.submitting);

    texts.push(payload.seo.title);
    texts.push(payload.seo.description);

    return texts;
  }

  private applyTranslations(
    sourcePayload: LandingContentPayload,
    translatedTexts: string[],
    targetLocale: string,
  ): LandingContentPayload {
    let index = 0;
    const next = (label: string): string => {
      const value = translatedTexts[index];
      if (value === undefined) {
        throw new Error(`Missing translated value for ${label}`);
      }
      index += 1;
      return value;
    };

    const hero = {
      ...sourcePayload.hero,
      title: next('hero.title'),
      subtitle: next('hero.subtitle'),
      priceNote: next('hero.priceNote'),
      badge: next('hero.badge'),
      bullets: sourcePayload.hero.bullets.map((_, bulletIndex) => next(`hero.bullets[${bulletIndex}]`)),
      primaryCta: next('hero.primaryCta'),
      telegramLabel: next('hero.telegramLabel'),
      emailLabel: next('hero.emailLabel'),
    };

    const painPoints = sourcePayload.painPoints.map((point, pointIndex) => ({
      ...point,
      title: next(`painPoints[${pointIndex}].title`),
      description: next(`painPoints[${pointIndex}].description`),
    }));

    const features = sourcePayload.features.map((feature, featureIndex) => ({
      ...feature,
      title: next(`features[${featureIndex}].title`),
      description: next(`features[${featureIndex}].description`),
    }));

    const comparison = {
      ...sourcePayload.comparison,
      highlight: next('comparison.highlight'),
      sysadmin: {
        ...sourcePayload.comparison.sysadmin,
        title: next('comparison.sysadmin.title'),
        description: next('comparison.sysadmin.description'),
      },
      vezha: {
        ...sourcePayload.comparison.vezha,
        title: next('comparison.vezha.title'),
        description: next('comparison.vezha.description'),
        badge: next('comparison.vezha.badge'),
      },
    };

    const metrics = {
      ...sourcePayload.metrics,
      note: next('metrics.note'),
      stats: sourcePayload.metrics.stats.map((stat, statIndex) => ({
        ...stat,
        label: next(`metrics.stats[${statIndex}].label`),
      })),
    };

    const howItWorks = sourcePayload.howItWorks.map((step, stepIndex) => ({
      ...step,
      title: next(`howItWorks[${stepIndex}].title`),
      description: next(`howItWorks[${stepIndex}].description`),
    }));

    const contact = {
      ...sourcePayload.contact,
      title: next('contact.title'),
      subtitle: next('contact.subtitle'),
      thankYou: next('contact.thankYou'),
      telegramLabel: next('contact.telegramLabel'),
      emailLabel: next('contact.emailLabel'),
      form: {
        ...sourcePayload.contact.form,
        nameLabel: next('contact.form.nameLabel'),
        emailLabel: next('contact.form.emailLabel'),
        phoneLabel: next('contact.form.phoneLabel'),
        messageLabel: next('contact.form.messageLabel'),
        submitLabel: next('contact.form.submitLabel'),
        errors: {
          ...sourcePayload.contact.form.errors,
          requiredEmail: next('contact.form.errors.requiredEmail'),
          invalidEmail: next('contact.form.errors.invalidEmail'),
        },
      },
    };

    const nav = sourcePayload.nav.map((item, navIndex) => ({
      ...item,
      label: next(`nav[${navIndex}].label`),
    }));

    const sections = {
      pain: {
        eyebrow: next('sections.pain.eyebrow'),
        heading: next('sections.pain.heading'),
        ctaTitle: next('sections.pain.ctaTitle'),
      },
      features: {
        eyebrow: next('sections.features.eyebrow'),
        heading: next('sections.features.heading'),
      },
      comparison: {
        heading: next('sections.comparison.heading'),
      },
      metrics: {
        eyebrow: next('sections.metrics.eyebrow'),
        heading: next('sections.metrics.heading'),
      },
      howItWorks: {
        eyebrow: next('sections.howItWorks.eyebrow'),
        heading: next('sections.howItWorks.heading'),
      },
      contact: {
        eyebrow: next('sections.contact.eyebrow'),
      },
      submitting: next('sections.submitting'),
    };

    const seo = {
      ...sourcePayload.seo,
      title: next('seo.title'),
      description: next('seo.description'),
    };

    if (index !== translatedTexts.length) {
      throw new Error(`Unused translated values: expected ${translatedTexts.length}, got ${index}`);
    }

    return {
      locale: targetLocale,
      hero,
      painPoints,
      features,
      comparison,
      metrics,
      howItWorks,
      contact,
      nav,
      sections,
      seo,
    };
  }

  private parsePayload(raw: string): LandingContentPayload {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (this.isLandingContentPayload(parsed)) {
        return this.withDefaults(parsed);
      }
      this.logger.error('Invalid content payload structure, returning default EN');
    } catch (error: unknown) {
      const trace = error instanceof Error ? error.stack ?? error.message : String(error);
      this.logger.error('Failed to parse content payload, returning default EN', trace);
      return DEFAULT_CONTENT.en;
    }
    return DEFAULT_CONTENT.en;
  }

  private withDefaults(payload: LandingContentPayload): LandingContentPayload {
    const fallback = DEFAULT_CONTENT[payload.locale] ?? DEFAULT_CONTENT.en;
    if (!payload.nav) payload.nav = fallback.nav;
    if (!payload.sections) payload.sections = fallback.sections;
    return payload;
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
    // nav and sections are optional for backward compatibility
    if (value['nav'] !== undefined && !this.isNav(value['nav'])) return false;
    if (value['sections'] !== undefined && !this.isSections(value['sections'])) return false;
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

  private isNav(value: unknown): value is LandingContentPayload['nav'] {
    if (!Array.isArray(value)) return false;
    return value.every((item) => {
      if (!this.isRecord(item)) return false;
      return typeof item['label'] === 'string' && typeof item['target'] === 'string';
    });
  }

  private isSections(value: unknown): value is LandingContentPayload['sections'] {
    if (!this.isRecord(value)) return false;
    const pain = value['pain'];
    if (!this.isRecord(pain) || typeof pain['eyebrow'] !== 'string' || typeof pain['heading'] !== 'string' || typeof pain['ctaTitle'] !== 'string') return false;
    const features = value['features'];
    if (!this.isRecord(features) || typeof features['eyebrow'] !== 'string' || typeof features['heading'] !== 'string') return false;
    const comparison = value['comparison'];
    if (!this.isRecord(comparison) || typeof comparison['heading'] !== 'string') return false;
    const metrics = value['metrics'];
    if (!this.isRecord(metrics) || typeof metrics['eyebrow'] !== 'string' || typeof metrics['heading'] !== 'string') return false;
    const howItWorks = value['howItWorks'];
    if (!this.isRecord(howItWorks) || typeof howItWorks['eyebrow'] !== 'string' || typeof howItWorks['heading'] !== 'string') return false;
    const contact = value['contact'];
    if (!this.isRecord(contact) || typeof contact['eyebrow'] !== 'string') return false;
    if (typeof value['submitting'] !== 'string') return false;
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
