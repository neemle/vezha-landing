import { CommonModule } from '@angular/common';
import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AdminPageCategory, AdminStaticPage, AdminStaticPageListItem } from '../models/admin-pages.model';
import { LandingContent } from '../models/landing-content.model';
import { Lead } from '../models/lead.model';
import { AdminService, LeadExportFilter } from '../services/admin.service';

type Locale = string;
type LeadSortKey = 'createdAt' | 'email' | 'name' | 'exportedAt';
type DragList = 'heroBullets' | 'painPoints' | 'features' | 'metricsStats' | 'howItWorks';
type DragContext = { list: DragList; from: number; locale: Locale };

type ContentFormGroup = FormGroup<{
  active: FormControl<boolean>;
  locale: FormControl<Locale>;
  hero: FormGroup<{
    title: FormControl<string>;
    subtitle: FormControl<string>;
    priceNote: FormControl<string>;
    badge: FormControl<string>;
    bullets: FormArray<FormControl<string>>;
    primaryCta: FormControl<string>;
    telegramLabel: FormControl<string>;
    emailLabel: FormControl<string>;
    telegramUrl: FormControl<string>;
    email: FormControl<string>;
  }>;
  painPoints: FormArray<FormGroup<{ title: FormControl<string>; description: FormControl<string>; icon: FormControl<string> }>>;
  features: FormArray<FormGroup<{ title: FormControl<string>; description: FormControl<string>; icon: FormControl<string> }>>;
  comparison: FormGroup<{
    highlight: FormControl<string>;
    sysadmin: FormGroup<{ title: FormControl<string>; description: FormControl<string>; price: FormControl<string> }>;
    vezha: FormGroup<{
      title: FormControl<string>;
      description: FormControl<string>;
      price: FormControl<string>;
      badge: FormControl<string>;
    }>;
  }>;
  metrics: FormGroup<{
    note: FormControl<string>;
    stats: FormArray<FormGroup<{ label: FormControl<string>; value: FormControl<string> }>>;
  }>;
  howItWorks: FormArray<FormGroup<{ title: FormControl<string>; description: FormControl<string> }>>;
  contact: FormGroup<{
    title: FormControl<string>;
    subtitle: FormControl<string>;
    thankYou: FormControl<string>;
    telegramLabel: FormControl<string>;
    telegramUrl: FormControl<string>;
    emailLabel: FormControl<string>;
    email: FormControl<string>;
    form: FormGroup<{
      nameLabel: FormControl<string>;
      emailLabel: FormControl<string>;
      phoneLabel: FormControl<string>;
      messageLabel: FormControl<string>;
      submitLabel: FormControl<string>;
      errors: FormGroup<{
        requiredEmail: FormControl<string>;
        invalidEmail: FormControl<string>;
      }>;
    }>;
  }>;
  seo: FormGroup<{
    title: FormControl<string>;
    description: FormControl<string>;
  }>;
}>;

type ContentFormState = {
  form: ContentFormGroup;
  loading: WritableSignal<boolean>;
  saving: WritableSignal<boolean>;
  error: WritableSignal<string>;
  success: WritableSignal<string>;
  loaded: WritableSignal<boolean>;
};

type CategoryCreateFormGroup = FormGroup<{
  code: FormControl<string>;
  title: FormControl<string>;
  active: FormControl<boolean>;
}>;

type CategoryTranslationFormGroup = FormGroup<{
  title: FormControl<string>;
}>;

type PageCreateFormGroup = FormGroup<{
  slug: FormControl<string>;
  categoryId: FormControl<number>;
  published: FormControl<boolean>;
  title: FormControl<string>;
  content: FormControl<string>;
}>;

type PageBaseFormGroup = FormGroup<{
  slug: FormControl<string>;
  categoryId: FormControl<number>;
  published: FormControl<boolean>;
}>;

