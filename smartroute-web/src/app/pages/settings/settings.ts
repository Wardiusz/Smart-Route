import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { errorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { ProfileRequest } from '../../core/models';
import { ProfileStore } from '../../core/profile.store';
import { ToastService } from '../../core/toast.service';
import { PageShell } from '../../shared/page-shell';
import { ProfileForm } from '../../shared/profile-form';
import { ThemeToggle } from '../../shared/theme-toggle';

@Component({
  selector: 'app-settings',
  imports: [PageShell, ProfileForm, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-page-shell>
      <h1>Preferencje</h1>
      <p class="lead">Zmiany wpłyną na kolejne rekomendacje tras.</p>

      <div class="grid">
        <section class="card">
          <h2>Styl podróży</h2>
          <app-profile-form [initial]="store.profile()" submitLabel="Zapisz zmiany" [saving]="saving()" [error]="error()" (save)="save($event)" />
        </section>
        <aside class="card side">
          <h2>Wygląd</h2>
          <p class="muted">Wybierz motyw interfejsu. „Systemowy” podąża za ustawieniem urządzenia.</p>
          <app-theme-toggle />
          <hr />
          <h2>Konto</h2>
          <p class="muted">{{ auth.user()?.email }}</p>
          <button class="btn" type="button" (click)="logout()">Wyloguj się</button>
        </aside>
      </div>
    </app-page-shell>`,
  styles: `
    h1 { font-size: 28px; letter-spacing: -.02em; } .lead { color: var(--text-2); margin: 6px 0 24px; }
    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 20px; align-items: start; }
    .card { padding: 26px; border-radius: var(--radius-lg); background: var(--panel); border: 1px solid var(--border); }
    h2 { font-size: 16px; margin-bottom: 16px; }
    .side { display: grid; gap: 12px; } .side h2 { margin: 0; }
    .muted { color: var(--text-2); font-size: 13px; } hr { border: 0; border-top: 1px solid var(--border); width: 100%; margin: 8px 0; }
    @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }
  `,
})
export class Settings {
  protected readonly store = inject(ProfileStore);
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected save(req: ProfileRequest) {
    this.saving.set(true);
    this.error.set(null);
    this.store.save(req).subscribe({
      next: () => { this.saving.set(false); this.toast.success('Preferencje zapisane.'); },
      error: (e) => { this.saving.set(false); this.error.set(errorMessage(e)); },
    });
  }
  protected logout() { this.store.clear(); this.auth.logout(); }
}
