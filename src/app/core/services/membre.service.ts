import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { environments } from '../../../environments/environments';
import {
  CompetenceDTO, CompteMembreDTO, DocumentDTOs, EspaceMembreDTOs, Historique, LocalisationDTO, MembreDTO,
  MembreFilterDTO, MembreResponseDTO, Page, ParcoursSNJDTO, ProfilMembreDTO, SituationProfessionnelleDTO,
  StatistiqueDTOs, StatutMembreEnum, TypeDocument
} from '../../models/api.models';
import { CriteresDoublon, PaginationMembres } from '../../models/membre.model';
import { enregistrerFichier, formulaire, toParams, urlLocale } from '../../shared/utils/http';

/** Membres : fiche, recherche, profil complet, documents, historique, export. */
@Injectable({ providedIn: 'root' })
export class MembreService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environments.apiUrl}/membres`;

  rechercher(filtre: MembreFilterDTO, p: PaginationMembres = {}): Observable<Page<MembreResponseDTO>> {
    return this.http.post<Page<MembreResponseDTO>>(`${this.apiUrl}/filtres`, filtre, {
      params: toParams({ page: p.page ?? 0, size: p.size ?? 10, sort: p.sort ?? 'dateModification,desc' })
    });
  }

  obtenir(id: number): Observable<MembreResponseDTO> {
    return this.http.get<MembreResponseDTO>(`${this.apiUrl}/${id}`);
  }

  profil(id: number): Observable<ProfilMembreDTO> {
    return this.http.get<ProfilMembreDTO>(`${this.apiUrl}/${id}/profil`);
  }

  creer(dto: MembreDTO, forcer = false): Observable<MembreResponseDTO> {
    return this.http.post<MembreResponseDTO>(this.apiUrl, dto, { params: toParams({ forcer }) });
  }

  modifier(id: number, dto: MembreDTO): Observable<MembreResponseDTO> {
    return this.http.put<MembreResponseDTO>(`${this.apiUrl}/${id}`, dto);
  }

  archiver(id: number): Observable<MembreResponseDTO> {
    return this.http.patch<MembreResponseDTO>(`${this.apiUrl}/${id}/archiver`, {});
  }

  changerStatut(id: number, statut: StatutMembreEnum): Observable<MembreResponseDTO> {
    return this.http.patch<MembreResponseDTO>(`${this.apiUrl}/${id}/statut`, {}, { params: toParams({ statut }) });
  }

  disponibilite(id: number, disponible: boolean): Observable<MembreResponseDTO> {
    return this.http.patch<MembreResponseDTO>(`${this.apiUrl}/${id}/disponibilite`, {}, { params: toParams({ disponible }) });
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  creerCompte(id: number, dto: CompteMembreDTO): Observable<MembreResponseDTO> {
    return this.http.post<MembreResponseDTO>(`${this.apiUrl}/${id}/compte`, dto);
  }

  verifierDoublons(c: CriteresDoublon): Observable<{ doublonPotentiel: boolean; motifs: string[] }> {
    return this.http.get<{ doublonPotentiel: boolean; motifs: string[] }>(`${this.apiUrl}/doublons/verifier`, { params: toParams({ ...c }) });
  }

  identifiantSuivant(cohorteId: number): Observable<{ identifiantSnj: string }> {
    return this.http.get<{ identifiantSnj: string }>(`${this.apiUrl}/identifiant-suivant`, { params: toParams({ cohorteId }) });
  }

  changerPhoto(id: number, fichier: File): Observable<MembreResponseDTO> {
    return this.http.post<MembreResponseDTO>(`${this.apiUrl}/${id}/photo`, formulaire({ fichier }));
  }

  /** Photo du membre sous forme d'URL locale (blob:), téléchargée avec le jeton. */
  photoUrl(id: number): Observable<string> {
    return this.http.get(`${this.apiUrl}/${id}/photo`, { responseType: 'blob' }).pipe(map(urlLocale));
  }

  completude(id: number): Observable<EspaceMembreDTOs.Completude> {
    return this.http.get<EspaceMembreDTOs.Completude>(`${this.apiUrl}/${id}/completude`);
  }

  cvPdf(id: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.apiUrl}/${id}/cv/pdf`, { responseType: 'blob', observe: 'response' }).pipe(tap(enregistrerFichier));
  }

  // Profil détaillé
  situation(id: number, dto: SituationProfessionnelleDTO): Observable<SituationProfessionnelleDTO> {
    return this.http.put<SituationProfessionnelleDTO>(`${this.apiUrl}/${id}/profil/situation-professionnelle`, dto);
  }

  creerSituation(id: number, dto: SituationProfessionnelleDTO): Observable<SituationProfessionnelleDTO> {
    return this.http.post<SituationProfessionnelleDTO>(`${this.apiUrl}/${id}/profil/situation-professionnelle`, dto);
  }

  localisation(id: number, dto: LocalisationDTO): Observable<LocalisationDTO> {
    return this.http.put<LocalisationDTO>(`${this.apiUrl}/${id}/profil/localisation`, dto);
  }

  creerLocalisation(id: number, dto: LocalisationDTO): Observable<LocalisationDTO> {
    return this.http.post<LocalisationDTO>(`${this.apiUrl}/${id}/profil/localisation`, dto);
  }

  ajouterCompetence(id: number, dto: CompetenceDTO): Observable<CompetenceDTO> {
    return this.http.post<CompetenceDTO>(`${this.apiUrl}/${id}/profil/competences`, dto);
  }

  supprimerCompetence(id: number, competenceId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/profil/competences/${competenceId}`);
  }

  ajouterParcours(id: number, dto: ParcoursSNJDTO): Observable<ParcoursSNJDTO> {
    return this.http.post<ParcoursSNJDTO>(`${this.apiUrl}/${id}/profil/parcours`, dto);
  }

  modifierParcours(id: number, parcoursId: number, dto: ParcoursSNJDTO): Observable<ParcoursSNJDTO> {
    return this.http.put<ParcoursSNJDTO>(`${this.apiUrl}/${id}/profil/parcours/${parcoursId}`, dto);
  }

  supprimerParcours(id: number, parcoursId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}/profil/parcours/${parcoursId}`);
  }

  // Documents et historique de la fiche
  documents(id: number): Observable<DocumentDTOs.DocumentsMembre> {
    return this.http.get<DocumentDTOs.DocumentsMembre>(`${this.apiUrl}/${id}/documents`);
  }

  ajouterDocument(id: number, fichier: File, type: TypeDocument, titre?: string): Observable<DocumentDTOs.DocumentDTO> {
    return this.http.post<DocumentDTOs.DocumentDTO>(`${this.apiUrl}/${id}/documents`, formulaire({ fichier, type, titre }));
  }

  attestation(id: number): Observable<DocumentDTOs.DocumentDTO> {
    return this.http.post<DocumentDTOs.DocumentDTO>(`${this.apiUrl}/${id}/documents/attestation`, {});
  }

  historique(id: number, page = 0, size = 20): Observable<Page<Historique.OperationDTO>> {
    return this.http.get<Page<Historique.OperationDTO>>(`${this.apiUrl}/${id}/historique`, {
      params: toParams({ page, size, sort: 'dateAction,desc' })
    });
  }

  // Export
  estimerExport(e: StatistiqueDTOs.Export): Observable<StatistiqueDTOs.EstimationExport> {
    return this.http.post<StatistiqueDTOs.EstimationExport>(`${this.apiUrl}/export/estimation`, e);
  }

  exporter(e: StatistiqueDTOs.Export): Observable<HttpResponse<Blob>> {
    return this.http.post(`${this.apiUrl}/export`, e, { responseType: 'blob', observe: 'response' }).pipe(tap(enregistrerFichier));
  }
}
