import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ActualiteDTOs, StatutActualite } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { Pill } from '../../../shared/components/pill/pill';
import { DateMoyennePipe, NombrePipe, RelatifPipe } from '../../../shared/pipes/format.pipes';
import { CATEGORIE_ACTUALITE, STATUT_ACTUALITE } from '../../../shared/utils/libelles';
import { couverture } from '../visuel';
import { ActualiteService } from '../../../core/services/actualite.service';

/** Écran web 37 — Actualités publiées, brouillons et archives. */
@Component({
  selector: 'app-actualites-liste',
  imports: [FormsModule, RouterLink, Icon, Avatar, Pill, DateMoyennePipe, NombrePipe, RelatifPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './actualites-liste.html',
  styleUrl: './actualites-liste.css'
})
export class ActualitesListe implements OnInit, OnDestroy {
  private readonly service = inject(ActualiteService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly STATUT = STATUT_ACTUALITE;
  protected readonly actualites = signal<ActualiteDTOs.Resume[]>([]);
  protected readonly compteurs = signal<ActualiteDTOs.Compteurs | null>(null);
  protected readonly statut = signal<StatutActualite | null>(null);
  protected readonly recherche = signal('');
  protected readonly images = signal<Record<number, string>>({});
  protected readonly redacteur = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_DIRECTION'));
  protected readonly onglets = computed(() => {
    const c = this.compteurs();
    return [
      { cle: null, libelle: 'Toutes', nombre: c?.toutes ?? 0 },
      { cle: 'PUBLIEE' as StatutActualite, libelle: 'Publiées', nombre: c?.publiees ?? 0 },
      { cle: 'BROUILLON' as StatutActualite, libelle: 'Brouillons', nombre: (c?.brouillons ?? 0) + (c?.programmees ?? 0) },
      { cle: 'ARCHIVEE' as StatutActualite, libelle: 'Archivées', nombre: c?.archivees ?? 0 }
    ];
  });
  protected readonly filtrees = computed(() => {
    const s = this.statut(), q = this.recherche().trim().toLowerCase();
    return this.actualites().filter(a => (!s || a.statut === s || (s === 'BROUILLON' && a.statut === 'PROGRAMMEE'))
      && (!q || `${a.titre} ${a.sousTitre} ${a.extrait}`.toLowerCase().includes(q)));
  });

  ngOnInit(): void {
    this.service.compteurs().subscribe(c => this.compteurs.set(c));
    this.service.lister().subscribe(l => {
      this.actualites.set(l);
      l.filter(a => a.imageUrl).forEach(a => this.service.imageUrl(a.id!).subscribe({ next: u => this.images.update(i => ({ ...i, [a.id!]: u })), error: () => undefined }));
    });
  }

  ngOnDestroy(): void { Object.values(this.images()).forEach(u => URL.revokeObjectURL(u)); }

  protected filtrer(s: StatutActualite | null): void { this.statut.set(s); }
  protected propre(t?: string): string { return (t ?? '').replace(/(^|\s)#{1,3}\s/g, ' ').replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1').replace(/\s-\s/g, ' · ').trim(); }
  protected visuel(a: ActualiteDTOs.Resume) { return couverture(a.categorie, a.statut); }
  protected categorie(c?: string): string { return CATEGORIE_ACTUALITE[c ?? ''] ?? ''; }
  protected ouvrir(a: ActualiteDTOs.Resume): void { if (this.redacteur()) this.router.navigate(['/actualites', a.id]); }
}
