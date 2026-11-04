import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { FormatFichier, StatistiqueDTOs } from '../../models/api.models';
import { enregistrerFichier, toParams } from '../../shared/utils/http';

/** Chiffres du tableau de bord, statistiques détaillées et rapports. */
@Injectable({ providedIn: 'root' })
export class StatistiqueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environments.apiUrl;

  tableauDeBord(): Observable<StatistiqueDTOs.TableauDeBord> {
    return this.http.get<StatistiqueDTOs.TableauDeBord>(`${this.apiUrl}/tableau-de-bord`);
  }

  statistiques(f: StatistiqueDTOs.Filtres = {}): Observable<StatistiqueDTOs.Statistiques> {
    return this.http.get<StatistiqueDTOs.Statistiques>(`${this.apiUrl}/statistiques`, { params: toParams({ ...f }) });
  }

  /** Télécharge les statistiques filtrées (tracé dans l'historique). */
  exporter(f: StatistiqueDTOs.Filtres, format: FormatFichier): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/statistiques/export`, { params: toParams({ ...f, format }), responseType: 'blob', observe: 'response' })
      .pipe(tap(enregistrerFichier));
  }

  rapports(): Observable<StatistiqueDTOs.RapportDTO[]> {
    return this.http.get<StatistiqueDTOs.RapportDTO[]>(`${this.apiUrl}/rapports`);
  }

  genererRapport(d: StatistiqueDTOs.DemandeRapport): Observable<StatistiqueDTOs.RapportDTO> {
    return this.http.post<StatistiqueDTOs.RapportDTO>(`${this.apiUrl}/rapports`, d);
  }

  telechargerRapport(id: number): Observable<unknown> {
    return this.http.get(`${this.apiUrl}/rapports/${id}/telecharger`, { responseType: 'blob', observe: 'response' })
      .pipe(tap(enregistrerFichier));
  }
}
