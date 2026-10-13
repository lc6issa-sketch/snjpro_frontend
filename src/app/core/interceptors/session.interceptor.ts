import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environments } from '../../../environments/environments';
import { AuthService } from '../services/auth.service';

/** Ajoute le jeton JWT de la session à tous les appels vers le backend. */
export const sessionInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;
  if (!token || !req.url.startsWith(environments.apiUrl)) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
