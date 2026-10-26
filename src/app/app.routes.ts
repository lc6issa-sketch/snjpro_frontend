import { Routes } from '@angular/router';
import { authGuard, invitesGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { RoleEnum } from './models/api.models';
import { MainLayout } from './layout/main-layout/main-layout';
import { AuthLayout } from './layout/auth-layout/auth-layout';

// Rôles autorisés sur les écrans de saisie (transmis au roleGuard via data.roles)
const GESTION_MEMBRES: RoleEnum[] = ['ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_COHORTE'];
const GESTION_MOBILISATIONS: RoleEnum[] = ['ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_REGIONAL', 'ROLE_RESPONSABLE_COHORTE'];
// Responsables : actualités limitées à leur région ou à leur cohorte
const REDACTEURS_ACTUALITES: RoleEnum[] = ['ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_DIRECTION', 'ROLE_RESPONSABLE_REGIONAL', 'ROLE_RESPONSABLE_COHORTE'];
const GESTION_OPPORTUNITES: RoleEnum[] = ['ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_PARTENAIRE'];

export const routes: Routes = [
  // Redirection de la racine avant le bloc AuthLayout (path ''), sinon celui-ci capture « / » et s'affiche sans formulaire
  { path: '', pathMatch: 'full', redirectTo: 'tableau-de-bord' },

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
      {
        path: 'membres/:id',
        title: 'Profil du membre · SNJPro',
        loadComponent: () => import('./pages/membres/profil/profil-membre').then(m => m.ProfilMembre),
      },
      {
        path: 'membres/:id/modifier',
        title: 'Modifier le profil · SNJPro',
        canActivate: [roleGuard],
        data: { roles: GESTION_MEMBRES },
        loadComponent: () => import('./pages/membres/modifier/modifier-membre').then(m => m.ModifierMembre),
      },

      // ----- Cohortes & compétences -----
      {
        path: 'cohortes',
        title: 'Cohortes · SNJPro',
        loadComponent: () => import('./pages/cohortes/liste/cohortes-liste').then(m => m.CohortesListe),
      },
      {
        path: 'cohortes/:id',
        title: 'Cohorte · SNJPro',
        loadComponent: () => import('./pages/cohortes/detail/cohorte-detail').then(m => m.CohorteDetail),
      },
      {
        path: 'competences',
        title: 'Compétences · SNJPro',
        loadComponent: () => import('./pages/competences/competences').then(m => m.Competences),
      },

      // ----- Mobilisations -----
      {
        path: 'mobilisations',
        title: 'Mobilisation · SNJPro',
        loadComponent: () => import('./pages/mobilisations/liste/mobilisations-liste').then(m => m.MobilisationsListe),
      },
      {
        path: 'mobilisations/nouvelle',
        title: 'Nouvelle mobilisation · SNJPro',
        canActivate: [roleGuard],
        data: { roles: GESTION_MOBILISATIONS },
        loadComponent: () => import('./pages/mobilisations/assistant/mobilisation-assistant').then(m => m.MobilisationAssistant),
      },
      {
        path: 'mobilisations/:id/edition',
        title: 'Nouvelle mobilisation · SNJPro',
        canActivate: [roleGuard],
        data: { roles: GESTION_MOBILISATIONS },
        loadComponent: () => import('./pages/mobilisations/assistant/mobilisation-assistant').then(m => m.MobilisationAssistant),
      },
      {
        path: 'mobilisations/:id',
        title: 'Mobilisation · SNJPro',
        loadComponent: () => import('./pages/mobilisations/detail/mobilisation-detail').then(m => m.MobilisationDetail),
      },

      // ----- Notifications -----
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

      // ----- Opportunités -----
      {
        path: 'opportunites',
        title: 'Opportunités · SNJPro',
        loadComponent: () => import('./pages/opportunites/liste/opportunites-liste').then(m => m.OpportunitesListe),
      },
      {
        path: 'opportunites/nouvelle',
        title: 'Nouvelle opportunité · SNJPro',
        canActivate: [roleGuard],
        data: { roles: GESTION_OPPORTUNITES },
        loadComponent: () => import('./pages/opportunites/form/opportunite-form').then(m => m.OpportuniteForm),
      },
      {
        path: 'opportunites/:id/modifier',
        title: 'Modifier l\'opportunité · SNJPro',
        canActivate: [roleGuard],
        data: { roles: GESTION_OPPORTUNITES },
        loadComponent: () => import('./pages/opportunites/form/opportunite-form').then(m => m.OpportuniteForm),
      },
      {
        path: 'opportunites/:id',
        title: 'Opportunité · SNJPro',
        loadComponent: () => import('./pages/opportunites/detail/opportunite-detail').then(m => m.OpportuniteDetail),
      },

      // ----- Documents, demandes, souvenirs, activités -----
      {
        path: 'documents',
        title: 'Documents · SNJPro',
        loadComponent: () => import('./pages/documents/documents').then(m => m.Documents),
      },
      {
        path: 'demandes',
        title: 'Demandes · SNJPro',
        loadComponent: () => import('./pages/demandes/demandes').then(m => m.Demandes),
      },
      {
        path: 'souvenirs',
        title: 'Souvenirs de formation · SNJPro',
        loadComponent: () => import('./pages/souvenirs/souvenirs').then(m => m.Souvenirs),
      },
      {
        path: 'activites',
        title: 'Activités & présences · SNJPro',
        loadComponent: () => import('./pages/activites/activites').then(m => m.Activites),
      },

      // ----- Administration -----
      {
        path: 'import',
        title: 'Import de données · SNJPro',
        loadComponent: () => import('./pages/import/import').then(m => m.Import),
      },
      {
        path: 'historique',
        title: 'Historique · SNJPro',
        loadComponent: () => import('./pages/historique/historique').then(m => m.HistoriqueOperations),
      },
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
      {
        path: 'messagerie',
        title: 'Messagerie · SNJPro',
        loadComponent: () => import('./pages/messagerie/messagerie').then(m => m.Messagerie),
      },
    ],
  },

  // Redirection par défaut si la route n'existe pas
  { path: '**', redirectTo: 'tableau-de-bord' },
];
