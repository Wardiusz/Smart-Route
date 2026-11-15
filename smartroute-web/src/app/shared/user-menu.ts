import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ProfileStore } from '../core/profile.store';
import { Icon } from './icon';
import { ThemeToggle } from './theme-toggle';

@Component({
  selector: 'app-user-menu',
  imports: [Icon, RouterLink, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="avatar" type="button" aria-haspopup="menu" [attr.aria-expanded]="open()" (click)="open.set(!open())">
      {{ initial() }}
    </button>
    @if (open()) {
      <div class="menu" role="menu">
        <div class="who">
          <strong>{{ store.profile()?.name || 'Podróżnik' }}</strong>
          <span>{{ auth.user()?.email }}</span>
        </div>
        <a role="menuitem" routerLink="/explore" (click)="open.set(false)"><app-icon name="route" [size]="16" />Planuj trasę</a>
        <a role="menuitem" routerLink="/history" (click)="open.set(false)"><app-icon name="history" [size]="16" />Historia podróży</a>
        <a role="menuitem" routerLink="/settings" (click)="open.set(false)"><app-icon name="sliders" [size]="16" />Preferencje</a>
        <div class="row"><span>Motyw</span><app-theme-toggle /></div>
        <button role="menuitem" type="button" class="out" (click)="logout()"><app-icon name="logout" [size]="16" />Wyloguj się</button>
      </div>
    }`,
  styles: `
    :host { position: relative; display: inline-block; }
    .avatar { width: 40px; height: 40px; border-radius: 12px; border: 1px solid var(--border-strong); background: var(--glass);
              backdrop-filter: blur(10px); font-weight: 700; color: var(--accent); text-transform: uppercase; }
    .avatar:hover { border-color: var(--accent-border); }
    .menu { position: absolute; right: 0; top: 48px; width: 260px; padding: 8px; z-index: 2000; border-radius: var(--radius);
            background: var(--panel); border: 1px solid var(--border-strong); box-shadow: var(--shadow); display: grid; gap: 2px; }
    .who { display: grid; padding: 8px 10px 10px; border-bottom: 1px solid var(--border); margin-bottom: 4px; }
    .who span { color: var(--text-3); font-size: 12px; overflow: hidden; text-overflow: ellipsis; }
    a, .out { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 10px; color: var(--text);
              background: none; border: 0; text-align: left; width: 100%; }
    a:hover, .out:hover { background: var(--card); text-decoration: none; }
    .row { display: flex; align-items: center; justify-content: space-between; padding: 6px 10px; color: var(--text-2); }
    .out { color: var(--danger); }
  `,
})
export class UserMenu {
  protected readonly auth = inject(AuthService);
  protected readonly store = inject(ProfileStore);
  private readonly el = inject(ElementRef<HTMLElement>);
  protected readonly open = signal(false);

  protected initial() {
    return (this.store.profile()?.name || this.auth.user()?.email || '?').charAt(0);
  }
  protected logout() { this.open.set(false); this.store.clear(); this.auth.logout(); }

  @HostListener('document:click', ['$event'])
  onDoc(e: Event) { if (this.open() && !this.el.nativeElement.contains(e.target)) this.open.set(false); }
  @HostListener('document:keydown.escape')
  onEsc() { this.open.set(false); }
}
