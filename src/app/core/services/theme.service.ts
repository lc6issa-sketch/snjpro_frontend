import { Injectable, signal } from '@angular/core';

/** Apparence choisie par l'utilisateur : suit le système, ou forcée en clair / sombre. */
export type ModeTheme = 'systeme' | 'clair' | 'sombre';

/** Clé du choix mémorisé dans le navigateur (lue aussi par index.html avant le démarrage, pour éviter un flash blanc). */
export const CLE_THEME = 'snjpro.theme';

export const MODES_THEME: { mode: ModeTheme; libelle: string; icone: string }[] = [
  { mode: 'systeme', libelle: 'Système', icone: 'monitor' },
  { mode: 'clair', libelle: 'Clair', icone: 'sun' },
  { mode: 'sombre', libelle: 'Sombre', icone: 'moon' }
];

/**
 * Mode clair / sombre, propre à chaque utilisateur et à chaque navigateur.
 * Pose data-theme="sombre" sur <html> : les couleurs sombres sont définies dans styles.css.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly mode = signal<ModeTheme>(lireMemorise());
  readonly sombre = signal(false);

  private readonly media = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  initialiser(): void {
    this.appliquer();
    // en mode « Système », suit le passage clair / sombre du poste en direct
    this.media?.addEventListener('change', () => { if (this.mode() === 'systeme') this.appliquer(); });
  }

  changer(mode: ModeTheme): void {
    this.mode.set(mode);
    try { localStorage.setItem(CLE_THEME, mode); } catch { /* stockage indisponible */ }
    this.appliquer();
  }

  private appliquer(): void {
    const mode = this.mode();
    const sombre = mode === 'sombre' || (mode === 'systeme' && !!this.media?.matches);
    this.sombre.set(sombre);
    if (typeof document === 'undefined') return;
    if (sombre) document.documentElement.dataset['theme'] = 'sombre';
    else delete document.documentElement.dataset['theme'];
  }
}

function lireMemorise(): ModeTheme {
  try {
    const v = localStorage.getItem(CLE_THEME);
    return v === 'clair' || v === 'sombre' ? v : 'systeme';
  } catch { return 'systeme'; }
}
