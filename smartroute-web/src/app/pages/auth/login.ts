import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { errorMessage } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { Icon } from '../../shared/icon';
import { AuthShell } from './auth-shell';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink, AuthShell, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './auth-form.scss',
  template: `
    <app-auth-shell>
      <h1>Witaj ponownie</h1>
      <p class="lead">Zaloguj się, aby planować ciekawsze trasy.</p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        @if (error()) { <div class="alert" role="alert"><app-icon name="alert" [size]="16" /><span>{{ error() }}</span></div> }

        <div class="field">
          <label for="email">E-mail</label>
          <div class="input-wrap" [class.invalid]="invalid('email')">
            <span class="lead"><app-icon name="mail" [size]="17" /></span>
            <input id="email" type="email" formControlName="email" autocomplete="email" placeholder="ty@example.com" />
          </div>
          @if (invalid('email')) { <span class="field-error">Podaj poprawny adres e-mail.</span> }
        </div>

        <div class="field">
          <label for="password">Hasło</label>
          <div class="input-wrap" [class.invalid]="invalid('password')">
            <span class="lead"><app-icon name="lock" [size]="17" /></span>
            <input id="password" [type]="show() ? 'text' : 'password'" formControlName="password" autocomplete="current-password" placeholder="Twoje hasło" />
            <button type="button" class="eye" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Ukryj hasło' : 'Pokaż hasło'">
              <app-icon [name]="show() ? 'eye-off' : 'eye'" [size]="17" />
            </button>
          </div>
          @if (invalid('password')) { <span class="field-error">Wpisz hasło.</span> }
        </div>

        <button class="btn btn-primary btn-block" type="submit" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> Logowanie… } @else { Zaloguj się <app-icon name="arrow-right" [size]="17" /> }
        </button>
      </form>

      <p class="switch">Nie masz konta? <a routerLink="/register" [queryParams]="returnUrl ? { returnUrl } : null">Zarejestruj się</a></p>
    </app-auth-shell>`,
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly returnUrl = inject(ActivatedRoute).snapshot.queryParamMap.get('returnUrl');

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly show = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  protected invalid(name: 'email' | 'password') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email.trim(), password).subscribe({
      next: () => void this.router.navigateByUrl(this.returnUrl || '/explore'),
      error: (e) => { this.loading.set(false); this.error.set(errorMessage(e, 'Nie udało się zalogować.')); },
    });
  }
}
