import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CohorteService } from '../../../core/services/cohorte.service';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { ToastService } from '../../../core/services/toast.service';
import { CohorteDTO, StatutCohorteEnum, UserResponseDTO } from '../../../models/api.models';
import { Modal } from '../../../shared/components/modal/modal';
import { UtilisateurService } from '../../../core/services/utilisateur.service';
import { messageErreur } from '../../../shared/utils/http';

/** Écrans web 23 (Nouvelle cohorte) et 25 (Modifier la cohorte). */
@Component({
  selector: 'app-cohorte-form',
  imports: [FormsModule, Modal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cohorte-form.html',
  styleUrl: './cohorte-form.css'
})
export class CohorteForm implements OnInit {
  private readonly service = inject(CohorteService);
  private readonly referentiel = inject(ReferentielService);
  private readonly utilisateurs = inject(UtilisateurService);
  private readonly toast = inject(ToastService);
  readonly cohorte = input<CohorteDTO | null>(null);
  readonly fermer = output<void>();
  readonly enregistre = output<CohorteDTO>();

  protected readonly annees = Array.from({ length: 16 }, (_, i) => new Date().getFullYear() + 1 - i);
  protected readonly statuts: { cle: StatutCohorteEnum; libelle: string }[] = [
    { cle: 'EN_FORMATION', libelle: 'En formation' }, { cle: 'EN_RESERVE', libelle: 'En réserve' }, { cle: 'LIBEREE', libelle: 'Libérée' }
  ];
  protected readonly centres = signal<string[]>([]);
  protected readonly responsables = signal<UserResponseDTO[]>([]);
  protected readonly envoi = signal(false);
  protected c: CohorteDTO = { anneeDebut: new Date().getFullYear(), statut: 'EN_FORMATION' };

  ngOnInit(): void {
    const existante = this.cohorte();
    if (existante) this.c = { ...existante };
    this.referentiel.centres().subscribe(c => this.centres.set(c));
    this.utilisateurs.lister('ROLE_RESPONSABLE_COHORTE', true).subscribe({ next: u => this.responsables.set(u), error: () => this.responsables.set([]) });
  }

  protected enregistrer(): void {
    this.envoi.set(true);
    const existante = this.cohorte();
    const dto: CohorteDTO = { ...this.c, nom: this.c.nom?.trim() };
    const req = existante ? this.service.modifier(existante.id!, dto) : this.service.creer(dto);
    req.subscribe({
      next: c => { this.toast.success(existante ? 'Cohorte mise à jour.' : 'Cohorte créée.'); this.enregistre.emit(c); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }
}
