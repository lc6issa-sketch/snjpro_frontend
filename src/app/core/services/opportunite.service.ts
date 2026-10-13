import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../../environments/environments';
import { OpportuniteDTOs, StatutCandidature, StatutOpportunite, TypeOpportunite } from '../../models/api.models';
import { toParams } from '../../shared/utils/http';

/** Opportunités d'emploi, de stage et de formation. */
@Injectable({ providedIn: 'root' })
export class OpportuniteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/opportunites`;

  lister(type?: TypeOpportunite | null, statut?: StatutOpportunite | null, recherche?: string): Observable<OpportuniteDTOs.Resume[]> {
    return this.http.get<OpportuniteDTOs.Resume[]>(this.apiUrl, { params: toParams({ type, statut, recherche }) });
  }

  compteurs(): Observable<OpportuniteDTOs.Compteurs> {
    return this.http.get<OpportuniteDTOs.Compteurs>(`${this.apiUrl}/compteurs`);
  }

  correspondances(competences: string[], region?: string): Observable<{ nombreMembres?: number; [k: string]: unknown }> {
    return this.http.get<{ nombreMembres?: number; [k: string]: unknown }>(`${this.apiUrl}/correspondances`, { params: toParams({ competences, region }) });
  }

  obtenir(id: number): Observable<OpportuniteDTOs.Detail> {
    return this.http.get<OpportuniteDTOs.Detail>(`${this.apiUrl}/${id}`);
  }

  creer(e: OpportuniteDTOs.Edition): Observable<OpportuniteDTOs.Detail> {
    return this.http.post<OpportuniteDTOs.Detail>(this.apiUrl, e);
  }

  modifier(id: number, e: OpportuniteDTOs.Edition): Observable<OpportuniteDTOs.Detail> {
    return this.http.put<OpportuniteDTOs.Detail>(`${this.apiUrl}/${id}`, e);
  }

  publier(id: number): Observable<OpportuniteDTOs.Detail> {
    return this.http.post<OpportuniteDTOs.Detail>(`${this.apiUrl}/${id}/publier`, {});
  }

  cloturer(id: number): Observable<OpportuniteDTOs.Detail> {
    return this.http.post<OpportuniteDTOs.Detail>(`${this.apiUrl}/${id}/cloturer`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  candidatures(id: number): Observable<OpportuniteDTOs.CandidatureDTO[]> {
    return this.http.get<OpportuniteDTOs.CandidatureDTO[]>(`${this.apiUrl}/${id}/candidatures`);
  }

  statutCandidature(id: number, statut: StatutCandidature): Observable<OpportuniteDTOs.CandidatureDTO> {
    return this.http.patch<OpportuniteDTOs.CandidatureDTO>(`${this.apiUrl}/candidatures/${id}/statut`, {}, { params: toParams({ statut }) });
  }
}
