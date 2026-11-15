import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { errorMessage } from '../../core/api.service';
import { ProfileStore } from '../../core/profile.store';
import { ToastService } from '../../core/toast.service';
import { Logo } from '../../shared/logo';
import { ProfileForm } from '../../shared/profile-form';
import { ProfileRequest } from '../../core/models';
import { ThemeToggle } from '../../shared/theme-toggle';

@Component({
  selector: 'app-onboarding',
  imports: [Logo, ProfileForm, ThemeToggle],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <header><app-logo [size]="38" /><app-theme-toggle /></header>
      <section class="card">
        <span class="step">Krok 1 z 1</span>
        <h1>Opowiedz nam o swoim stylu podróży</h1>
        <p class="lead">Na tej podstawie dobierzemy przystanki, które naprawdę Cię zainteresują. Zmienisz to w każdej chwili.</p>
        <app-profile-form submitLabel="Zapisz i zacznij odkrywać" [saving]="saving()" [error]="error()" (save)="save($event)" />
      </section>
    </main>`,
  styles: `
    main { min-height: 100vh; padding: 24px; display: grid; grid-template-rows: auto 1fr; justify-items: center;
           background: radial-gradient(900px 480px at 80% -10%, var(--accent-soft), transparent 60%), var(--bg); }
    header { width: min(100%, 1000px); display: flex; justify-content: space-between; align-items: center; }
    .card { width: min(100%, 600px); margin: 24px 0; padding: 32px; border-radius: var(--radius-lg); align-self: center;
            background: var(--panel); border: 1px solid var(--border); box-shadow: var(--shadow); }
    .step { font-size: 11px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--accent); }
    h1 { font-size: 26px; letter-spacing: -.02em; margin: 8px 0 6px; }
    .lead { color: var(--text-2); margin-bottom: 24px; }
    @media (max-width: 520px) { .card { padding: 22px; } }
  `,
})
export class Onboarding {
  private readonly store = inject(ProfileStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected save(req: ProfileRequest) {
    this.saving.set(true);
    this.error.set(null);
    this.store.save(req).subscribe({
      next: () => { this.toast.success('Profil zapisany. Czas na pierwszą trasę!'); void this.router.navigate(['/explore']); },
      error: (e) => { this.saving.set(false); this.error.set(errorMessage(e)); },
    });
  }
}
