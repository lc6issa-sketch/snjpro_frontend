import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OpportuniteDTOs, TypeOpportunite } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { Pill } from '../../../shared/components/pill/pill';
import { DateCourtePipe, NombrePipe } from '../../../shared/pipes/format.pipes';
import { STATUT_OPPORTUNITE, TYPE_OPPORTUNITE } from '../../../shared/utils/libelles';
import { OpportuniteService } from '../../../core/services/opportunite.service';

/** Écran web 40 — Opportunités d'emploi, de stage et de formation. */
@Component({
  selector: 'app-opportunites-liste',
  imports: [FormsModule, RouterLink, Icon, Avatar, Pill, DateCourtePipe, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './opportunites-liste.html',
  styleUrl: './opportunites-liste.css'
})
export class OpportunitesListe implements OnInit {
  private readonly service = inject(OpportuniteService);
  private readonly auth = inject(AuthService);
  protected readonly STATUT = STATUT_OPPORTUNITE;
  protected readonly TYPE = TYPE_OPPORTUNITE;
  protected readonly opportunites = signal<OpportuniteDTOs.Resume[]>([]);
  protected readonly compteurs = signal<OpportuniteDTOs.Compteurs | null>(null);
  protected readonly type = signal<TypeOpportunite | null>(null);
  protected readonly recherche = signal('');
  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_PARTENAIRE'));
  protected readonly onglets = computed(() => {
    const c = this.compteurs();
    return [
      { cle: null, libelle: 'Toutes', nombre: c?.toutes ?? 0 },
      { cle: 'EMPLOI' as TypeOpportunite, libelle: 'Emplois', nombre: c?.emplois ?? 0 },
      { cle: 'STAGE' as TypeOpportunite, libelle: 'Stages', nombre: c?.stages ?? 0 },
      { cle: 'FORMATION' as TypeOpportunite, libelle: 'Formations', nombre: c?.formations ?? 0 }
    ];
  });
  protected readonly filtrees = computed(() => {
    const t = this.type(), q = this.recherche().trim().toLowerCase();
    return this.opportunites().filter(o => (!t || o.type === t) && (!q || `${o.intitule} ${o.organisation} ${o.lieu}`.toLowerCase().includes(q)));
  });

  ngOnInit(): void {
    this.service.lister().subscribe(l => this.opportunites.set(l));
    this.service.compteurs().subscribe(c => this.compteurs.set(c));
  }
}
