import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Logo officiel SNJPro (fichiers du dossier public) : emblème `logo_snj.png` et nom `logo_nom_app.png`.
 * `fond="sombre"` (barre latérale, panneaux verts) : emblème sur disque blanc et variante `logo_nom_app_blanc.png`
 * (SNJ blanc, « Pro » vert clair, contre-formes transparentes).
 * `fond="clair"` : couleurs d'origine.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './logo.html',
  styleUrl: './logo.css'
})
export class Logo {
  readonly taille = input(38);
  readonly sousTitre = input<string>('');
  readonly fond = input<'clair' | 'sombre'>('sombre');
  readonly avecNom = input(true);
}
