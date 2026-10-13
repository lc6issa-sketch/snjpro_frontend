import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { FormatFichier, Historique, Page } from '../../models/api.models';
import { enregistrerFichier, toParams } from '../../shared/utils/http';

type FiltresHistorique = { utilisateur?: string; action?: string; entite?: string; entiteId?: number; du?: string; au?: string; recherche?: string };

/** Journal des opérations. */
@Injectable({ providedIn: 'root' })
export class HistoriqueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/historique`;

  lister(f: FiltresHistorique, page = 0, size = 11): Observable<Page<Historique.OperationDTO>> {
    return this.http.get<Page<Historique.OperationDTO>>(this.apiUrl, { params: toParams({ ...f, page, size, sort: 'dateAction,desc' }) });
  }

  obtenir(id: number): Observable<Historique.OperationDTO> {
    return this.http.get<Historique.OperationDTO>(`${this.apiUrl}/${id}`);
  }

  restaurer(id: number): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/${id}/restaurer`, {});
  }

  exporter(f: Omit<FiltresHistorique, 'entiteId'>, format: FormatFichier = 'XLSX'): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/export`, { params: toParams({ ...f, format }), responseType: 'blob', observe: 'response' })
      .pipe(tap(enregistrerFichier));
  }
}
