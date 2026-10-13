import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Espace de gestion : utilisateur connecté et rôle autre que « membre » (les membres utilisent l'application mobile). */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.connecte()) return router.createUrlTree(['/connexion'], { queryParams: { retour: state.url } });
  if (auth.aRole('ROLE_MEMBRE')) return router.createUrlTree(['/acces-refuse'], { queryParams: { raison: 'membre' } });
  return true;
};

/** Pages de connexion : inutile d'y revenir si l'on est déjà connecté. */
export const invitesGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.connecte() && !auth.aRole('ROLE_MEMBRE')) return router.createUrlTree(['/tableau-de-bord']);
  return true;
};
