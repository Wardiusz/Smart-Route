import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs';
import { errorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Icon } from '../../shared/icon';
import { AuthShell } from './auth-shell';

const match = (g: AbstractControl): ValidationErrors | null =>
  g.get('password')?.value === g.get('confirm')?.value ? null : { mismatch: true };

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthShell, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-form.scss',
  template: `
    <app-auth-shell>
      <h1>Załóż konto</h1>
      <p class="lead">Zapisuj preferencje i wracaj do swoich tras.</p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error()) { <div class="alert" role="alert"><app-icon name="alert" [size]="16" /><span>{{ error() }}</span></div> }

        <div class="field">
          <label for="email">E-mail</label>
          <div class="input-wrap" [class.invalid]="invalid('email')">
            <span class="lead"><app-icon name="mail" [size]="17" /></span>
            <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="ty@example.com" />
          </div>
          @if (invalid('email')) { <span class="field-error">Podaj poprawny adres e-mail (maks. 254 znaki).</span> }
        </div>

        <div class="field">
          <label for="password">Hasło</label>
          <div class="input-wrap" [class.invalid]="invalid('password')">
            <span class="lead"><app-icon name="lock" [size]="17" /></span>
            <input id="password" [type]="show() ? 'text' : 'password'" formControlName="password" autocomplete="new-password" placeholder="Min. 8 znaków" />
            <button type="button" class="eye" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Ukryj hasło' : 'Pokaż hasło'">
              <app-icon [name]="show() ? 'eye-off' : 'eye'" [size]="17" />
            </button>
          </div>
          <div class="meter" [attr.data-level]="strength().level" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <span class="hint">{{ strength().label }}</span>
          @if (invalid('password')) { <span class="field-error">Hasło musi mieć od 8 do 72 znaków.</span> }
        </div>

        <div class="field">
          <label for="confirm">Powtórz hasło</label>
          <div class="input-wrap" [class.invalid]="mismatch()">
            <span class="lead"><app-icon name="lock" [size]="17" /></span>
            <input id="confirm" [type]="show() ? 'text' : 'password'" formControlName="confirm" autocomplete="new-password" placeholder="Powtórz hasło" />
          </div>
          @if (mismatch()) { <span class="field-error">Hasła nie są takie same.</span> }
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Tworzenie konta… } @else { Utwórz konto <app-icon name="arrow-right" [size]="17" /> }
        </button>
      </form>

      <p class="switch">Masz już konto? <a routerLink="/login" [queryParams]="returnUrl ? { returnUrl } : null">Zaloguj się</a></p>
    </app-auth-shell>`,
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly show = signal(false);
  protected readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
      confirm: ['', [Validators.required]],
    },
    { validators: match },
  );

  private readonly pwd = toSignal(this.form.controls.password.valueChanges.pipe(startWith(''), map((v) => v ?? '')), { initialValue: '' });
  protected readonly strength = computed(() => {
    const p = this.pwd();
    if (!p) return { level: 0, label: 'Użyj co najmniej 8 znaków.' };
    let s = 0;
    if (p.length >= 8) s++;
    if (p.length >= 12) s++;
    if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
    if (/\d/.test(p) && /[^A-Za-z0-9]/.test(p)) s++;
    const labels = ['Za słabe', 'Słabe', 'Średnie', 'Dobre', 'Mocne'];
    return { level: Math.max(1, s), label: labels[Math.max(1, s)] ?? labels[4] };
  });

  protected invalid(name: 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }
  protected mismatch() {
    const c = this.form.controls.confirm;
    return this.form.hasError('mismatch') && (c.touched || c.dirty);
  }

  protected submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.register(email.trim(), password).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl || '/explore'),
      error: (e) => { this.loading.set(false); this.error.set(errorMessage(e, 'Nie udało się utworzyć konta.')); },
    });
  }
}
