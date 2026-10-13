import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, of, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { AuthAvanceDTOs, AuthResponse, RoleDTOs, RoleEnum } from '../../models/api.models';
import { DeuxiemeFacteur } from '../../models/auth.model';
import { LIBELLES_ROLES } from '../../shared/utils/libelles';

const CLE_SESSION = 'snjpro.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/auth`;
  private readonly router = inject(Router);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  readonly utilisateur = signal<AuthResponse | null>(this.lireSession());
  readonly permissions = signal<RoleDTOs.Permission[]>([]);
  readonly deuxiemeFacteur = signal<DeuxiemeFacteur | null>(null);

  readonly connecte = computed(() => !!this.utilisateur()?.token);
  readonly role = computed(() => this.utilisateur()?.role ?? null);
  readonly nomComplet = computed(() => {
    const u = this.utilisateur();
    return u ? `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || (u.username ?? '') : '';
  });
  readonly libelleRole = computed(() => {
    const r = this.role();
    return r ? LIBELLES_ROLES[r] : '';
  });

  get token(): string | null { return this.utilisateur()?.token ?? null; }

  /** Connexion par identifiant (nom d'utilisateur ou e-mail) et mot de passe. */
  login(identifiant: string, motDePasse: string, seSouvenir: boolean): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { username: identifiant, password: motDePasse }).pipe(
      tap(r => {
        if (r.deuxiemeFacteurRequis) {
          this.deuxiemeFacteur.set({ identifiant, telephoneMasque: r.telephoneMasque, seSouvenir });
        } else {
          this.ouvrirSession(r, seSouvenir);
        }
      })
    );
  }

  /** « Recevoir un code par SMS » : connexion sans mot de passe. */
  demanderCode(identifiant: string): Observable<Record<string, unknown>> {
    return this.http.post<Record<string, unknown>>(`${this.apiUrl}/login/code/demander`, { identifiant }).pipe(
      tap(() => {
        const actuel = this.deuxiemeFacteur();
        this.deuxiemeFacteur.set({ identifiant, telephoneMasque: actuel?.telephoneMasque, seSouvenir: actuel?.seSouvenir ?? true });
      })
    );
  }

  verifierCode(code: string, faireConfiance: boolean): Observable<AuthResponse> {
    const etape = this.deuxiemeFacteur();
    const corps: AuthAvanceDTOs.VerificationCodeConnexion = { identifiant: etape?.identifiant, code, faireConfianceAppareil: faireConfiance };
    return this.http.post<AuthResponse>(`${this.apiUrl}/login/code/verifier`, corps).pipe(
      tap(r => {
        this.ouvrirSession(r, etape?.seSouvenir ?? true);
        this.deuxiemeFacteur.set(null);
      })
    );
  }

  /** Déconnexion : le jeton est révoqué côté serveur puis la session locale est effacée. */
  logout(): void {
    const fin = () => { this.effacer(); this.router.navigateByUrl('/connexion'); };
    if (!this.token) { fin(); return; }
    this.http.post(`${this.apiUrl}/logout`, {}).pipe(catchError(() => of(null)), finalize(fin)).subscribe();
  }

  /** Recharge le profil connecté (nom, photo, rôle) et les permissions. */
  rafraichir(): Observable<AuthResponse | null> {
    return this.http.get<AuthResponse>(`${this.apiUrl}/me`).pipe(
      tap(me => this.utilisateur.update(u => (u ? { ...u, ...me, token: u.token } : u))),
      tap(() => this.sauvegarder()),
      tap(() => this.chargerPermissions()),
      catchError(() => of(null))
    );
  }

  chargerPermissions(): void {
    this.http.get<RoleDTOs.Permission[]>(`${this.apiUrl}/permissions`).pipe(catchError(() => of([]))).subscribe(p => this.permissions.set(p));
  }

  /** Mise à jour locale après modification du compte (Paramètres › Mon profil). */
  mettreAJour(partiel: Partial<AuthResponse>): void {
    this.utilisateur.update(u => (u ? { ...u, ...partiel } : u));
    this.sauvegarder();
  }

  aRole(...roles: RoleEnum[]): boolean {
    const r = this.role();
    return !!r && roles.includes(r);
  }

  /** Droit « voir » sur un module (MEMBRES, COHORTES…), d'après la matrice des permissions du rôle. */
  peutVoir(module: string): boolean {
    const p = this.permissions();
    if (!p.length) return true;
    return p.some(x => x.module === module && x.voir);
  }

  effacer(): void {
    this.utilisateur.set(null);
    this.permissions.set([]);
    if (this.navigateur) {
      localStorage.removeItem(CLE_SESSION);
      sessionStorage.removeItem(CLE_SESSION);
    }
  }

  private ouvrirSession(r: AuthResponse, seSouvenir: boolean): void {
    this.utilisateur.set(r);
    if (this.navigateur) {
      (seSouvenir ? localStorage : sessionStorage).setItem(CLE_SESSION, JSON.stringify(r));
      (seSouvenir ? sessionStorage : localStorage).removeItem(CLE_SESSION);
    }
    this.chargerPermissions();
  }

  private sauvegarder(): void {
    if (!this.navigateur) return;
    const u = this.utilisateur();
    const stockage = localStorage.getItem(CLE_SESSION) ? localStorage : sessionStorage;
    if (u) stockage.setItem(CLE_SESSION, JSON.stringify(u));
  }

  private lireSession(): AuthResponse | null {
    if (!this.navigateur) return null;
    try {
      const brut = localStorage.getItem(CLE_SESSION) ?? sessionStorage.getItem(CLE_SESSION);
      return brut ? (JSON.parse(brut) as AuthResponse) : null;
    } catch {
      return null;
    }
  }
}
