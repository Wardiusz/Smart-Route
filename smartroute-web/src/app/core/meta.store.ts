import { Injectable, inject, signal } from '@angular/core';
import { ApiService, errorMessage } from './api.service';
import { Meta } from './models';

@Injectable({ providedIn: 'root' })
export class MetaStore {
  private readonly api = inject(ApiService);
  readonly meta = signal<Meta | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  load(force = false) {
    if (this.loading() || (this.meta() && !force)) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.meta().subscribe({
      next: (m) => { this.meta.set(m); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e, 'Nie udało się pobrać danych.')); this.loading.set(false); },
    });
  }
}
