import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SiteFooterComponent } from './site-footer.component';

describe('SiteFooterComponent', () => {
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SiteFooterComponent, RouterTestingModule],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('renders categories and page links for the selected lang', () => {
    const fixture = TestBed.createComponent(SiteFooterComponent);
    fixture.componentInstance.lang = 'ua';
    fixture.detectChanges();

    const req = httpMock.expectOne((request) => request.url === '/api/pages/footer' && request.params.get('lang') === 'ua');
    req.flush({
      locale: 'ua',
      categories: [
        {
          code: 'legal',
          title: 'Юридичні',
          titleLocale: 'ua',
          pages: [{ slug: 'about', title: 'Про нас', titleLocale: 'ua' }],
        },
      ],
    });

    fixture.detectChanges();
    const text = fixture.nativeElement.textContent ?? '';
    expect(text).toContain('Юридичні');
    expect(text).toContain('Про нас');
  });
});

