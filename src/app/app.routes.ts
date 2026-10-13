import { Routes } from '@angular/router';
import { authGuard, invitesGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { RoleEnum } from './models/api.models';
import { MainLayout } from './layout/main-layout/main-layout';
import { AuthLayout } from './layout/auth-layout/auth-layout';

// Rôles autorisés sur les écrans de saisie (transmis au roleGuard via data.roles)
const GESTION_MEMBRES: RoleEnum[] = ['ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_COHORTE'];
const GESTION_MOBILISATIONS: RoleEnum[] = ['ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_REGIONAL', 'ROLE_RESPONSABLE_COHORTE'];
const REDACTEURS_ACTUALITES: RoleEnum[] = ['ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_DIRECTION'];
const GESTION_OPPORTUNITES: RoleEnum[] = ['ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_PARTENAIRE'];

export const routes: Routes = [
  // Redirection de la racine avant le bloc AuthLayout (path ''), sinon celui-ci capture « / » et s'affiche sans formulaire
  { path: '', pathMatch: 'full', redirectTo: 'actualites' },

  // =========================================================================
  // ROUTES PUBLIQUES (écrans web 01 à 04)
  // =========================================================================
  {
    path: '',
    component: AuthLayout,
    children: [
      {
        path: 'connexion',
        canActivate: [invitesGuard],
        title: 'Connexion · SNJPro',
        loadComponent: () => import('./pages/auth/connexion/connexion').then(m => m.Connexion),
      },
      {
        path: 'verification',
        title: 'Vérification · SNJPro',
        loadComponent: () => import('./pages/auth/verification/verification').then(m => m.Verification),
      },
      {
        path: 'mot-de-passe-oublie',
        title: 'Mot de passe oublié · SNJPro',
        loadComponent: () => import('./pages/auth/mot-de-passe-oublie/mot-de-passe-oublie').then(m => m.MotDePasseOublie),
      },
      {
        path: 'reinitialiser-mot-de-passe',
        title: 'Nouveau mot de passe · SNJPro',
        loadComponent: () => import('./pages/auth/nouveau-mot-de-passe/nouveau-mot-de-passe').then(m => m.NouveauMotDePasse),
      },
      {
        path: 'invitation',
        title: 'Activer mon compte · SNJPro',
        loadComponent: () => import('./pages/auth/nouveau-mot-de-passe/nouveau-mot-de-passe').then(m => m.NouveauMotDePasse),
      },
    ],
  },
  {
    path: 'acces-refuse',
    title: 'Accès non autorisé · SNJPro',
    loadComponent: () => import('./pages/acces-refuse/acces-refuse').then(m => m.AccesRefuse),
  },
  {
    path: 'activites/:id/projection',
    canActivate: [authGuard],
    title: 'Projection · SNJPro',
    loadComponent: () => import('./pages/activites/projection/projection').then(m => m.Projection),
  },

  // =========================================================================
  // ESPACE DE GESTION
  // =========================================================================
  {
    path: '',
    component: MainLayout,
    canActivate: [authGuard],
    children: [
      // ----- Actualités -----
      {
        path: 'actualites',
        title: 'Actualités · SNJPro',
        loadComponent: () => import('./pages/actualites/liste/actualites-liste').then(m => m.ActualitesListe),
      },
      {
        path: 'actualites/nouvelle',
        title: 'Nouvelle actualité · SNJPro',
        canActivate: [roleGuard],
        data: { roles: REDACTEURS_ACTUALITES },
        loadComponent: () => import('./pages/actualites/editeur/editeur-actualite').then(m => m.EditeurActualite),
      },
      {
        path: 'actualites/:id',
        title: 'Actualité · SNJPro',
        canActivate: [roleGuard],
        data: { roles: REDACTEURS_ACTUALITES },
        loadComponent: () => import('./pages/actualites/editeur/editeur-actualite').then(m => m.EditeurActualite),
      },

      // ----- Utilisateurs & rôles -----
      {
        path: 'utilisateurs',
        title: 'Utilisateurs & rôles · SNJPro',
        loadComponent: () => import('./pages/utilisateurs/utilisateurs').then(m => m.Utilisateurs),
      },
      {
        path: 'parametres',
        title: 'Paramètres · SNJPro',
        loadComponent: () => import('./pages/parametres/parametres').then(m => m.Parametres),
      },

      // ----- Compétences -----
      {
        path: 'competences',
        title: 'Compétences · SNJPro',
        loadComponent: () => import('./pages/competences/competences').then(m => m.Competences),
      },

      // ----- Import & doublons -----
      {
        path: 'import',
        title: 'Import de données · SNJPro',
        loadComponent: () => import('./pages/import/import').then(m => m.Import),
      },

      // ----- Historique -----
      {
        path: 'historique',
        title: 'Historique · SNJPro',
        loadComponent: () => import('./pages/historique/historique').then(m => m.HistoriqueOperations),
      },

      // ----- Notifications & alertes -----
      {
        path: 'notifications',
        title: 'Notifications · SNJPro',
        loadComponent: () => import('./pages/notifications/nouvelle/nouvelle-notification').then(m => m.NouvelleNotification),
      },
      {
        path: 'notifications/historique',
        title: 'Historique des envois · SNJPro',
        loadComponent: () => import('./pages/notifications/historique/historique-envois').then(m => m.HistoriqueEnvois),
      },

      // ----- Demandes des membres -----
      {
        path: 'demandes',
        title: 'Demandes · SNJPro',
        loadComponent: () => import('./pages/demandes/demandes').then(m => m.Demandes),
      },

      // ----- Activités & présences -----
      {
        path: 'activites',
        title: 'Activités & présences · SNJPro',
        loadComponent: () => import('./pages/activites/activites').then(m => m.Activites),
      },

      // ----- Messagerie -----
      {
        path: 'messagerie',
        title: 'Messagerie · SNJPro',
        loadComponent: () => import('./pages/messagerie/messagerie').then(m => m.Messagerie),
      },

      // ----- Tableau de bord -----
      {
        path: 'tableau-de-bord',
        title: 'Tableau de bord · SNJPro',
        loadComponent: () => import('./pages/tableau-de-bord/tableau-de-bord').then(m => m.TableauDeBord),
      },

      // ----- Membres -----
      {
        path: 'membres',
        title: 'Membres · SNJPro',
        loadComponent: () => import('./pages/membres/liste/membres-liste').then(m => m.MembresListe),
      },
      {
        path: 'membres/nouveau',
        title: 'Nouveau membre · SNJPro',
        canActivate: [roleGuard],
        data: { roles: GESTION_MEMBRES },
        loadComponent: () => import('./pages/membres/nouveau/nouveau-membre').then(m => m.NouveauMembre),
      },
    ],
  },

  // Redirection par défaut si la route n'existe pas
  { path: '**', redirectTo: 'actualites' },
];
