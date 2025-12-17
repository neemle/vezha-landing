import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingHarness, RouterTestingModule } from '@angular/router/testing';
import { SeoService } from '../services/seo.service';
import { LandingComponent } from './landing.component';

describe('LandingComponent (locales)', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    const seoStub = { update: jasmine.createSpy('update') };

    await TestBed.configureTestingModule({
      imports: [LandingComponent, RouterTestingModule.withRoutes([{ path: '', component: LandingComponent }])],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), { provide: SeoService, useValue: seoStub }],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads available locales on start and shows them in the switcher', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/?lang=pl', LandingComponent);

    const localesReq = httpMock.expectOne((req) => req.url === '/api/content/locales');
    localesReq.flush([
      { locale: 'en', active: true },
      { locale: 'ua', active: true },
      { locale: 'pl', active: true },
    ]);

    harness.fixture.detectChanges();
    flushFooterRequests(httpMock);

    const contentReq = httpMock.expectOne(
      (req) => req.url === '/api/content' && req.params.get('lang') === 'pl',
    );
    contentReq.flush({
      active: true,
      locale: 'pl',
      hero: {
        title: 'Title',
        subtitle: 'Subtitle',
        priceNote: 'Price',
        badge: 'Badge',
        bullets: [],
        primaryCta: 'CTA',
        telegramLabel: 'Telegram',
        emailLabel: 'Email',
        telegramUrl: 'https://example.com',
        email: 'support@example.com',
      },
      painPoints: [],
      features: [],
      comparison: {
        highlight: 'Highlight',
        sysadmin: { title: 'Sys', description: 'Desc', price: '$20' },
        vezha: { title: 'Vezha', description: 'Desc', price: '$5', badge: 'Best' },
      },
      metrics: {
        note: 'Note',
        stats: [],
      },
      howItWorks: [],
      contact: {
        title: 'Contact',
        subtitle: 'Subtitle',
        thankYou: 'Thanks',
        telegramLabel: 'Telegram',
        telegramUrl: 'https://example.com',
        emailLabel: 'Email',
        email: 'support@example.com',
        form: {
          nameLabel: 'Name',
          emailLabel: 'Email',
          phoneLabel: 'Phone',
          messageLabel: 'Message',
          submitLabel: 'Submit',
          errors: {
            requiredEmail: 'Required',
            invalidEmail: 'Invalid',
          },
        },
      },
      seo: {
        title: 'SEO',
        description: 'Desc',
      },
    });

    harness.fixture.detectChanges();
    flushFooterRequests(httpMock);

    harness.fixture.detectChanges();

    expect(component.activeLang()).toBe('pl');
    expect(component.activeLocales().some((item) => item.code === 'pl')).toBeTrue();

    const text = harness.fixture.nativeElement.textContent ?? '';
    expect(text).toContain('PL');
  });
});

function flushFooterRequests(httpMock: HttpTestingController): void {
  const requests = httpMock.match((req) => req.url === '/api/pages/footer');
  requests.forEach((req) => {
    if (req.cancelled) return;
    const lang = req.request.params.get('lang') ?? 'en';
    req.flush({ locale: lang, categories: [] });
  });
}
