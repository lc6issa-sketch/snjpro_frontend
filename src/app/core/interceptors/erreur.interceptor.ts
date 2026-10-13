import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environments } from '../../../environments/environments';
import { AuthService } from '../services/auth.service';

/** Parcours d'authentification publics : une erreur 401 y signifie « identifiants incorrects », pas « session expirée ». */
const ROUTES_PUBLIQUES = ['/auth/login', '/auth/mot-de-passe-oublie', '/auth/reinitialiser', '/auth/activation', '/auth/invitation'];

/** Gère l'expiration de session : sur 401, la session locale est effacée et l'utilisateur renvoyé vers la connexion. */
export const erreurInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((erreur: unknown) => {
      if (req.url.startsWith(environments.apiUrl) && erreur instanceof HttpErrorResponse && erreur.status === 401) {
        const publique = ROUTES_PUBLIQUES.some(r => req.url.startsWith(environments.apiUrl + r));
        if (!publique && auth.connecte()) {
          auth.effacer();
          router.navigate(['/connexion'], { queryParams: { expire: 1 } });
        }
      }
      return throwError(() => erreur);
    })
  );
};
