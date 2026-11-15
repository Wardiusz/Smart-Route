import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Logo } from './logo';

@Component({
  selector: 'app-splash',
  imports: [Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="splash" role="status" aria-live="polite" aria-label="Ładowanie aplikacji">
      <div class="glow"></div>
      <app-logo [size]="64" [text]="false" class="logo" />
      <h1>SmartRoute</h1>
      <svg class="path" viewBox="0 0 240 60" aria-hidden="true">
        <path class="base" d="M10 40 C 60 40, 70 12, 120 22 S 190 50, 230 18" />
        <path class="draw" d="M10 40 C 60 40, 70 12, 120 22 S 190 50, 230 18" />
        <circle cx="10" cy="40" r="6" class="a" /><circle cx="230" cy="18" r="6" class="b" />
        <circle cx="120" cy="22" r="4" class="s" />
      </svg>
      <p>{{ message() }}</p>
    </div>`,
  styles: `
    .splash { position: fixed; inset: 0; z-index: 9000; display: grid; place-content: center; justify-items: center; gap: 14px;
              background: var(--bg); text-align: center; }
    .glow { position: absolute; width: 520px; height: 520px; border-radius: 50%; filter: blur(60px); opacity: .5;
            background: radial-gradient(circle, var(--accent-soft), transparent 65%); animation: pulse 3s ease-in-out infinite; }
    .logo { animation: float 2.6s ease-in-out infinite; position: relative; }
    h1 { font-size: 26px; font-weight: 600; letter-spacing: -.02em; position: relative; }
    p { color: var(--text-2); position: relative; }
    .path { width: 240px; height: 60px; position: relative; overflow: visible; }
    .base { fill: none; stroke: var(--border-strong); stroke-width: 3; stroke-dasharray: 3 7; stroke-linecap: round; }
    .draw { fill: none; stroke: var(--accent); stroke-width: 4; stroke-linecap: round; stroke-dasharray: 340; stroke-dashoffset: 340;
            filter: drop-shadow(0 0 6px var(--accent-glow)); animation: draw 2.2s var(--ease) infinite; }
    .a { fill: var(--lavender); } .b { fill: var(--accent); } .s { fill: var(--bg); stroke: var(--accent); stroke-width: 2.5; }
    @keyframes draw { 0% { stroke-dashoffset: 340; } 70%, 100% { stroke-dashoffset: 0; } }
    @keyframes float { 50% { transform: translateY(-6px); } }
    @keyframes pulse { 50% { opacity: .8; transform: scale(1.08); } }
  `,
})
export class Splash { readonly message = input('Przygotowujemy Twoją podróż…'); }
