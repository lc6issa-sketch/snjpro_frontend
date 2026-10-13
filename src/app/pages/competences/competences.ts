import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { CompetenceReferentielDTOs } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Modal } from '../../shared/components/modal/modal';
import { Pagination } from '../../shared/components/pagination/pagination';
import { Avatar } from '../../shared/components/avatar/avatar';
import { NombrePipe } from '../../shared/pipes/format.pipes';
import { styleCategorie } from '../../shared/utils/categories';
import { CompetenceService } from '../../core/services/competence.service';
import { messageErreur } from '../../shared/utils/http';
import { ConfirmationService } from '../../core/services/confirmation.service';

const TAILLE = 10;

/** Écrans web 27 (Référentiel des compétences) et 28 (Nouvelle compétence). */
@Component({
  selector: 'app-competences',
  imports: [FormsModule, Icon, Modal, Pagination, Avatar, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './competences.html',
  styleUrl: './competences.css'
})
export class Competences implements OnInit {
  private readonly service = inject(CompetenceService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  protected readonly taille = TAILLE;
  protected readonly competences = signal<CompetenceReferentielDTOs.Competence[]>([]);
  protected readonly categories = signal<CompetenceReferentielDTOs.Categorie[]>([]);
  protected readonly categorie = signal<string | null>(null);
  protected readonly recherche = signal('');
  protected readonly tri = signal('MEMBRES');
  protected readonly page = signal(0);
  protected readonly edition = signal(false);
  protected readonly enCours = signal<CompetenceReferentielDTOs.Competence | null>(null);
  protected readonly selection = signal<CompetenceReferentielDTOs.Competence | null>(null);
  protected readonly liste = signal<CompetenceReferentielDTOs.Detenteur[]>([]);
  protected form: CompetenceReferentielDTOs.Edition = {};

  protected readonly peutGerer = computed(() => this.auth.aRole('ROLE_ADMIN_SYSTEME', 'ROLE_ADMIN_SNJ'));
  protected readonly total = computed(() => this.categories().reduce((s, c) => s + (c.nombreCompetences ?? 0), 0) || this.competences().length);
  protected readonly filtrees = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    return this.competences().filter(c => !q || (c.nom ?? '').toLowerCase().includes(q));
  });
  protected readonly pageCourante = computed(() => this.filtrees().slice(this.page() * TAILLE, (this.page() + 1) * TAILLE));
  protected readonly max = computed(() => Math.max(1, ...this.competences().map(c => c.nombreMembres ?? 0)));
  protected readonly style = styleCategorie;

  ngOnInit(): void { this.charger(); this.service.categories().subscribe(c => this.categories.set(c)); }

  protected choisir(c: string | null): void { this.categorie.set(c); this.page.set(0); this.charger(); }
  protected trier(t: string): void { this.tri.set(t); this.charger(); }

  protected ouvrir(c: CompetenceReferentielDTOs.Competence | null): void {
    this.enCours.set(c);
    this.form = c ? { nom: c.nom, categorie: c.categorie, description: c.description } : { categorie: this.categorie() ?? undefined };
    this.edition.set(true);
  }

  protected enregistrer(): void {
    const c = this.enCours();
    const dto = { ...this.form, nom: this.form.nom?.trim() };
    (c ? this.service.modifier(c.id!, dto) : this.service.creer(dto)).subscribe({
      next: () => { this.toast.success(c ? 'Compétence mise à jour.' : 'Compétence créée.'); this.edition.set(false); this.recharger(); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected async supprimer(c: CompetenceReferentielDTOs.Competence): Promise<void> {
    if (!(await this.confirmation.demander(`Supprimer « ${c.nom} » ?`, 'La compétence sera retirée du référentiel. Les profils des membres ne sont pas modifiés.', 'Supprimer', true))) return;
    this.service.supprimer(c.id!).subscribe({ next: () => { this.toast.success('Compétence supprimée.'); this.recharger(); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected synchroniser(): void {
    this.service.synchroniser().subscribe({
      next: r => { this.toast.success(`${(r as { ajoutees?: number }).ajoutees ?? 0} compétence(s) ajoutée(s) au référentiel.`); this.recharger(); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected detenteurs(c: CompetenceReferentielDTOs.Competence): void {
    this.selection.set(c);
    this.liste.set([]);
    this.service.detenteurs(c.id!).subscribe(l => this.liste.set(l));
  }

  protected voirMembre(id: number): void { this.selection.set(null); this.router.navigate(['/membres', id]); }
  protected tousLesMembres(c: CompetenceReferentielDTOs.Competence): void { this.selection.set(null); this.router.navigate(['/membres'], { queryParams: { competence: c.nom } }); }

  private recharger(): void { this.charger(); this.service.categories().subscribe(c => this.categories.set(c)); }
  private charger(): void { this.service.lister(this.categorie(), undefined, this.tri()).subscribe(c => this.competences.set(c)); }
}
