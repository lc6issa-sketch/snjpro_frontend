import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleEnum } from '../../models/api.models';

/** Restreint une route aux rôles listés dans ses données : `data: { roles: ['ROLE_ADMIN_SYSTEME', ...] }`. */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const rolesAttendus: RoleEnum[] = route.data['roles'] ?? [];

  if (auth.aRole(...rolesAttendus)) return true;
  return router.createUrlTree(['/acces-refuse']);
};
