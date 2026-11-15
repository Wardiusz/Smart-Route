import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService, errorMessage } from '../../core/api.service';
import { formatKm, formatMinutes } from '../../core/format';
import { Decision, Trip } from '../../core/models';
import { encodePlace } from '../../core/place';
import { ProfileStore } from '../../core/profile.store';
import { Icon, MODE_ICON } from '../../shared/icon';
import { PageShell } from '../../shared/page-shell';

const LABEL: Record<Decision, string> = { PENDING: 'Bez decyzji', ALTERNATIVE: 'Wybrano alternatywę', DIRECT: 'Wybrano standardową' };

@Component({
  selector: 'app-history',
  imports: [PageShell, Icon, RouterLink, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-shell>
      <h1>Historia podróży</h1>
      <p class="lead">Ostatnie zaplanowane trasy. Twoje wybory pomagają nam lepiej dobierać kolejne propozycje.</p>

      @if (loading()) {
        <div class="list">@for (n of [1, 2, 3]; track n) { <div class="skeleton sk"></div> }</div>
      } @else if (error()) {
        <div class="alert" role="alert"><app-icon name="wifi-off" [size]="16" />
          <span>{{ error() }} <a href="#" (click)="$event.preventDefault(); load()">Spróbuj ponownie</a></span></div>
      } @else if (!trips().length) {
        <div class="empty">
          <app-icon name="route" [size]="30" />
          <h2>Jeszcze nic tu nie ma</h2>
          <p>Zaplanuj pierwszą trasę, a pojawi się w tym miejscu.</p>
          <a class="btn btn-primary" routerLink="/explore">Planuj trasę</a>
        </div>
      } @else {
        <ul class="list">
          @for (t of trips(); track t.id) {
            <li class="item">
              <div class="route">
                <span class="mi"><app-icon [name]="modeIcon[t.mode]" [size]="18" /></span>
                <div class="names"><b>{{ t.origin.name }}</b><app-icon name="arrow-right" [size]="14" /><b>{{ t.destination.name }}</b></div>
                <span class="when">{{ t.createdAt | date: 'd MMM y, HH:mm' }}</span>
              </div>
              <div class="stats">
                <span>Standardowa <b>{{ fmt(t.direct.totalMinutes) }}</b> · {{ km(t.direct.distanceKm) }}</span>
                @if (t.alternative; as a) {
                  <span class="alt">Alternatywa <b>{{ fmt(a.route.totalMinutes) }}</b> · {{ km(a.route.distanceKm) }} · {{ a.stops.length }} przyst.</span>
                } @else { <span class="muted">Brak alternatywy</span> }
              </div>
              <div class="foot">
                <span class="badge" [class]="t.decision.toLowerCase()">{{ label[t.decision] }}</span>
                <a class="again" routerLink="/explore" [queryParams]="{ from: encode(t.origin), to: encode(t.destination) }">Zaplanuj ponownie <app-icon name="arrow-right" [size]="14" /></a>
              </div>
            </li>
          }
        </ul>
      }
    </app-page-shell>`,
  styles: `
    h1 { font-size: 28px; letter-spacing: -.02em; } .lead { color: var(--text-2); margin: 6px 0 24px; }
    .list { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; } .sk { height: 112px; border-radius: var(--radius); }
    .item { padding: 18px 20px; border-radius: var(--radius); background: var(--panel); border: 1px solid var(--border); display: grid; gap: 12px; transition: border-color .2s; }
    .item:hover { border-color: var(--border-strong); }
    .route { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .mi { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; color: var(--accent); background: var(--accent-soft); }
    .names { display: flex; align-items: center; gap: 8px; font-size: 16px; } .names app-icon { color: var(--text-3); }
    .when { margin-left: auto; color: var(--text-3); font-size: 12px; }
    .stats { display: flex; gap: 20px; flex-wrap: wrap; color: var(--text-2); font-size: 13px; } .stats b { color: var(--text); } .stats .alt b { color: var(--accent); } .muted { color: var(--text-3); }
    .foot { display: flex; align-items: center; justify-content: space-between; }
    .badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 999px; background: var(--card); color: var(--text-2); border: 1px solid var(--border); }
    .badge.alternative { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-border); }
    .again { display: inline-flex; gap: 6px; align-items: center; font-size: 13px; font-weight: 500; }
    .empty { display: grid; justify-items: center; gap: 8px; text-align: center; padding: 64px 20px; border-radius: var(--radius-lg); border: 1px dashed var(--border-strong); color: var(--text-2); }
    .empty app-icon { color: var(--accent); } .empty h2 { color: var(--text); font-size: 18px; } .empty .btn { margin-top: 10px; } .empty .btn:hover { text-decoration: none; }
  `,
})
export class History {
  private readonly api = inject(ApiService);
  private readonly profile = inject(ProfileStore);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly trips = signal<Trip[]>([]);
  protected readonly label = LABEL;
  protected readonly modeIcon = MODE_ICON;
  protected readonly fmt = formatMinutes;
  protected readonly km = formatKm;
  protected readonly encode = encodePlace;
  protected readonly count = computed(() => this.trips().length);

  constructor() { this.load(); }

  protected load() {
    const id = this.profile.profile()?.id;
    if (!id) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.history(id).subscribe({
      next: (t) => { this.trips.set(t); this.loading.set(false); },
      error: (e) => { this.error.set(errorMessage(e)); this.loading.set(false); },
    });
  }
}
