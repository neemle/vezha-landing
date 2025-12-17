import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { AdminService } from './admin.service';

describe('AdminService (pages)', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    window.localStorage.removeItem('adminToken');
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), AdminService],
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
    service.setToken('test-token');
  });

  afterEach(() => {
    httpMock.verify();
    window.localStorage.removeItem('adminToken');
  });

  it('lists page categories with locale and admin token', () => {
    service.listPageCategories('ua').subscribe((categories) => {
      expect(categories.length).toBe(0);
    });

    const req = httpMock.expectOne((request) => request.url === '/api/admin/page-categories' && request.params.get('locale') === 'ua');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('x-admin-token')).toBe('test-token');
    req.flush([]);
  });

  it('creates a page with admin token', () => {
    service
      .createPage({
        slug: 'about',
        categoryId: 1,
        published: true,
        title: 'About',
        content: '<p>About</p>',
      })
      .subscribe((page) => {
        expect(page.slug).toBe('about');
        expect(page.published).toBeTrue();
      });

    const req = httpMock.expectOne((request) => request.url === '/api/admin/pages');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('x-admin-token')).toBe('test-token');
    req.flush({
      id: 1,
      slug: 'about',
      published: true,
      categoryId: 1,
      title: 'About',
      content: '<p>About</p>',
      translationLocale: 'en',
      hasLocaleTranslation: true,
    });
  });
});

