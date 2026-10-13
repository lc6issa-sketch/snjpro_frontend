import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';
import { Icon } from '../icon/icon';

/**
 * Fenêtre modale des maquettes (Exporter les membres, Nouvelle cohorte…) :
 * en-tête avec icône, titre et sous-titre, contenu, pied de page `[pied]`.
 */
@Component({
  selector: 'app-modal',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})
export class Modal {
  readonly titre = input.required<string>();
  readonly sousTitre = input<string | null | undefined>(null);
  readonly icone = input<string | null>(null);
  readonly teinte = input<'green' | 'lime' | 'red' | 'gold' | 'blue'>('green');
  readonly largeur = input<number>(560);
  readonly fermer = output<void>();

  @HostListener('document:keydown.escape') echap(): void { this.fermer.emit(); }
}
