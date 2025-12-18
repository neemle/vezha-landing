import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

type JsonRecord = Record<string, unknown>;

const ADMIN_TOKEN = 'vezha-admin';

function parseJson(text: string): unknown {
  return JSON.parse(text);
}

function assertRecord(value: unknown, label = 'value'): asserts value is JsonRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: JsonRecord, key: string): string {
  const value = record[key];
  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string`);
  }
  return value;
}

function assertStringArray(value: unknown, label: string): asserts value is string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${label} must be an array of strings`);
  }
}

describe('Landing content locales (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidUnknownValues: false,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows saving landing content for a new locale', async () => {
    const enRes = await request(app.getHttpServer())
      .get('/api/admin/content')
      .query({ locale: 'en' })
      .set('x-admin-token', ADMIN_TOKEN)
      .expect(200);
    const enBody = parseJson(enRes.text);
    assertRecord(enBody, 'enBody');

    const upsertRes = await request(app.getHttpServer())
      .put('/api/admin/content')
      .set('x-admin-token', ADMIN_TOKEN)
      .send({
        locale: 'pl',
        content: { ...enBody, locale: 'pl' },
      })
      .expect(200);
    const upsertBody = parseJson(upsertRes.text);
    assertRecord(upsertBody, 'upsertBody');
    expect(readString(upsertBody, 'locale')).toBe('pl');

    const plRes = await request(app.getHttpServer())
      .get('/api/admin/content')
      .query({ locale: 'pl' })
      .set('x-admin-token', ADMIN_TOKEN)
      .expect(200);
    const plBody = parseJson(plRes.text);
    assertRecord(plBody, 'plBody');
    expect(readString(plBody, 'locale')).toBe('pl');

    const localesRes = await request(app.getHttpServer()).get('/api/content/locales').expect(200);
    const localesBody = parseJson(localesRes.text);
    if (!Array.isArray(localesBody)) throw new Error('localesBody must be an array');
    const hasPl = localesBody.some((item) => {
      if (!isRecord(item)) return false;
      return item['locale'] === 'pl';
    });
    expect(hasPl).toBe(true);
  });

  it('creates a draft locale by auto-translating via LibreTranslate', async () => {
    const enRes = await request(app.getHttpServer())
      .get('/api/admin/content')
      .query({ locale: 'en' })
      .set('x-admin-token', ADMIN_TOKEN)
      .expect(200);
    const enBody = parseJson(enRes.text);
    assertRecord(enBody, 'enBody');
    const enHero = enBody['hero'];
    assertRecord(enHero, 'enHero');
    const enTitle = readString(enHero, 'title');

    const fetchSpy = jest.spyOn(globalThis, 'fetch').mockImplementation(async (_input, init) => {
      const body = init?.body;
      if (typeof body !== 'string') throw new Error('LibreTranslate request body must be a string');
      const requestJson = parseJson(body);
      assertRecord(requestJson, 'requestJson');
      expect(readString(requestJson, 'source')).toBe('en');
      expect(readString(requestJson, 'target')).toBe('es');
      const q = requestJson['q'];
      assertStringArray(q, 'q');
      const translatedText = q.map((text) => `es:${text}`);
      return new Response(JSON.stringify({ translatedText }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    try {
      const createRes = await request(app.getHttpServer())
        .post('/api/admin/content/locales')
        .set('x-admin-token', ADMIN_TOKEN)
        .send({ locale: 'es', sourceLocale: 'en' })
        .expect(201);
      const createBody = parseJson(createRes.text);
      assertRecord(createBody, 'createBody');
      expect(readString(createBody, 'locale')).toBe('es');
      const esHero = createBody['hero'];
      assertRecord(esHero, 'esHero');
      expect(readString(esHero, 'title')).toBe(`es:${enTitle}`);
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const localesRes = await request(app.getHttpServer()).get('/api/content/locales').expect(200);
      const localesBody = parseJson(localesRes.text);
      if (!Array.isArray(localesBody)) throw new Error('localesBody must be an array');
      const localeEntry = localesBody.find((item) => {
        if (!isRecord(item)) return false;
        return item['locale'] === 'es';
      });
      if (!localeEntry || !isRecord(localeEntry)) throw new Error('es locale entry not found');
      expect(localeEntry['active']).toBe(false);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
