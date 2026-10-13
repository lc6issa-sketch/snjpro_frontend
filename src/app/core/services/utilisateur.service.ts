import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environments } from '../../../environments/environments';
import { InvitationDTO, RoleDTOs, RoleEnum, UserDTO, UserResponseDTO } from '../../models/api.models';
import { toParams } from '../../shared/utils/http';

/** Comptes du personnel, invitations, rôles et permissions. */
@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/utilisateurs`;

  lister(role?: RoleEnum | null, actif?: boolean | null, recherche?: string): Observable<UserResponseDTO[]> {
    return this.http.get<UserResponseDTO[]>(this.apiUrl, { params: toParams({ role, actif, recherche }) });
  }

  obtenir(id: number): Observable<UserResponseDTO> {
    return this.http.get<UserResponseDTO>(`${this.apiUrl}/${id}`);
  }

  modifier(id: number, d: UserDTO): Observable<UserResponseDTO> {
    return this.http.put<UserResponseDTO>(`${this.apiUrl}/${id}`, d);
  }

  activer(id: number, actif: boolean): Observable<UserResponseDTO> {
    return this.http.patch<UserResponseDTO>(`${this.apiUrl}/${id}/actif`, {}, { params: toParams({ actif }) });
  }

  reinitialiserMotDePasse(id: number, nouveauMotDePasse: string): Observable<unknown> {
    return this.http.patch<unknown>(`${this.apiUrl}/${id}/mot-de-passe`, { nouveauMotDePasse });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  inviter(i: InvitationDTO): Observable<UserResponseDTO> {
    return this.http.post<UserResponseDTO>(`${this.apiUrl}/invitations`, i);
  }

  invitations(): Observable<UserResponseDTO[]> {
    return this.http.get<UserResponseDTO[]>(`${this.apiUrl}/invitations`);
  }

  renvoyer(id: number): Observable<unknown> {
    return this.http.post<unknown>(`${this.apiUrl}/invitations/${id}/renvoyer`, {});
  }

  roles(): Observable<RoleDTOs.Role[]> {
    return this.http.get<RoleDTOs.Role[]>(`${this.apiUrl}/roles/detail`);
  }

  permissions(role: RoleEnum): Observable<RoleDTOs.Role> {
    return this.http.get<RoleDTOs.Role>(`${this.apiUrl}/roles/${role}/permissions`);
  }

  enregistrerPermissions(role: RoleEnum, permissions: RoleDTOs.Permission[]): Observable<RoleDTOs.Role> {
    return this.http.put<RoleDTOs.Role>(`${this.apiUrl}/roles/${role}/permissions`, { permissions });
  }
}
