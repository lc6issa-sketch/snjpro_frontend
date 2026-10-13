import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { Icon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Logo } from '../logo/logo';
import { nombre } from '../../shared/utils/format';
import { ShellService } from '../../core/services/shell.service';

interface Lien { libelle: string; icone: string; lien: string; module?: string; badge?: string; alerte?: boolean; }
/** Entrée de premier niveau : un lien direct, ou un groupe dépliable de liens. */
interface Entree { libelle: string; icone: string; lien?: string; module?: string; badge?: string; alerte?: boolean; enfants?: Lien[]; }

const MENU: Entree[] = [
  { libelle: 'Tableau de bord', icone: 'layout-grid', lien: '/tableau-de-bord' },
  { libelle: 'Membres', icone: 'users', lien: '/membres', module: 'MEMBRES', badge: 'membres' },
  { libelle: 'Cohortes', icone: 'layers', lien: '/cohortes', module: 'COHORTES' },
  { libelle: 'Compétences', icone: 'award', lien: '/competences', module: 'COMPETENCES' },
  { libelle: 'Mobilisation', icone: 'megaphone', lien: '/mobilisations', module: 'MOBILISATION', badge: 'mobilisation' },
  { libelle: 'Activités & présences', icone: 'calendar', lien: '/activites', module: 'ACTIVITES' },
  { libelle: 'Communication', icone: 'send', enfants: [
    { libelle: 'Notifications', icone: 'bell', lien: '/notifications', module: 'NOTIFICATIONS' },
    { libelle: 'Actualités', icone: 'newspaper', lien: '/actualites', module: 'ACTUALITES' },
    { libelle: 'Opportunités', icone: 'briefcase', lien: '/opportunites', module: 'OPPORTUNITES' },
    { libelle: 'Souvenirs', icone: 'image', lien: '/souvenirs', module: 'SOUVENIRS', badge: 'souvenirs' }
  ] },
  { libelle: 'Documents & demandes', icone: 'folder', enfants: [
    { libelle: 'Documents', icone: 'book-open', lien: '/documents', module: 'DOCUMENTS' },
    { libelle: 'Demandes', icone: 'file-text', lien: '/demandes', module: 'DEMANDES', badge: 'demandes' }
  ] },
  { libelle: 'Données', icone: 'bar-chart', enfants: [
    { libelle: 'Import & doublons', icone: 'upload', lien: '/import', module: 'IMPORT', badge: 'import', alerte: true },
    { libelle: 'Historique', icone: 'history', lien: '/historique', module: 'HISTORIQUE' }
  ] },
  { libelle: 'Administration', icone: 'shield-check', enfants: [
    { libelle: 'Utilisateurs & rôles', icone: 'shield-check', lien: '/utilisateurs', module: 'UTILISATEURS' },
    { libelle: 'Paramètres', icone: 'sliders', lien: '/parametres' }
  ] }
];

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, Icon, Avatar, Logo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  protected readonly auth = inject(AuthService);
  protected readonly shell = inject(ShellService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), map(() => this.router.url)),
    { initialValue: this.router.url });

  /** Menu filtré selon les droits ; un groupe réduit à un seul lien est affiché comme un lien simple. */
  protected readonly menu = computed(() => {
    this.auth.permissions();
    const visible = (e: { module?: string }) => !e.module || this.auth.peutVoir(e.module);
    return MENU.flatMap<Entree>(e => {
      if (!e.enfants) return visible(e) ? [e] : [];
      const enfants = e.enfants.filter(visible);
      return enfants.length === 0 ? [] : enfants.length === 1 ? [enfants[0]] : [{ ...e, enfants }];
    });
  });

  private readonly ouverts = signal<ReadonlySet<string>>(new Set());

  constructor() {
    // Le groupe qui contient la page courante s'ouvre automatiquement
    effect(() => {
      const groupe = this.menu().find(e => this.groupeActif(e));
      if (groupe) this.ouverts.update(s => s.has(groupe.libelle) ? s : new Set(s).add(groupe.libelle));
    });
  }

  protected estActif(lien: string): boolean {
    const url = this.url().split(/[?#]/)[0];
    return url === lien || url.startsWith(lien + '/');
  }

  protected groupeActif(e: Entree): boolean {
    return !!e.enfants?.some(l => this.estActif(l.lien));
  }

  protected estOuvert(e: Entree): boolean {
    return this.ouverts().has(e.libelle);
  }

  protected cliquerGroupe(e: Entree): void {
    this.ouverts.update(s => {
      const n = new Set(s);
      if (!n.delete(e.libelle)) n.add(e.libelle);
      return n;
    });
  }

  protected compte(cle: string): number { return this.shell.badges()[cle] ?? 0; }
  protected texte(cle: string): string { return nombre(this.compte(cle)); }
  protected texteNombre(n: number): string { return nombre(n); }
  protected totalBadges(e: Entree): number { return e.enfants?.reduce((t, l) => t + (l.badge ? this.compte(l.badge) : 0), 0) ?? 0; }
  protected alerteGroupe(e: Entree): boolean { return !!e.enfants?.some(l => l.alerte && l.badge && this.compte(l.badge)); }
}
