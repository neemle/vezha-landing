import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, distinctUntilChanged, finalize, map, of, switchMap, catchError } from 'rxjs';
import { PublicStaticPage } from '../models/static-page.model';
import { ContentService } from '../services/content.service';
import { PagesService } from '../services/pages.service';
import { SeoService } from '../services/seo.service';
import { SiteFooterComponent } from '../site-footer/site-footer.component';

@Component({
  selector: 'app-static-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SiteFooterComponent],
  templateUrl: './static-page.component.html',
  styleUrl: './static-page.component.scss',
})
export class StaticPageComponent implements OnInit {
  activeLang = signal<string>('en');
  locales = signal<Array<{ code: string; active: boolean }>>([
    { code: 'en', active: true },
    { code: 'ua', active: true },
  ]);
  activeLocales = computed(() => this.locales().filter((locale) => locale.active));
  page = signal<PublicStaticPage | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');

  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly contentService = inject(ContentService);
  private readonly pages = inject(PagesService);
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    this.loadLocales();
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        map(([params, query]) => {
          const slug = params.get('slug') ?? '';
          const queryLang = query.get('lang');
          const lang = queryLang
            ? queryLang.trim() || 'en'
            : this.detectBrowserLang();
          return { slug, lang };
        }),
        distinctUntilChanged((a, b) => a.slug === b.slug && a.lang === b.lang),
        switchMap(({ slug, lang }) => {
          this.loading.set(true);
          this.error.set('');
          this.activeLang.set(lang);
          if (!slug) {
            this.page.set(null);
            this.loading.set(false);
            this.error.set('Page not found.');
            return of<PublicStaticPage | null>(null);
          }
          return this.pages.getPage(slug, lang).pipe(
            finalize(() => this.loading.set(false)),
            catchError(() => {
              this.page.set(null);
              this.error.set('Page not found.');
              return of<PublicStaticPage | null>(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        if (!page) return;
        this.page.set(page);
        this.seo.update({
          title: `${page.title} | VEZHA 360`,
          description: '',
        });
      });
  }

  switchLang(lang: string): void {
    const normalized = lang.trim() || 'en';
    if (this.activeLang() === normalized) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { lang: normalized },
      queryParamsHandling: 'merge',
    });
  }

  private loadLocales(): void {
    this.contentService.getLocales().subscribe({
      next: (locales) => {
        const mapped = locales
          .map((item) => ({ code: this.normalizeLocale(item.locale), active: item.active }))
          .filter((item) => !!item.code);
        const hasEn = mapped.some((item) => item.code === 'en');
        this.locales.set(hasEn ? mapped : [{ code: 'en', active: true }, ...mapped]);
      },
      error: () => {
        this.locales.set([
          { code: 'en', active: true },
          { code: 'ua', active: true },
        ]);
      },
    });
  }

  private detectBrowserLang(): string {
    if (typeof navigator === 'undefined') return 'en';
    const languages = navigator.languages ?? [navigator.language];
    for (const lang of languages) {
      const normalized = this.normalizeLocale(lang);
      if (normalized && normalized !== 'en') return normalized;
    }
    return 'en';
  }

  private normalizeLocale(locale: string | null | undefined): string {
    if (!locale) return 'en';
    const lower = locale.trim().toLowerCase();
    const primary = lower.split('-')[0] ?? lower;
    if (primary === 'uk' || primary === 'ua') return 'ua';
    if (primary === 'en') return 'en';
    return primary;
  }
}
