import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
  activeLang = signal<'en' | 'ua'>('en');
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

  switchLang(lang: 'en' | 'ua'): void {
    if (this.activeLang() === lang) return;
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

  private loadContent(lang: string): void {
    this.loading.set(true);
    this.error.set('');
    this.contentService
      .getContent(lang)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.content.set(data);
          this.seo.update(data.seo);
        },
        error: () => {
          this.error.set('Failed to load content. Please retry.');
        },
      });
  }
}
