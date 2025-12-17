import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { PagesService } from './pages.service';

describe('PagesService', () => {
  let service: PagesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), PagesService],
    });
    service = TestBed.inject(PagesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('requests footer links with lang param', () => {
    service.getFooterLinks('ua').subscribe((response) => {
      expect(response.locale).toBe('ua');
      expect(response.categories.length).toBe(0);
    });

    const req = httpMock.expectOne((request) => request.url === '/api/pages/footer' && request.params.get('lang') === 'ua');
    expect(req.request.method).toBe('GET');
    req.flush({ locale: 'ua', categories: [] });
  });

  it('requests a page by slug with lang param', () => {
    service.getPage('about', 'en').subscribe((page) => {
      expect(page.slug).toBe('about');
      expect(page.locale).toBe('en');
    });

    const req = httpMock.expectOne((request) => request.url === '/api/pages/about' && request.params.get('lang') === 'en');
    expect(req.request.method).toBe('GET');
    req.flush({ slug: 'about', title: 'About', content: '<p>About</p>', locale: 'en' });
  });
});

