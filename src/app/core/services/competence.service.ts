import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../../environments/environments';
import { CompetenceReferentielDTOs } from '../../models/api.models';
import { toParams } from '../../shared/utils/http';

/** Référentiel des compétences. */
@Injectable({ providedIn: 'root' })
export class CompetenceService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/competences`;

  /** toutes = false : un responsable de cohorte ne reçoit que les compétences des membres de sa cohorte. */
  lister(categorie?: string | null, recherche?: string, tri = 'MEMBRES', toutes = false): Observable<CompetenceReferentielDTOs.Competence[]> {
    return this.http.get<CompetenceReferentielDTOs.Competence[]>(this.apiUrl, { params: toParams({ categorie, recherche, tri, toutes }) });
  }

  categories(toutes = false): Observable<CompetenceReferentielDTOs.Categorie[]> {
    return this.http.get<CompetenceReferentielDTOs.Categorie[]>(`${this.apiUrl}/categories`, { params: toParams({ toutes }) });
  }

  obtenir(id: number): Observable<CompetenceReferentielDTOs.Competence> {
    return this.http.get<CompetenceReferentielDTOs.Competence>(`${this.apiUrl}/${id}`);
  }

  detenteurs(id: number): Observable<CompetenceReferentielDTOs.Detenteur[]> {
    return this.http.get<CompetenceReferentielDTOs.Detenteur[]>(`${this.apiUrl}/${id}/membres`);
  }

  creer(d: CompetenceReferentielDTOs.Edition): Observable<CompetenceReferentielDTOs.Competence> {
    return this.http.post<CompetenceReferentielDTOs.Competence>(this.apiUrl, d);
  }

  modifier(id: number, d: CompetenceReferentielDTOs.Edition): Observable<CompetenceReferentielDTOs.Competence> {
    return this.http.put<CompetenceReferentielDTOs.Competence>(`${this.apiUrl}/${id}`, d);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  synchroniser(): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/synchroniser`, {});
  }
}
