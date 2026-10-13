import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../../environments/environments';
import { CohorteDTO, StatutCohorteEnum } from '../../models/api.models';
import { TableauCohorte } from '../../models/cohorte.model';
import { toParams } from '../../shared/utils/http';

/** Cohortes : liste, fiche, tableau de bord et changement de statut. */
@Injectable({ providedIn: 'root' })
export class CohorteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/cohortes`;

  lister(statut?: StatutCohorteEnum | null, nom?: string): Observable<CohorteDTO[]> {
    return this.http.get<CohorteDTO[]>(this.apiUrl, { params: toParams({ statut, nom }) });
  }

  compteurs(): Observable<Record<string, number>> {
    return this.http.get<Record<string, number>>(`${this.apiUrl}/compteurs`);
  }

  obtenir(id: number): Observable<CohorteDTO> {
    return this.http.get<CohorteDTO>(`${this.apiUrl}/${id}`);
  }

  tableauDeBord(id: number): Observable<TableauCohorte> {
    return this.http.get<TableauCohorte>(`${this.apiUrl}/${id}/tableau-de-bord`);
  }

  creer(dto: CohorteDTO): Observable<CohorteDTO> {
    return this.http.post<CohorteDTO>(this.apiUrl, dto);
  }

  modifier(id: number, dto: CohorteDTO): Observable<CohorteDTO> {
    return this.http.put<CohorteDTO>(`${this.apiUrl}/${id}`, dto);
  }

  changerStatut(id: number, statut: StatutCohorteEnum, dateEffet?: string, motif?: string, notifierMembres = true): Observable<CohorteDTO> {
    return this.http.patch<CohorteDTO>(`${this.apiUrl}/${id}/statut`, {}, { params: toParams({ statut, dateEffet, motif, notifierMembres }) });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
