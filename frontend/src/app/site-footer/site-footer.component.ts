import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Input, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, filter, finalize, of, switchMap } from 'rxjs';
import { FooterLinksResponse } from '../models/static-page.model';
import { PagesService } from '../services/pages.service';

@Component({
  selector: 'app-site-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.scss',
})
export class SiteFooterComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly pages = inject(PagesService);

  private readonly langSignal = signal<string>('');
  readonly currentLang = this.langSignal.asReadonly();

  footer = signal<FooterLinksResponse | null>(null);
  loading = signal(false);
  error = signal('');

  @Input({ required: true })
  set lang(value: string) {
    this.langSignal.set(value?.trim() ? value.trim() : 'en');
  }

  constructor() {
    toObservable(this.langSignal)
      .pipe(
        filter((lang) => !!lang),
        distinctUntilChanged(),
        switchMap((lang) => {
          this.loading.set(true);
          this.error.set('');
          return this.pages.getFooterLinks(lang).pipe(
            finalize(() => this.loading.set(false)),
            catchError(() => {
              this.footer.set(null);
              this.error.set('Unable to load footer links.');
              return of<FooterLinksResponse | null>(null);
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        if (result) this.footer.set(result);
      });
  }
}
