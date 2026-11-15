import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const PUBLIC_AUTH = ['/auth/login', '/auth/register', '/auth/refresh'];

function withToken(req: HttpRequest<unknown>, token: string | null) {
  return token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  if (PUBLIC_AUTH.some((p) => req.url.includes(p))) return next(req);

  return next(withToken(req, auth.accessToken)).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && auth.refreshToken()) {
        return auth.refresh().pipe(
          switchMap((token) => next(withToken(req, token))),
          catchError((e) => { auth.logout(); return throwError(() => e); }),
        );
      }
      return throwError(() => err);
    }),
  );
};
