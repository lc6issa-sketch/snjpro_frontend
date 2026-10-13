import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../../environments/environments';
import { RechercheGlobale } from '../../models/api.models';
import { toParams } from '../../shared/utils/http';

/** Recherche globale (palette Ctrl K). */
@Injectable({ providedIn: 'root' })
export class RechercheService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/recherche`;

  rechercher(q: string, limite = 5): Observable<RechercheGlobale.Resultats> {
    return this.http.get<RechercheGlobale.Resultats>(this.apiUrl, { params: toParams({ q, limite }) });
  }
}
