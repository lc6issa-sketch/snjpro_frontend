import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../../environments/environments';
import { AuthAvanceDTOs } from '../../models/api.models';
import { toParams } from '../../shared/utils/http';

/** Parcours publics : mot de passe oublié, invitation. */
@Injectable({ providedIn: 'root' })
export class AccesPublicService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/auth`;

  motDePasseOublie(email: string): Observable<{ message: string; codeDeveloppement?: string }> {
    return this.http.post<{ message: string; codeDeveloppement?: string }>(`${this.apiUrl}/mot-de-passe-oublie`, { email });
  }

  reinitialiser(jeton: string, nouveauMotDePasse: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/reinitialiser`, { jeton, nouveauMotDePasse });
  }

  infoInvitation(jeton: string): Observable<AuthAvanceDTOs.InfoInvitation> {
    return this.http.get<AuthAvanceDTOs.InfoInvitation>(`${this.apiUrl}/invitation`, { params: toParams({ jeton }) });
  }

  accepterInvitation(a: AuthAvanceDTOs.AcceptationInvitation): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/invitation/accepter`, a);
  }
}
