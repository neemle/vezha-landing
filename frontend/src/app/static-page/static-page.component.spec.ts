import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { SeoService } from '../services/seo.service';
import { StaticPageComponent } from './static-page.component';

describe('StaticPageComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    const seoStub = { update: jasmine.createSpy('update') };

    await TestBed.configureTestingModule({
      imports: [StaticPageComponent, RouterTestingModule.withRoutes([{ path: ':slug', component: StaticPageComponent }])],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SeoService, useValue: seoStub },
      ],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads page and footer links using route slug and lang', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/about?lang=ua', StaticPageComponent);

    const localesRequest = httpMock.expectOne((req) => req.url === '/api/content/locales');
    localesRequest.flush([
      { locale: 'en', active: true },
      { locale: 'ua', active: true },
    ]);

    const footerRequests = httpMock.match((req) => req.url === '/api/pages/footer');
    footerRequests.forEach((req) => {
      const lang = req.request.params.get('lang') ?? 'en';
      req.flush({ locale: lang, categories: [] });
    });

    const pageRequest = httpMock.expectOne((req) => req.url === '/api/pages/about');

    expect(pageRequest.request.params.get('lang')).toBe('ua');
    pageRequest.flush({ slug: 'about', title: 'Про нас', content: '<p>Про нас</p>', locale: 'ua' });

    harness.fixture.detectChanges();
    expect(component.page()?.title).toBe('Про нас');
  });

  it('updates query param when switching language', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/about?lang=ua', StaticPageComponent);

    const localesRequest = httpMock.expectOne((req) => req.url === '/api/content/locales');
    localesRequest.flush([
      { locale: 'en', active: true },
      { locale: 'ua', active: true },
    ]);

    const footerRequests = httpMock.match((req) => req.url === '/api/pages/footer');
    footerRequests.forEach((req) => {
      const lang = req.request.params.get('lang') ?? 'en';
      req.flush({ locale: lang, categories: [] });
    });

    const pageRequest = httpMock.expectOne((req) => req.url === '/api/pages/about');
    pageRequest.flush({ slug: 'about', title: 'Про нас', content: '<p>Про нас</p>', locale: 'ua' });

    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    component.switchLang('en');
    expect(navigateSpy).toHaveBeenCalledWith(
      [],
      jasmine.objectContaining({
        queryParams: { lang: 'en' },
        queryParamsHandling: 'merge',
      }),
    );
  });
});
