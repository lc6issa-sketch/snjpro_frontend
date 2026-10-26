import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { Router, RouterLink } from '@angular/router';
import { MembreService } from '../../../core/services/membre.service';
import { CohorteService } from '../../../core/services/cohorte.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CohorteDTO, CompetenceDTO, DocumentDTOs, EspaceMembreDTOs, Historique, NiveauCompetenceEnum, ParcoursSNJDTO, ProfilMembreDTO, TypeDocument } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { Pill } from '../../../shared/components/pill/pill';
import { Ring } from '../../../shared/components/charts/ring/ring';
import { Modal } from '../../../shared/components/modal/modal';
import { DateCourtePipe, DateHeurePipe, DateMoyennePipe, TelephonePipe } from '../../../shared/pipes/format.pipes';
import { NIVEAU_COMPETENCE, STATUT_COHORTE, STATUT_MEMBRE, STATUT_PROFESSIONNEL, TYPE_DOCUMENT, etiquetteAction } from '../../../shared/utils/libelles';
import { AjoutParcours } from '../ajout-parcours/ajout-parcours';
import { DocumentService } from '../../../core/services/document.service';
import { MessagerieService } from '../../../core/services/messagerie.service';
import { messageErreur } from '../../../shared/utils/http';
import { ConfirmationService } from '../../../core/services/confirmation.service';

type Onglet = 'apercu' | 'documents' | 'historique';

