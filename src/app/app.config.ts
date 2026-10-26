import { ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { routes } from './app.routes';
import { erreurInterceptor } from './core/interceptors/erreur.interceptor';
import { sessionInterceptor } from './core/interceptors/session.interceptor';
import { ApparenceService } from './core/services/apparence.service';
import { ThemeService } from './core/services/theme.service';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding(), withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideHttpClient(withFetch(), withInterceptors([erreurInterceptor, sessionInterceptor])),
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    // Logo et charte graphique choisis par l'administrateur
    provideAppInitializer(() => inject(ApparenceService).initialiser()),
    // Mode clair / sombre choisi par l'utilisateur (ou celui du poste)
    provideAppInitializer(() => inject(ThemeService).initialiser())
  ]
};
