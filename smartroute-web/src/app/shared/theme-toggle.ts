import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemePref, ThemeService } from '../core/theme.service';
import { Icon } from './icon';

@Component({
  selector: 'app-theme-toggle',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="seg" role="radiogroup" aria-label="Motyw">
      @for (o of options; track o.value) {
        <button type="button" role="radio" [attr.aria-checked]="theme.preference() === o.value"
                [class.on]="theme.preference() === o.value" [title]="o.label" (click)="theme.set(o.value)">
          <app-icon [name]="o.icon" [size]="16" />
        </button>
      }
    </div>`,
  styles: `
    .seg { display: inline-flex; padding: 3px; gap: 2px; border-radius: 12px; background: var(--input); border: 1px solid var(--border); }
    button { width: 32px; height: 28px; border: 0; border-radius: 9px; background: transparent; color: var(--text-3);
             display: grid; place-items: center; transition: background .2s, color .2s; }
    button:hover { color: var(--text); }
    button.on { background: var(--card-hover); color: var(--accent); box-shadow: var(--shadow-sm); }
  `,
})
export class ThemeToggle {
  protected readonly theme = inject(ThemeService);
  protected readonly options: { value: ThemePref; icon: string; label: string }[] = [
    { value: 'light', icon: 'sun', label: 'Jasny' },
    { value: 'dark', icon: 'moon', label: 'Ciemny' },
    { value: 'system', icon: 'monitor', label: 'Systemowy' },
  ];
}
