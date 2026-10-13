import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { DemandeDTOs, StatutDemande, TypeDemande } from '../../models/api.models';
import { enregistrerFichier, toParams } from '../../shared/utils/http';

/** Demandes des membres. */
@Injectable({ providedIn: 'root' })
export class DemandeService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/demandes`;

  lister(statut?: StatutDemande | null, type?: TypeDemande | null, recherche?: string): Observable<DemandeDTOs.Resume[]> {
    return this.http.get<DemandeDTOs.Resume[]>(this.apiUrl, { params: toParams({ statut, type, recherche }) });
  }

  statistiques(): Observable<DemandeDTOs.Statistiques> {
    return this.http.get<DemandeDTOs.Statistiques>(`${this.apiUrl}/statistiques`);
  }

  obtenir(id: number): Observable<DemandeDTOs.Detail> {
    return this.http.get<DemandeDTOs.Detail>(`${this.apiUrl}/${id}`);
  }

  prendreEnCharge(id: number): Observable<DemandeDTOs.Detail> {
    return this.http.post<DemandeDTOs.Detail>(`${this.apiUrl}/${id}/prise-en-charge`, {});
  }

  valider(id: number, v: DemandeDTOs.Validation): Observable<DemandeDTOs.Detail> {
    return this.http.post<DemandeDTOs.Detail>(`${this.apiUrl}/${id}/valider`, v);
  }

  rejeter(id: number, r: DemandeDTOs.Rejet): Observable<DemandeDTOs.Detail> {
    return this.http.post<DemandeDTOs.Detail>(`${this.apiUrl}/${id}/rejeter`, r);
  }

  complement(id: number, c: DemandeDTOs.Complement): Observable<DemandeDTOs.Detail> {
    return this.http.post<DemandeDTOs.Detail>(`${this.apiUrl}/${id}/complement`, c);
  }

  pieceJointe(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/piece-jointe`, { responseType: 'blob', observe: 'response' }).pipe(tap(enregistrerFichier));
  }
}
