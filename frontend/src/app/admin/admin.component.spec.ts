import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminService } from '../services/admin.service';
import { AdminComponent } from './admin.component';

describe('AdminComponent (tabs + locales)', () => {
  let httpMock: HttpTestingController;
  let adminService: AdminService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminComponent, RouterTestingModule],
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    adminService = TestBed.inject(AdminService);
    adminService.setToken('vezha-admin');
  });

  afterEach(() => {
    adminService.setToken(null);
    httpMock.verify();
  });

  it('lazy-loads pages and leads based on selected tab', () => {
    const fixture = TestBed.createComponent(AdminComponent);
    fixture.detectChanges();

    const localeIndexReq = httpMock.expectOne((req) => req.url === '/api/content/locales');
    localeIndexReq.flush([
      { locale: 'en', active: true },
      { locale: 'ua', active: true },
    ]);

    const contentReq = httpMock.expectOne((req) => req.url === '/api/admin/content' && req.params.get('locale') === 'en');
    contentReq.flush({
      locale: 'en',
      active: true,
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
      metrics: { note: 'Note', stats: [] },
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
          errors: { requiredEmail: 'Required', invalidEmail: 'Invalid' },
        },
      },
      seo: { title: 'SEO', description: 'Desc' },
    });

    httpMock.expectNone((req) => req.url === '/api/admin/leads');
    httpMock.expectNone((req) => req.url === '/api/admin/page-categories');
    httpMock.expectNone((req) => req.url === '/api/admin/pages');

    fixture.detectChanges();

    const setupNav: HTMLElement = fixture.nativeElement.querySelector('nav[aria-label="Setup sections"]');
    const contentButton = Array.from(setupNav.querySelectorAll('button')).find(
      (button) => (button.textContent ?? '').trim() === 'Content',
    );
    if (!contentButton) throw new Error('Content tab button not found');
    contentButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    const categoriesReq = httpMock.expectOne((req) => req.url === '/api/admin/page-categories' && req.params.get('locale') === 'en');
    categoriesReq.flush([]);
    const pagesReq = httpMock.expectOne((req) => req.url === '/api/admin/pages' && req.params.get('locale') === 'en');
    pagesReq.flush([]);

    fixture.detectChanges();

    const adminNav: HTMLElement = fixture.nativeElement.querySelector('nav[aria-label="Admin sections"]');
    const leadsButton = Array.from(adminNav.querySelectorAll('button')).find(
      (button) => (button.textContent ?? '').trim() === 'Leads',
    );
    if (!leadsButton) throw new Error('Leads tab button not found');
    leadsButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    const leadsReq = httpMock.expectOne((req) => req.url === '/api/admin/leads');
    leadsReq.flush([]);

    fixture.detectChanges();
    const leadsCard = fixture.nativeElement.querySelector('.leads-card');
    expect(leadsCard).toBeTruthy();
  });

  it('creates a new locale from EN fallback and saves it', () => {
    const fixture = TestBed.createComponent(AdminComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const localeIndexReq = httpMock.expectOne((req) => req.url === '/api/content/locales');
    localeIndexReq.flush([
      { locale: 'en', active: true },
      { locale: 'ua', active: true },
    ]);

    const contentReq = httpMock.expectOne((req) => req.url === '/api/admin/content' && req.params.get('locale') === 'en');
    contentReq.flush({
      locale: 'en',
      active: true,
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
      metrics: { note: 'Note', stats: [] },
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
          errors: { requiredEmail: 'Required', invalidEmail: 'Invalid' },
        },
      },
      seo: { title: 'SEO', description: 'Desc' },
    });

    component.localeForm.controls.newLocale.setValue('pl');
    fixture.detectChanges();

    const addButton: HTMLButtonElement | null = fixture.nativeElement.querySelector('.locale-controls .locale-add button');
    if (!addButton) throw new Error('Add locale button not found');
    addButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    const templateReq = httpMock.expectOne((req) => req.url === '/api/admin/content' && req.params.get('locale') === 'en');
    templateReq.flush({
      locale: 'en',
      active: true,
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
      metrics: { note: 'Note', stats: [] },
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
          errors: { requiredEmail: 'Required', invalidEmail: 'Invalid' },
        },
      },
      seo: { title: 'SEO', description: 'Desc' },
    });

    const createReq = httpMock.expectOne((req) => req.url === '/api/admin/content' && req.method === 'PUT');
    expect(createReq.request.body?.locale).toBe('pl');
    expect(createReq.request.body?.content?.locale).toBe('pl');
    expect(createReq.request.body?.content?.active).toBeTrue();
    createReq.flush({
      locale: 'pl',
      active: true,
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
      metrics: { note: 'Note', stats: [] },
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
          errors: { requiredEmail: 'Required', invalidEmail: 'Invalid' },
        },
      },
      seo: { title: 'SEO', description: 'Desc' },
    });

    const refreshedLocaleIndexReq = httpMock.expectOne((req) => req.url === '/api/content/locales');
    refreshedLocaleIndexReq.flush([
      { locale: 'en', active: true },
      { locale: 'ua', active: true },
      { locale: 'pl', active: true },
    ]);

    fixture.detectChanges();
    expect(component.activeLocale()).toBe('pl');
    expect(component.locales().some((locale) => locale.code === 'pl')).toBeTrue();
  });

  it('opens rich editor modal for HTML fields and writes back to the form control', () => {
    const fixture = TestBed.createComponent(AdminComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    const localeIndexReq = httpMock.expectOne((req) => req.url === '/api/content/locales');
    localeIndexReq.flush([
      { locale: 'en', active: true },
      { locale: 'ua', active: true },
    ]);

    const contentReq = httpMock.expectOne((req) => req.url === '/api/admin/content' && req.params.get('locale') === 'en');
    contentReq.flush({
      locale: 'en',
      active: true,
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
      metrics: { note: 'Note', stats: [] },
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
          errors: { requiredEmail: 'Required', invalidEmail: 'Invalid' },
        },
      },
      seo: { title: 'SEO', description: 'Desc' },
    });

    fixture.detectChanges();

    const setupNav: HTMLElement = fixture.nativeElement.querySelector('nav[aria-label="Setup sections"]');
    const contentButton = Array.from(setupNav.querySelectorAll('button')).find(
      (button) => (button.textContent ?? '').trim() === 'Content',
    );
    if (!contentButton) throw new Error('Content tab button not found');
    contentButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    const categoriesReq = httpMock.expectOne((req) => req.url === '/api/admin/page-categories' && req.params.get('locale') === 'en');
    categoriesReq.flush([]);
    const pagesReq = httpMock.expectOne((req) => req.url === '/api/admin/pages' && req.params.get('locale') === 'en');
    pagesReq.flush([]);

    fixture.detectChanges();

    const trigger: HTMLButtonElement | null = fixture.nativeElement.querySelector('button.rich-trigger');
    if (!trigger) throw new Error('Rich edit trigger not found');
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.htmlEditor()).not.toBeNull();

    const modal: HTMLElement | null = fixture.nativeElement.querySelector('.html-editor-modal');
    if (!modal) throw new Error('HTML editor modal not opened');
    const surface: HTMLElement | null = modal.querySelector('.editor-surface');
    if (!surface) throw new Error('HTML editor surface not found');
    surface.innerHTML = '<p><strong>Hello</strong></p>';

    const saveButton: HTMLButtonElement | null = modal.querySelector('.modal-actions button.primary');
    if (!saveButton) throw new Error('Save button not found');
    saveButton.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    fixture.detectChanges();

    expect(component.htmlEditor()).toBeNull();
    expect(component.staticPageCreateForm.controls.content.value).toBe('<p><strong>Hello</strong></p>');
  });
});
