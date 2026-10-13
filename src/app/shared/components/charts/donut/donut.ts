import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Segment } from '../../../../models/graphique.model';

/** Anneau (« Répartition par sexe », « Situation professionnelle ») avec total au centre. */
@Component({
  selector: 'app-donut',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './donut.html',
  styleUrl: './donut.css'
})
export class Donut {
  readonly segments = input<Segment[]>([]);
  readonly centre = input('');
  readonly legende = input('');
  readonly taille = input(150);
  readonly epaisseur = input(16);
  readonly C = 2 * Math.PI * 48;
  protected readonly arcs = computed(() => {
    const total = this.segments().reduce((s, x) => s + x.valeur, 0) || 1;
    const ecart = this.segments().length > 1 ? 3 : 0;
    let debut = 0;
    return this.segments().map(s => {
      const brut = (s.valeur / total) * this.C;
      const arc = { ...s, debut, longueur: Math.max(0, brut - ecart) };
      debut += brut;
      return arc;
    });
  });
}
