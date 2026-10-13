import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MembreService } from '../../../core/services/membre.service';
import { ToastService } from '../../../core/services/toast.service';
import { Modal } from '../../../shared/components/modal/modal';
import { Icon } from '../../../shared/components/icon/icon';
import { messageErreur } from '../../../shared/utils/http';

const TYPES = [
  { cle: 'FORMATION', libelle: 'Formation' }, { cle: 'AFFECTATION', libelle: 'Affectation' },
  { cle: 'PROMOTION', libelle: 'Promotion' }, { cle: 'DISTINCTION', libelle: 'Distinction' }
];

/** Écran web 21 — Ajouter une étape au parcours SNJ d'un membre. */
@Component({
  selector: 'app-ajout-parcours',
  imports: [FormsModule, Modal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ajout-parcours.html',
  styleUrl: './ajout-parcours.css'
})
export class AjoutParcours {
  private readonly service = inject(MembreService);
  private readonly toast = inject(ToastService);
  readonly membreId = input.required<number>();
  readonly nom = input('');
  readonly fermer = output<void>();
  readonly ajoute = output<void>();

  protected readonly types = TYPES;
  protected type = 'AFFECTATION';
  protected intitule = '';
  protected dateDebut = new Date().toISOString().slice(0, 10);
  protected dateFin = '';
  protected lieu = '';
  protected description = '';
  protected readonly envoi = signal(false);

  protected ajouter(): void {
    this.envoi.set(true);
    this.service.ajouterParcours(this.membreId(), {
      intitule: this.intitule.trim(), type: this.type, dateDebut: this.dateDebut || undefined, dateFin: this.dateFin || undefined,
      lieu: this.lieu || undefined, description: this.description || undefined
    }).subscribe({
      next: () => { this.toast.success('Étape ajoutée au parcours.'); this.ajoute.emit(); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }
}
