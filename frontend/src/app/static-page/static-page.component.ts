import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest, distinctUntilChanged, finalize, map, of, switchMap, catchError } from 'rxjs';
import { PublicStaticPage } from '../models/static-page.model';
import { PagesService } from '../services/pages.service';
import { SeoService } from '../services/seo.service';
import { SiteFooterComponent } from '../site-footer/site-footer.component';

type LocaleOption = { code: string };

@Component({
  selector: 'app-static-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SiteFooterComponent],
  templateUrl: './static-page.component.html',
  styleUrl: './static-page.component.scss',
})
export class StaticPageComponent implements OnInit {
  activeLang = signal<string>('en');
  locales = signal<LocaleOption[]>([{ code: 'en' }, { code: 'ua' }]);
  page = signal<PublicStaticPage | null>(null);
  loading = signal<boolean>(false);
  error = signal<string>('');

  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly pages = inject(PagesService);
  private readonly seo = inject(SeoService);

  ngOnInit(): void {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        map(([params, query]) => {
          const slug = params.get('slug') ?? '';
          const lang = (query.get('lang') ?? 'en').trim() || 'en';
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
}

