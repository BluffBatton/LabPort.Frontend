import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { SKIP_AUTH } from './auth-http-context';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);

  if (request.context.get(SKIP_AUTH)) {
    return next(request);
  }

  const accessToken = auth.accessToken();
  const authenticatedRequest = accessToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`
        }
      })
    : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || !accessToken) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        switchMap(() => {
          const refreshedToken = auth.accessToken();

          if (!refreshedToken) {
            auth.logout();
            return throwError(() => error);
          }

          return next(
            request.clone({
              setHeaders: {
                Authorization: `Bearer ${refreshedToken}`
              }
            })
          );
        }),
        catchError((refreshError: unknown) => {
          auth.logout();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
