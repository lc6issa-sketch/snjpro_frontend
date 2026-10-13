import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { CohorteService } from '../../core/services/cohorte.service';
import { ReferentielService } from '../../core/services/referentiel.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CohorteDTO, InvitationDTO, RoleDTOs, RoleEnum, UserResponseDTO } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Modal } from '../../shared/components/modal/modal';
import { DateCourtePipe, RelatifPipe } from '../../shared/pipes/format.pipes';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { LIBELLES_ROLES } from '../../shared/utils/libelles';
import { messageErreur } from '../../shared/utils/http';
import { ConfirmationService } from '../../core/services/confirmation.service';

const STYLE_ROLE: Record<string, { teinte: string; pill: string; icone: string }> = {
  ROLE_ADMIN_SYSTEME: { teinte: 'tone-violet', pill: 'violet', icone: 'shield-check' },
  ROLE_ADMIN_SNJ: { teinte: 'tone-blue', pill: 'blue', icone: 'users' },
  ROLE_DIRECTION: { teinte: 'tone-green', pill: 'dark', icone: 'bar-chart' },
  ROLE_RESPONSABLE_REGIONAL: { teinte: 'tone-teal', pill: 'teal', icone: 'map-pin' },
  ROLE_RESPONSABLE_COHORTE: { teinte: 'tone-gold', pill: 'gold', icone: 'layers' },
  ROLE_PARTENAIRE: { teinte: 'tone-grey', pill: 'grey', icone: 'briefcase' }
};
const ROLES_INVITABLES: { cle: RoleEnum; detail: string }[] = [
  { cle: 'ROLE_ADMIN_SNJ', detail: 'Gère les membres, cohortes et imports' },
  { cle: 'ROLE_RESPONSABLE_REGIONAL', detail: 'Membres et mobilisations de sa région' },
  { cle: 'ROLE_RESPONSABLE_COHORTE', detail: 'Suivi des membres d\'une cohorte' },
  { cle: 'ROLE_DIRECTION', detail: 'Tableau de bord, statistiques et rapports' },
  { cle: 'ROLE_PARTENAIRE', detail: 'Publication et suivi des opportunités' },
  { cle: 'ROLE_ADMIN_SYSTEME', detail: 'Accès complet, y compris les comptes et les rôles' }
];

