import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { ActiviteDTOs, FormatFichier, Page, StatutActivite } from '../../models/api.models';
import { enregistrerFichier, toParams } from '../../shared/utils/http';

/** Activités et présences. */
@Injectable({ providedIn: 'root' })
export class ActiviteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/activites`;

  lister(statut?: StatutActivite | null, annee?: number, mois?: number): Observable<ActiviteDTOs.Resume[]> {
    return this.http.get<ActiviteDTOs.Resume[]>(this.apiUrl, { params: toParams({ statut, annee, mois }) });
  }

  obtenir(id: number): Observable<ActiviteDTOs.Resume> {
    return this.http.get<ActiviteDTOs.Resume>(`${this.apiUrl}/${id}`);
  }

  creer(e: ActiviteDTOs.Edition): Observable<ActiviteDTOs.Resume> {
    return this.http.post<ActiviteDTOs.Resume>(this.apiUrl, e);
  }

  modifier(id: number, e: ActiviteDTOs.Edition): Observable<ActiviteDTOs.Resume> {
    return this.http.put<ActiviteDTOs.Resume>(`${this.apiUrl}/${id}`, e);
  }

  terminer(id: number): Observable<ActiviteDTOs.Resume> {
    return this.http.post<ActiviteDTOs.Resume>(`${this.apiUrl}/${id}/terminer`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  qr(id: number): Observable<ActiviteDTOs.CodeQr> {
    return this.http.get<ActiviteDTOs.CodeQr>(`${this.apiUrl}/${id}/qr`);
  }

  projection(id: number): Observable<ActiviteDTOs.Projection> {
    return this.http.get<ActiviteDTOs.Projection>(`${this.apiUrl}/${id}/projection`);
  }

  presences(id: number, page = 0, size = 10): Observable<Page<ActiviteDTOs.PresenceDTO>> {
    return this.http.get<Page<ActiviteDTOs.PresenceDTO>>(`${this.apiUrl}/${id}/presences`, { params: toParams({ page, size, sort: 'dateHeure,desc' }) });
  }

  saisir(id: number, s: ActiviteDTOs.SaisieManuelle): Observable<ActiviteDTOs.PresenceDTO> {
    return this.http.post<ActiviteDTOs.PresenceDTO>(`${this.apiUrl}/${id}/presences`, s);
  }

  supprimerPresence(id: number, presenceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/presences/${presenceId}`);
  }

  exporter(id: number, format: FormatFichier = 'XLSX'): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/presences/export`, { params: toParams({ format }), responseType: 'blob', observe: 'response' })
      .pipe(tap(enregistrerFichier));
  }
}
