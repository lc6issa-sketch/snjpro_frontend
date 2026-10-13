import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { DecisionDoublon, FormatFichier, ImportAssistantDTOs, Page } from '../../models/api.models';
import { enregistrerFichier, formulaire, toParams } from '../../shared/utils/http';

/** Assistant d'import en 4 étapes. */
@Injectable({ providedIn: 'root' })
export class ImportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/import`;

  analyser(fichier: File, cohorteId: number): Observable<ImportAssistantDTOs.Analyse> {
    return this.http.post<ImportAssistantDTOs.Analyse>(`${this.apiUrl}/sessions`, formulaire({ fichier }), { params: toParams({ cohorteId }) });
  }

  sessions(page = 0, size = 5): Observable<Page<ImportAssistantDTOs.Session>> {
    return this.http.get<Page<ImportAssistantDTOs.Session>>(`${this.apiUrl}/sessions`, { params: toParams({ page, size }) });
  }

  obtenir(id: number): Observable<ImportAssistantDTOs.Analyse> {
    return this.http.get<ImportAssistantDTOs.Analyse>(`${this.apiUrl}/sessions/${id}`);
  }

  correspondance(id: number, correspondance: Record<string, string | null>): Observable<ImportAssistantDTOs.Analyse> {
    return this.http.put<ImportAssistantDTOs.Analyse>(`${this.apiUrl}/sessions/${id}/correspondance`, { correspondance });
  }

  verifier(id: number): Observable<ImportAssistantDTOs.Verification> {
    return this.http.post<ImportAssistantDTOs.Verification>(`${this.apiUrl}/sessions/${id}/verification`, {});
  }

  decider(id: number, ligne: number, decision: DecisionDoublon): Observable<ImportAssistantDTOs.DoublonLigne> {
    return this.http.put<ImportAssistantDTOs.DoublonLigne>(`${this.apiUrl}/sessions/${id}/doublons/${ligne}`, { decision });
  }

  deciderTous(id: number, decision: DecisionDoublon): Observable<ImportAssistantDTOs.Verification> {
    return this.http.put<ImportAssistantDTOs.Verification>(`${this.apiUrl}/sessions/${id}/doublons`, { decision });
  }

  importer(id: number): Observable<ImportAssistantDTOs.Resultat> {
    return this.http.post<ImportAssistantDTOs.Resultat>(`${this.apiUrl}/sessions/${id}/importer`, {});
  }

  exporterErreurs(id: number, format: FormatFichier = 'XLSX'): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/sessions/${id}/erreurs/export`, { params: toParams({ format }), responseType: 'blob', observe: 'response' })
      .pipe(tap(enregistrerFichier));
  }

  rapport(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/sessions/${id}/rapport`, { responseType: 'blob', observe: 'response' }).pipe(tap(enregistrerFichier));
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/sessions/${id}`);
  }
}
