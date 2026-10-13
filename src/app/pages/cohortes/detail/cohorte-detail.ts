import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CohorteService } from '../../../core/services/cohorte.service';
import { MembreService } from '../../../core/services/membre.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CohorteDTO, MembreResponseDTO, Page, StatutCohorteEnum } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { Pill } from '../../../shared/components/pill/pill';
import { Modal } from '../../../shared/components/modal/modal';
import { DateCourtePipe, NombrePipe } from '../../../shared/pipes/format.pipes';
import { STATUT_COHORTE, STATUT_MEMBRE, STATUT_PROFESSIONNEL } from '../../../shared/utils/libelles';
import { aujourdhuiIso, nombre } from '../../../shared/utils/format';
import { CohorteForm } from '../cohorte-form/cohorte-form';
import { ExportMembres } from '../../membres/export-membres/export-membres';
import { periodeCohorte } from '../cohorte-visuel';
import { TableauCohorte } from '../../../models/cohorte.model';
import { MessagerieService } from '../../../core/services/messagerie.service';
import { messageErreur } from '../../../shared/utils/http';

const COULEURS_SITUATION = ['var(--primary)', 'var(--secondary)', 'var(--blue)', 'var(--gold)', 'var(--violet)', 'var(--border-strong)'];
const STATUTS: { cle: StatutCohorteEnum; libelle: string; detail: string }[] = [
  { cle: 'EN_FORMATION', libelle: 'En formation', detail: 'Les recrues suivent la formation initiale' },
  { cle: 'EN_RESERVE', libelle: 'En réserve', detail: 'Mobilisables en priorité par le SNJ' },
  { cle: 'LIBEREE', libelle: 'Libérée', detail: 'Formation terminée, membres rendus à la vie civile' },
  { cle: 'ARCHIVEE', libelle: 'Archivée', detail: 'Consultation uniquement, plus de mise à jour' }
];
const MOTIFS = ['Fin de la formation initiale', 'Rappel des réservistes', 'Libération de la cohorte', 'Archivage administratif', 'Autre'];

/** Écrans web 24 (Détail de la cohorte) et 26 (Changer le statut). */
@Component({
  selector: 'app-cohorte-detail',
  imports: [FormsModule, RouterLink, Icon, Avatar, Pill, Modal, DateCourtePipe, NombrePipe, CohorteForm, ExportMembres],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cohorte-detail.html',
  styleUrl: './cohorte-detail.css'
})
export class CohorteDetail implements OnInit {
  readonly id = input.required<string>();
  private readonly service = inject(CohorteService);
  private readonly membreService = inject(MembreService);
  private readonly messagerie = inject(MessagerieService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly STATUT_COHORTE = STATUT_COHORTE;
  protected readonly STATUT_MEMBRE = STATUT_MEMBRE;
  protected readonly statuts = STATUTS;
  protected readonly motifs = MOTIFS;
  protected readonly annee = new Date().getFullYear();
  protected readonly t = signal<TableauCohorte | null>(null);
  protected readonly membres = signal<Page<MembreResponseDTO> | null>(null);
  protected readonly page = signal(0);
  protected readonly recherche = signal('');
  protected readonly modifier = signal(false);
  protected readonly exporter = signal(false);
  protected readonly changement = signal(false);
  protected readonly envoi = signal(false);
  protected nouveauStatut: StatutCohorteEnum = 'EN_RESERVE';
  protected dateEffet = aujourdhuiIso();
  protected motif = MOTIFS[0];
  protected notifier = true;

  protected readonly c = computed<CohorteDTO | null>(() => this.t()?.cohorte ?? null);
  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ'));
  protected readonly periode = computed(() => periodeCohorte(this.c()));
  protected readonly libelleStatut = computed(() => STATUT_COHORTE[this.c()?.statut ?? '']?.libelle ?? '');
  protected readonly nombreTexte = computed(() => nombre(this.t()?.membresActifs));
  protected readonly debut = computed(() => (this.membres()?.totalElements ? this.page() * 8 + 1 : 0));
  protected readonly fin = computed(() => Math.min(this.membres()?.totalElements ?? 0, (this.page() + 1) * 8));
  protected readonly situations = computed(() => {
    const s = this.t()?.situationActuelle ?? {};
    const total = Object.values(s).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(s).sort((a, b) => b[1] - a[1]).map(([libelle, valeur], i) => ({
      libelle, valeur, pourcentage: Math.round((valeur / total) * 100), couleur: libelle === 'Non renseignée' ? 'var(--border-strong)' : COULEURS_SITUATION[i % COULEURS_SITUATION.length]
    }));
  });

  private readonly saisie = new Subject<string>();

  constructor() {
    this.saisie.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => { this.page.set(0); this.chargerMembres(); });
  }

  ngOnInit(): void { this.charger(); this.chargerMembres(); }

  protected rechercher(q: string): void { this.recherche.set(q); this.saisie.next(q); }
  protected allerA(p: number): void { this.page.set(p); this.chargerMembres(); }
  protected situation(m: MembreResponseDTO): string { return STATUT_PROFESSIONNEL[m.situationProfessionnelle?.statut ?? '']?.libelle ?? '—'; }

  protected ouvrirStatut(): void {
    this.nouveauStatut = STATUTS.find(s => s.cle !== this.c()?.statut)?.cle ?? 'EN_RESERVE';
    this.changement.set(true);
  }

  protected confirmerStatut(): void {
    this.envoi.set(true);
    this.service.changerStatut(+this.id(), this.nouveauStatut, this.dateEffet, this.motif, this.notifier).subscribe({
      next: () => { this.envoi.set(false); this.changement.set(false); this.toast.success('Statut de la cohorte mis à jour.'); this.charger(); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected modifiee(): void { this.modifier.set(false); this.charger(); }

  protected ecrire(): void {
    const id = this.c()?.responsableId;
    if (!id) return;
    this.messagerie.creer({ destinataireUserId: id }).subscribe({
      next: conv => this.router.navigate(['/messagerie'], { queryParams: { conversation: conv.id } }),
      error: e => this.toast.error(messageErreur(e))
    });
  }

  private charger(): void {
    this.service.tableauDeBord(+this.id()).subscribe({
      next: t => this.t.set(t),
      error: e => { this.toast.error(messageErreur(e)); this.router.navigate(['/cohortes']); }
    });
  }

  private chargerMembres(): void {
    this.membreService.rechercher({ cohorteId: +this.id(), query: this.recherche() || undefined }, { page: this.page(), size: 8, sort: 'nom,asc' })
      .subscribe(p => this.membres.set(p));
  }
}
