import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CohorteService } from '../../../core/services/cohorte.service';
import { AuthService } from '../../../core/services/auth.service';
import { CohorteDTO, StatutCohorteEnum } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Pill } from '../../../shared/components/pill/pill';
import { NombrePipe } from '../../../shared/pipes/format.pipes';
import { STATUT_COHORTE } from '../../../shared/utils/libelles';
import { CohorteForm } from '../cohorte-form/cohorte-form';
import { periodeCohorte } from '../cohorte-visuel';

const ONGLETS: { cle: StatutCohorteEnum | null; libelle: string; compteur: string }[] = [
  { cle: null, libelle: 'Toutes', compteur: 'TOUTES' },
  { cle: 'EN_FORMATION', libelle: 'En formation', compteur: 'EN_FORMATION' },
  { cle: 'LIBEREE', libelle: 'Libérées', compteur: 'LIBEREE' },
  { cle: 'EN_RESERVE', libelle: 'En réserve', compteur: 'EN_RESERVE' },
  { cle: 'ARCHIVEE', libelle: 'Archivées', compteur: 'ARCHIVEE' }
];

/** Écran web 22 — Liste des cohortes. */
@Component({
  selector: 'app-cohortes-liste',
  imports: [FormsModule, Icon, Pill, NombrePipe, CohorteForm],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cohortes-liste.html',
  styleUrl: './cohortes-liste.css'
})
export class CohortesListe implements OnInit {
  private readonly service = inject(CohorteService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly STATUT = STATUT_COHORTE;
  protected readonly onglets = ONGLETS;
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly compteurs = signal<Record<string, number | undefined>>({});
  protected readonly statut = signal<StatutCohorteEnum | null>(null);
  protected readonly recherche = signal('');
  protected readonly formulaire = signal(false);
  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ'));
  protected readonly filtrees = computed(() => {
    const s = this.statut(), q = this.recherche().trim().toLowerCase();
    return this.cohortes().filter(c => (!s || c.statut === s) && (!q || `${c.nom} ${c.centre} ${c.region}`.toLowerCase().includes(q)));
  });
  protected readonly totalMembres = computed(() => this.cohortes().reduce((s, c) => s + (c.nombreMembres ?? 0), 0));
  protected readonly premiereAnnee = computed(() => Math.min(...this.cohortes().map(c => c.anneeDebut ?? 9999)) || null);
  protected readonly periode = periodeCohorte;

  ngOnInit(): void { this.charger(); }

  protected ouvrir(c: CohorteDTO): void { this.router.navigate(['/cohortes', c.id]); }
  protected cree(c: CohorteDTO): void { this.formulaire.set(false); this.router.navigate(['/cohortes', c.id]); }

  private charger(): void {
    this.service.lister().subscribe(c => this.cohortes.set([...c].sort((a, b) => (b.anneeDebut ?? 0) - (a.anneeDebut ?? 0) || (b.numero ?? 0) - (a.numero ?? 0))));
    this.service.compteurs().subscribe(c => this.compteurs.set(c));
  }
}
