import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateChildFn, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';

import { ADMIN_ROLES } from './auth.models';
import { AuthService } from './auth.service';

const loginRedirect = (state: RouterStateSnapshot) => {
  const router = inject(Router);
  return router.createUrlTree(['/auth/login'], {
    queryParams: {
      returnUrl: state.url
    }
  });
};

const adminRedirect = () => {
  const router = inject(Router);
  return router.createUrlTree(['/lab/dashboard'], {
    queryParams: {
      denied: 'admin'
    }
  });
};

export const authGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  return auth.ensureActiveSession() ? true : loginRedirect(state);
};

export const authChildGuard: CanActivateChildFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
  authGuard(route, state);

export const adminGuard: CanActivateFn = (_route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);

  if (!auth.ensureActiveSession()) {
    return loginRedirect(state);
  }

  return auth.hasAnyRole(ADMIN_ROLES) ? true : adminRedirect();
};

export const adminChildGuard: CanActivateChildFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) =>
  adminGuard(route, state);
