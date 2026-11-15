import { Routes } from '@angular/router';
import { authGuard, guestGuard, profileGuard } from './core/guards';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'explore' },
  { path: 'login', canActivate: [guestGuard], title: 'Logowanie · SmartRoute', loadComponent: () => import('./pages/auth/login').then((m) => m.Login) },
  { path: 'register', canActivate: [guestGuard], title: 'Rejestracja · SmartRoute', loadComponent: () => import('./pages/auth/register').then((m) => m.Register) },
  { path: 'onboarding', canActivate: [authGuard], title: 'Twoje preferencje · SmartRoute', loadComponent: () => import('./pages/onboarding/onboarding').then((m) => m.Onboarding) },
  { path: 'explore', canActivate: [authGuard, profileGuard], title: 'Odkrywaj · SmartRoute', loadComponent: () => import('./pages/explore/explore').then((m) => m.Explore) },
  { path: 'history', canActivate: [authGuard, profileGuard], title: 'Historia · SmartRoute', loadComponent: () => import('./pages/history/history').then((m) => m.History) },
  { path: 'settings', canActivate: [authGuard, profileGuard], title: 'Preferencje · SmartRoute', loadComponent: () => import('./pages/settings/settings').then((m) => m.Settings) },
  { path: '**', title: 'Nie znaleziono · SmartRoute', loadComponent: () => import('./pages/not-found').then((m) => m.NotFound) },
];
