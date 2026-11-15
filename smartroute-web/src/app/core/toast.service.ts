import { Injectable, signal } from '@angular/core';

export interface Toast { id: number; text: string; kind: 'info' | 'success' | 'error'; }

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private n = 0;

  show(text: string, kind: Toast['kind'] = 'info', ms = 3600) {
    const t = { id: ++this.n, text, kind };
    this.toasts.update((l) => [...l, t]);
    setTimeout(() => this.dismiss(t.id), ms);
  }
  success(text: string) { this.show(text, 'success'); }
  error(text: string) { this.show(text, 'error', 5200); }
  dismiss(id: number) { this.toasts.update((l) => l.filter((t) => t.id !== id)); }
}
