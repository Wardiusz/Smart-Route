import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { AuthResponse, User } from './models';

const K_ACCESS = 'sr.access';
const K_REFRESH = 'sr.refresh';
const K_USER = 'sr.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _user = signal<User | null>(this.read<User>(K_USER));
  readonly user = computed(() => this._user());
  readonly isLoggedIn = computed(() => this._user() !== null && !!this.refreshToken());

  private refreshing$: Observable<string> | null = null;

  get accessToken(): string | null { return localStorage.getItem(K_ACCESS); }
  refreshToken(): string | null { return localStorage.getItem(K_REFRESH); }

  login(email: string, password: string) {
    return this.api.login(email, password).pipe(tap((r) => this.store(r)));
  }
  register(email: string, password: string) {
    return this.api.register(email, password).pipe(tap((r) => this.store(r)));
  }

  logout(redirect = true): void {
    localStorage.removeItem(K_ACCESS);
    localStorage.removeItem(K_REFRESH);
    localStorage.removeItem(K_USER);
    this._user.set(null);
    if (redirect) void this.router.navigate(['/login']);
  }

  refresh(): Observable<string> {
    const rt = this.refreshToken();
    if (!rt) return throwError(() => new Error('no-refresh-token'));
    if (!this.refreshing$) {
      this.refreshing$ = this.api.refresh(rt).pipe(
        tap((r) => this.store(r)),
        map((r) => r.accessToken),
        finalize(() => (this.refreshing$ = null)),
        shareReplay(1),
      );
    }
    return this.refreshing$;
  }

  restoreSession(): Observable<boolean> {
    if (!this.refreshToken()) {
      this.logout(false);
      return of(false);
    }
    return this.api.me().pipe(
      map((u) => { this._user.set(u); localStorage.setItem(K_USER, JSON.stringify(u)); return true; }),
      catchError(() =>
        this.refresh().pipe(
          map(() => true),
          catchError(() => { this.logout(false); return of(false); }),
        ),
      ),
    );
  }

  private store(r: AuthResponse): void {
    localStorage.setItem(K_ACCESS, r.accessToken);
    localStorage.setItem(K_REFRESH, r.refreshToken);
    localStorage.setItem(K_USER, JSON.stringify(r.user));
    this._user.set(r.user);
  }

  private read<T>(key: string): T | null {
    try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
  }
}
