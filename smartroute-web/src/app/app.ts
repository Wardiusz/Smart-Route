import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router, RouterOutlet } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { AuthService } from './core/auth.service';
import { ThemeService } from './core/theme.service';
import { Splash } from './shared/splash';
import { Toasts } from './shared/toasts';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Splash, Toasts],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (booting()) {
      <app-splash />
    } @else {
      @if (navigating()) { <div class="bar" role="progressbar" aria-label="Ładowanie strony"></div> }
      <router-outlet />
    }
    <app-toasts />`,
  styles: `
    .bar { position: fixed; top: 0; left: 0; height: 3px; width: 100%; z-index: 8000; background: var(--grad);
           transform-origin: left; animation: load 1.1s var(--ease) infinite; }
    @keyframes load { 0% { transform: scaleX(0); } 70% { transform: scaleX(.85); } 100% { transform: scaleX(1); opacity: 0; } }
  `,
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly booting = signal(true);
  protected readonly navigating = signal(false);

  constructor() {
    inject(ThemeService);
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) this.navigating.set(true);
      else if (e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError) this.navigating.set(false);
    });
    forkJoin([this.auth.restoreSession(), timer(1000)]).subscribe(() => {
      this.booting.set(false);
      void this.router.initialNavigation();
    });
  }
}
