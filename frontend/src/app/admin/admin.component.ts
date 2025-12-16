import { CommonModule } from '@angular/common';
import { Component, OnInit, WritableSignal, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { LandingContent } from '../models/landing-content.model';
import { Lead } from '../models/lead.model';
import { AdminService, LeadExportFilter } from '../services/admin.service';

type Locale = 'en' | 'ua';

type ContentFormGroup = FormGroup<{
  contentJson: FormControl<string>;
}>;

type ContentFormState = {
  form: ContentFormGroup;
  loading: WritableSignal<boolean>;
  saving: WritableSignal<boolean>;
  error: WritableSignal<string>;
  success: WritableSignal<string>;
};

type LeadSortKey = 'createdAt' | 'email' | 'name' | 'exportedAt';

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

  readonly locales: Locale[] = ['en', 'ua'];

  readonly tokenForm = this.fb.nonNullable.group({
    adminToken: [this.admin.token() ?? '', Validators.required],
  });

  readonly contentStates: Record<Locale, ContentFormState> = this.locales.reduce((acc, locale) => {
    acc[locale] = {
      form: this.fb.nonNullable.group({
        contentJson: ['', Validators.required],
      }) as ContentFormGroup,
      loading: signal(false),
      saving: signal(false),
      error: signal(''),
      success: signal(''),
    };
    return acc;
  }, {} as Record<Locale, ContentFormState>);

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
    this.locales.forEach((locale) => this.loadLocale(locale));
    this.loadLeads();
  }

  saveToken(): void {
    const token = this.tokenForm.controls.adminToken.value.trim();
    this.admin.setToken(token);
  }

  loadLocale(locale: Locale): void {
    const state = this.contentStates[locale];
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
          state.form.setValue({ contentJson: JSON.stringify(content, null, 2) });
          state.success.set('Loaded latest content.');
        },
        error: (err) => state.error.set(this.humanizeError(err)),
      });
  }

  saveLocale(locale: Locale): void {
    const state = this.contentStates[locale];
    state.error.set('');
    state.success.set('');

    const token = this.ensureToken();
    if (!token) {
      state.error.set('Admin token is required to save content.');
      return;
    }

    const raw = state.form.controls.contentJson.value.trim();
    if (!raw) {
      state.error.set('Content JSON cannot be empty.');
      return;
    }

    let payload: LandingContent;
    try {
      payload = JSON.parse(raw) as LandingContent;
    } catch (parseError) {
      state.error.set('Content must be valid JSON.');
      return;
    }

    const normalized: LandingContent = { ...payload, locale };

    state.saving.set(true);
    this.admin
      .updateContent(locale, normalized)
      .pipe(finalize(() => state.saving.set(false)))
      .subscribe({
        next: () => state.success.set('Content saved.'),
        error: (err) => state.error.set(this.humanizeError(err)),
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
}
