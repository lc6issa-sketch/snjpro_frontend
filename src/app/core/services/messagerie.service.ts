import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import { MessagerieDTOs, Page } from '../../models/api.models';
import { enregistrerFichier, formulaire, toParams } from '../../shared/utils/http';

/** Messagerie. */
@Injectable({ providedIn: 'root' })
export class MessagerieService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/messagerie`;

  conversations(recherche?: string): Observable<MessagerieDTOs.ConversationDTO[]> {
    return this.http.get<MessagerieDTOs.ConversationDTO[]>(`${this.apiUrl}/conversations`, { params: toParams({ recherche }) });
  }

  nonLus(): Observable<{ nonLus: number }> {
    return this.http.get<{ nonLus: number }>(`${this.apiUrl}/non-lus`);
  }

  creer(c: MessagerieDTOs.NouvelleConversation): Observable<MessagerieDTOs.ConversationDTO> {
    return this.http.post<MessagerieDTOs.ConversationDTO>(`${this.apiUrl}/conversations`, c);
  }

  groupeCohorte(): Observable<MessagerieDTOs.ConversationDTO> {
    return this.http.post<MessagerieDTOs.ConversationDTO>(`${this.apiUrl}/conversations/cohorte`, {});
  }

  messages(id: number, page = 0, size = 50): Observable<Page<MessagerieDTOs.MessageDTO>> {
    return this.http.get<Page<MessagerieDTOs.MessageDTO>>(`${this.apiUrl}/conversations/${id}/messages`, { params: toParams({ page, size }) });
  }

  envoyer(id: number, contenu: string): Observable<MessagerieDTOs.MessageDTO> {
    return this.http.post<MessagerieDTOs.MessageDTO>(`${this.apiUrl}/conversations/${id}/messages`, { contenu });
  }

  envoyerFichier(id: number, fichier: File, contenu?: string): Observable<MessagerieDTOs.MessageDTO> {
    return this.http.post<MessagerieDTOs.MessageDTO>(`${this.apiUrl}/conversations/${id}/pieces-jointes`, formulaire({ fichier, contenu }));
  }

  telechargerPieceJointe(messageId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/messages/${messageId}/piece-jointe`, { responseType: 'blob', observe: 'response' })
      .pipe(tap(enregistrerFichier));
  }

  contacts(recherche?: string): Observable<MessagerieDTOs.Contact[]> {
    return this.http.get<MessagerieDTOs.Contact[]>(`${this.apiUrl}/contacts`, { params: toParams({ recherche }) });
  }
}
