import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../core/services/toast.service';
import { Historique, RoleEnum, UserResponseDTO } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { NombrePipe } from '../../shared/pipes/format.pipes';
import { etiquetteAction, LIBELLES_ROLES } from '../../shared/utils/libelles';
import { dateCourte, heure, versDate } from '../../shared/utils/format';
import { HistoriqueService } from '../../core/services/historique.service';
import { UtilisateurService } from '../../core/services/utilisateur.service';
import { messageErreur } from '../../shared/utils/http';
import { ConfirmationService } from '../../core/services/confirmation.service';

const ACTIONS = ['CREATION', 'MODIFICATION', 'SUPPRESSION', 'ARCHIVAGE', 'IMPORT', 'EXPORT', 'FUSION', 'CHANGEMENT_STATUT', 'MODIFICATION_PERMISSIONS',
  'INVITATION', 'CONNEXION', 'CONNEXION_ECHOUEE', 'ENVOI', 'PUBLICATION', 'VALIDATION', 'REJET', 'PRESENCE', 'PHOTO', 'ATTESTATION'];
const PERIODES = [{ jours: 7, libelle: '7 derniers jours' }, { jours: 30, libelle: '30 derniers jours' }, { jours: 90, libelle: '3 derniers mois' }, { jours: 0, libelle: 'Toute la période' }];
const ENTITES: Record<string, string> = {
  MEMBRE: 'Membre', COHORTE: 'Cohorte', UTILISATEUR: 'Utilisateur', IMPORT: 'Import', MOBILISATION: 'Mobilisation', NOTIFICATION: 'Notification',
  ACTUALITE: 'Actualité', OPPORTUNITE: 'Opportunité', DOCUMENT: 'Document', DOSSIER: 'Dossier', DEMANDE: 'Demande', ACTIVITE: 'Activité',
  COMPETENCE: 'Compétence', ROLE: 'Rôle', RAPPORT: 'Rapport', STATISTIQUES: 'Statistiques', HISTORIQUE: 'Journal', AUTHENTIFICATION: 'Connexion'
};

/** Écran web 60 — Historique des modifications (journal des opérations, détail et restauration). */
@Component({
  selector: 'app-historique',
  imports: [FormsModule, Icon, Avatar, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './historique.html',
  styleUrl: './historique.css'
})
export class HistoriqueOperations implements OnInit {
  private readonly service = inject(HistoriqueService);
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly actions = ACTIONS;
  protected readonly periodes = PERIODES;
  protected readonly operations = signal<Historique.OperationDTO[]>([]);
  protected readonly total = signal(0);
  protected readonly selection = signal<Historique.OperationDTO | null>(null);
  protected readonly utilisateurs = signal<UserResponseDTO[]>([]);
  protected recherche = '';
  protected utilisateur = '';
  protected action = '';
  protected jours = 7;
  protected entite = '';
  protected entiteId: number | null = null;
  private page = 0;
  private readonly saisie = new Subject<void>();
  protected readonly etiquette = etiquetteAction;

  constructor() { this.saisie.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.recharger()); }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    if (q.get('entite')) { this.entite = q.get('entite')!; this.entiteId = Number(q.get('entiteId')) || null; this.jours = 0; }
    this.utilisateurService.lister().subscribe({ next: u => this.utilisateurs.set(u), error: () => undefined });
    this.recharger();
  }

  protected rechercher(q: string): void { this.recherche = q; this.saisie.next(); }
  protected recharger(): void { this.page = 0; this.charger(false); }
  protected plus(): void { this.page++; this.charger(true); }
  protected retirerEntite(): void { this.entite = ''; this.entiteId = null; this.router.navigate([], { queryParams: {} }); this.recharger(); }

  protected ouvrir(h: Historique.OperationDTO): void { this.service.obtenir(h.id!).subscribe(d => this.selection.set(d)); }

  protected async restaurer(h: Historique.OperationDTO): Promise<void> {
    if (!(await this.confirmation.demander('Restaurer les valeurs précédentes ?', 'La fiche du membre reprendra les anciennes valeurs. Cette restauration sera elle-même tracée.', 'Restaurer'))) return;
    this.service.restaurer(h.id!).subscribe({ next: () => { this.toast.success('Valeurs restaurées.'); this.recharger(); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected voir(h: Historique.OperationDTO): void { this.router.navigate(['/membres', h.entiteId]); }
  protected exporter(): void { this.service.exporter(this.filtres()).subscribe({ error: e => this.toast.error(messageErreur(e)) }); }

  protected roles(t?: string): string { return (t ?? '').replace(/ROLE_[A-Z_]+/g, r => LIBELLES_ROLES[r as RoleEnum] ?? r); }
  protected libelleAction(a: string): string { return etiquetteAction(a).libelle; }
  protected libelleEntite(e?: string): string { return ENTITES[e ?? ''] ?? (e ? e.charAt(0) + e.slice(1).toLowerCase() : ''); }
  protected jour(v?: string): string { return dateCourte(v).slice(0, 5); }
  protected heureDe(v?: string): string { return heure(v); }
  protected dateComplete(v?: string): string { const d = versDate(v); return d ? `${dateCourte(d)} à ${heure(d)}:${String(d.getSeconds()).padStart(2, '0')}` : '—'; }

  private filtres() {
    const du = this.jours ? new Date(Date.now() - this.jours * 86400000).toISOString().slice(0, 10) : undefined;
    return { utilisateur: this.utilisateur || undefined, action: this.action || undefined, entite: this.entite || undefined, entiteId: this.entiteId ?? undefined, du, recherche: this.recherche || undefined };
  }

  private charger(ajouter: boolean): void {
    this.service.lister(this.filtres(), this.page, 11).subscribe(p => {
      this.operations.update(l => (ajouter ? [...l, ...(p.content ?? [])] : p.content ?? []));
      this.total.set(p.totalElements ?? 0);
    });
  }
}
