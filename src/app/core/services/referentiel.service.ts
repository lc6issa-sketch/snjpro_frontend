import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environments } from '../../../environments/environments';

/** Listes de valeurs des formulaires (mises en cache pour la session). */
@Injectable({ providedIn: 'root' })
export class ReferentielService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/referentiels`;
  private readonly cache = new Map<string, Observable<string[]>>();

  regionsMali(): Observable<string[]> { return this.liste('regions-mali'); }
  regions(): Observable<string[]> { return this.liste('regions'); }
  competences(): Observable<string[]> { return this.liste('competences'); }
  professions(): Observable<string[]> { return this.liste('professions'); }
  centres(): Observable<string[]> { return this.liste('centres'); }
  diplomes(): Observable<string[]> { return this.liste('diplomes'); }
  groupesSanguins(): Observable<string[]> { return this.liste('groupes-sanguins'); }

  private liste(nom: string): Observable<string[]> {
    if (!this.cache.has(nom)) this.cache.set(nom, this.http.get<string[]>(`${this.apiUrl}/${nom}`).pipe(shareReplay(1)));
    return this.cache.get(nom)!;
  }
}