/** Écrans web 61 (Utilisateurs), 62 (Rôles & permissions), 63 (Inviter) et 64 (Modifier un utilisateur). */
@Component({
  selector: 'app-utilisateurs',
  imports: [FormsModule, Icon, Avatar, Modal, DateCourtePipe, RelatifPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './utilisateurs.html',
  styleUrl: './utilisateurs.css'
})
export class Utilisateurs implements OnInit {
  private readonly service = inject(UtilisateurService);
  private readonly cohorteService = inject(CohorteService);
  private readonly referentiel = inject(ReferentielService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  protected readonly auth = inject(AuthService);

  protected readonly rolesInvitables = ROLES_INVITABLES;
  protected readonly onglet = signal<'utilisateurs' | 'roles'>('utilisateurs');
  protected readonly utilisateurs = signal<UserResponseDTO[]>([]);
  protected readonly roles = signal<RoleDTOs.Role[]>([]);
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly regions = signal<string[]>([]);
  protected readonly recherche = signal('');
  protected readonly filtreRole = signal<RoleEnum | ''>('');
  protected readonly roleSelectionne = signal<RoleEnum>('ROLE_RESPONSABLE_REGIONAL');
  protected readonly permissions = signal<RoleDTOs.Permission[]>([]);
  protected readonly invitation = signal(false);
  protected readonly edition = signal<UserResponseDTO | null>(null);
  protected readonly envoi = signal(false);
  protected readonly nouveauMdp = signal<string | null>(null);

  protected invite: InvitationDTO = { role: 'ROLE_ADMIN_SNJ' };
  protected modif: { role?: RoleEnum; region?: string; cohorteId?: number; actif?: boolean } = {};

  protected readonly estAdmin = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME'));
  protected readonly filtres = computed(() => {
    const q = this.recherche().trim().toLowerCase(), r = this.filtreRole();
    return this.utilisateurs().filter(u => u.role !== 'ROLE_MEMBRE' && (!r || u.role === r) && (!q || `${u.prenom} ${u.nom} ${u.email} ${u.username}`.toLowerCase().includes(q)));
  });
  protected readonly comptes = computed(() => this.utilisateurs().filter(u => u.role !== 'ROLE_MEMBRE'));
  protected readonly invitationsEnAttente = computed(() => this.comptes().filter(u => u.invitationEnAttente).length);
  protected readonly roleCourant = computed(() => this.roles().find(r => r.role === this.roleSelectionne()) ?? null);
  protected readonly rolesAffiches = computed(() => this.roles().filter(r => r.role !== 'ROLE_MEMBRE'));

  ngOnInit(): void {
    this.charger();
    this.service.roles().subscribe(r => this.roles.set(r));
    this.cohorteService.lister().subscribe(c => this.cohortes.set(c));
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
    this.chargerPermissions();
  }

  protected libelle(r?: RoleEnum | string): string { return LIBELLES_ROLES[r as RoleEnum] ?? r ?? ''; }
  protected libelleRoleLong(r?: RoleEnum | string): string {
    return ({ ROLE_RESPONSABLE_REGIONAL: 'Responsable régional', ROLE_RESPONSABLE_COHORTE: 'Responsable de cohorte' } as Record<string, string>)[r ?? ''] ?? this.libelle(r);
  }
  protected style(r?: string) { return STYLE_ROLE[r ?? ''] ?? STYLE_ROLE['ROLE_PARTENAIRE']; }
  protected perimetre(u: UserResponseDTO): string {
    if (u.role === 'ROLE_RESPONSABLE_REGIONAL') return u.region ?? '—';
    if (u.role === 'ROLE_RESPONSABLE_COHORTE') return this.cohortes().find(c => c.id === u.cohorteId)?.nom ?? '—';
    return 'National';
  }

  // ------------------------------------------------------------ permissions
  protected choisirRole(r: RoleEnum): void { this.roleSelectionne.set(r); this.chargerPermissions(); }
  protected basculer(p: RoleDTOs.Permission, cle: 'voir' | 'creer' | 'modifier' | 'supprimer'): void {
    this.permissions.update(l => l.map(x => (x.module === p.module ? { ...x, [cle]: !x[cle], ...(cle === 'voir' && x.voir ? { creer: false, modifier: false, supprimer: false } : {}), ...(cle !== 'voir' && !x[cle] ? { voir: true } : {}) } : x)));
  }
  protected enregistrerPermissions(): void {
    this.envoi.set(true);
    this.service.enregistrerPermissions(this.roleSelectionne(), this.permissions()).subscribe({
      next: r => { this.envoi.set(false); this.permissions.set(r.permissions ?? []); this.toast.success('Permissions enregistrées.'); this.auth.chargerPermissions(); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  // ------------------------------------------------------------ invitation
  protected ouvrirInvitation(): void { this.invite = { role: 'ROLE_ADMIN_SNJ' }; this.invitation.set(true); }
  protected inviter(): void {
    if (!this.invite.prenom?.trim() || !this.invite.nom?.trim() || !this.invite.email?.trim()) { this.toast.error('Le prénom, le nom et l\'e-mail sont obligatoires.'); return; }
    if (this.invite.role === 'ROLE_RESPONSABLE_REGIONAL' && !this.invite.region) { this.toast.error('Choisissez la région de rattachement.'); return; }
    if (this.invite.role === 'ROLE_RESPONSABLE_COHORTE' && !this.invite.cohorteId) { this.toast.error('Choisissez la cohorte suivie.'); return; }
    this.envoi.set(true);
    const tel = (this.invite.telephone ?? '').replace(/\D/g, '');
    this.service.inviter({ ...this.invite, telephone: tel ? '+223' + tel.replace(/^223/, '') : undefined }).subscribe({
      next: () => { this.envoi.set(false); this.invitation.set(false); this.toast.success(`Invitation envoyée à ${this.invite.email}.`); this.charger(); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }
  protected renvoyer(u: UserResponseDTO): void {
    this.service.renvoyer(u.id!).subscribe({ next: () => this.toast.success('Invitation renvoyée.'), error: e => this.toast.error(messageErreur(e)) });
  }

  // ------------------------------------------------------------ modification
  protected ouvrirEdition(u: UserResponseDTO): void {
    this.modif = { role: u.role, region: u.region, cohorteId: u.cohorteId, actif: u.actif };
    this.nouveauMdp.set(null);
    this.edition.set(u);
    this.roleSelectionne.set(u.role ?? 'ROLE_ADMIN_SNJ');
    this.chargerPermissions();
  }

  protected enregistrerEdition(): void {
    const u = this.edition();
    if (!u) return;
    this.envoi.set(true);
    this.service.modifier(u.id!, { username: u.username, email: u.email, prenom: u.prenom, nom: u.nom, role: this.modif.role, region: this.modif.region, cohorteId: this.modif.cohorteId }).subscribe({
      next: () => {
        const fin = () => { this.envoi.set(false); this.edition.set(null); this.toast.success('Utilisateur mis à jour.'); this.charger(); };
        if (this.modif.actif !== u.actif) this.service.activer(u.id!, !!this.modif.actif).subscribe({ next: fin, error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); } });
        else fin();
      },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected reinitialiser(): void {
    const u = this.edition();
    if (!u) return;
    const mdp = 'Snj' + Math.random().toString(36).slice(2, 8) + Math.floor(10 + Math.random() * 89);
    this.service.reinitialiserMotDePasse(u.id!, mdp).subscribe({
      next: () => { this.nouveauMdp.set(mdp); this.toast.success('Mot de passe réinitialisé. Communiquez-le à l\'utilisateur.'); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected async desactiver(): Promise<void> {
    const u = this.edition();
    if (!u || !(await this.confirmation.demander(`Désactiver le compte de ${u.prenom} ${u.nom} ?`, 'L\'utilisateur ne pourra plus se connecter. Ses sessions ouvertes sont fermées.', 'Désactiver', true))) return;
    this.service.activer(u.id!, false).subscribe({ next: () => { this.edition.set(null); this.toast.success('Compte désactivé.'); this.charger(); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected async supprimer(): Promise<void> {
    const u = this.edition();
    if (!u || !(await this.confirmation.demander(`Supprimer définitivement le compte de ${u.prenom} ${u.nom} ?`, 'Cette action est irréversible. Préférez la désactivation pour garder l\'historique.', 'Supprimer', true))) return;
    this.service.supprimer(u.id!).subscribe({ next: () => { this.edition.set(null); this.toast.success('Compte supprimé.'); this.charger(); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected copier(t: string): void { navigator.clipboard?.writeText(t).then(() => this.toast.info('Mot de passe copié.')).catch(() => undefined); }

  private charger(): void {
    this.service.lister().subscribe(u => {
      this.utilisateurs.set(u);
      const id = Number(this.route.snapshot.queryParamMap.get('id'));
      const cible = id ? u.find(x => x.id === id) : null;
      if (cible && !this.edition()) this.ouvrirEdition(cible);
    });
    this.service.roles().subscribe(r => this.roles.set(r));
  }

  private chargerPermissions(): void { this.service.permissions(this.roleSelectionne()).subscribe(r => this.permissions.set(r.permissions ?? [])); }
}
