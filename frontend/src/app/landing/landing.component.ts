import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { LandingContent } from '../models/landing-content.model';
import { ContentService } from '../services/content.service';
import { LeadService } from '../services/lead.service';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  title = 'VEZHA 360';
  activeLang = signal<string>('en');
  locales = signal<Array<{ code: string; active: boolean }>>([
    { code: 'en', active: true },
    { code: 'ua', active: true },
  ]);
  activeLocales = computed(() => this.locales().filter((locale) => locale.active));
  content = signal<LandingContent | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');
  submitted = signal<boolean>(false);
  submitting = signal<boolean>(false);

  private readonly fb = inject(FormBuilder);
  private readonly contentService = inject(ContentService);
  private readonly leadService = inject(LeadService);
  private readonly seo = inject(SeoService);

  contactForm = this.fb.nonNullable.group({
    name: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    message: [''],
  });

  ngOnInit(): void {
    this.loadContent(this.activeLang());
  }

  switchLang(lang: string): void {
    if (this.activeLang() === lang) return;
    if (this.locales().find((item) => item.code === lang && item.active === false)) {
      this.error.set('Selected language is inactive. Showing English.');
      this.activeLang.set('en');
      return;
    }
    this.activeLang.set(lang);
    this.submitted.set(false);
    this.contactForm.reset();
    this.loadContent(lang);
  }

  scrollToContact(): void {
    const contact = document.getElementById('contact');
    contact?.scrollIntoView({ behavior: 'smooth' });
  }

  submitLead(): void {
    if (this.contactForm.invalid) {
      this.contactForm.markAllAsTouched();
      return;
    }
    const payload = { ...this.contactForm.getRawValue(), lang: this.activeLang() };
    this.submitting.set(true);
    this.error.set('');
    this.leadService
      .submitLead(payload)
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: () => {
          this.submitted.set(true);
          this.error.set('');
          this.contactForm.reset();
        },
        error: () => this.error.set('Unable to send request. Please try again.'),
      });
  }

  isFaIcon(value: string | null | undefined): boolean {
    return !!value && /^fa[a-z-]*-/.test(value.trim());
  }

  private loadContent(lang: string): void {
    this.loading.set(true);
    this.error.set('');
    this.contentService
      .getContent(lang)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          const isActive = lang === 'en' ? true : data.active !== false;
          this.markLocale(lang, isActive);
          if (!isActive && lang !== 'en') {
            this.error.set('Selected language is inactive. Showing English.');
            this.activeLang.set('en');
            this.loadContent('en');
            return;
          }
          this.content.set(data);
          this.seo.update(data.seo);
        },
        error: () => {
          if (lang !== 'en') {
            this.error.set('Language unavailable. Showing English.');
            this.activeLang.set('en');
            this.loadContent('en');
            return;
          }
          this.error.set('Failed to load content. Please retry.');
        },
      });
  }

  private markLocale(code: string, active: boolean): void {
    this.locales.update((items) => {
      const existing = items.find((item) => item.code === code);
      if (existing) {
        return items.map((item) => (item.code === code ? { ...item, active } : item));
      }
      return [...items, { code, active }];
    });
  }
}
