import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type LeadPayload = {
  name?: string;
  email: string;
  phone?: string;
  message?: string;
  lang?: string;
  referrer?: string;
};

@Injectable({ providedIn: 'root' })
export class LeadService {
  private readonly apiBase = this.resolveApiBase();

  constructor(private readonly http: HttpClient) {}

  submitLead(payload: LeadPayload): Observable<unknown> {
    return this.http.post(`${this.apiBase}/leads`, payload);
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
