import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FooterLinksResponse, PublicStaticPage } from '../models/static-page.model';

@Injectable({ providedIn: 'root' })
export class PagesService {
  private readonly apiBase = this.resolveApiBase();

  constructor(private readonly http: HttpClient) {}

  getFooterLinks(lang: string): Observable<FooterLinksResponse> {
    return this.http.get<FooterLinksResponse>(`${this.apiBase}/pages/footer`, { params: { lang } });
  }

  getPage(slug: string, lang: string): Observable<PublicStaticPage> {
    const safeSlug = encodeURIComponent(slug);
    return this.http.get<PublicStaticPage>(`${this.apiBase}/pages/${safeSlug}`, { params: { lang } });
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

