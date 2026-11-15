import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../shared/logo';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <app-logo [size]="44" />
      <p class="code">404</p>
      <h1>Zgubiliśmy trasę</h1>
      <p class="sub">Tej strony nie ma na mapie. Wróć na znany szlak.</p>
      <a class="btn btn-primary" routerLink="/explore">Wróć do planowania</a>
    </main>`,
  styles: `
    main { min-height: 100vh; display: grid; place-content: center; justify-items: center; gap: 12px; text-align: center; padding: 24px; }
    .code { font-size: 84px; font-weight: 700; line-height: 1; margin-top: 18px;
            background: var(--grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
    h1 { font-size: 24px; } .sub { color: var(--text-2); margin-bottom: 10px; }
    .btn:hover { text-decoration: none; }
  `,
})
export class NotFound {}
