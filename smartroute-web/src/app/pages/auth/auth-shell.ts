import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../shared/icon';
import { Logo } from '../../shared/logo';
import { ThemeToggle } from '../../shared/theme-toggle';

@Component({
  selector: 'app-auth-shell',
  imports: [Logo, ThemeToggle, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wrap">
      <section class="form-side">
        <header><app-logo [size]="40" /><app-theme-toggle /></header>
        <div class="card"><ng-content /></div>
        <footer>Trochę dłużej. Dużo bardziej niezapomniana.</footer>
      </section>

      <aside class="hero" aria-hidden="true">
        <svg class="topo" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
          @for (r of rings; track r) {
            <ellipse cx="420" cy="520" [attr.rx]="r * 1.5" [attr.ry]="r" fill="none" stroke="var(--border-strong)" stroke-width="1" [attr.opacity]="1 - r / 520" />
          }
          <ellipse cx="150" cy="140" rx="90" ry="50" fill="var(--accent-soft)" />
          <ellipse cx="500" cy="660" rx="120" ry="60" fill="var(--accent-soft)" />
          <path class="direct" d="M110 640 L 470 160" />
          <path class="glow" d="M110 640 C 150 520, 330 560, 300 420 S 300 260, 470 160" />
          <path class="line" d="M110 640 C 150 520, 330 560, 300 420 S 300 260, 470 160" />
          <g class="pin a"><circle cx="110" cy="640" r="13" /><text x="110" y="645" text-anchor="middle">A</text></g>
          <g class="pin s"><circle cx="228" cy="540" r="11" /><text x="228" y="545" text-anchor="middle">1</text></g>
          <g class="pin s"><circle cx="318" cy="400" r="11" /><text x="318" y="405" text-anchor="middle">2</text></g>
          <g class="pin b"><circle cx="470" cy="160" r="13" /><text x="470" y="165" text-anchor="middle">B</text></g>
        </svg>
        <div class="copy">
          <span class="chip"><app-icon name="sparkles" [size]="14" /> Dopasowane do Ciebie</span>
          <h2>Mniej pośpiechu.<br />Więcej odkryć.</h2>
          <p>SmartRoute znajduje ciekawsze drogi z punktu A do B – z widokami, historią i smakiem regionu po drodze.</p>
        </div>
      </aside>
    </div>`,
  styles: `
    .wrap { min-height: 100vh; display: grid; grid-template-columns: minmax(380px, 520px) 1fr; background: var(--bg); }
    .form-side { display: flex; flex-direction: column; padding: 24px 32px; background: var(--panel); border-right: 1px solid var(--border); }
    header { display: flex; align-items: center; justify-content: space-between; }
    .card { margin: auto 0; padding: 32px 0; width: 100%; max-width: 400px; align-self: center; }
    footer { color: var(--text-3); font-size: 12px; text-align: center; }
    .hero { position: relative; overflow: hidden; background:
              radial-gradient(900px 500px at 70% 20%, var(--accent-soft), transparent 60%), var(--bg-2); }
    .topo { position: absolute; inset: 0; width: 100%; height: 100%; }
    .direct { fill: none; stroke: var(--route-direct); stroke-width: 3; stroke-dasharray: 8 8; opacity: .7; }
    .glow { fill: none; stroke: var(--accent); stroke-width: 14; opacity: .22; filter: blur(6px); }
    .line { fill: none; stroke: var(--accent); stroke-width: 5; stroke-linecap: round; stroke-dasharray: 900; stroke-dashoffset: 900; animation: draw 3.2s var(--ease) .3s forwards; }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    .pin circle { stroke-width: 3; } .pin text { font-size: 12px; font-weight: 700; fill: #04222b; }
    .pin.a circle { fill: var(--lavender); stroke: var(--bg-2); }
    .pin.b circle { fill: var(--accent); stroke: var(--bg-2); }
    .pin.s circle { fill: var(--accent); stroke: var(--bg-2); filter: drop-shadow(0 0 8px var(--accent-glow)); }
    .copy { position: absolute; left: 48px; bottom: 56px; max-width: 420px; display: grid; gap: 14px; }
    .chip { display: inline-flex; align-items: center; gap: 6px; width: max-content; padding: 6px 12px; border-radius: 999px;
            background: var(--accent-soft); color: var(--accent); border: 1px solid var(--accent-border); font-size: 12px; font-weight: 600; }
    h2 { font-size: 40px; line-height: 1.1; letter-spacing: -.02em; }
    .copy p { color: var(--text-2); font-size: 15px; }
    @media (max-width: 900px) { .wrap { grid-template-columns: 1fr; } .hero { display: none; } .form-side { border: 0; padding: 20px; } }
  `,
})
export class AuthShell {
  protected readonly rings = [60, 110, 160, 210, 260, 310, 360, 410, 460];
}
