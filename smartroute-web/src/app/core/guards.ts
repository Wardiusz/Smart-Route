import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';
import { ProfileStore } from './profile.store';

export const authGuard: CanActivateFn = (_r, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? true : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn() ? router.createUrlTree(['/explore']) : true;
};

export const profileGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(ProfileStore).ensureLoaded().pipe(map((ok) => (ok ? true : router.createUrlTree(['/onboarding']))));
};
