import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { Icon } from './icon';

@Component({
  selector: 'app-toasts',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="stack" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class]="t.kind" role="status">
          <app-icon [name]="t.kind === 'error' ? 'alert' : t.kind === 'success' ? 'check' : 'info'" [size]="16" />
          <span>{{ t.text }}</span>
          <button type="button" aria-label="Zamknij" (click)="toast.dismiss(t.id)"><app-icon name="x" [size]="14" /></button>
        </div>
      }
    </div>`,
  styles: `
    .stack { position: fixed; z-index: 5000; bottom: 20px; left: 50%; transform: translateX(-50%); display: grid; gap: 8px; width: min(92vw, 420px); }
    .toast { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--radius); background: var(--panel);
             border: 1px solid var(--border-strong); box-shadow: var(--shadow); animation: in .25s var(--ease); }
    .toast span { flex: 1; }
    .toast.success { border-color: var(--accent-border); } .toast.success app-icon { color: var(--accent); }
    .toast.error { border-color: var(--danger); } .toast.error app-icon { color: var(--danger); }
    button { background: none; border: 0; color: var(--text-3); display: grid; }
    @keyframes in { from { opacity: 0; transform: translateY(8px); } }
  `,
})
export class Toasts { protected readonly toast = inject(ToastService); }
