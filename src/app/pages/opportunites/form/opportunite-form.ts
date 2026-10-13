import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, switchMap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { ToastService } from '../../../core/services/toast.service';
import { OpportuniteDTOs, TypeOpportunite } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { NombrePipe } from '../../../shared/pipes/format.pipes';
import { OpportuniteService } from '../../../core/services/opportunite.service';
import { messageErreur } from '../../../shared/utils/http';

/** Écran web 41 — Nouvelle opportunité (et modification d'une opportunité existante). */
@Component({
  selector: 'app-opportunite-form',
  imports: [FormsModule, RouterLink, Icon, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './opportunite-form.html',
  styleUrl: './opportunite-form.css'
})
export class OpportuniteForm implements OnInit {
  readonly id = input<string>();
  private readonly service = inject(OpportuniteService);
  private readonly referentiel = inject(ReferentielService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly types: { cle: TypeOpportunite; libelle: string }[] = [{ cle: 'EMPLOI', libelle: 'Emploi' }, { cle: 'STAGE', libelle: 'Stage' }, { cle: 'FORMATION', libelle: 'Formation' }];
  protected readonly regions = signal<string[]>([]);
  protected readonly competences = signal<string[]>([]);
  protected readonly correspondants = signal<number | null>(null);
  protected readonly envoi = signal(false);
  protected f: OpportuniteDTOs.Edition = { type: 'EMPLOI', competences: [], publicCible: 'COMPETENCES', notifierMembres: true, portailPublic: false };
  protected ajout = '';
  private readonly calcul = new Subject<void>();

  constructor() {
    this.calcul.pipe(debounceTime(300), switchMap(() => this.service.correspondances(this.f.publicCible === 'TOUS' ? [] : this.f.competences ?? [], this.f.publicCible === 'REGION' ? this.f.region : undefined).pipe(catchError(() => of(null)))), takeUntilDestroyed())
      .subscribe(r => this.correspondants.set(r ? Number(r['nombreMembres'] ?? 0) : null));
  }

  ngOnInit(): void {
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
    this.referentiel.competences().subscribe(c => this.competences.set(c));
    const id = this.id();
    if (id) {
      this.service.obtenir(+id).subscribe(d => {
        const r = d.resume ?? {};
        this.f = { type: r.type, intitule: r.intitule, organisation: r.organisation, lieu: r.lieu, typeContrat: r.typeContrat, dateLimite: r.dateLimite,
          description: d.description, competences: r.competences ?? [], publicCible: d.publicCible ?? 'COMPETENCES', region: d.region, notifierMembres: d.notifierMembres, portailPublic: d.portailPublic };
        this.estimer();
      });
    } else this.estimer();
  }

  protected estimer(): void { this.calcul.next(); }
  protected ajouter(): void {
    const v = this.ajout.trim();
    if (v && !this.f.competences!.includes(v)) this.f.competences = [...this.f.competences!, v];
    this.ajout = '';
    this.estimer();
  }
  protected retirer(c: string): void { this.f.competences = this.f.competences!.filter(x => x !== c); this.estimer(); }

  protected enregistrer(publier: boolean): void {
    if (!this.f.intitule?.trim() || !this.f.organisation?.trim()) { this.toast.error('L\'intitulé et l\'organisation sont obligatoires.'); return; }
    if (this.f.publicCible === 'REGION' && !this.f.region) { this.toast.error('Choisissez la région visée.'); return; }
    this.envoi.set(true);
    const id = this.id();
    const dto = { ...this.f, publier };
    (id ? this.service.modifier(+id, dto) : this.service.creer(dto)).subscribe({
      next: d => {
        const suite = () => { this.toast.success(publier ? 'Opportunité publiée.' : 'Brouillon enregistré.'); this.router.navigate(['/opportunites', d.resume?.id]); };
        if (publier && id && d.resume?.statut === 'BROUILLON') this.service.publier(+id).subscribe({ next: suite, error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); } });
        else suite();
      },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }
}
