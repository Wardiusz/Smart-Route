import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from './icon';
import { Logo } from './logo';
import { UserMenu } from './user-menu';

@Component({
  selector: 'app-page-shell',
  imports: [RouterLink, RouterLinkActive, Logo, UserMenu, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bar">
      <a routerLink="/explore" class="brand"><app-logo [size]="36" /></a>
      <nav>
        <a routerLink="/explore" routerLinkActive="on"><app-icon name="route" [size]="16" /><span>Planuj</span></a>
        <a routerLink="/history" routerLinkActive="on"><app-icon name="history" [size]="16" /><span>Historia</span></a>
        <a routerLink="/settings" routerLinkActive="on"><app-icon name="sliders" [size]="16" /><span>Preferencje</span></a>
      </nav>
      <app-user-menu />
    </div>
    <main><ng-content /></main>`,
  styles: `
    :host { display: block; min-height: 100vh; background: radial-gradient(900px 400px at 85% -10%, var(--accent-soft), transparent 60%), var(--bg); }
    .bar { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 24px; padding: 12px 24px;
           background: var(--glass); backdrop-filter: blur(14px); border-bottom: 1px solid var(--border); }
    .brand:hover { text-decoration: none; }
    nav { display: flex; gap: 4px; flex: 1; }
    nav a { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 10px; color: var(--text-2); font-weight: 500; }
    nav a:hover { background: var(--card); color: var(--text); text-decoration: none; }
    nav a.on { background: var(--accent-soft); color: var(--accent); }
    main { width: min(100%, 1040px); margin: 0 auto; padding: 32px 24px 64px; }
    @media (max-width: 640px) { nav span { display: none; } .bar { gap: 8px; padding: 10px 14px; } }
  `,
})
export class PageShell {}
