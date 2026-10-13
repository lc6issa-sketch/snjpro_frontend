import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { FormatFichier, MobilisationDTOs, Page, ReponseMobilisation, StatutMobilisation } from '../../models/api.models';
import { enregistrerFichier, toParams } from '../../shared/utils/http';

/** Mobilisations. */
@Injectable({ providedIn: 'root' })
export class MobilisationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/mobilisations`;

  lister(statut?: StatutMobilisation | null, recherche?: string): Observable<MobilisationDTOs.Resume[]> {
    return this.http.get<MobilisationDTOs.Resume[]>(this.apiUrl, { params: toParams({ statut, recherche }) });
  }

  statistiques(): Observable<MobilisationDTOs.Statistiques> {
    return this.http.get<MobilisationDTOs.Statistiques>(`${this.apiUrl}/statistiques`);
  }

  obtenir(id: number): Observable<MobilisationDTOs.Detail> {
    return this.http.get<MobilisationDTOs.Detail>(`${this.apiUrl}/${id}`);
  }

  creer(d: MobilisationDTOs.Informations): Observable<MobilisationDTOs.Detail> {
    return this.http.post<MobilisationDTOs.Detail>(this.apiUrl, d);
  }

  modifier(id: number, d: MobilisationDTOs.Informations): Observable<MobilisationDTOs.Detail> {
    return this.http.put<MobilisationDTOs.Detail>(`${this.apiUrl}/${id}`, d);
  }

  criteres(id: number, c: MobilisationDTOs.Criteres): Observable<MobilisationDTOs.Detail> {
    return this.http.put<MobilisationDTOs.Detail>(`${this.apiUrl}/${id}/criteres`, c);
  }

  apercu(id: number, limite = 50): Observable<MobilisationDTOs.Apercu> {
    return this.http.get<MobilisationDTOs.Apercu>(`${this.apiUrl}/${id}/apercu`, { params: toParams({ limite }) });
  }

  envoyer(id: number, e: MobilisationDTOs.Envoi): Observable<MobilisationDTOs.Detail> {
    return this.http.post<MobilisationDTOs.Detail>(`${this.apiUrl}/${id}/envoyer`, e);
  }

  participants(id: number, reponse: ReponseMobilisation | null, page = 0, size = 8): Observable<Page<MobilisationDTOs.Participant>> {
    return this.http.get<Page<MobilisationDTOs.Participant>>(`${this.apiUrl}/${id}/participants`, { params: toParams({ reponse, page, size }) });
  }

  exporterParticipants(id: number, reponse: ReponseMobilisation | null, format: FormatFichier = 'XLSX'): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/participants/export`, { params: toParams({ reponse, format }), responseType: 'blob', observe: 'response' })
      .pipe(tap(enregistrerFichier));
  }

  relancer(id: number): Observable<MobilisationDTOs.Detail> {
    return this.http.post<MobilisationDTOs.Detail>(`${this.apiUrl}/${id}/relancer`, {});
  }

  cloturer(id: number, c: MobilisationDTOs.Cloture): Observable<MobilisationDTOs.Detail> {
    return this.http.post<MobilisationDTOs.Detail>(`${this.apiUrl}/${id}/cloturer`, c);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
