import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * L'application est réservée aux utilisateurs connectés (jeton stocké dans le navigateur) :
 * le rendu se fait côté client, le serveur ne fournit que la coquille HTML.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client
  }
];
