import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { ApparenceDTO, LogoApplication } from '../../models/api.models';

/** Clé du choix mémorisé dans le navigateur (lue aussi par index.html avant le démarrage, pour éviter un flash de couleurs). */
export const CLE_CHARTE = 'snjpro.charte';

/** Fichiers et nom de chaque logo ; la charte graphique (couleurs) est définie dans styles.css par [data-charte]. */
export const LOGOS: Record<LogoApplication, { libelle: string; detail: string; embleme: string }> = {
  VERT: { libelle: 'Logo vert', detail: 'Charte verte du SNJ (logo d\'origine)', embleme: 'logo_snj.png' },
  OR: { libelle: 'Écusson', detail: 'Charte noir et or', embleme: 'logo_snj_or.svg' }
};

/**
 * Logo de l'application, choisi par l'administrateur pour tous les utilisateurs.
 * Le choix pose l'attribut data-charte sur <html> : toutes les couleurs de la charte suivent le logo.
 */
@Injectable({ providedIn: 'root' })
export class ApparenceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/apparence`;

  readonly logo = signal<LogoApplication>(lireMemorise());

  /** Applique le choix mémorisé tout de suite, puis celui du serveur. */
  initialiser(): void {
    this.appliquer(this.logo());
    this.http.get<ApparenceDTO>(this.apiUrl).subscribe({ next: a => this.appliquer(a.logo ?? 'VERT'), error: () => undefined });
  }

  changer(logo: LogoApplication): Observable<ApparenceDTO> {
    return this.http.put<ApparenceDTO>(this.apiUrl, { logo }).pipe(tap(a => this.appliquer(a.logo ?? logo)));
  }

  private appliquer(logo: LogoApplication): void {
    this.logo.set(logo);
    if (typeof document === 'undefined') return;
    document.documentElement.dataset['charte'] = logo === 'OR' ? 'or' : 'vert';
    const icone = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (icone) {
      icone.href = LOGOS[logo].embleme;
      icone.type = logo === 'OR' ? 'image/svg+xml' : 'image/png';
    }
    try { localStorage.setItem(CLE_CHARTE, logo); } catch { /* stockage indisponible */ }
  }
}

function lireMemorise(): LogoApplication {
  try { return localStorage.getItem(CLE_CHARTE) === 'OR' ? 'OR' : 'VERT'; } catch { return 'VERT'; }
}
