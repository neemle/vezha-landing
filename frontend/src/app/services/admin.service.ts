import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { LandingContent } from '../models/landing-content.model';
import { Lead } from '../models/lead.model';
import { AdminPageCategory, AdminStaticPage, AdminStaticPageListItem } from '../models/admin-pages.model';

export type LeadExportFilter = 'all' | 'exported' | 'unexported';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly tokenSignal = signal<string | null>(this.readStoredToken());
  private readonly apiBase = this.resolveApiBase();

  token(): string | null {
    return this.tokenSignal();
  }

  setToken(token: string | null): void {
    const normalized = token?.trim() || null;
    this.tokenSignal.set(normalized);
    if (typeof window !== 'undefined' && window.localStorage) {
      if (normalized) {
        window.localStorage.setItem('adminToken', normalized);
      } else {
        window.localStorage.removeItem('adminToken');
      }
    }
  }

  getContent(locale: string): Observable<LandingContent> {
    const headers = this.requireAuthHeaders();
    return this.http.get<LandingContent>(`${this.apiBase}/admin/content`, {
      params: { locale },
      headers,
    });
  }

  updateContent(locale: string, content: LandingContent): Observable<LandingContent> {
    const headers = this.requireAuthHeaders();
    return this.http.put<LandingContent>(`${this.apiBase}/admin/content`, { locale, content }, { headers });
  }

  listLeads(options: { exported?: LeadExportFilter; includeBad?: boolean; search?: string } = {}): Observable<Lead[]> {
    const headers = this.requireAuthHeaders();
    let params = new HttpParams();
    if (options.exported) params = params.set('exported', options.exported);
    if (options.includeBad !== undefined) params = params.set('includeBad', String(options.includeBad));
    if (options.search) params = params.set('search', options.search);
    return this.http.get<Lead[]>(`${this.apiBase}/admin/leads`, { headers, params });
  }

  setLeadBad(id: number, bad: boolean): Observable<Lead> {
    const headers = this.requireAuthHeaders();
    return this.http.patch<Lead>(`${this.apiBase}/admin/leads/${id}/bad`, { bad }, { headers });
  }

  exportLeads(): Observable<string> {
    const headers = this.requireAuthHeaders().set('Accept', 'text/csv');
    return this.http.get(`${this.apiBase}/admin/leads/export`, {
      headers,
      responseType: 'text',
    });
  }

  listPageCategories(locale: string): Observable<AdminPageCategory[]> {
    const headers = this.requireAuthHeaders();
    return this.http.get<AdminPageCategory[]>(`${this.apiBase}/admin/page-categories`, { headers, params: { locale } });
  }

  createPageCategory(payload: { code: string; title: string; active?: boolean }): Observable<AdminPageCategory> {
    const headers = this.requireAuthHeaders();
    return this.http.post<AdminPageCategory>(`${this.apiBase}/admin/page-categories`, payload, { headers });
  }

  updatePageCategory(id: number, payload: { active?: boolean }, locale: string): Observable<AdminPageCategory> {
    const headers = this.requireAuthHeaders();
    return this.http.patch<AdminPageCategory>(`${this.apiBase}/admin/page-categories/${id}`, payload, {
      headers,
      params: { locale },
    });
  }

  upsertPageCategoryTranslation(
    id: number,
    payload: { locale: string; title: string },
    responseLocale: string,
  ): Observable<AdminPageCategory> {
    const headers = this.requireAuthHeaders();
    return this.http.put<AdminPageCategory>(`${this.apiBase}/admin/page-categories/${id}/translations`, payload, {
      headers,
      params: { locale: responseLocale },
    });
  }

  listPages(locale: string): Observable<AdminStaticPageListItem[]> {
    const headers = this.requireAuthHeaders();
    return this.http.get<AdminStaticPageListItem[]>(`${this.apiBase}/admin/pages`, { headers, params: { locale } });
  }

  getPage(id: number, locale: string): Observable<AdminStaticPage> {
    const headers = this.requireAuthHeaders();
    return this.http.get<AdminStaticPage>(`${this.apiBase}/admin/pages/${id}`, { headers, params: { locale } });
  }

  createPage(payload: {
    slug: string;
    categoryId: number;
    published?: boolean;
    title: string;
    content: string;
  }): Observable<AdminStaticPage> {
    const headers = this.requireAuthHeaders();
    return this.http.post<AdminStaticPage>(`${this.apiBase}/admin/pages`, payload, { headers });
  }

  updatePage(id: number, payload: { slug?: string; categoryId?: number; published?: boolean }, locale: string): Observable<AdminStaticPage> {
    const headers = this.requireAuthHeaders();
    return this.http.patch<AdminStaticPage>(`${this.apiBase}/admin/pages/${id}`, payload, { headers, params: { locale } });
  }

  upsertPageTranslation(
    id: number,
    payload: { locale: string; title: string; content: string },
  ): Observable<AdminStaticPage> {
    const headers = this.requireAuthHeaders();
    return this.http.put<AdminStaticPage>(`${this.apiBase}/admin/pages/${id}/translations`, payload, { headers });
  }

  private requireAuthHeaders(): HttpHeaders {
    const token = this.tokenSignal();
    if (!token) {
      throw new Error('Admin token is required');
    }
    return token ? new HttpHeaders({ 'x-admin-token': token }) : new HttpHeaders();
  }

  private readStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem('adminToken');
    } catch {
      return null;
    }
  }

  private resolveApiBase(): string {
    if (typeof window === 'undefined') {
      return '/api';
    }
    const origin = window.location.origin;
    if (origin.includes('localhost:4200')) {
      return 'http://localhost:3000/api';
    }
    return '/api';
  }
}