type PageTranslationFormGroup = FormGroup<{
  title: FormControl<string>;
  content: FormControl<string>;
}>;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss',
})
export class AdminComponent implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  readonly locales = signal<Locale[]>(['en', 'ua']);
  readonly activeLocale = signal<Locale>('en');
  readonly dragState = signal<DragContext | null>(null);
  readonly iconOptions: string[] = [
    'fa-shield-halved',
    'fa-bolt',
    'fa-lock',
    'fa-server',
    'fa-cloud',
    'fa-headset',
    'fa-screwdriver-wrench',
    'fa-bug',
    'fa-database',
    'fa-eye',
    'fa-wave-square',
    'fa-clock',
    'fa-chart-line',
    'fa-circle-check',
    'fa-laptop-code',
    'fa-network-wired',
    'fa-circle-exclamation',
    'fa-user-shield',
    'fa-signal',
    'fa-route',
    'fa-robot',
    'fa-fire',
    'fa-gear',
    'fa-list-check',
    'fa-diagram-project',
  ];

  readonly tokenForm = this.fb.nonNullable.group({
    adminToken: [this.admin.token() ?? '', Validators.required],
  });

  readonly localeForm = this.fb.nonNullable.group({
    newLocale: ['', [Validators.required, Validators.pattern('^[a-zA-Z-]{2,8}$')]],
  });

  readonly pageCategoryCreateForm: CategoryCreateFormGroup = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]],
    title: ['', Validators.required],
    active: [true],
  });

  readonly pageCategoryTranslationForm: CategoryTranslationFormGroup = this.fb.nonNullable.group({
    title: ['', Validators.required],
  });

  readonly staticPageCreateForm: PageCreateFormGroup = this.fb.nonNullable.group({
    slug: ['', [Validators.required, Validators.pattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]],
    categoryId: [0, [Validators.required, Validators.min(1)]],
    published: [false],
    title: ['', Validators.required],
    content: ['', Validators.required],
  });

  readonly staticPageBaseForm: PageBaseFormGroup = this.fb.nonNullable.group({
    slug: ['', [Validators.required, Validators.pattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]],
    categoryId: [0, [Validators.required, Validators.min(1)]],
    published: [false],
  });

  readonly staticPageTranslationForm: PageTranslationFormGroup = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: ['', Validators.required],
  });

  private readonly contentStates: Record<string, ContentFormState> = this.createInitialStates(['en', 'ua']);

  readonly selectedContent = computed(() => this.ensureState(this.activeLocale()));

  readonly pageCategories = signal<AdminPageCategory[]>([]);
  readonly pageCategoriesLoading = signal(false);
  readonly pageCategoriesError = signal('');
  readonly pageCategoriesSuccess = signal('');
  readonly selectedPageCategoryId = signal<number | null>(null);
  readonly selectedPageCategory = computed(() => {
    const id = this.selectedPageCategoryId();
    if (!id) return null;
    return this.pageCategories().find((item) => item.id === id) ?? null;
  });

  readonly staticPages = signal<AdminStaticPageListItem[]>([]);
  readonly staticPagesLoading = signal(false);
  readonly staticPagesError = signal('');
  readonly staticPagesSuccess = signal('');
  readonly selectedStaticPageId = signal<number | null>(null);
  readonly selectedStaticPage = signal<AdminStaticPage | null>(null);
  readonly selectedStaticPageLoading = signal(false);

  readonly leadFilters = signal<{ exported: LeadExportFilter; includeBad: boolean; search: string }>({
    exported: 'all',
    includeBad: true,
    search: '',
  });
  readonly leads = signal<Lead[]>([]);
  readonly leadsLoading = signal(false);
  readonly leadsError = signal('');
  readonly leadsSuccess = signal('');
  readonly exporting = signal(false);
  readonly exportMessage = signal('');
  readonly sortState = signal<{ key: LeadSortKey; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });

  readonly viewLeads = computed(() => {
    const data = [...this.leads()];
    const { key, direction } = this.sortState();
    const factor = direction === 'asc' ? 1 : -1;
    return data.sort((a, b) => {
      const av = this.leadSortValue(a, key);
      const bv = this.leadSortValue(b, key);
      if (av < bv) return -1 * factor;
      if (av > bv) return 1 * factor;
      return 0;
    });
  });

  ngOnInit(): void {
    const token = this.admin.token();
    if (token) {
      this.loadLocale(this.activeLocale());
      this.loadPageCategories(this.activeLocale());
      this.loadStaticPages(this.activeLocale());
      this.loadLeads();
    }
  }

  saveToken(): void {
    const token = this.tokenForm.controls.adminToken.value.trim();
    this.admin.setToken(token);
    if (token && !this.selectedContent().loaded()) {
      this.loadLocale(this.activeLocale());
    }
    if (token) {
      this.loadPageCategories(this.activeLocale());
      this.loadStaticPages(this.activeLocale());
      this.loadLeads();
    }
  }

  switchLocale(locale: Locale): void {
    if (this.activeLocale() === locale) return;
    this.activeLocale.set(locale);
    if (!this.ensureState(locale).loaded() && this.admin.token()) {
      this.loadLocale(locale);
    }
    if (this.admin.token()) {
      this.loadPageCategories(locale);
      this.loadStaticPages(locale);
    }
    this.selectedPageCategoryId.set(null);
    this.selectedStaticPageId.set(null);
    this.selectedStaticPage.set(null);
  }

  addLocale(): void {
    const code = this.localeForm.controls.newLocale.value.trim().toLowerCase() as Locale;
    if (!code) return;
    if (this.locales().includes(code)) {
      this.localeForm.controls.newLocale.setErrors({ duplicate: true });
      return;
    }
    const fallback = this.ensureState('en');
    if (!fallback.loaded()) {
      this.selectedContent().error.set('Load EN first so it can be used as a fallback template.');
      this.loadLocale('en');
      return;
    }
    const fallbackContent = this.toLandingContent(fallback.form, 'en');
    const newState = this.ensureState(code);
    newState.form = this.createContentForm({ ...fallbackContent, locale: code, active: true }, code);
    newState.loaded.set(true);
    newState.error.set('');
    newState.success.set('Locale created from EN fallback.');
    this.locales.update((list) => [...list, code]);
    this.activeLocale.set(code);
    if (this.admin.token()) {
      this.loadPageCategories(code);
      this.loadStaticPages(code);
    }
    this.localeForm.reset({ newLocale: '' });
  }

  loadLocale(locale: Locale): void {
    const state = this.ensureState(locale);
    state.loading.set(true);
    state.error.set('');
    state.success.set('');

    const token = this.ensureToken();
    if (!token) {
      state.loading.set(false);
      state.error.set('Admin token is required to load content.');
      return;
    }

    this.admin
      .getContent(locale)
      .pipe(finalize(() => state.loading.set(false)))
      .subscribe({
        next: (content) => {
          state.form = this.createContentForm(content, locale);
          state.loaded.set(true);
          state.success.set('Loaded latest content.');
        },
        error: (err) => state.error.set(this.humanizeError(err)),
      });
  }

  saveLocale(locale: Locale): void {
    const state = this.ensureState(locale);
    state.error.set('');
    state.success.set('');

    const token = this.ensureToken();
    if (!token) {
      state.error.set('Admin token is required to save content.');
      return;
    }

    const payload = this.toLandingContent(state.form, locale);
    state.saving.set(true);
    this.admin
      .updateContent(locale, payload)
      .pipe(finalize(() => state.saving.set(false)))
      .subscribe({
        next: () => state.success.set('Content saved.'),
        error: (err) => state.error.set(this.humanizeError(err)),
      });
  }

  loadPageCategories(locale: Locale): void {
    this.pageCategoriesLoading.set(true);
    this.pageCategoriesError.set('');
    this.pageCategoriesSuccess.set('');
    const token = this.ensureToken();
    if (!token) {
      this.pageCategoriesLoading.set(false);
      this.pageCategoriesError.set('Admin token is required to load categories.');
      return;
    }
    this.admin
      .listPageCategories(locale)
      .pipe(finalize(() => this.pageCategoriesLoading.set(false)))
      .subscribe({
        next: (categories) => {
          this.pageCategories.set(categories);
          this.pageCategoriesSuccess.set(`Loaded ${categories.length} categories.`);
        },
        error: (err) => this.pageCategoriesError.set(this.humanizeError(err)),
      });
  }

  createPageCategory(): void {
    this.pageCategoriesError.set('');
    this.pageCategoriesSuccess.set('');
    if (this.pageCategoryCreateForm.invalid) {
      this.pageCategoryCreateForm.markAllAsTouched();
      return;
    }
    const token = this.ensureToken();
    if (!token) {
      this.pageCategoriesError.set('Admin token is required to create categories.');
      return;
    }
    const raw = this.pageCategoryCreateForm.getRawValue();
    this.pageCategoriesLoading.set(true);
    this.admin
      .createPageCategory({ code: raw.code.trim(), title: raw.title.trim(), active: raw.active })
      .pipe(finalize(() => this.pageCategoriesLoading.set(false)))
      .subscribe({
        next: () => {
          this.pageCategoryCreateForm.reset({ code: '', title: '', active: true });
          this.pageCategoriesSuccess.set('Category created.');
          this.loadPageCategories(this.activeLocale());
        },
        error: (err) => this.pageCategoriesError.set(this.humanizeError(err)),
      });
  }

  selectPageCategory(category: AdminPageCategory): void {
    this.selectedPageCategoryId.set(category.id);
    this.pageCategoryTranslationForm.reset({ title: category.title });
  }

  savePageCategoryTranslation(): void {
    this.pageCategoriesError.set('');
    this.pageCategoriesSuccess.set('');
    const selected = this.selectedPageCategory();
    if (!selected) {
      this.pageCategoriesError.set('Select a category first.');
      return;
    }
    if (this.pageCategoryTranslationForm.invalid) {
      this.pageCategoryTranslationForm.markAllAsTouched();
      return;
    }
    const token = this.ensureToken();
    if (!token) {
      this.pageCategoriesError.set('Admin token is required to save category translations.');
      return;
    }
    const locale = this.activeLocale();
    const title = this.pageCategoryTranslationForm.controls.title.value.trim();
    this.pageCategoriesLoading.set(true);
    this.admin
      .upsertPageCategoryTranslation(selected.id, { locale, title }, locale)
      .pipe(finalize(() => this.pageCategoriesLoading.set(false)))
      .subscribe({
        next: () => {
          this.pageCategoriesSuccess.set('Category translation saved.');
          this.loadPageCategories(locale);
        },
        error: (err) => this.pageCategoriesError.set(this.humanizeError(err)),
      });
  }

  togglePageCategoryActive(category: AdminPageCategory, active: boolean): void {
    this.pageCategoriesError.set('');
    const token = this.ensureToken();
    if (!token) return;
    const locale = this.activeLocale();
    this.pageCategoriesLoading.set(true);
    this.admin
      .updatePageCategory(category.id, { active }, locale)
      .pipe(finalize(() => this.pageCategoriesLoading.set(false)))
      .subscribe({
        next: () => this.loadPageCategories(locale),
        error: (err) => this.pageCategoriesError.set(this.humanizeError(err)),
      });
  }

  loadStaticPages(locale: Locale): void {
    this.staticPagesLoading.set(true);
    this.staticPagesError.set('');
    this.staticPagesSuccess.set('');
    const token = this.ensureToken();
    if (!token) {
      this.staticPagesLoading.set(false);
      this.staticPagesError.set('Admin token is required to load pages.');
      return;
    }
    this.admin
      .listPages(locale)
      .pipe(finalize(() => this.staticPagesLoading.set(false)))
      .subscribe({
        next: (pages) => {
          this.staticPages.set(pages);
          this.staticPagesSuccess.set(`Loaded ${pages.length} pages.`);
        },
        error: (err) => this.staticPagesError.set(this.humanizeError(err)),
      });
  }

  selectStaticPage(page: AdminStaticPageListItem): void {
    this.selectedStaticPageId.set(page.id);
    this.loadStaticPage(page.id, this.activeLocale());
  }

  createStaticPage(): void {
    this.staticPagesError.set('');
    this.staticPagesSuccess.set('');
    if (this.staticPageCreateForm.invalid) {
      this.staticPageCreateForm.markAllAsTouched();
      return;
    }
    const token = this.ensureToken();
    if (!token) {
      this.staticPagesError.set('Admin token is required to create pages.');
      return;
    }
    const raw = this.staticPageCreateForm.getRawValue();
    this.staticPagesLoading.set(true);
    this.admin
      .createPage({
        slug: raw.slug.trim(),
        categoryId: raw.categoryId,
        published: raw.published,
        title: raw.title.trim(),
        content: raw.content.trim(),
      })
      .pipe(finalize(() => this.staticPagesLoading.set(false)))
      .subscribe({
        next: (created) => {
          this.staticPageCreateForm.reset({ slug: '', categoryId: 0, published: false, title: '', content: '' });
          this.staticPagesSuccess.set('Page created.');
          this.loadStaticPages(this.activeLocale());
          this.selectedStaticPageId.set(created.id);
          this.loadStaticPage(created.id, this.activeLocale());
        },
        error: (err) => this.staticPagesError.set(this.humanizeError(err)),
      });
  }

  saveStaticPageBase(): void {
    this.staticPagesError.set('');
    this.staticPagesSuccess.set('');
    const selected = this.selectedStaticPage();
    if (!selected) {
      this.staticPagesError.set('Select a page first.');
      return;
    }
    if (this.staticPageBaseForm.invalid) {
      this.staticPageBaseForm.markAllAsTouched();
      return;
    }
    const token = this.ensureToken();
    if (!token) {
      this.staticPagesError.set('Admin token is required to save pages.');
      return;
    }
    const locale = this.activeLocale();
    const raw = this.staticPageBaseForm.getRawValue();
    this.selectedStaticPageLoading.set(true);
    this.admin
      .updatePage(
        selected.id,
        { slug: raw.slug.trim(), categoryId: raw.categoryId, published: raw.published },
        locale,
      )
      .pipe(finalize(() => this.selectedStaticPageLoading.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedStaticPage.set(updated);
          this.staticPageBaseForm.reset({ slug: updated.slug, categoryId: updated.categoryId, published: updated.published });
          this.staticPageTranslationForm.reset({ title: updated.title, content: updated.content });
          this.staticPagesSuccess.set('Page updated.');
          this.loadStaticPages(locale);
        },
        error: (err) => this.staticPagesError.set(this.humanizeError(err)),
      });
  }

  saveStaticPageTranslation(): void {
    this.staticPagesError.set('');
    this.staticPagesSuccess.set('');
    const selected = this.selectedStaticPage();
    if (!selected) {
      this.staticPagesError.set('Select a page first.');
      return;
    }
    if (this.staticPageTranslationForm.invalid) {
      this.staticPageTranslationForm.markAllAsTouched();
      return;
    }
    const token = this.ensureToken();
    if (!token) {
      this.staticPagesError.set('Admin token is required to save translations.');
      return;
    }
    const locale = this.activeLocale();
    const raw = this.staticPageTranslationForm.getRawValue();
    this.selectedStaticPageLoading.set(true);
    this.admin
      .upsertPageTranslation(selected.id, { locale, title: raw.title.trim(), content: raw.content.trim() })
      .pipe(finalize(() => this.selectedStaticPageLoading.set(false)))
      .subscribe({
        next: (updated) => {
          this.selectedStaticPage.set(updated);
          this.staticPageTranslationForm.reset({ title: updated.title, content: updated.content });
          this.staticPagesSuccess.set('Translation saved.');
          this.loadStaticPages(locale);
        },
        error: (err) => this.staticPagesError.set(this.humanizeError(err)),
      });
  }

  toggleStaticPagePublished(page: AdminStaticPageListItem, published: boolean): void {
    this.staticPagesError.set('');
    const token = this.ensureToken();
    if (!token) return;
    const locale = this.activeLocale();
    this.staticPagesLoading.set(true);
    this.admin
      .updatePage(page.id, { published }, locale)
      .pipe(finalize(() => this.staticPagesLoading.set(false)))
      .subscribe({
        next: () => {
          this.loadStaticPages(locale);
          if (this.selectedStaticPageId() === page.id) {
            this.loadStaticPage(page.id, locale);
          }
        },
        error: (err) => this.staticPagesError.set(this.humanizeError(err)),
      });
  }

  private loadStaticPage(id: number, locale: Locale): void {
    this.selectedStaticPageLoading.set(true);
    this.staticPagesError.set('');
    const token = this.ensureToken();
    if (!token) {
      this.selectedStaticPageLoading.set(false);
      this.staticPagesError.set('Admin token is required to load pages.');
      return;
    }
    this.admin
      .getPage(id, locale)
      .pipe(finalize(() => this.selectedStaticPageLoading.set(false)))
      .subscribe({
        next: (page) => {
          this.selectedStaticPage.set(page);
          this.staticPageBaseForm.reset({ slug: page.slug, categoryId: page.categoryId, published: page.published });
          this.staticPageTranslationForm.reset({ title: page.title, content: page.content });
        },
        error: (err) => this.staticPagesError.set(this.humanizeError(err)),
      });
  }

  loadLeads(): void {
    this.leadsLoading.set(true);
    this.leadsError.set('');
    this.leadsSuccess.set('');
    const token = this.ensureToken();
    if (!token) {
      this.leadsLoading.set(false);
      this.leadsError.set('Admin token is required to load leads.');
      return;
    }
    const { exported, includeBad, search } = this.leadFilters();
    this.admin
      .listLeads({ exported, includeBad, search: search?.trim() || undefined })
      .pipe(finalize(() => this.leadsLoading.set(false)))
      .subscribe({
        next: (leads) => {
          this.leads.set(leads);
          this.leadsSuccess.set(`Loaded ${leads.length} leads.`);
        },
        error: (err) => this.leadsError.set(this.humanizeError(err)),
      });
  }

  updateExportedFilter(exported: LeadExportFilter): void {
    this.leadFilters.update((f) => ({ ...f, exported }));
    this.loadLeads();
  }

  toggleIncludeBad(includeBad: boolean): void {
    this.leadFilters.update((f) => ({ ...f, includeBad }));
    this.loadLeads();
  }

  applySearch(value: string): void {
    this.leadFilters.update((f) => ({ ...f, search: value }));
    this.loadLeads();
  }

  sortBy(key: LeadSortKey): void {
    this.sortState.update((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));
  }

  toggleBad(lead: Lead): void {
    const token = this.ensureToken();
    if (!token) return;
    const next = !lead.bad;
    this.leadsError.set('');
    this.admin.setLeadBad(lead.id, next).subscribe({
      next: (updated) => {
        this.leads.update((items) => items.map((item) => (item.id === updated.id ? { ...item, bad: updated.bad } : item)));
      },
      error: (err) => this.leadsError.set(this.humanizeError(err)),
    });
  }

  exportLeads(): void {
    const token = this.ensureToken();
    if (!token) return;
    this.exporting.set(true);
    this.exportMessage.set('');
    this.leadsError.set('');
    this.admin
      .exportLeads()
      .pipe(finalize(() => this.exporting.set(false)))
      .subscribe({
        next: (csv) => {
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `leads-${new Date().toISOString()}.csv`;
          link.click();
          URL.revokeObjectURL(url);
          this.exportMessage.set('Exported pending leads to CSV and marked as exported.');
          this.loadLeads();
        },
        error: (err) => this.leadsError.set(this.humanizeError(err)),
      });
  }

  addHeroBullet(locale: Locale): void {
    this.heroBullets(locale).push(this.fb.nonNullable.control(''));
  }

  removeHeroBullet(locale: Locale, index: number): void {
    this.heroBullets(locale).removeAt(index);
  }

  addPainPoint(locale: Locale): void {
    this.painPoints(locale).push(this.createPainPoint());
  }

  removePainPoint(locale: Locale, index: number): void {
    this.painPoints(locale).removeAt(index);
  }

  addFeature(locale: Locale): void {
    this.features(locale).push(this.createFeature());
  }

  removeFeature(locale: Locale, index: number): void {
    this.features(locale).removeAt(index);
  }

  addMetric(locale: Locale): void {
    this.metricsStats(locale).push(this.createStat());
  }

  removeMetric(locale: Locale, index: number): void {
    this.metricsStats(locale).removeAt(index);
  }

  addHowItWorks(locale: Locale): void {
    this.howItWorks(locale).push(this.createHowItWorksStep());
  }

  removeHowItWorks(locale: Locale, index: number): void {
    this.howItWorks(locale).removeAt(index);
  }

  startDrag(event: DragEvent, list: DragList, index: number, locale: Locale): void {
    event.dataTransfer?.setData('text/plain', `${list}:${index}:${locale}`);
    event.dataTransfer?.setDragImage(this.createDragImage(), 0, 0);
    this.dragState.set({ list, from: index, locale });
  }

  allowDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  dropItem(event: DragEvent, list: DragList, toIndex: number, locale: Locale): void {
    event.preventDefault();
    const payload = event.dataTransfer?.getData('text/plain');
    if (!payload) return;
    const [fromList, fromIndexStr, fromLocale] = payload.split(':');
    if (fromList !== list || fromLocale !== locale) return;
    const from = Number.parseInt(fromIndexStr, 10);
    if (Number.isNaN(from) || from === toIndex) return;
    const array = this.getArray(locale, list);
    this.moveFormArrayItem(array, from, toIndex);
    this.dragState.set(null);
  }

  endDrag(): void {
    this.dragState.set(null);
  }

  isFaIcon(value: string | null | undefined): boolean {
    return !!value && /^fa[a-z-]*-/.test(value.trim());
  }

  private createInitialStates(locales: Locale[]): Record<string, ContentFormState> {
    return locales.reduce((acc, locale) => {
      acc[locale] = this.createState(locale);
      return acc;
    }, {} as Record<string, ContentFormState>);
  }

  private createState(locale: Locale): ContentFormState {
    return {
      form: this.createContentForm(undefined, locale),
      loading: signal(false),
      saving: signal(false),
      error: signal(''),
      success: signal(''),
      loaded: signal(false),
    };
  }

  private ensureState(locale: Locale): ContentFormState {
    if (!this.contentStates[locale]) {
      this.contentStates[locale] = this.createState(locale);
    }
    return this.contentStates[locale];
  }

  private ensureToken(): string | null {
    const token = this.tokenForm.controls.adminToken.value.trim();
    if (!token) {
      this.tokenForm.markAllAsTouched();
      return null;
    }
    this.admin.setToken(token);
    return token;
  }

  private humanizeError(err: unknown): string {
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object' && 'message' in err && typeof (err as any).message === 'string') {
      return (err as any).message;
    }
    return 'Request failed. Check token and try again.';
  }

  private leadSortValue(lead: Lead, key: LeadSortKey): string {
    if (key === 'createdAt' || key === 'exportedAt') {
      return (lead[key] as string | null | undefined) ?? '';
    }
    return (lead[key] as string | null | undefined)?.toLowerCase() ?? '';
  }

  private createContentForm(content?: LandingContent, locale: Locale = 'en'): ContentFormGroup {
    const form = this.fb.nonNullable.group({
      active: [content?.active ?? true],
      locale: [locale, Validators.required],
      hero: this.fb.nonNullable.group({
        title: [content?.hero?.title ?? ''],
        subtitle: [content?.hero?.subtitle ?? ''],
        priceNote: [content?.hero?.priceNote ?? ''],
        badge: [content?.hero?.badge ?? ''],
        bullets: this.createStringArray(content?.hero?.bullets),
        primaryCta: [content?.hero?.primaryCta ?? ''],
        telegramLabel: [content?.hero?.telegramLabel ?? ''],
        emailLabel: [content?.hero?.emailLabel ?? ''],
        telegramUrl: [content?.hero?.telegramUrl ?? ''],
        email: [content?.hero?.email ?? ''],
      }),
      painPoints: this.createPainPoints(content?.painPoints),
      features: this.createFeatures(content?.features),
      comparison: this.fb.nonNullable.group({
        highlight: [content?.comparison?.highlight ?? ''],
        sysadmin: this.fb.nonNullable.group({
          title: [content?.comparison?.sysadmin?.title ?? ''],
          description: [content?.comparison?.sysadmin?.description ?? ''],
          price: [content?.comparison?.sysadmin?.price ?? ''],
        }),
        vezha: this.fb.nonNullable.group({
          title: [content?.comparison?.vezha?.title ?? ''],
          description: [content?.comparison?.vezha?.description ?? ''],
          price: [content?.comparison?.vezha?.price ?? ''],
          badge: [content?.comparison?.vezha?.badge ?? ''],
        }),
      }),
      metrics: this.fb.nonNullable.group({
        note: [content?.metrics?.note ?? ''],
        stats: this.createStats(content?.metrics?.stats),
      }),
      howItWorks: this.createHowItWorks(content?.howItWorks),
      contact: this.fb.nonNullable.group({
        title: [content?.contact?.title ?? ''],
        subtitle: [content?.contact?.subtitle ?? ''],
        thankYou: [content?.contact?.thankYou ?? ''],
        telegramLabel: [content?.contact?.telegramLabel ?? ''],
        telegramUrl: [content?.contact?.telegramUrl ?? ''],
        emailLabel: [content?.contact?.emailLabel ?? ''],
        email: [content?.contact?.email ?? ''],
        form: this.fb.nonNullable.group({
          nameLabel: [content?.contact?.form?.nameLabel ?? ''],
          emailLabel: [content?.contact?.form?.emailLabel ?? ''],
          phoneLabel: [content?.contact?.form?.phoneLabel ?? ''],
          messageLabel: [content?.contact?.form?.messageLabel ?? ''],
          submitLabel: [content?.contact?.form?.submitLabel ?? ''],
          errors: this.fb.nonNullable.group({
            requiredEmail: [content?.contact?.form?.errors?.requiredEmail ?? ''],
            invalidEmail: [content?.contact?.form?.errors?.invalidEmail ?? ''],
          }),
        }),
      }),
      seo: this.fb.nonNullable.group({
        title: [content?.seo?.title ?? ''],
        description: [content?.seo?.description ?? ''],
      }),
    });
    return form;
  }

  private createStringArray(values?: string[] | null): FormArray<FormControl<string>> {
    const arr = this.fb.array<FormControl<string>>([]);
    const source = values && values.length ? values : [''];
    source.forEach((value) => arr.push(this.fb.nonNullable.control(value ?? '')));
    return arr;
  }

  private createPainPoint(value?: { title?: string; description?: string; icon?: string }) {
    return this.fb.nonNullable.group({
      title: [value?.title ?? ''],
      description: [value?.description ?? ''],
      icon: [value?.icon ?? ''],
    });
  }

  private createPainPoints(values?: Array<{ title: string; description: string; icon: string }> | null) {
    const arr = this.fb.array<FormGroup<{ title: FormControl<string>; description: FormControl<string>; icon: FormControl<string> }>>([]);
    const source = values && values.length ? values : [undefined];
    source.forEach((value) => arr.push(this.createPainPoint(value)));
    return arr;
  }

  private createFeature(value?: { title?: string; description?: string; icon?: string }) {
    return this.fb.nonNullable.group({
      title: [value?.title ?? ''],
      description: [value?.description ?? ''],
      icon: [value?.icon ?? ''],
    });
  }

  private createFeatures(values?: Array<{ title: string; description: string; icon: string }> | null) {
    const arr = this.fb.array<FormGroup<{ title: FormControl<string>; description: FormControl<string>; icon: FormControl<string> }>>([]);
    const source = values && values.length ? values : [undefined];
    source.forEach((value) => arr.push(this.createFeature(value)));
    return arr;
  }

  private createStat(value?: { label?: string; value?: string }) {
    return this.fb.nonNullable.group({
      label: [value?.label ?? ''],
      value: [value?.value ?? ''],
    });
  }

  private createStats(values?: Array<{ label: string; value: string }> | null) {
    const arr = this.fb.array<FormGroup<{ label: FormControl<string>; value: FormControl<string> }>>([]);
    const source = values && values.length ? values : [undefined];
    source.forEach((value) => arr.push(this.createStat(value)));
    return arr;
  }

  private createHowItWorksStep(value?: { title?: string; description?: string }) {
    return this.fb.nonNullable.group({
      title: [value?.title ?? ''],
      description: [value?.description ?? ''],
    });
  }

  private createHowItWorks(values?: Array<{ title: string; description: string }> | null) {
    const arr = this.fb.array<FormGroup<{ title: FormControl<string>; description: FormControl<string> }>>([]);
    const source = values && values.length ? values : [undefined];
    source.forEach((value) => arr.push(this.createHowItWorksStep(value)));
    return arr;
  }

  private toLandingContent(form: ContentFormGroup, locale: Locale): LandingContent {
    const hero = form.controls.hero.controls;
    const comparison = form.controls.comparison.controls;
    const metrics = form.controls.metrics.controls;
    const contact = form.controls.contact.controls;
    return {
      active: form.controls.active.value ?? true,
      locale,
      hero: {
        title: hero.title.value.trim(),
        subtitle: hero.subtitle.value.trim(),
        priceNote: hero.priceNote.value.trim(),
        badge: hero.badge.value.trim(),
        bullets: hero.bullets.controls
          .map((control) => control.value.trim())
          .filter((value) => value.length > 0),
        primaryCta: hero.primaryCta.value.trim(),
        telegramLabel: hero.telegramLabel.value.trim(),
        emailLabel: hero.emailLabel.value.trim(),
        telegramUrl: hero.telegramUrl.value.trim(),
        email: hero.email.value.trim(),
      },
      painPoints: form.controls.painPoints.controls
        .map((group) => ({
          title: group.controls.title.value.trim(),
          description: group.controls.description.value.trim(),
          icon: group.controls.icon.value.trim(),
        }))
        .filter((item) => item.title || item.description || item.icon),
      features: form.controls.features.controls
        .map((group) => ({
          title: group.controls.title.value.trim(),
          description: group.controls.description.value.trim(),
          icon: group.controls.icon.value.trim(),
        }))
        .filter((item) => item.title || item.description || item.icon),
      comparison: {
        highlight: comparison.highlight.value.trim(),
        sysadmin: {
          title: comparison.sysadmin.controls.title.value.trim(),
          description: comparison.sysadmin.controls.description.value.trim(),
          price: comparison.sysadmin.controls.price.value.trim(),
        },
        vezha: {
          title: comparison.vezha.controls.title.value.trim(),
          description: comparison.vezha.controls.description.value.trim(),
          price: comparison.vezha.controls.price.value.trim(),
          badge: comparison.vezha.controls.badge.value.trim(),
        },
      },
      metrics: {
        note: metrics.note.value.trim(),
        stats: metrics.stats.controls
          .map((group) => ({
            label: group.controls.label.value.trim(),
            value: group.controls.value.value.trim(),
          }))
          .filter((item) => item.label || item.value),
      },
      howItWorks: form.controls.howItWorks.controls
        .map((group) => ({
          title: group.controls.title.value.trim(),
          description: group.controls.description.value.trim(),
        }))
        .filter((item) => item.title || item.description),
      contact: {
        title: contact.title.value.trim(),
        subtitle: contact.subtitle.value.trim(),
        thankYou: contact.thankYou.value.trim(),
        telegramLabel: contact.telegramLabel.value.trim(),
        telegramUrl: contact.telegramUrl.value.trim(),
        emailLabel: contact.emailLabel.value.trim(),
        email: contact.email.value.trim(),
        form: {
          nameLabel: contact.form.controls.nameLabel.value.trim(),
          emailLabel: contact.form.controls.emailLabel.value.trim(),
          phoneLabel: contact.form.controls.phoneLabel.value.trim(),
          messageLabel: contact.form.controls.messageLabel.value.trim(),
          submitLabel: contact.form.controls.submitLabel.value.trim(),
          errors: {
            requiredEmail: contact.form.controls.errors.controls.requiredEmail.value.trim(),
            invalidEmail: contact.form.controls.errors.controls.invalidEmail.value.trim(),
          },
        },
      },
      seo: {
        title: form.controls.seo.controls.title.value.trim(),
        description: form.controls.seo.controls.description.value.trim(),
      },
    };
  }

  private moveFormArrayItem(array: FormArray<AbstractControl>, from: number, to: number): void {
    if (from === to) return;
    const control = array.at(from);
    if (!control) return;
    array.removeAt(from);
    const targetIndex = to >= array.length ? array.length : to;
    array.insert(targetIndex, control);
  }

  private getArray(locale: Locale, list: DragList): FormArray<AbstractControl> {
    const form = this.ensureState(locale).form.controls;
    switch (list) {
      case 'heroBullets':
        return form.hero.controls.bullets as unknown as FormArray<AbstractControl>;
      case 'painPoints':
        return form.painPoints as unknown as FormArray<AbstractControl>;
      case 'features':
        return form.features as unknown as FormArray<AbstractControl>;
      case 'metricsStats':
        return form.metrics.controls.stats as unknown as FormArray<AbstractControl>;
      case 'howItWorks':
        return form.howItWorks as unknown as FormArray<AbstractControl>;
    }
  }

  private heroBullets(locale: Locale): FormArray<FormControl<string>> {
    return this.ensureState(locale).form.controls.hero.controls.bullets;
  }

  private painPoints(locale: Locale) {
    return this.ensureState(locale).form.controls.painPoints;
  }

  private features(locale: Locale) {
    return this.ensureState(locale).form.controls.features;
  }

  private metricsStats(locale: Locale) {
    return this.ensureState(locale).form.controls.metrics.controls.stats;
  }

  private howItWorks(locale: Locale) {
    return this.ensureState(locale).form.controls.howItWorks;
  }

  private createDragImage(): HTMLElement {
    const ghost = document.createElement('div');
    ghost.style.width = '1px';
    ghost.style.height = '1px';
    ghost.style.opacity = '0';
    document.body.appendChild(ghost);
    setTimeout(() => ghost.remove(), 0);
    return ghost;
  }
}
