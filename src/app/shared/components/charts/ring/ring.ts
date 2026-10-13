import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Jauge circulaire (« 86 % », « Objectif 89 % »). */
@Component({
  selector: 'app-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ring.html',
  styleUrl: './ring.css'
})
export class Ring {
  readonly valeur = input<number | null | undefined>(0);
  readonly taille = input(64);
  readonly epaisseur = input(10);
  readonly couleur = input('var(--secondary)');
  readonly legende = input('');
  readonly C = 2 * Math.PI * 42;
  protected readonly borne = computed(() => Math.max(0, Math.min(100, Math.round(this.valeur() ?? 0))));
}
