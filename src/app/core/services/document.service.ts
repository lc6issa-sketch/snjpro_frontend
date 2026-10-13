import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { DocumentDTOs, VisibiliteDocument } from '../../models/api.models';
import { enregistrerFichier, formulaire, toParams } from '../../shared/utils/http';

/** Documents partagés. */
@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/documents`;

  dossiers(): Observable<DocumentDTOs.DossierDTO[]> {
    return this.http.get<DocumentDTOs.DossierDTO[]>(`${this.apiUrl}/dossiers`);
  }

  creerDossier(d: DocumentDTOs.DossierEdition): Observable<DocumentDTOs.DossierDTO> {
    return this.http.post<DocumentDTOs.DossierDTO>(`${this.apiUrl}/dossiers`, d);
  }

  supprimerDossier(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/dossiers/${id}`);
  }

  lister(dossierId?: number | null, visibilite?: VisibiliteDocument | null, recherche?: string): Observable<DocumentDTOs.DocumentDTO[]> {
    return this.http.get<DocumentDTOs.DocumentDTO[]>(this.apiUrl, { params: toParams({ dossierId, visibilite, recherche }) });
  }

  espace(): Observable<DocumentDTOs.Espace> {
    return this.http.get<DocumentDTOs.Espace>(`${this.apiUrl}/espace`);
  }

  /** Téléversement avec suivi de progression (barre « 72 % »). */
  televerser(fichier: File, titre: string, dossierId?: number | null, visibilite?: VisibiliteDocument): Observable<HttpEvent<DocumentDTOs.DocumentDTO>> {
    return this.http.post<DocumentDTOs.DocumentDTO>(this.apiUrl, formulaire({ fichier, titre, dossierId: dossierId ?? undefined, visibilite }), {
      reportProgress: true, observe: 'events'
    });
  }

  modifier(id: number, d: DocumentDTOs.DocumentEdition): Observable<DocumentDTOs.DocumentDTO> {
    return this.http.put<DocumentDTOs.DocumentDTO>(`${this.apiUrl}/${id}`, d);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  telecharger(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/telecharger`, { responseType: 'blob', observe: 'response' }).pipe(tap(enregistrerFichier));
  }

  verifier(id: number, verifie: boolean): Observable<DocumentDTOs.DocumentDTO> {
    return this.http.patch<DocumentDTOs.DocumentDTO>(`${this.apiUrl}/${id}/verification`, {}, { params: toParams({ verifie }) });
  }
}
