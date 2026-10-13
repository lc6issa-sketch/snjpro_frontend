import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../../environments/environments';
import { StatistiqueDTOs } from '../../models/api.models';

/** Chiffres du tableau de bord. */
@Injectable({ providedIn: 'root' })
export class StatistiqueService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environments.apiUrl;

  tableauDeBord(): Observable<StatistiqueDTOs.TableauDeBord> {
    return this.http.get<StatistiqueDTOs.TableauDeBord>(`${this.apiUrl}/tableau-de-bord`);
  }
}
