import { Injectable, Logger } from '@nestjs/common';

type JsonRecord = Record<string, unknown>;

@Injectable()
export class LibreTranslateService {
  private readonly logger = new Logger(LibreTranslateService.name);

  async translateTexts(texts: string[], sourceLocale: string, targetLocale: string): Promise<string[]> {
    if (texts.length === 0) return [];

    const endpoint = `${this.getBaseUrl()}/translate`;
    const payload: JsonRecord = {
      q: texts,
      source: this.toLibreLanguageCode(sourceLocale),
      target: this.toLibreLanguageCode(targetLocale),
      format: 'text',
    };

    const apiKey = process.env.LIBRETRANSLATE_API_KEY?.trim();
    if (apiKey) {
      payload['api_key'] = apiKey;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const responseText = await this.safeReadText(response);
      this.logger.error(`LibreTranslate error ${response.status}: ${responseText}`);
      throw new Error(`LibreTranslate error ${response.status}`);
    }

    const data = await this.safeReadJson(response);
    const translated = this.parseTranslateResponse(data);
    if (translated.length !== texts.length) {
      this.logger.error(`LibreTranslate returned ${translated.length} items, expected ${texts.length}`);
      throw new Error('LibreTranslate response length mismatch');
    }

    return translated;
  }

  private getBaseUrl(): string {
    const configured = process.env.LIBRETRANSLATE_URL?.trim();
    let baseUrl = configured && configured.length > 0 ? configured : 'http://localhost:5000';
    while (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    return baseUrl;
  }

  private toLibreLanguageCode(locale: string): string {
    const normalized = locale.trim().toLowerCase();
    const base = normalized.split('-')[0];
    if (base === 'ua') return 'uk';
    return base;
  }

  private async safeReadText(response: Response): Promise<string> {
    try {
      return await response.text();
    } catch {
      return '';
    }
  }

  private async safeReadJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  private parseTranslateResponse(value: unknown): string[] {
    if (this.isRecord(value)) {
      const translatedText = value['translatedText'];
      if (typeof translatedText === 'string') return [translatedText];
      if (this.isStringArray(translatedText)) return translatedText;
    }

    if (Array.isArray(value)) {
      const translated: string[] = [];
      for (const item of value) {
        if (!this.isRecord(item)) {
          throw new Error('LibreTranslate response must contain objects');
        }
        const translatedText = item['translatedText'];
        if (typeof translatedText !== 'string') {
          throw new Error('LibreTranslate response objects must contain translatedText strings');
        }
        translated.push(translatedText);
      }
      return translated;
    }

    throw new Error('Unsupported LibreTranslate response format');
  }

  private isStringArray(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
  }

  private isRecord(value: unknown): value is JsonRecord {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}

