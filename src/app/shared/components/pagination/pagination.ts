import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { nombre } from '../../utils/format';

/** « Affichage de 1 à 9 sur 1 284 résultats » + pages ‹ 1 2 3 … 143 ›. */
@Component({
  selector: 'app-pagination',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pagination.html',
  styleUrl: './pagination.css'
})
export class Pagination {
  readonly page = input(0);
  readonly taille = input(10);
  readonly total = input(0);
  readonly libelle = input('résultats');
  readonly aller = output<number>();

  protected readonly pages = computed(() => Math.max(1, Math.ceil(this.total() / this.taille())));
  protected readonly debut = computed(() => (this.total() ? this.page() * this.taille() + 1 : 0));
  protected readonly fin = computed(() => Math.min(this.total(), (this.page() + 1) * this.taille()));
  protected readonly totalTexte = computed(() => nombre(this.total()));
  protected readonly numeros = computed(() => {
    const n = this.pages(), p = this.page();
    if (n <= 6) return Array.from({ length: n }, (_, i) => i);
    const set = new Set([0, 1, 2, p - 1, p, p + 1, n - 1].filter(x => x >= 0 && x < n));
    const tri = [...set].sort((a, b) => a - b);
    const res: number[] = [];
    tri.forEach((x, i) => { if (i && x - tri[i - 1] > 1) res.push(-1); res.push(x); });
    return res;
  });
}
