import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ApparenceService, LOGOS } from '../../core/services/apparence.service';

/**
 * Logo Si-SNJ (fichiers du dossier public), selon le logo choisi par l'administrateur :
 * - VERT : emblème `logo_snj.png` et nom « Si-SNJ » en texte vert ; `fond="sombre"` (barre latérale, panneaux) : emblème sur
 *   disque blanc et nom en blanc.
 * - OR : écusson `logo_snj_or.svg` et nom « Si-SNJ » en texte aux couleurs de la charte noir et or.
 * `fond="clair"` : couleurs d'origine.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logo.html',
  styleUrl: './logo.css'
})
export class Logo {
  private readonly apparence = inject(ApparenceService);

  readonly taille = input(38);
  readonly sousTitre = input<string>('');
  readonly fond = input<'clair' | 'sombre'>('sombre');
  readonly avecNom = input(true);

  protected readonly ecusson = computed(() => this.apparence.logo() === 'OR');
  protected readonly embleme = computed(() => LOGOS[this.apparence.logo()].embleme);
}
