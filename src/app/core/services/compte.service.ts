import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environments } from '../../../environments/environments';
import { AuthAvanceDTOs } from '../../models/api.models';
import { formulaire, urlLocale } from '../../shared/utils/http';

/** Mon compte (Paramètres) : profil, photo, mot de passe, sessions, préférences. */
@Injectable({ providedIn: 'root' })
export class CompteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/auth`;

  modifier(c: AuthAvanceDTOs.MonCompte): Observable<unknown> {
    return this.http.put<unknown>(`${this.apiUrl}/me`, c);
  }

  changerPhoto(fichier: File): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/me/photo`, formulaire({ fichier }));
  }

  /** Photo de l'utilisateur connecté sous forme d'URL locale (blob:). */
  photoUrl(): Observable<string> {
    return this.http.get(`${this.apiUrl}/me/photo`, { responseType: 'blob' }).pipe(map(urlLocale));
  }

  photoUtilisateurUrl(id: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/utilisateurs/${id}/photo`, { responseType: 'blob' }).pipe(map(urlLocale));
  }

  changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string): Observable<unknown> {
    return this.http.put<unknown>(`${this.apiUrl}/mot-de-passe`, { ancienMotDePasse, nouveauMotDePasse });
  }

  doubleAuthentification(d: AuthAvanceDTOs.DoubleAuthentification): Observable<unknown> {
    return this.http.put<unknown>(`${this.apiUrl}/double-authentification`, d);
  }

  sessions(): Observable<AuthAvanceDTOs.Session[]> {
    return this.http.get<AuthAvanceDTOs.Session[]>(`${this.apiUrl}/sessions`);
  }

  deconnecterSession(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${id}`);
  }

  deconnecterAutres(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions`);
  }

  /** Le backend renvoie directement la liste (List<Preference>), en lecture comme après enregistrement. */
  preferences(): Observable<AuthAvanceDTOs.Preference[]> {
    return this.http.get<AuthAvanceDTOs.Preference[]>(`${this.apiUrl}/preferences-notifications`);
  }

  enregistrerPreferences(p: AuthAvanceDTOs.Preferences): Observable<AuthAvanceDTOs.Preference[]> {
    return this.http.put<AuthAvanceDTOs.Preference[]>(`${this.apiUrl}/preferences-notifications`, p);
  }
}
