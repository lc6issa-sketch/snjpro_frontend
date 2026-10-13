import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../../environments/environments';
import { CibleNotification, NotificationDTOs, Page } from '../../models/api.models';
import { toParams } from '../../shared/utils/http';

/** Notifications aux membres et alertes du personnel. */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/notifications`;
  private readonly alertesUrl = `${environments.apiUrl}/alertes`;

  envoyer(e: NotificationDTOs.Envoi): Observable<NotificationDTOs.Resume> {
    return this.http.post<NotificationDTOs.Resume>(this.apiUrl, e);
  }

  historique(page = 0, size = 20): Observable<Page<NotificationDTOs.Resume>> {
    return this.http.get<Page<NotificationDTOs.Resume>>(this.apiUrl, { params: toParams({ page, size, sort: 'dateCreation,desc' }) });
  }

  statistiques(): Observable<NotificationDTOs.Statistiques> {
    return this.http.get<NotificationDTOs.Statistiques>(`${this.apiUrl}/statistiques`);
  }

  estimer(cible: CibleNotification, valeurs: string[], sms: boolean): Observable<NotificationDTOs.Estimation> {
    return this.http.get<NotificationDTOs.Estimation>(`${this.apiUrl}/estimation`, { params: toParams({ cible, valeurs, sms }) });
  }

  envoyerBrouillon(id: number): Observable<NotificationDTOs.Resume> {
    return this.http.post<NotificationDTOs.Resume>(`${this.apiUrl}/${id}/envoyer`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Alertes du personnel (cloche de la barre du haut)
  alertes(nonLues = false, page = 0, size = 10): Observable<Page<NotificationDTOs.Alerte>> {
    return this.http.get<Page<NotificationDTOs.Alerte>>(this.alertesUrl, { params: toParams({ nonLues, page, size }) });
  }

  alertesNonLues(): Observable<{ nonLues: number }> {
    return this.http.get<{ nonLues: number }>(`${this.alertesUrl}/non-lues`);
  }

  alerteLue(id: number): Observable<NotificationDTOs.Alerte> {
    return this.http.patch<NotificationDTOs.Alerte>(`${this.alertesUrl}/${id}/lu`, {});
  }

  toutLu(): Observable<unknown> {
    return this.http.patch<unknown>(`${this.alertesUrl}/tout-lu`, {});
  }
}
