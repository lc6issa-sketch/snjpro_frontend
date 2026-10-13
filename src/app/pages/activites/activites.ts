import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MembreService } from '../../core/services/membre.service';
import { ReferentielService } from '../../core/services/referentiel.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { ActiviteDTOs, MembreResponseDTO, MobilisationDTOs } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Pill } from '../../shared/components/pill/pill';
import { Modal } from '../../shared/components/modal/modal';
import { Ring } from '../../shared/components/charts/ring/ring';
import { QrCode } from '../../shared/components/qr-code/qr-code';
import { Pagination } from '../../shared/components/pagination/pagination';
import { DateHeurePipe, HeurePipe, NombrePipe } from '../../shared/pipes/format.pipes';
import { MODE_PRESENCE, STATUT_ACTIVITE } from '../../shared/utils/libelles';
import { aujourdhuiIso, dateCourte, dateMoyenne, heure, moisCourt, moisLong, versDate } from '../../shared/utils/format';
import { ActiviteService } from '../../core/services/activite.service';
import { MobilisationService } from '../../core/services/mobilisation.service';
import { messageErreur } from '../../shared/utils/http';
import { ConfirmationService } from '../../core/services/confirmation.service';

const MOTIFS = ['Téléphone déchargé', 'Pas de smartphone', 'Problème de connexion', 'Arrivée tardive', 'Autre'];

/**
 * Écrans web 49 (Activités & présences), 50 (Nouvelle / modifier une activité) et 51 (Saisir une présence)
 * + registre complet des présences d'une activité (US14 : « un responsable peut consulter les présences »).
 */
