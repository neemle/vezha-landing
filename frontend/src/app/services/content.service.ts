import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LandingContent } from '../models/landing-content.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly apiBase = this.resolveApiBase();

  constructor(private readonly http: HttpClient) {}

  getContent(lang: string): Observable<LandingContent> {
    return this.http.get<LandingContent>(`${this.apiBase}/content`, {
      params: { lang },
    });
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
