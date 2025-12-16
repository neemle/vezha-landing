import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(private readonly title: Title, private readonly meta: Meta) {}

  update(config: { title: string; description: string }): void {
    this.title.setTitle(config.title);
    this.meta.updateTag({ name: 'description', content: config.description });
  }
}
