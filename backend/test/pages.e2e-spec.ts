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

function assertString(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string') throw new Error(`${label} must be a string`);
}

function assertNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== 'number') throw new Error(`${label} must be a number`);
}

function readNumber(record: JsonRecord, key: string): number {
  const value = record[key];
  assertNumber(value, key);
  return value;
}

function readString(record: JsonRecord, key: string): string {
  const value = record[key];
  assertString(value, key);
  return value;
}

describe('Static pages (e2e)', () => {
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

  it('supports EN fallback, translations, and publish toggle', async () => {
    const categoryRes = await request(app.getHttpServer())
      .post('/api/admin/page-categories')
      .set('x-admin-token', ADMIN_TOKEN)
      .send({ code: 'legal', title: 'Legal' })
      .expect(201);
    const categoryBody = parseJson(categoryRes.text);
    assertRecord(categoryBody, 'categoryBody');
    const categoryId = readNumber(categoryBody, 'id');

    const pageRes = await request(app.getHttpServer())
      .post('/api/admin/pages')
      .set('x-admin-token', ADMIN_TOKEN)
      .send({
        slug: 'about',
        categoryId,
        published: true,
        title: 'About',
        content: '<p>About us</p>',
      })
      .expect(201);
    const pageBody = parseJson(pageRes.text);
    assertRecord(pageBody, 'pageBody');
    const pageId = readNumber(pageBody, 'id');

    const footerFallbackRes = await request(app.getHttpServer())
      .get('/api/pages/footer')
      .query({ lang: 'ua' })
      .expect(200);
    const footerFallbackBody = parseJson(footerFallbackRes.text);
    assertRecord(footerFallbackBody, 'footerFallbackBody');
    const categories = footerFallbackBody['categories'];
    if (!Array.isArray(categories)) throw new Error('categories must be an array');
    expect(categories.length).toBe(1);
    const firstCategory = categories[0];
    assertRecord(firstCategory, 'firstCategory');
    expect(readString(firstCategory, 'title')).toBe('Legal');
    const pages = firstCategory['pages'];
    if (!Array.isArray(pages)) throw new Error('pages must be an array');
    expect(pages.length).toBe(1);
    const firstPage = pages[0];
    assertRecord(firstPage, 'firstPage');
    expect(readString(firstPage, 'title')).toBe('About');

    const pageFallbackRes = await request(app.getHttpServer())
      .get('/api/pages/about')
      .query({ lang: 'ua' })
      .expect(200);
    const pageFallbackBody = parseJson(pageFallbackRes.text);
    assertRecord(pageFallbackBody, 'pageFallbackBody');
    expect(readString(pageFallbackBody, 'locale')).toBe('en');
    expect(readString(pageFallbackBody, 'title')).toBe('About');

    await request(app.getHttpServer())
      .put(`/api/admin/page-categories/${categoryId}/translations`)
      .set('x-admin-token', ADMIN_TOKEN)
      .send({ locale: 'ua', title: 'Юридичні' })
      .expect(200);

    await request(app.getHttpServer())
      .put(`/api/admin/pages/${pageId}/translations`)
      .set('x-admin-token', ADMIN_TOKEN)
      .send({ locale: 'ua', title: 'Про нас', content: '<p>Про нас</p>' })
      .expect(200);

    const footerUaRes = await request(app.getHttpServer()).get('/api/pages/footer').query({ lang: 'ua' }).expect(200);
    const footerUaBody = parseJson(footerUaRes.text);
    assertRecord(footerUaBody, 'footerUaBody');
    const categoriesUa = footerUaBody['categories'];
    if (!Array.isArray(categoriesUa)) throw new Error('categories must be an array');
    expect(categoriesUa.length).toBe(1);
    const categoryUa = categoriesUa[0];
    assertRecord(categoryUa, 'categoryUa');
    expect(readString(categoryUa, 'title')).toBe('Юридичні');
    const pagesUa = categoryUa['pages'];
    if (!Array.isArray(pagesUa)) throw new Error('pages must be an array');
    expect(pagesUa.length).toBe(1);
    const pageUaLink = pagesUa[0];
    assertRecord(pageUaLink, 'pageUaLink');
    expect(readString(pageUaLink, 'title')).toBe('Про нас');

    const pageUaRes = await request(app.getHttpServer()).get('/api/pages/about').query({ lang: 'ua' }).expect(200);
    const pageUaBody = parseJson(pageUaRes.text);
    assertRecord(pageUaBody, 'pageUaBody');
    expect(readString(pageUaBody, 'locale')).toBe('ua');
    expect(readString(pageUaBody, 'title')).toBe('Про нас');

    await request(app.getHttpServer())
      .patch(`/api/admin/pages/${pageId}`)
      .set('x-admin-token', ADMIN_TOKEN)
      .send({ published: false })
      .expect(200);

    await request(app.getHttpServer()).get('/api/pages/about').expect(404);

    const footerAfterUnpublish = await request(app.getHttpServer()).get('/api/pages/footer').query({ lang: 'en' }).expect(200);
    const footerAfterUnpublishBody = parseJson(footerAfterUnpublish.text);
    assertRecord(footerAfterUnpublishBody, 'footerAfterUnpublishBody');
    const categoriesAfterUnpublish = footerAfterUnpublishBody['categories'];
    if (!Array.isArray(categoriesAfterUnpublish)) throw new Error('categories must be an array');
    expect(categoriesAfterUnpublish.length).toBe(0);
  });

  it('rejects duplicate slugs', async () => {
    const categoryRes = await request(app.getHttpServer())
      .post('/api/admin/page-categories')
      .set('x-admin-token', ADMIN_TOKEN)
      .send({ code: 'legal', title: 'Legal' })
      .expect(201);
    const categoryBody = parseJson(categoryRes.text);
    assertRecord(categoryBody, 'categoryBody');
    const categoryId = readNumber(categoryBody, 'id');

    await request(app.getHttpServer())
      .post('/api/admin/pages')
      .set('x-admin-token', ADMIN_TOKEN)
      .send({ slug: 'about', categoryId, published: true, title: 'About', content: '<p>About</p>' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/admin/pages')
      .set('x-admin-token', ADMIN_TOKEN)
      .send({ slug: 'about', categoryId, published: true, title: 'About 2', content: '<p>About</p>' })
      .expect(400);
  });

  it('requires admin token for admin endpoints', async () => {
    await request(app.getHttpServer()).get('/api/admin/page-categories').expect(401);
  });
});
