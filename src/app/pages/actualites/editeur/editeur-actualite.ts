import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Location } from '@angular/common';
import { Observable, switchMap, of } from 'rxjs';
import { CohorteService } from '../../../core/services/cohorte.service';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { ToastService } from '../../../core/services/toast.service';
import { ActualiteDTOs, CategorieActualite, CibleNotification, CohorteDTO, StatutActualite } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { CATEGORIE_ACTUALITE } from '../../../shared/utils/libelles';
import { nombreMots } from '../../../shared/utils/texte-enrichi';
import { heure } from '../../../shared/utils/format';
import { ActualiteService } from '../../../core/services/actualite.service';
import { messageErreur } from '../../../shared/utils/http';
import { ConfirmationService } from '../../../core/services/confirmation.service';

/** Écran web 38 — Éditeur d'actualité. */
@Component({
  selector: 'app-editeur-actualite',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './editeur-actualite.html',
  styleUrl: './editeur-actualite.css'
})
export class EditeurActualite implements OnInit, OnDestroy {
  readonly id = input<string>();
  private readonly service = inject(ActualiteService);
  private readonly cohorteService = inject(CohorteService);
  private readonly referentiel = inject(ReferentielService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly categories = Object.entries(CATEGORIE_ACTUALITE).map(([cle, libelle]) => ({ cle: cle as CategorieActualite, libelle }));
  protected readonly actualiteId = signal<number | null>(null);
  protected readonly detail = signal<ActualiteDTOs.Detail | null>(null);
  protected readonly enregistreA = signal<Date | null>(null);
  protected readonly envoi = signal(false);
  protected readonly image = signal<string | null>(null);
  protected readonly survol = signal(false);
  protected readonly fichierImage = signal<File | null>(null);
  protected readonly regions = signal<string[]>([]);
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly version = signal(0);

  protected f: ActualiteDTOs.Edition = { titre: '', sousTitre: '', contenu: '', categorie: 'ANNONCE', statut: 'BROUILLON', cible: 'TOUS', notifierMembres: true, epingle: false, inscriptionsOuvertes: false };
  protected valeurs: string[] = [];
  protected datePublication = '';
  protected dateExpiration = '';

  protected readonly mots = computed(() => { this.version(); return nombreMots(this.f.contenu); });
  protected readonly minutes = computed(() => Math.max(1, Math.round(this.mots() / 200)));

  ngOnInit(): void {
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
    this.cohorteService.lister().subscribe(c => this.cohortes.set(c.filter(x => x.statut !== 'ARCHIVEE')));
    const id = this.id();
    if (id) {
      this.service.obtenir(+id).subscribe({
        next: d => this.remplir(d),
        error: e => { this.toast.error(messageErreur(e)); this.router.navigate(['/actualites']); }
      });
    }
  }

  ngOnDestroy(): void { const i = this.image(); if (i?.startsWith('blob:')) URL.revokeObjectURL(i); }

  private remplir(d: ActualiteDTOs.Detail): void {
    this.detail.set(d);
    this.actualiteId.set(d.resume?.id ?? null);
    const r = d.resume ?? {};
    this.f = {
      titre: r.titre, sousTitre: r.sousTitre, contenu: d.contenu, categorie: r.categorie, statut: r.statut === 'ARCHIVEE' ? 'BROUILLON' : r.statut,
      cible: d.cible ?? 'TOUS', notifierMembres: d.notifierMembres, epingle: r.epingle, inscriptionsOuvertes: d.inscriptionsOuvertes
    };
    this.valeurs = d.valeurs ?? [];
    this.datePublication = (r.datePublication ?? '').slice(0, 16);
    this.dateExpiration = (d.dateExpiration ?? '').slice(0, 10);
    if (r.imageUrl && r.id) this.service.imageUrl(r.id).subscribe({ next: u => this.image.set(u), error: () => undefined });
    this.maj();
  }

  protected maj(): void { this.version.update(v => v + 1); }

  protected choisirImage(ev: Event): void {
    const fichier = (ev.target as HTMLInputElement).files?.[0];
    if (fichier) this.prendreImage(fichier);
  }

  protected deposer(ev: DragEvent): void {
    ev.preventDefault();
    this.survol.set(false);
    const fichier = ev.dataTransfer?.files?.[0];
    if (fichier) this.prendreImage(fichier);
  }

  private prendreImage(fichier: File): void {
    if (!fichier.type.startsWith('image/')) { this.toast.error('Choisissez une image (JPG, PNG ou WEBP).'); return; }
    this.fichierImage.set(fichier);
    this.image.set(URL.createObjectURL(fichier));
    this.maj();
  }

  // ------------------------------------------------------------ public visé
  protected changerCible(c: CibleNotification): void {
    this.f.cible = c;
    this.valeurs = c === 'COHORTE' && this.cohortes().length ? [String(this.cohortes()[0].id)] : [];
    this.maj();
  }

  protected basculerRegion(r: string): void {
    this.valeurs = this.valeurs.includes(r) ? this.valeurs.filter(x => x !== r) : [...this.valeurs, r];
    this.maj();
  }

  // ------------------------------------------------------------ enregistrement
  protected enregistrer(statut?: StatutActualite, apres?: () => void): void {
    if (!this.f.titre?.trim()) { this.toast.error('Le titre est obligatoire.'); return; }
    if (statut === 'PROGRAMMEE' && !this.datePublication) { this.toast.error('Indiquez la date de publication.'); return; }
    this.envoi.set(true);
    const dto: ActualiteDTOs.Edition = {
      ...this.f, titre: this.f.titre.trim(), statut: statut ?? this.f.statut,
      datePublication: this.f.statut === 'PROGRAMMEE' || statut === 'PROGRAMMEE' ? (this.datePublication ? this.datePublication + ':00' : undefined) : undefined,
      dateExpiration: this.dateExpiration ? this.dateExpiration + 'T23:59:00' : undefined
    };
    const corps = { ...dto, valeurs: this.valeurs } as ActualiteDTOs.Edition;
    const id = this.actualiteId();
    const req: Observable<ActualiteDTOs.Detail> = (id ? this.service.modifier(id, corps) : this.service.creer(corps)).pipe(
      switchMap(d => {
        const fichier = this.fichierImage();
        if (!fichier) return of(d);
        this.fichierImage.set(null);
        return this.service.changerImage(d.resume!.id!, fichier);
      })
    );
    req.subscribe({
      next: d => {
        this.envoi.set(false);
        this.enregistreA.set(new Date());
        this.detail.set(d);
        if (!id) { this.actualiteId.set(d.resume?.id ?? null); this.location.replaceState(`/actualites/${d.resume?.id}`); }
        this.f.statut = d.resume?.statut === 'ARCHIVEE' ? 'BROUILLON' : d.resume?.statut;
        if (apres) apres(); else this.toast.success('Actualité enregistrée.');
        this.maj();
      },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected publier(): void {
    const id = () => this.actualiteId();
    if (this.f.statut === 'PROGRAMMEE') { this.enregistrer('PROGRAMMEE', () => { this.toast.success('Publication programmée.'); this.router.navigate(['/actualites']); }); return; }
    this.enregistrer(undefined, () => {
      this.service.publier(id()!).subscribe({
        next: () => { this.toast.success('Actualité publiée.'); this.router.navigate(['/actualites']); },
        error: e => this.toast.error(messageErreur(e))
      });
    });
  }

  protected async archiver(): Promise<void> {
    const id = this.actualiteId();
    if (!id) return;
    if (!(await this.confirmation.demander('Archiver cette actualité ?', 'Elle ne sera plus visible dans l\'application des membres.', 'Archiver'))) return;
    this.service.archiver(id).subscribe({ next: () => { this.toast.success('Actualité archivée.'); this.router.navigate(['/actualites']); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected async supprimer(): Promise<void> {
    const id = this.actualiteId();
    if (!id) { this.router.navigate(['/actualites']); return; }
    if (!(await this.confirmation.demander('Supprimer ce brouillon ?', this.f.titre, 'Supprimer', true))) return;
    this.service.supprimer(id).subscribe({ next: () => { this.toast.success('Brouillon supprimé.'); this.router.navigate(['/actualites']); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected heureEnregistrement(): string { const d = this.enregistreA(); return d ? heure(d) : ''; }
}
