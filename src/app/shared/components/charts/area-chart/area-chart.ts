import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Point } from '../../../../models/graphique.model';

/** Courbe avec aire (« Complétude des profils par année de cohorte »). */
@Component({
  selector: 'app-area-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './area-chart.html',
  styleUrl: './area-chart.css'
})
export class AreaChart {
  readonly points = input<Point[]>([]);
  y(v: number): number { return 10 + (190 * (100 - v)) / 100; }
  private x(i: number, n: number): number { return 30 + (n <= 1 ? 135 : (i * 270) / (n - 1)); }
  protected readonly trace = computed(() => {
    const p = this.points();
    if (!p.length) return null;
    const pts = p.map((v, i) => ({ x: this.x(i, p.length), y: this.y(Math.max(0, Math.min(100, v.valeur))) }));
    const ligne = pts.map((q, i) => `${i ? 'L' : 'M'}${q.x},${q.y}`).join(' ');
    const aire = `${ligne} L${pts[pts.length - 1].x},200 L${pts[0].x},200 Z`;
    return { ligne, aire, dernier: pts[pts.length - 1], derniereValeur: Math.round(p[p.length - 1].valeur) };
  });
  protected readonly etiquettes = computed(() => {
    const p = this.points(), n = p.length, pas = Math.max(1, Math.ceil(n / 4));
    return p.map((v, i) => ({ texte: v.libelle, x: this.x(i, n), garder: i % pas === 0 || i === n - 1 })).filter(l => l.garder);
  });
}
