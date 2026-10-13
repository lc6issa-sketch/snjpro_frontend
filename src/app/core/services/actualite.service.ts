import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environments } from '../../../environments/environments';
import { ActualiteDTOs, CategorieActualite, StatutActualite } from '../../models/api.models';
import { formulaire, toParams, urlLocale } from '../../shared/utils/http';

/** Actualités. */
@Injectable({ providedIn: 'root' })
export class ActualiteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/actualites`;

  lister(statut?: StatutActualite | null, categorie?: CategorieActualite | null, recherche?: string): Observable<ActualiteDTOs.Resume[]> {
    return this.http.get<ActualiteDTOs.Resume[]>(this.apiUrl, { params: toParams({ statut, categorie, recherche }) });
  }

  compteurs(): Observable<ActualiteDTOs.Compteurs> {
    return this.http.get<ActualiteDTOs.Compteurs>(`${this.apiUrl}/compteurs`);
  }

  obtenir(id: number): Observable<ActualiteDTOs.Detail> {
    return this.http.get<ActualiteDTOs.Detail>(`${this.apiUrl}/${id}`);
  }

  creer(e: ActualiteDTOs.Edition): Observable<ActualiteDTOs.Detail> {
    return this.http.post<ActualiteDTOs.Detail>(this.apiUrl, e);
  }

  modifier(id: number, e: ActualiteDTOs.Edition): Observable<ActualiteDTOs.Detail> {
    return this.http.put<ActualiteDTOs.Detail>(`${this.apiUrl}/${id}`, e);
  }

  publier(id: number): Observable<ActualiteDTOs.Detail> {
    return this.http.post<ActualiteDTOs.Detail>(`${this.apiUrl}/${id}/publier`, {});
  }

  archiver(id: number): Observable<ActualiteDTOs.Detail> {
    return this.http.post<ActualiteDTOs.Detail>(`${this.apiUrl}/${id}/archiver`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  changerImage(id: number, fichier: File): Observable<ActualiteDTOs.Detail> {
    return this.http.post<ActualiteDTOs.Detail>(`${this.apiUrl}/${id}/image`, formulaire({ fichier }));
  }

  /** Image de couverture sous forme d'URL locale (blob:). */
  imageUrl(id: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/${id}/image`, { responseType: 'blob' }).pipe(map(urlLocale));
  }

  inscrits(id: number): Observable<ActualiteDTOs.Inscrit[]> {
    return this.http.get<ActualiteDTOs.Inscrit[]>(`${this.apiUrl}/${id}/inscrits`);
  }
}