/** Écrans web 17 (Aperçu), 18 (Documents) et 19 (Historique) — Profil d'un membre. */
@Component({
  selector: 'app-profil-membre',
  imports: [FormsModule, RouterLink, Icon, Avatar, Pill, Ring, Modal, DateCourtePipe, DateHeurePipe, DateMoyennePipe, TelephonePipe, AjoutParcours],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profil-membre.html',
  styleUrl: './profil-membre.css'
})
export class ProfilMembre implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  private readonly service = inject(MembreService);
  private readonly cohorteService = inject(CohorteService);
  private readonly documentService = inject(DocumentService);
  private readonly messagerie = inject(MessagerieService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);

  protected readonly STATUT = STATUT_MEMBRE;
  protected readonly STATUT_COHORTE = STATUT_COHORTE;
  protected readonly STATUT_PRO = STATUT_PROFESSIONNEL;
  protected readonly NIVEAU = NIVEAU_COMPETENCE;
  protected readonly etiquetteAction = etiquetteAction;
  protected readonly typesDocument = TYPE_DOCUMENT;

  protected readonly onglet = signal<Onglet>('apercu');
  protected readonly profil = signal<ProfilMembreDTO | null>(null);
  protected readonly cohorte = signal<CohorteDTO | null>(null);
  protected readonly completude = signal<EspaceMembreDTOs.Completude | null>(null);
  protected readonly documents = signal<DocumentDTOs.DocumentsMembre | null>(null);
  protected readonly historique = signal<Historique.OperationDTO[]>([]);
  protected readonly totalHistorique = signal(0);
  protected readonly photo = signal<string | null>(null);
  protected readonly ajoutParcours = signal(false);
  protected readonly gestionCompetences = signal(false);
  protected readonly televersement = signal<TypeDocument | null>(null);
  protected nouvelleCompetence = '';
  protected nouveauNiveau: NiveauCompetenceEnum = 'INTERMEDIAIRE';
  protected titreDocument = '';
  protected fichierDocument: File | null = null;

  protected readonly m = computed(() => this.profil()?.membre ?? null);
  protected readonly nomComplet = computed(() => `${this.m()?.prenom ?? ''} ${this.m()?.nom ?? ''}`.trim());
  protected readonly peutModifier = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_COHORTE'));
  protected readonly parcours = computed(() => this.profil()?.parcours ?? []);
  protected readonly nbDocuments = computed(() => (this.documents()?.documents?.length ?? 0) + (this.documents()?.piecesManquantes?.length ?? 0));

  ngOnInit(): void {
    this.charger();
    this.service.documents(+this.id()).subscribe(d => this.documents.set(d));
    this.chargerHistorique();
  }

  ngOnDestroy(): void { const p = this.photo(); if (p) URL.revokeObjectURL(p); }

  protected charger(): void {
    const id = +this.id();
    this.service.profil(id).subscribe({
      next: p => {
        this.profil.set(p);
        if (p.membre?.cohorteId) this.cohorteService.obtenir(p.membre.cohorteId).subscribe(c => this.cohorte.set(c));
        if (p.membre?.photoUrl) this.service.photoUrl(id).subscribe({ next: u => this.photo.set(u), error: () => this.photo.set(null) });
      },
      error: e => { this.toast.error(messageErreur(e)); this.router.navigate(['/membres']); }
    });
    this.service.completude(id).subscribe(c => this.completude.set(c));
  }

  private chargerHistorique(): void {
    this.service.historique(+this.id(), 0, 20).subscribe(p => { this.historique.set(p.content ?? []); this.totalHistorique.set(p.totalElements ?? 0); });
  }

  // ------------------------------------------------------------ actions
  protected contacter(): void {
    this.messagerie.creer({ membreId: +this.id() }).subscribe({
      next: c => this.router.navigate(['/messagerie'], { queryParams: { conversation: c.id } }),
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected parcoursAjoute(): void { this.ajoutParcours.set(false); this.charger(); this.chargerHistorique(); }

  protected async supprimerParcours(p: ParcoursSNJDTO): Promise<void> {
    if (!(await this.confirmation.demander('Supprimer cette étape ?', p.intitule, 'Supprimer', true))) return;
    this.service.supprimerParcours(+this.id(), p.id!).subscribe({ next: () => { this.toast.success('Étape supprimée.'); this.charger(); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected ajouterCompetence(): void {
    const intitule = this.nouvelleCompetence.trim();
    if (!intitule) return;
    this.service.ajouterCompetence(+this.id(), { intitule, niveau: this.nouveauNiveau }).subscribe({
      next: () => { this.nouvelleCompetence = ''; this.charger(); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected retirerCompetence(c: CompetenceDTO): void {
    this.service.supprimerCompetence(+this.id(), c.id!).subscribe({ next: () => this.charger(), error: e => this.toast.error(messageErreur(e)) });
  }

  protected points(n?: NiveauCompetenceEnum): number[] {
    const p = n ? NIVEAU_COMPETENCE[n].points : 2;
    return [1, 2, 3].map(i => (i <= Math.min(3, p) ? 1 : 0));
  }

  protected changerPhoto(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    this.service.changerPhoto(+this.id(), f).subscribe({
      next: () => { this.toast.success('Photo mise à jour.'); this.charger(); this.recharger(); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  /** Lien « Ajouter » d'un élément manquant de la complétude. */
  protected completer(element: string): void {
    const e = element.toLowerCase();
    if (e.includes('photo')) this.ouvrirTeleversement('PHOTO');
    else if (e.includes('pièce') || e.includes('identité')) this.ouvrirTeleversement('IDENTITE');
    else if (e.includes('compétence')) this.gestionCompetences.set(true);
    else if (e.includes('parcours')) this.ajoutParcours.set(true);
    else this.router.navigate(['/membres', this.id(), 'modifier']);
  }

  // ------------------------------------------------------------ documents
  protected ouvrirTeleversement(type: TypeDocument): void {
    this.titreDocument = TYPE_DOCUMENT[type] ?? '';
    this.fichierDocument = null;
    this.televersement.set(type);
  }

  protected choisirFichier(ev: Event): void { this.fichierDocument = (ev.target as HTMLInputElement).files?.[0] ?? null; }

  protected televerser(): void {
    const type = this.televersement();
    if (!type || !this.fichierDocument) return;
    const req: Observable<unknown> = type === 'PHOTO' && /^image\//.test(this.fichierDocument.type)
      ? this.service.changerPhoto(+this.id(), this.fichierDocument)
      : this.service.ajouterDocument(+this.id(), this.fichierDocument, type, this.titreDocument);
    req.subscribe({
      next: () => { this.toast.success('Document ajouté.'); this.televersement.set(null); this.recharger(); this.charger(); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected attestation(): void {
    this.service.attestation(+this.id()).subscribe({
      next: () => { this.toast.success('Attestation générée.'); this.recharger(); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected telecharger(d: DocumentDTOs.DocumentDTO): void {
    this.documentService.telecharger(d.id!).subscribe({ error: e => this.toast.error(messageErreur(e)) });
  }

  protected cv(): void { this.service.cvPdf(+this.id()).subscribe({ error: e => this.toast.error(messageErreur(e)) }); }

  private recharger(): void {
    this.service.documents(+this.id()).subscribe(d => this.documents.set(d));
    this.service.completude(+this.id()).subscribe(c => this.completude.set(c));
    this.chargerHistorique();
  }

  protected iconeDocument(d: DocumentDTOs.DocumentDTO | TypeDocument): { icone: string; teinte: string } {
    const type = typeof d === 'string' ? d : d.typeDocument;
    switch (type) {
      case 'ATTESTATION': return { icone: 'award', teinte: 'tone-lime' };
      case 'DIPLOME': return { icone: 'graduation-cap', teinte: 'tone-blue' };
      case 'IDENTITE': case 'CARTE_MEMBRE': return { icone: 'id-card', teinte: 'tone-red' };
      case 'PHOTO': return { icone: 'user', teinte: 'tone-red' };
      default: return { icone: 'file-text', teinte: 'tone-grey' };
    }
  }

  /** « a modifié la situation professionnelle » à partir de l'opération du journal. */
  protected phrase(h: Historique.OperationDTO): string {
    const a = (h.action ?? '').toUpperCase();
    const champs = (h.champsModifies ?? []).map(c => (c['libelle'] ?? c['champ'] ?? '').toLowerCase()).filter(Boolean);
    if (a === 'CREATION') return 'a créé la fiche';
    if (a.includes('MODIFICATION') && champs.length) return `a modifié ${champs.slice(0, 3).join(', ')}`;
    if (a === 'ATTESTATION') return 'a généré l\'attestation de participation';
    if (a === 'PHOTO') return 'a mis à jour la photo d\'identité';
    if (a.includes('STATUT')) return `a changé le statut${h.details ? ' : ' + h.details : ''}`;
    return h.details ? `${etiquetteAction(a).libelle.toLowerCase()} · ${h.details}` : etiquetteAction(a).libelle.toLowerCase();
  }
}
