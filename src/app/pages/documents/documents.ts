import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { DocumentDTOs, VisibiliteDocument } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Modal } from '../../shared/components/modal/modal';
import { Pill } from '../../shared/components/pill/pill';
import { DateCourtePipe, TaillePipe } from '../../shared/pipes/format.pipes';
import { VISIBILITE_DOCUMENT } from '../../shared/utils/libelles';
import { taille } from '../../shared/utils/format';
import { DocumentService } from '../../core/services/document.service';
import { messageErreur } from '../../shared/utils/http';
import { ConfirmationService } from '../../core/services/confirmation.service';

/** Écrans web 43 (Documents), 44 (Nouveau dossier) et 45 (Téléverser un document). */
@Component({
  selector: 'app-documents',
  imports: [FormsModule, Icon, Modal, Pill, DateCourtePipe, TaillePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './documents.html',
  styleUrl: './documents.css'
})
export class Documents implements OnInit {
  private readonly service = inject(DocumentService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly auth = inject(AuthService);

  protected readonly VISIBILITE = VISIBILITE_DOCUMENT;
  protected readonly visibilites: { cle: VisibiliteDocument; libelle: string }[] = [{ cle: 'MEMBRES', libelle: 'Membres' }, { cle: 'INTERNE', libelle: 'Interne' }, { cle: 'PUBLIC', libelle: 'Public' }];
  protected readonly dossiers = signal<DocumentDTOs.DossierDTO[]>([]);
  protected readonly documents = signal<DocumentDTOs.DocumentDTO[]>([]);
  protected readonly espace = signal<DocumentDTOs.Espace | null>(null);
  protected readonly dossier = signal<number | null>(null);
  protected readonly visibilite = signal<VisibiliteDocument | null>(null);
  protected readonly recherche = signal('');
  protected readonly modeDossier = signal(false);
  protected readonly modeTeleversement = signal(false);
  protected readonly fichier = signal<File | null>(null);
  protected readonly progression = signal(0);
  protected readonly envoi = signal(false);
  protected readonly survol = signal(false);
  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ'));
  protected readonly total = computed(() => this.dossiers().reduce((s, d) => s + (d.nombreDocuments ?? 0), 0));
  protected readonly filtres = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    return this.documents().filter(d => !q || `${d.titre} ${d.nomFichier}`.toLowerCase().includes(q));
  });
  protected readonly espaceTexte = computed(() => `${taille(this.espace()?.utiliseOctets)} / ${taille(this.espace()?.quotaOctets)}`);

  protected nomDossier = '';
  protected visibiliteDossier: VisibiliteDocument = 'INTERNE';
  protected titre = '';
  protected dossierCible: number | null = null;
  protected visibiliteDocument: VisibiliteDocument = 'MEMBRES';

  ngOnInit(): void { this.chargerDossiers(); this.charger(); }

  protected choisir(id: number | null): void { this.dossier.set(id); this.charger(); }
  protected filtrerVisibilite(v: VisibiliteDocument | null): void { this.visibilite.set(v); this.charger(); }

  protected icone(d: DocumentDTOs.DocumentDTO): { nom: string; teinte: string } {
    const e = (d.extension ?? '').toLowerCase();
    if (['xls', 'xlsx', 'csv'].includes(e)) return { nom: 'file-spreadsheet', teinte: 'tone-lime' };
    if (['doc', 'docx'].includes(e)) return { nom: 'file-text', teinte: 'tone-blue' };
    if (['png', 'jpg', 'jpeg', 'webp'].includes(e)) return { nom: 'image', teinte: 'tone-violet' };
    return { nom: 'file-text', teinte: 'tone-red' };
  }

  protected telecharger(d: DocumentDTOs.DocumentDTO): void { this.service.telecharger(d.id!).subscribe({ error: e => this.toast.error(messageErreur(e)) }); }

  protected async supprimer(d: DocumentDTOs.DocumentDTO): Promise<void> {
    if (!(await this.confirmation.demander('Supprimer ce document ?', d.titre ?? d.nomFichier, 'Supprimer', true))) return;
    this.service.supprimer(d.id!).subscribe({ next: () => { this.toast.success('Document supprimé.'); this.charger(); this.chargerDossiers(); }, error: e => this.toast.error(messageErreur(e)) });
  }

  // ------------------------------------------------------------ dossiers
  protected ouvrirDossier(): void { this.nomDossier = ''; this.visibiliteDossier = 'INTERNE'; this.modeDossier.set(true); }
  protected creerDossier(): void {
    this.service.creerDossier({ nom: this.nomDossier.trim(), visibiliteDefaut: this.visibiliteDossier }).subscribe({
      next: () => { this.toast.success('Dossier créé.'); this.modeDossier.set(false); this.chargerDossiers(); },
      error: e => this.toast.error(messageErreur(e))
    });
  }
  protected async supprimerDossier(d: DocumentDTOs.DossierDTO): Promise<void> {
    if (!(await this.confirmation.demander('Supprimer ce dossier vide ?', d.nom, 'Supprimer', true))) return;
    this.service.supprimerDossier(d.id!).subscribe({ next: () => { if (this.dossier() === d.id) this.dossier.set(null); this.chargerDossiers(); }, error: e => this.toast.error(messageErreur(e)) });
  }

  // ------------------------------------------------------------ téléversement
  protected ouvrirTeleversement(): void {
    this.fichier.set(null); this.titre = ''; this.progression.set(0);
    this.dossierCible = this.dossier();
    this.adapterVisibilite();
    this.modeTeleversement.set(true);
  }
  protected fermerTeleversement(): void { if (!this.envoi()) this.modeTeleversement.set(false); }
  protected adapterVisibilite(): void {
    const d = this.dossiers().find(x => x.id === this.dossierCible);
    if (d?.visibiliteDefaut) this.visibiliteDocument = d.visibiliteDefaut;
  }
  protected choisirFichier(ev: Event): void { this.prendre((ev.target as HTMLInputElement).files?.[0]); }
  protected deposer(ev: DragEvent): void { ev.preventDefault(); this.survol.set(false); this.prendre(ev.dataTransfer?.files?.[0]); }
  private prendre(f?: File | null): void {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { this.toast.error('Le fichier dépasse 20 Mo.'); return; }
    this.fichier.set(f);
    this.progression.set(0);
    if (!this.titre) this.titre = f.name.replace(/\.[^.]+$/, '');
  }

  protected televerser(): void {
    const f = this.fichier();
    if (!f) return;
    this.envoi.set(true);
    this.service.televerser(f, this.titre.trim() || f.name, this.dossierCible, this.visibiliteDocument).subscribe({
      next: ev => {
        if (ev.type === HttpEventType.UploadProgress && ev.total) this.progression.set(Math.round((ev.loaded / ev.total) * 100));
        if (ev.type === HttpEventType.Response) {
          this.envoi.set(false);
          this.modeTeleversement.set(false);
          this.toast.success('Document publié.');
          this.charger(); this.chargerDossiers();
        }
      },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  private charger(): void { this.service.lister(this.dossier(), this.visibilite()).subscribe(d => this.documents.set(d)); }
  private chargerDossiers(): void {
    this.service.dossiers().subscribe(d => this.dossiers.set(d));
    this.service.espace().subscribe(e => this.espace.set(e));
  }
}
