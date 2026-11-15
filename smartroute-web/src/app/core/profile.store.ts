import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { Profile, ProfileRequest } from './models';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly _profile = signal<Profile | null>(null);
  readonly profile = computed(() => this._profile());
  private loadedFor: number | null = null;

  private key(): string | null {
    const u = this.auth.user();
    return u ? `sr.profile.${u.id}` : null;
  }

  ensureLoaded(): Observable<boolean> {
    const u = this.auth.user();
    const key = this.key();
    if (!u || !key) return of(false);
    if (this.loadedFor === u.id && this._profile()) return of(true);

    const id = Number(localStorage.getItem(key));
    if (!id) return of(false);
    return this.api.getProfile(id).pipe(
      tap((p) => { this._profile.set(p); this.loadedFor = u.id; }),
      map(() => true),
      catchError(() => { localStorage.removeItem(key); this._profile.set(null); return of(false); }),
    );
  }

  save(req: ProfileRequest): Observable<Profile> {
    const key = this.key();
    const current = this._profile();
    const call = current ? this.api.updateProfile(current.id, req) : this.api.createProfile(req);
    return call.pipe(
      tap((p) => {
        this._profile.set(p);
        this.loadedFor = this.auth.user()?.id ?? null;
        if (key) localStorage.setItem(key, String(p.id));
      }),
    );
  }

  clear() { this._profile.set(null); this.loadedFor = null; }
}
