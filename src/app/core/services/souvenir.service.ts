import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environments } from '../../../environments/environments';
import { Page, SouvenirDTOs, StatutSouvenir, TypeMedia } from '../../models/api.models';
import { formulaire, toParams, urlLocale } from '../../shared/utils/http';

type FiltresSouvenirs = { cohorteId?: number | null; statut?: StatutSouvenir | null; type?: TypeMedia | null; recherche?: string };

/** Souvenirs de formation : photos, vidéos et sons (publication, modération, lecture des fichiers). */
@Injectable({ providedIn: 'root' })
export class SouvenirService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/souvenirs`;

  lister(f: FiltresSouvenirs, page = 0, size = 12): Observable<Page<SouvenirDTOs.Resume>> {
    return this.http.get<Page<SouvenirDTOs.Resume>>(this.apiUrl, { params: toParams({ ...f, page, size }) });
  }

  statistiques(cohorteId?: number | null): Observable<SouvenirDTOs.Statistiques> {
    return this.http.get<SouvenirDTOs.Statistiques>(`${this.apiUrl}/statistiques`, { params: toParams({ cohorteId }) });
  }

  obtenir(id: number): Observable<SouvenirDTOs.Resume> {
    return this.http.get<SouvenirDTOs.Resume>(`${this.apiUrl}/${id}`);
  }

  /** Publication avec suivi de progression (vidéos volumineuses). */
  creer(e: SouvenirDTOs.Edition, fichiers: File[]): Observable<HttpEvent<SouvenirDTOs.Resume>> {
    const corps = formulaire({
      titre: e.titre, legende: e.legende, cohorteId: e.cohorteId, datePrise: e.datePrise, lieu: e.lieu, visibleTous: !!e.visibleTous, fichiers
    });
    return this.http.post<SouvenirDTOs.Resume>(this.apiUrl, corps, { reportProgress: true, observe: 'events' });
  }

  modifier(id: number, e: SouvenirDTOs.Edition): Observable<SouvenirDTOs.Resume> {
    return this.http.put<SouvenirDTOs.Resume>(`${this.apiUrl}/${id}`, e);
  }

  ajouterMedias(id: number, fichiers: File[]): Observable<HttpEvent<SouvenirDTOs.Resume>> {
    return this.http.post<SouvenirDTOs.Resume>(`${this.apiUrl}/${id}/medias`, formulaire({ fichiers }), { reportProgress: true, observe: 'events' });
  }

  supprimerMedia(id: number, mediaId: number): Observable<SouvenirDTOs.Resume> {
    return this.http.delete<SouvenirDTOs.Resume>(`${this.apiUrl}/${id}/medias/${mediaId}`);
  }

  valider(id: number): Observable<SouvenirDTOs.Resume> {
    return this.http.post<SouvenirDTOs.Resume>(`${this.apiUrl}/${id}/valider`, {});
  }

  rejeter(id: number, motif: string): Observable<SouvenirDTOs.Resume> {
    return this.http.post<SouvenirDTOs.Resume>(`${this.apiUrl}/${id}/rejeter`, { motif });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /** URL locale (blob:) d'une photo / vidéo / son, téléchargé avec le jeton. */
  fichier(mediaId: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/medias/${mediaId}/fichier`, { responseType: 'blob' }).pipe(map(urlLocale));
  }

  /** Image de couverture d'une vidéo ou d'un son (remplace l'ancienne). */
  definirCouverture(id: number, mediaId: number, image: File): Observable<SouvenirDTOs.Resume> {
    return this.http.post<SouvenirDTOs.Resume>(`${this.apiUrl}/${id}/medias/${mediaId}/couverture`, formulaire({ image }));
  }

  supprimerCouverture(id: number, mediaId: number): Observable<SouvenirDTOs.Resume> {
    return this.http.delete<SouvenirDTOs.Resume>(`${this.apiUrl}/${id}/medias/${mediaId}/couverture`);
  }

  /** URL locale (blob:) de l'image de couverture d'une vidéo ou d'un son. */
  couverture(mediaId: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/medias/${mediaId}/couverture`, { responseType: 'blob' }).pipe(map(urlLocale));
  }
}
