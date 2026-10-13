import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { MobilisationDTOs, Page, ReponseMobilisation } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { Pill } from '../../../shared/components/pill/pill';
import { Modal } from '../../../shared/components/modal/modal';
import { Ring } from '../../../shared/components/charts/ring/ring';
import { DateHeurePipe, NombrePipe } from '../../../shared/pipes/format.pipes';
import { REPONSE_MOBILISATION, STATUT_MOBILISATION } from '../../../shared/utils/libelles';
import { dateCourte, dateMoyenne, heure, versDate } from '../../../shared/utils/format';
import { styleCategorie } from '../../../shared/utils/categories';
import { MobilisationService } from '../../../core/services/mobilisation.service';
import { messageErreur } from '../../../shared/utils/http';
import { ConfirmationService } from '../../../core/services/confirmation.service';

/** Écrans web 33 (Détail de la mobilisation) et 34 (Clôturer la mobilisation). */
@Component({
  selector: 'app-mobilisation-detail',
  imports: [FormsModule, RouterLink, Icon, Avatar, Pill, Modal, Ring, DateHeurePipe, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobilisation-detail.html',
  styleUrl: './mobilisation-detail.css'
})
export class MobilisationDetail implements OnInit {
  readonly id = input.required<string>();
  private readonly service = inject(MobilisationService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly STATUT = STATUT_MOBILISATION;
  protected readonly REPONSE = REPONSE_MOBILISATION;
  protected readonly d = signal<MobilisationDTOs.Detail | null>(null);
  protected readonly participants = signal<Page<MobilisationDTOs.Participant> | null>(null);
  protected readonly reponse = signal<ReponseMobilisation | null>('DISPONIBLE');
  protected readonly page = signal(0);
  protected readonly cloture = signal(false);
  protected readonly envoi = signal(false);
  protected clotureForm: MobilisationDTOs.Cloture = { remercierParticipants: true, ajouterAuParcours: true };
  protected exporterApres = false;

  protected readonly c = computed(() => this.d()?.compteurs ?? null);
  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_REGIONAL', 'ROLE_RESPONSABLE_COHORTE'));
  protected readonly style = computed(() => styleCategorie(this.d()?.informations?.typeBesoin));
  protected readonly onglets = computed(() => {
    const c = this.c();
    return [
      { cle: null, libelle: 'Tous', nombre: c?.sollicites ?? 0 },
      { cle: 'DISPONIBLE' as ReponseMobilisation, libelle: 'Disponibles', nombre: c?.disponibles ?? 0 },
      { cle: 'INDISPONIBLE' as ReponseMobilisation, libelle: 'Indisponibles', nombre: c?.indisponibles ?? 0 },
      { cle: 'EN_ATTENTE' as ReponseMobilisation, libelle: 'Sans réponse', nombre: c?.sansReponse ?? 0 }
    ];
  });
  protected readonly jours = computed(() => Object.entries(this.d()?.reponsesParJour ?? {}).map(([j, v]) => ({ libelle: dateCourte(j).slice(0, 5), valeur: v })));
  protected readonly maxJour = computed(() => Math.max(1, ...this.jours().map(j => j.valeur)));
  protected readonly debut = computed(() => (this.participants()?.totalElements ? this.page() * 8 + 1 : 0));
  protected readonly fin = computed(() => Math.min(this.participants()?.totalElements ?? 0, (this.page() + 1) * 8));
  protected readonly periode = computed(() => {
    const i = this.d()?.informations;
    const deb = versDate(i?.dateDebut), f = versDate(i?.dateFin);
    if (!deb) return '';
    return f && f.getTime() !== deb.getTime() ? (deb.getMonth() === f.getMonth() ? `${deb.getDate()} – ${dateMoyenne(f)}` : `${dateMoyenne(deb)} – ${dateMoyenne(f)}`) : dateMoyenne(deb);
  });
  protected readonly rdv = computed(() => {
    const i = this.d()?.informations;
    const deb = versDate(i?.dateDebut), f = versDate(i?.dateFin);
    const jours = deb && f ? Math.round((f.getTime() - deb.getTime()) / 86400000) + 1 : null;
    return [i?.heureRendezVous ? heure(i.heureRendezVous) : null, jours ? `${jours} jour${jours > 1 ? 's' : ''}` : null].filter(x => !!x).join(' · ') || '—';
  });

  ngOnInit(): void { this.charger(true); }

  protected part(v?: number): number { const s = this.c()?.sollicites ?? 0; return s ? Math.round(((v ?? 0) / s) * 100) : 0; }
  protected court(v?: string): string { return dateCourte(v).slice(0, 5); }
  protected filtrer(r: ReponseMobilisation | null): void { this.reponse.set(r); this.page.set(0); this.chargerParticipants(); }
  protected aller(p: number): void { this.page.set(p); this.chargerParticipants(); }

  protected exporter(): void {
    this.service.exporterParticipants(+this.id(), this.reponse()).subscribe({ error: e => this.toast.error(messageErreur(e)) });
  }

  protected async relancer(): Promise<void> {
    if (!(await this.confirmation.demander('Relancer les membres sans réponse ?', `${this.c()?.sansReponse ?? 0} membre(s) recevront un rappel.`, 'Relancer'))) return;
    this.service.relancer(+this.id()).subscribe({ next: d => { this.d.set(d); this.toast.success('Relance envoyée.'); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected cloturer(): void {
    this.envoi.set(true);
    this.service.cloturer(+this.id(), this.clotureForm).subscribe({
      next: d => {
        this.envoi.set(false);
        this.cloture.set(false);
        this.d.set(d);
        this.toast.success('Mobilisation clôturée.');
        if (this.exporterApres) this.service.exporterParticipants(+this.id(), 'DISPONIBLE').subscribe();
      },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected message(): void {
    this.router.navigate(['/notifications'], { queryParams: { type: 'MOBILISATION', titre: this.d()?.informations?.titre } });
  }

  private charger(initial = false): void {
    this.service.obtenir(+this.id()).subscribe({
      next: d => {
        if (d.statut === 'BROUILLON') { this.router.navigate(['/mobilisations', d.id, 'edition']); return; }
        this.d.set(d);
        if (initial) { this.reponse.set(d.compteurs?.disponibles ? 'DISPONIBLE' : null); this.chargerParticipants(); }
      },
      error: e => { this.toast.error(messageErreur(e)); this.router.navigate(['/mobilisations']); }
    });
  }

  private chargerParticipants(): void {
    this.service.participants(+this.id(), this.reponse(), this.page(), 8).subscribe(p => this.participants.set(p));
  }
}
