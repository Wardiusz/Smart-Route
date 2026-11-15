import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';

export type ThemePref = 'dark' | 'light' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly mq = matchMedia('(prefers-color-scheme: light)');

  readonly preference = signal<ThemePref>((localStorage.getItem('sr.theme') as ThemePref) || 'system');
  private readonly systemLight = signal(this.mq.matches);
  readonly theme = computed<'dark' | 'light'>(() => {
    const p = this.preference();
    return p === 'system' ? (this.systemLight() ? 'light' : 'dark') : p;
  });

  constructor() {
    this.mq.addEventListener('change', (e) => this.systemLight.set(e.matches));
    effect(() => {
      this.doc.documentElement.setAttribute('data-theme', this.theme());
      localStorage.setItem('sr.theme', this.preference());
    });
  }

  set(p: ThemePref) { this.preference.set(p); }
  toggle() { this.preference.set(this.theme() === 'dark' ? 'light' : 'dark'); }
}
