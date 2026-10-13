import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { nombre } from '../../../utils/format';
import { Point } from '../../../../models/graphique.model';

/** Histogramme vertical (« Évolution des effectifs ») avec barre mise en avant et infobulle. */
@Component({
  selector: 'app-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './bar-chart.html',
  styleUrl: './bar-chart.css'
})
export class BarChart {
  readonly points = input<Point[]>([]);
  readonly titre = input('');
  readonly unite = input('membres');
  readonly L = 600; readonly H = 240; readonly G = 36;
  protected readonly survol = signal<number | null>(null);

  private readonly max = computed(() => {
    const m = Math.max(1, ...this.points().map(p => p.valeur));
    const pas = Math.pow(10, Math.floor(Math.log10(m)));
    return Math.ceil(m / pas) * pas;
  });
  protected readonly actif = computed(() => {
    if (this.survol() !== null) return this.survol();
    const p = this.points();
    let iMax = 0;
    p.forEach((x, i) => { if (x.valeur > p[iMax].valeur) iMax = i; });
    return p.length ? iMax : null;
  });
  protected readonly graduations = computed(() => {
    const m = this.max(), zone = this.H - 30;
    return [0, 0.25, 0.5, 0.75, 1].map(f => ({ v: f, y: 10 + zone * (1 - f), texte: f === 0 ? '0' : abrege(m * f) }));
  });
  protected readonly barres = computed(() => {
    const p = this.points(), n = Math.max(1, p.length), zone = this.H - 30, largeur = (this.L - this.G - 10) / n;
    return p.map((x, i) => {
      const h = (x.valeur / this.max()) * zone;
      return { libelle: x.libelle, valeur: x.valeur, x: this.G + 10 + i * largeur + largeur * 0.22, w: largeur * 0.56, y: 10 + zone - h, h: Math.max(h, 1) };
    });
  });
  protected readonly bulle = computed(() => {
    const i = this.actif();
    const b = i === null ? null : this.barres()[i];
    if (!b || !b.valeur) return null;
    return { gauche: ((b.x + b.w / 2) / this.L) * 100, haut: (b.y / this.H) * 100, libelle: b.libelle, texte: `${nombre(b.valeur)} ${this.unite()}` };
  });
}

function abrege(v: number): string {
  if (v >= 1000) return `${nombre(v / 1000, v % 1000 ? 1 : 0)} k`;
  return nombre(v);
}
