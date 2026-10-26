import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MembreService } from '../../../core/services/membre.service';
import { CohorteService } from '../../../core/services/cohorte.service';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { AuthService } from '../../../core/services/auth.service';
import { CohorteDTO, MembreFilterDTO, MembreResponseDTO, StatutMembreEnum } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { Pill } from '../../../shared/components/pill/pill';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { NombrePipe, RelatifPipe, TelMasquePipe } from '../../../shared/pipes/format.pipes';
import { STATUT_MEMBRE } from '../../../shared/utils/libelles';
import { ExportMembres } from '../export-membres/export-membres';

const TAILLE = 9;

/** Écran web 09 — Liste des membres avec filtres, sélection multiple et actions groupées. */
@Component({
  selector: 'app-membres-liste',
  imports: [FormsModule, RouterLink, Icon, Avatar, Pill, Pagination, NombrePipe, RelatifPipe, TelMasquePipe, ExportMembres],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './membres-liste.html',
  styleUrl: './membres-liste.css'
})
export class MembresListe implements OnInit {
  private readonly service = inject(MembreService);
  private readonly cohorteService = inject(CohorteService);
  private readonly referentiel = inject(ReferentielService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  protected readonly STATUT = STATUT_MEMBRE;
  protected readonly taille = TAILLE;
  protected readonly statuts: { cle: StatutMembreEnum; libelle: string }[] = [
    { cle: 'ACTIF', libelle: 'Actif' }, { cle: 'INACTIF', libelle: 'Inactif' }, { cle: 'SUSPENDU', libelle: 'Suspendu' }, { cle: 'ARCHIVE', libelle: 'Archivé' }
  ];
  protected readonly filtre = signal<MembreFilterDTO>({});
  protected readonly page = signal<{ content?: MembreResponseDTO[]; totalElements?: number } | null>(null);
  protected readonly numeroPage = signal(0);
  protected readonly total = signal(0);
  protected readonly chargement = signal(true);
  protected readonly selection = signal(new Set<number>());
  protected readonly exporter = signal(false);
  /** Membres cochés, transmis à l'export : s'il y en a, seuls ceux-là sont exportés. */
  protected readonly idsSelection = computed(() => [...this.selection()]);
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly regions = signal<string[]>([]);
  protected readonly professions = signal<string[]>([]);
  protected readonly competences = signal<string[]>([]);
  protected readonly membres = computed(() => this.page()?.content ?? []);
  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_COHORTE'));
  protected readonly toutCoche = computed(() => this.membres().length > 0 && this.membres().every(m => this.selection().has(m.id!)));

  protected readonly filtresActifs = computed(() => {
    const f = this.filtre();
    const l: { cle: keyof MembreFilterDTO; texte: string }[] = [];
    if (f.cohorteId) l.push({ cle: 'cohorteId', texte: `Cohorte : ${this.cohortes().find(c => c.id === f.cohorteId)?.nom ?? f.cohorteId}` });
    if (f.region) l.push({ cle: 'region', texte: `Région : ${f.region}` });
    if (f.profession) l.push({ cle: 'profession', texte: `Profession : ${f.profession}` });
    if (f.competence) l.push({ cle: 'competence', texte: `Compétence : ${f.competence}` });
    if (f.statut) l.push({ cle: 'statut', texte: `Statut : ${STATUT_MEMBRE[f.statut]?.libelle ?? f.statut}` });
    return l;
  });
  protected readonly etiquettes = computed(() => this.filtresActifs().map(f => f.texte));

  private readonly saisie = new Subject<string>();

  constructor() {
    this.saisie.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(q => {
      this.filtre.update(f => ({ ...f, query: q || undefined }));
      this.numeroPage.set(0);
      this.charger();
    });
  }

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const initial: MembreFilterDTO = {};
    if (q.get('cohorteId')) initial.cohorteId = +q.get('cohorteId')!;
    if (q.get('competence')) initial.competence = q.get('competence')!;
    if (q.get('region')) initial.region = q.get('region')!;
    this.filtre.set(initial);
    this.cohorteService.lister().subscribe(c => this.cohortes.set(c));
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
    this.referentiel.professions().subscribe(p => this.professions.set(p));
    this.referentiel.competences().subscribe(c => this.competences.set(c));
    this.service.rechercher({}, { size: 1 }).subscribe(p => this.total.set(p.totalElements));
    this.charger();
  }

  protected rechercher(q: string): void { this.saisie.next(q); }

  protected changer(cle: keyof MembreFilterDTO, valeur: unknown): void {
    this.filtre.update(f => ({ ...f, [cle]: valeur === '' || valeur === null ? undefined : valeur }));
    this.numeroPage.set(0);
    this.charger();
  }

  protected toutEffacer(): void { this.filtre.set({ query: this.filtre().query }); this.numeroPage.set(0); this.charger(); }
  protected allerA(p: number): void { this.numeroPage.set(p); this.charger(); }

  protected cocher(id: number): void {
    this.selection.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  protected cocherTout(): void {
    const tous = this.toutCoche();
    this.selection.update(s => { const n = new Set(s); this.membres().forEach(m => (tous ? n.delete(m.id!) : n.add(m.id!))); return n; });
  }

  protected viderSelection(): void { this.selection.set(new Set()); }
  protected ouvrir(m: MembreResponseDTO): void { this.router.navigate(['/membres', m.id]); }
  protected mobiliser(): void { this.router.navigate(['/mobilisations/nouvelle']); }
  protected notifier(): void { this.router.navigate(['/notifications'], { queryParams: { membres: [...this.selection()].join(',') } }); }

  private charger(): void {
    this.chargement.set(true);
    this.service.rechercher(this.filtre(), { page: this.numeroPage(), size: TAILLE }).subscribe({
      next: p => { this.page.set(p); this.chargement.set(false); },
      error: () => { this.page.set({ content: [], totalElements: 0 }); this.chargement.set(false); }
    });
  }
}
