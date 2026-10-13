import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Etiquette, etiquette } from '../../utils/libelles';

/** Pastille de statut : `<app-pill [dico]="STATUT_MEMBRE" valeur="ACTIF" />` → « • Actif » en vert. */
@Component({
  selector: 'app-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pill.html',
  styleUrl: './pill.css'
})
export class Pill {
  readonly dico = input<Record<string, Etiquette>>({});
  readonly valeur = input<string | null | undefined>(null);
  readonly point = input(true);
  protected readonly e = computed(() => etiquette(this.dico(), this.valeur()));
  protected readonly classes = computed(() => `pill ${this.e().teinte}${this.point() ? ' dot' : ''}`);
}
