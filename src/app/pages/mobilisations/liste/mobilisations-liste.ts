import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { MobilisationDTOs, StatutMobilisation } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Pill } from '../../../shared/components/pill/pill';
import { NombrePipe } from '../../../shared/pipes/format.pipes';
import { STATUT_MOBILISATION } from '../../../shared/utils/libelles';
import { dateMoyenne, versDate } from '../../../shared/utils/format';
import { styleCategorie } from '../../../shared/utils/categories';
import { MobilisationService } from '../../../core/services/mobilisation.service';

/** Écran web 29 — Liste des mobilisations. */
@Component({
  selector: 'app-mobilisations-liste',
  imports: [FormsModule, RouterLink, Icon, Pill, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobilisations-liste.html',
  styleUrl: './mobilisations-liste.css'
})
export class MobilisationsListe implements OnInit {
  private readonly service = inject(MobilisationService);
  private readonly auth = inject(AuthService);
  protected readonly router = inject(Router);
  protected readonly STATUT = STATUT_MOBILISATION;
  protected readonly mobilisations = signal<MobilisationDTOs.Resume[]>([]);
  protected readonly stats = signal<MobilisationDTOs.Statistiques | null>(null);
  protected readonly statut = signal<StatutMobilisation | null>(null);
  protected readonly recherche = signal('');
  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_REGIONAL', 'ROLE_RESPONSABLE_COHORTE'));
  protected readonly onglets = computed(() => {
    const l = this.mobilisations(), n = (s: StatutMobilisation) => l.filter(m => m.statut === s).length;
    return [
      { cle: null, libelle: 'Toutes', nombre: l.length },
      { cle: 'EN_COURS' as StatutMobilisation, libelle: 'En cours', nombre: n('EN_COURS') },
      { cle: 'PLANIFIEE' as StatutMobilisation, libelle: 'Planifiées', nombre: n('PLANIFIEE') },
      { cle: 'BROUILLON' as StatutMobilisation, libelle: 'Brouillons', nombre: n('BROUILLON') },
      { cle: 'CLOTUREE' as StatutMobilisation, libelle: 'Clôturées', nombre: n('CLOTUREE') }
    ];
  });
  protected readonly filtrees = computed(() => {
    const s = this.statut(), q = this.recherche().trim().toLowerCase();
    return this.mobilisations().filter(m => (!s || m.statut === s) && (!q || `${m.titre} ${m.lieu} ${m.region} ${m.typeBesoin}`.toLowerCase().includes(q)));
  });
  protected readonly style = styleCategorie;

  ngOnInit(): void {
    this.service.lister().subscribe(l => this.mobilisations.set(l));
    this.service.statistiques().subscribe(s => this.stats.set(s));
  }

  protected date(v?: string): string { return dateMoyenne(v); }

  protected sousTitre(m: MobilisationDTOs.Resume): string {
    const d = versDate(m.dateDebut), f = versDate(m.dateFin);
    let periode = '';
    if (d && f && d.getTime() !== f.getTime()) {
      periode = d.getMonth() === f.getMonth() ? `${d.getDate()} – ${dateMoyenne(f)}` : `${dateMoyenne(d)} – ${dateMoyenne(f)}`;
    } else if (d) periode = (m.statut === 'EN_COURS' && d < new Date() ? 'depuis le ' : '') + dateMoyenne(d);
    return [m.region || m.lieu, periode, m.typeBesoin].filter(x => !!x).join(' · ');
  }
}
