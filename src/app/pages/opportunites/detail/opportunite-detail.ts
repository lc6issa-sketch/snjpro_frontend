import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { OpportuniteDTOs, StatutCandidature } from '../../../models/api.models';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { Pill } from '../../../shared/components/pill/pill';
import { DateCourtePipe, NombrePipe } from '../../../shared/pipes/format.pipes';
import { STATUT_CANDIDATURE, STATUT_OPPORTUNITE, TYPE_OPPORTUNITE } from '../../../shared/utils/libelles';
import { OpportuniteService } from '../../../core/services/opportunite.service';
import { messageErreur } from '../../../shared/utils/http';
import { ConfirmationService } from '../../../core/services/confirmation.service';

/** Écran web 42 — Détail d'une opportunité et suivi des candidatures. */
@Component({
  selector: 'app-opportunite-detail',
  imports: [RouterLink, Avatar, Pill, DateCourtePipe, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './opportunite-detail.html',
  styleUrl: './opportunite-detail.css'
})
export class OpportuniteDetail implements OnInit {
  readonly id = input.required<string>();
  private readonly service = inject(OpportuniteService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  protected readonly STATUT = STATUT_OPPORTUNITE;
  protected readonly STATUT_CANDIDATURE = STATUT_CANDIDATURE;
  protected readonly statuts = Object.entries(STATUT_CANDIDATURE).map(([cle, e]) => ({ cle: cle as StatutCandidature, libelle: e.libelle }));
  protected readonly d = signal<OpportuniteDTOs.Detail | null>(null);
  protected readonly candidatures = signal<OpportuniteDTOs.CandidatureDTO[]>([]);
  protected readonly r = computed(() => this.d()?.resume ?? null);
  protected readonly type = computed(() => TYPE_OPPORTUNITE[this.r()?.type ?? '']?.libelle ?? '');
  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_PARTENAIRE'));

  ngOnInit(): void {
    this.service.obtenir(+this.id()).subscribe({ next: d => this.d.set(d), error: e => { this.toast.error(messageErreur(e)); this.router.navigate(['/opportunites']); } });
    this.service.candidatures(+this.id()).subscribe(c => this.candidatures.set([...c].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))));
  }

  protected changerStatut(c: OpportuniteDTOs.CandidatureDTO, statut: StatutCandidature): void {
    this.service.statutCandidature(c.id!, statut).subscribe({
      next: n => { this.candidatures.update(l => l.map(x => (x.id === n.id ? n : x))); this.toast.success('Candidature mise à jour. Le membre est notifié.'); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected publier(): void { this.service.publier(+this.id()).subscribe({ next: d => { this.d.set(d); this.toast.success('Opportunité publiée.'); }, error: e => this.toast.error(messageErreur(e)) }); }

  protected async cloturer(): Promise<void> {
    if (!(await this.confirmation.demander('Clôturer cette opportunité ?', 'Les membres ne pourront plus y candidater.', 'Clôturer'))) return;
    this.service.cloturer(+this.id()).subscribe({ next: d => { this.d.set(d); this.toast.success('Opportunité clôturée.'); }, error: e => this.toast.error(messageErreur(e)) });
  }
}