@Component({
  selector: 'app-activites',
  imports: [FormsModule, Icon, Avatar, Pill, Modal, Ring, QrCode, Pagination, HeurePipe, DateHeurePipe, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './activites.html',
  styleUrl: './activites.css'
})
export class Activites implements OnInit, OnDestroy {
  private readonly service = inject(ActiviteService);
  private readonly mobilisations = inject(MobilisationService);
  private readonly membres = inject(MembreService);
  private readonly referentiel = inject(ReferentielService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly STATUT = STATUT_ACTIVITE;
  protected readonly MODE = MODE_PRESENCE;
  protected readonly motifs = MOTIFS;
  protected readonly activites = signal<ActiviteDTOs.Resume[]>([]);
  protected readonly passees = signal(false);
  protected readonly selection = signal<ActiviteDTOs.Resume | null>(null);
  protected readonly qr = signal<ActiviteDTOs.CodeQr | null>(null);
  protected readonly pointages = signal<ActiviteDTOs.PresenceDTO[]>([]);
  protected readonly creation = signal(false);
  /** Identifiant de l'activité en cours de modification (null : création). */
  protected readonly enEdition = signal<number | null>(null);
  // Registre complet des présences
  protected readonly registre = signal(false);
  protected readonly registrePage = signal(0);
  protected readonly registreTotal = signal(0);
  protected readonly registreLignes = signal<ActiviteDTOs.PresenceDTO[]>([]);
  protected readonly registreChargement = signal(false);
  protected readonly TAILLE_REGISTRE = 10;
  protected readonly saisie = signal(false);
  protected readonly envoi = signal(false);
  protected readonly regions = signal<string[]>([]);
  protected readonly mobilisationsDispo = signal<MobilisationDTOs.Resume[]>([]);
  protected readonly resultats = signal<MembreResponseDTO[]>([]);
  protected readonly membreChoisi = signal<MembreResponseDTO | null>(null);

  protected nouvelle: ActiviteDTOs.Edition = { qrActif: true };
  protected recherche = '';
  protected heureArrivee = '';
  protected motif = MOTIFS[0];
  private horloge?: ReturnType<typeof setInterval>;
  private readonly saisieRecherche = new Subject<string>();

  protected readonly moisCourant = new Date();
  protected readonly titreMois = `${moisLong(this.moisCourant.getMonth()).replace(/^./, c => c.toUpperCase())} ${this.moisCourant.getFullYear()}`;
  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_REGIONAL', 'ROLE_RESPONSABLE_COHORTE'));
  protected readonly c = computed(() => this.selection()?.compteurs ?? null);

  constructor() {
    this.saisieRecherche.pipe(debounceTime(250), switchMap(q => q.trim().length < 2 ? of(null) : this.membres.rechercher({ query: q.trim() }, { size: 4 }).pipe(catchError(() => of(null)))), takeUntilDestroyed())
      .subscribe(p => this.resultats.set(p?.content ?? []));
  }

  ngOnInit(): void {
    this.charger();
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
    this.mobilisations.lister().subscribe(l => this.mobilisationsDispo.set(l.filter(m => m.statut === 'EN_COURS' || m.statut === 'PLANIFIEE')));
  }

  ngOnDestroy(): void { clearInterval(this.horloge); }

  protected jour(a: ActiviteDTOs.Resume): string { return String(versDate(a.date)?.getDate() ?? '').padStart(2, '0'); }
  protected mois(a: ActiviteDTOs.Resume): string { return moisCourt(a.date); }
  protected periode(a: ActiviteDTOs.Resume): string {
    const d = versDate(a.date), f = versDate(a.dateFin);
    if (!d) return '';
    return f && f.getTime() !== d.getTime() ? (d.getMonth() === f.getMonth() ? `${d.getDate()} – ${dateMoyenne(f)}` : `${dateMoyenne(d)} – ${dateMoyenne(f)}`) : dateMoyenne(d);
  }
  protected validite(): string { const v = this.qr()?.valableJusqua; return v ? heure(v) : ''; }

  protected basculerPassees(): void { this.passees.update(p => !p); this.charger(); }

  protected choisir(a: ActiviteDTOs.Resume): void {
    this.selection.set(a);
    this.chargerDetail();
    clearInterval(this.horloge);
    this.horloge = setInterval(() => this.rafraichir(), 15000);
  }

  // ------------------------------------------------------------ création
  protected ouvrirCreation(): void {
    this.enEdition.set(null);
    this.nouvelle = { qrActif: true, date: aujourdhuiIso(), heureDebut: '08:00', heureFin: '13:00' };
    this.creation.set(true);
  }
  protected ouvrirModification(): void {
    const a = this.selection();
    if (!a) return;
    this.enEdition.set(a.id!);
    this.nouvelle = {
      titre: a.titre, description: a.description, date: a.date, dateFin: a.dateFin,
      heureDebut: a.heureDebut ? heure(a.heureDebut) : undefined, heureFin: a.heureFin ? heure(a.heureFin) : undefined,
      lieu: a.lieu, region: a.region, mobilisationId: a.mobilisationId, qrActif: a.qrActif
    };
    this.creation.set(true);
  }
  protected creer(): void {
    if (!this.nouvelle.titre?.trim() || !this.nouvelle.date) { this.toast.error('Le titre et la date sont obligatoires.'); return; }
    const id = this.enEdition();
    const donnees: ActiviteDTOs.Edition = {
      ...this.nouvelle, titre: this.nouvelle.titre.trim(), description: this.nouvelle.description?.trim() || undefined,
      dateFin: this.nouvelle.dateFin || undefined, heureDebut: this.nouvelle.heureDebut || undefined, heureFin: this.nouvelle.heureFin || undefined
    };
    this.envoi.set(true);
    (id ? this.service.modifier(id, donnees) : this.service.creer(donnees)).subscribe({
      next: a => { this.envoi.set(false); this.creation.set(false); this.toast.success(id ? 'Activité modifiée.' : 'Activité créée.'); this.charger(a.id); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }
  protected async supprimer(): Promise<void> {
    const a = this.selection();
    if (!a || !(await this.confirmation.demander('Supprimer cette activité ?', `« ${a.titre} » sera définitivement supprimée.`, 'Supprimer', true))) return;
    this.service.supprimer(a.id!).subscribe({
      next: () => { this.toast.success('Activité supprimée.'); this.selection.set(null); this.charger(); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  // ------------------------------------------------------------ registre des présences
  protected ouvrirRegistre(): void {
    this.registre.set(true);
    this.chargerRegistre(0);
  }
  protected chargerRegistre(page: number): void {
    const a = this.selection();
    if (!a) return;
    this.registrePage.set(page);
    this.registreChargement.set(true);
    this.service.presences(a.id!, page, this.TAILLE_REGISTRE).subscribe({
      next: p => { this.registreLignes.set(p.content ?? []); this.registreTotal.set(p.totalElements ?? 0); this.registreChargement.set(false); },
      error: e => { this.registreChargement.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  // ------------------------------------------------------------ saisie manuelle
  protected ouvrirSaisie(): void {
    this.recherche = ''; this.resultats.set([]); this.membreChoisi.set(null);
    this.heureArrivee = heure(new Date()); this.motif = MOTIFS[0];
    this.saisie.set(true);
  }
  protected chercher(q: string): void { this.recherche = q; this.saisieRecherche.next(q); }
  protected enregistrerPresence(): void {
    const a = this.selection(), m = this.membreChoisi();
    if (!a || !m) return;
    this.envoi.set(true);
    this.service.saisir(a.id!, { membreId: m.id, heureArrivee: this.heureArrivee || undefined, motif: this.motif }).subscribe({
      next: () => { this.envoi.set(false); this.saisie.set(false); this.toast.success(`Présence de ${m.prenom} ${m.nom} enregistrée.`); this.rafraichir(); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected exporter(): void { const a = this.selection(); if (a) this.service.exporter(a.id!).subscribe({ error: e => this.toast.error(messageErreur(e)) }); }
  protected projeter(): void { const a = this.selection(); if (a) window.open(`/activites/${a.id}/projection`, '_blank'); }

  protected async terminer(): Promise<void> {
    const a = this.selection();
    if (!a || !(await this.confirmation.demander('Terminer cette activité ?', 'Le QR code sera désactivé et plus aucune présence ne pourra être enregistrée.', 'Terminer'))) return;
    this.service.terminer(a.id!).subscribe({ next: r => { this.toast.success('Activité terminée.'); this.selection.set(r); this.charger(r.id); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected async retirer(p: ActiviteDTOs.PresenceDTO): Promise<void> {
    const a = this.selection();
    if (!a || !(await this.confirmation.demander('Retirer ce pointage ?', `${p.prenom} ${p.nom}`, 'Retirer', true))) return;
    this.service.supprimerPresence(a.id!, p.id!).subscribe({
      next: () => {
        this.rafraichir();
        if (this.registre()) this.chargerRegistre(this.registreLignes().length === 1 && this.registrePage() > 0 ? this.registrePage() - 1 : this.registrePage());
      },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  private rafraichir(): void {
    const a = this.selection();
    if (!a) return;
    this.service.obtenir(a.id!).subscribe(r => this.selection.set(r));
    this.chargerDetail();
  }

  private chargerDetail(): void {
    const a = this.selection();
    if (!a) return;
    this.service.presences(a.id!, 0, 5).subscribe(p => this.pointages.set(p.content ?? []));
    if (a.qrActif && a.statut !== 'TERMINEE') this.service.qr(a.id!).subscribe({ next: q => this.qr.set(q), error: () => this.qr.set(null) });
    else this.qr.set(null);
  }

  private charger(selectionner?: number): void {
    const maintenant = new Date();
    const req = this.passees() ? this.service.lister() : this.service.lister(null, maintenant.getFullYear(), maintenant.getMonth() + 1);
    req.subscribe(l => {
      const tri = [...l].sort((x, y) => (y.date ?? '').localeCompare(x.date ?? ''));
      this.activites.set(tri);
      const cible = tri.find(x => x.id === (selectionner ?? this.selection()?.id)) ?? tri.find(x => x.statut === 'EN_COURS') ?? tri[0];
      if (cible) this.choisir(cible); else { this.selection.set(null); clearInterval(this.horloge); }
    });
  }

  protected dateCourte(v?: string): string { return dateCourte(v); }
}
