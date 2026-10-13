import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { initiales } from '../../utils/format';

const TEINTES = [
  { bg: 'var(--tint)', fg: 'var(--primary)' },
  { bg: 'var(--gold-bg)', fg: 'var(--gold-text)' },
  { bg: 'var(--blue-bg)', fg: 'var(--blue-text)' },
  { bg: 'var(--violet-bg)', fg: 'var(--violet-text)' },
  { bg: 'var(--red-bg)', fg: 'var(--red-text)' },
  { bg: 'var(--teal-bg)', fg: 'var(--teal-text)' },
  { bg: 'var(--lime-bg)', fg: 'var(--lime-text)' }
];

/** Pastille ronde avec initiales (« AT ») ou photo, couleur stable dérivée du nom. */
@Component({
  selector: 'app-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.html',
  styleUrl: './avatar.css'
})
export class Avatar {
  readonly nom = input<string | null | undefined>('');
  readonly photo = input<string | null | undefined>(null);
  readonly size = input<number>(32);
  protected readonly lettres = computed(() => initiales(this.nom()));
  protected readonly teinte = computed(() => {
    const n = this.nom() ?? '';
    let h = 0;
    for (const c of n) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return TEINTES[h % TEINTES.length];
  });
}
