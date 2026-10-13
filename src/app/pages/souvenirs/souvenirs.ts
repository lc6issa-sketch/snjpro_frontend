import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { Subject, debounceTime } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CohorteService } from '../../core/services/cohorte.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CohorteDTO, SouvenirDTOs, StatutSouvenir, TypeMedia } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Pill } from '../../shared/components/pill/pill';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';
import { DateCourtePipe, NombrePipe, RelatifPipe, TaillePipe } from '../../shared/pipes/format.pipes';
import { STATUT_SOUVENIR } from '../../shared/utils/libelles';
import { SouvenirService } from '../../core/services/souvenir.service';
import { messageErreur } from '../../shared/utils/http';
import { ConfirmationService } from '../../core/services/confirmation.service';

const EXT_PHOTO = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'];
const EXT_VIDEO = ['mp4', 'm4v', 'webm', 'mov', '3gp'];
const EXT_AUDIO = ['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'opus'];
const MAX_FICHIERS = 10;
const MAX_OCTETS = 100 * 1024 * 1024;

interface FichierLocal { fichier: File; type: TypeMedia; apercu: string | null; }

/**
 * Souvenirs de formation : galerie de photos, vidéos et sons rattachés aux cohortes.
 * Le personnel publie directement ; les membres envoient depuis l'application mobile et les gestionnaires valident ici.
 */
@Component({
  selector: 'app-souvenirs',
  imports: [FormsModule, Icon, Pill, Modal, Pagination, DateCourtePipe, NombrePipe, RelatifPipe, TaillePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './souvenirs.html',
  styleUrl: './souvenirs.css'
})
export class Souvenirs implements OnInit, OnDestroy {
  /** ?id=… (lien d'une alerte) : ouvre directement le souvenir. */
  readonly id = input<string | undefined>();

  private readonly service = inject(SouvenirService);
  private readonly cohortesService = inject(CohorteService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);

  protected readonly STATUT = STATUT_SOUVENIR;
  protected readonly TAILLE = 12;
  protected readonly acceptes = [...EXT_PHOTO, ...EXT_VIDEO, ...EXT_AUDIO].map(e => '.' + e).join(',');

  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ', 'ROLE_RESPONSABLE_REGIONAL', 'ROLE_RESPONSABLE_COHORTE'));

  // Liste
  protected readonly stats = signal<SouvenirDTOs.Statistiques | null>(null);
  protected readonly souvenirs = signal<SouvenirDTOs.Resume[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(0);
  protected readonly chargement = signal(false);
  protected readonly statut = signal<StatutSouvenir>('PUBLIE');
  protected readonly type = signal<TypeMedia | null>(null);
  protected cohorteId: number | null = null;
  protected recherche = '';
  private readonly saisie = new Subject<void>();

  // Cohortes du périmètre
  private readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly cohortesPerimetre = computed(() => {
    const u = this.auth.utilisateur();
    return this.cohortes().filter(c =>
      this.auth.aRole('ROLE_RESPONSABLE_COHORTE') ? c.id === u?.cohorteId
      : this.auth.aRole('ROLE_RESPONSABLE_REGIONAL') ? (c.region ?? '').toLowerCase() === (u?.region ?? '').toLowerCase()
      : true);
  });

  // URLs locales (blob:) des fichiers, par identifiant de média
  protected readonly urls = signal<Record<number, string>>({});
  private readonly enCours = new Set<number>();

  // Visionneuse
  protected readonly ouvert = signal<SouvenirDTOs.Resume | null>(null);
  protected readonly index = signal(0);
  protected readonly media = computed(() => this.ouvert()?.medias?.[this.index()] ?? null);
  protected readonly rejet = signal(false);
  protected motifRejet = '';

  // Formulaire (création / modification)
  protected readonly formulaire = signal(false);
  protected readonly enEdition = signal<number | null>(null);
  protected f: SouvenirDTOs.Edition = {};
  protected readonly fichiers = signal<FichierLocal[]>([]);
  protected readonly survol = signal(false);
  protected readonly progression = signal<number | null>(null);
  protected readonly envoi = signal(false);

  constructor() {
    this.saisie.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.charger(0));
    // Charge le fichier du média affiché dans la visionneuse
    effect(() => { const m = this.media(); if (m?.id) this.chargerUrl(m.id); });
  }

  ngOnInit(): void {
    this.cohortesService.lister().subscribe(l => this.cohortes.set(l));
    this.rafraichir();
    const id = Number(this.id());
    if (id) this.service.obtenir(id).subscribe({ next: s => this.ouvrir(s), error: e => this.toast.error(messageErreur(e)) });
  }

  ngOnDestroy(): void {
    Object.values(this.urls()).forEach(u => URL.revokeObjectURL(u));
    this.fichiers().forEach(f => f.apercu && URL.revokeObjectURL(f.apercu));
  }

  // ------------------------------------------------------------ liste
  protected rafraichir(): void {
    this.service.statistiques(this.cohorteId).subscribe(s => this.stats.set(s));
    this.charger(this.page());
  }

  protected charger(page: number): void {
    this.page.set(page);
    this.chargement.set(true);
    this.service.lister({ cohorteId: this.cohorteId, statut: this.statut(), type: this.type(), recherche: this.recherche.trim() || undefined }, page, this.TAILLE)
      .subscribe({
        next: p => {
          this.souvenirs.set(p.content ?? []);
          this.total.set(p.totalElements ?? 0);
          this.chargement.set(false);
          // vignettes : première photo de chaque souvenir
          (p.content ?? []).forEach(s => { const ph = s.medias?.find(m => m.type === 'PHOTO'); if (ph?.id) this.chargerUrl(ph.id); });
        },
        error: e => { this.chargement.set(false); this.toast.error(messageErreur(e)); }
      });
  }

  protected choisirStatut(s: StatutSouvenir): void { this.statut.set(s); this.charger(0); }
  protected choisirType(t: TypeMedia | null): void { this.type.set(t); this.charger(0); }
  protected changerCohorte(): void { this.rafraichir(); this.charger(0); }
  protected chercher(): void { this.saisie.next(); }

  protected couverture(s: SouvenirDTOs.Resume): string | null {
    const ph = s.medias?.find(m => m.type === 'PHOTO');
    return ph?.id ? this.urls()[ph.id] ?? null : null;
  }
  protected iconeCouverture(s: SouvenirDTOs.Resume): string { return s.nombreVideos ? 'video' : s.nombreAudios ? 'mic' : 'image'; }

  private chargerUrl(mediaId: number): void {
    if (this.urls()[mediaId] || this.enCours.has(mediaId)) return;
    this.enCours.add(mediaId);
    this.service.fichier(mediaId).subscribe({
      next: u => { this.enCours.delete(mediaId); this.urls.update(m => ({ ...m, [mediaId]: u })); },
      error: () => this.enCours.delete(mediaId)
    });
  }

  // ------------------------------------------------------------ visionneuse
  protected ouvrir(s: SouvenirDTOs.Resume): void {
    this.ouvert.set(s);
    s.medias?.forEach(m => { if (m.type === 'PHOTO' && m.id) this.chargerUrl(m.id); });   // miniatures
    this.index.set(0);
    this.rejet.set(false);
    this.motifRejet = '';
  }
  protected fermerVisionneuse(): void { this.ouvert.set(null); }
  protected deplacer(pas: number): void {
    const n = this.ouvert()?.medias?.length ?? 0;
    if (n) this.index.update(i => (i + pas + n) % n);
  }

  protected valider(): void {
    const s = this.ouvert();
    if (!s) return;
    this.service.valider(s.id!).subscribe({ next: r => { this.toast.success('Souvenir publié.'); this.apresAction(r); }, error: e => this.toast.error(messageErreur(e)) });
  }
  protected confirmerRejet(): void {
    const s = this.ouvert();
    if (!s || !this.motifRejet.trim()) { this.toast.error('Indiquez le motif du rejet.'); return; }
    this.service.rejeter(s.id!, this.motifRejet.trim()).subscribe({
      next: r => { this.toast.success('Souvenir rejeté : le membre verra le motif.'); this.apresAction(r); },
      error: e => this.toast.error(messageErreur(e))
    });
  }
  protected async supprimer(): Promise<void> {
    const s = this.ouvert();
    if (!s || !(await this.confirmation.demander('Supprimer ce souvenir ?', `« ${s.titre} » et ses ${s.medias?.length ?? 0} fichier(s) seront définitivement supprimés.`, 'Supprimer', true))) return;
    this.service.supprimer(s.id!).subscribe({
      next: () => { this.toast.success('Souvenir supprimé.'); this.ouvert.set(null); this.rafraichir(); },
      error: e => this.toast.error(messageErreur(e))
    });
  }
  protected async retirerMedia(m: SouvenirDTOs.Media): Promise<void> {
    const s = this.ouvert();
    if (!s || !(await this.confirmation.demander('Retirer ce fichier ?', m.nomFichier ?? '', 'Retirer', true))) return;
    this.service.supprimerMedia(s.id!, m.id!).subscribe({
      next: r => { this.index.set(0); this.apresAction(r, false); },
      error: e => this.toast.error(messageErreur(e))
    });
  }
  protected ajouterAuSouvenir(evt: Event): void {
    const s = this.ouvert();
    const liste = Array.from((evt.target as HTMLInputElement).files ?? []);
    (evt.target as HTMLInputElement).value = '';
    if (!s || !liste.length) return;
    const erreur = this.controler(liste, s.medias?.length ?? 0);
    if (erreur) { this.toast.error(erreur); return; }
    this.progression.set(0);
    this.service.ajouterMedias(s.id!, liste).subscribe({
      next: ev => {
        if (ev.type === HttpEventType.UploadProgress && ev.total) this.progression.set(Math.round((ev.loaded / ev.total) * 100));
        if (ev.type === HttpEventType.Response && ev.body) { this.progression.set(null); this.toast.success('Fichiers ajoutés.'); this.apresAction(ev.body, false); }
      },
      error: e => { this.progression.set(null); this.toast.error(messageErreur(e)); }
    });
  }

  private apresAction(r: SouvenirDTOs.Resume, garderOuvert = true): void {
    this.rejet.set(false);
    if (garderOuvert || this.ouvert()) this.ouvert.set(r);
    this.rafraichir();
  }

  // ------------------------------------------------------------ formulaire
  protected ouvrirCreation(): void {
    this.enEdition.set(null);
    const perimetre = this.cohortesPerimetre();
    this.f = { cohorteId: this.cohorteId ?? (perimetre.length === 1 ? perimetre[0].id : undefined), visibleTous: false };
    this.viderFichiers();
    this.formulaire.set(true);
  }
  protected ouvrirModification(): void {
    const s = this.ouvert();
    if (!s) return;
    this.enEdition.set(s.id!);
    this.f = { titre: s.titre, legende: s.legende, cohorteId: s.cohorteId, datePrise: s.datePrise, lieu: s.lieu, visibleTous: s.visibleTous };
    this.viderFichiers();
    this.formulaire.set(true);
  }

  protected deposer(evt: DragEvent): void {
    evt.preventDefault();
    this.survol.set(false);
    this.ajouterFichiers(Array.from(evt.dataTransfer?.files ?? []));
  }
  protected choisirFichiers(evt: Event): void {
    this.ajouterFichiers(Array.from((evt.target as HTMLInputElement).files ?? []));
    (evt.target as HTMLInputElement).value = '';
  }
  private ajouterFichiers(liste: File[]): void {
    const erreur = this.controler(liste, this.fichiers().length);
    if (erreur) { this.toast.error(erreur); return; }
    this.fichiers.update(f => [...f, ...liste.map(x => {
      const type = typeDe(x.name);
      return { fichier: x, type, apercu: type === 'AUDIO' ? null : URL.createObjectURL(x) };
    })]);
  }
  protected retirerFichier(i: number): void {
    const f = this.fichiers()[i];
    if (f?.apercu) URL.revokeObjectURL(f.apercu);
    this.fichiers.update(l => l.filter((_, j) => j !== i));
  }
  private viderFichiers(): void {
    this.fichiers().forEach(f => f.apercu && URL.revokeObjectURL(f.apercu));
    this.fichiers.set([]);
  }

  /** Contrôles côté navigateur (le backend revérifie). */
  private controler(liste: File[], dejaPresents: number): string | null {
    if (dejaPresents + liste.length > MAX_FICHIERS) return `Un souvenir contient au plus ${MAX_FICHIERS} fichiers.`;
    const refuse = liste.find(x => !typeDe(x.name, true));
    if (refuse) return `« ${refuse.name} » : format non pris en charge (photos, vidéos MP4/WebM/MOV ou sons MP3/WAV/M4A/OGG).`;
    const lourd = liste.find(x => x.size > MAX_OCTETS);
    if (lourd) return `« ${lourd.name} » dépasse 100 Mo.`;
    return null;
  }

  protected enregistrer(): void {
    if (!this.f.titre?.trim()) { this.toast.error('Le titre est obligatoire.'); return; }
    if (!this.f.cohorteId) { this.toast.error('Choisissez la cohorte.'); return; }
    const id = this.enEdition();
    const donnees: SouvenirDTOs.Edition = { ...this.f, titre: this.f.titre.trim(), datePrise: this.f.datePrise || undefined };
    this.envoi.set(true);
    if (id) {
      this.service.modifier(id, donnees).subscribe({
        next: r => { this.envoi.set(false); this.formulaire.set(false); this.toast.success('Souvenir modifié.'); this.apresAction(r); },
        error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
      });
      return;
    }
    if (!this.fichiers().length) { this.envoi.set(false); this.toast.error('Ajoutez au moins une photo, une vidéo ou un son.'); return; }
    this.progression.set(0);
    this.service.creer(donnees, this.fichiers().map(x => x.fichier)).subscribe({
      next: ev => {
        if (ev.type === HttpEventType.UploadProgress && ev.total) this.progression.set(Math.round((ev.loaded / ev.total) * 100));
        if (ev.type === HttpEventType.Response) {
          this.envoi.set(false); this.progression.set(null); this.formulaire.set(false); this.viderFichiers();
          this.toast.success('Souvenir publié.');
          if (this.statut() !== 'PUBLIE') this.statut.set('PUBLIE');
          this.rafraichir();
        }
      },
      error: e => { this.envoi.set(false); this.progression.set(null); this.toast.error(messageErreur(e)); }
    });
  }

  protected icone(t?: TypeMedia): string { return t === 'VIDEO' ? 'video' : t === 'AUDIO' ? 'mic' : 'image'; }
}

function typeDe(nom: string, strict = false): TypeMedia {
  const ext = (nom.split('.').pop() ?? '').toLowerCase();
  if (EXT_VIDEO.includes(ext)) return 'VIDEO';
  if (EXT_AUDIO.includes(ext)) return 'AUDIO';
  if (EXT_PHOTO.includes(ext) || !strict) return 'PHOTO';
  return null as unknown as TypeMedia;
}
