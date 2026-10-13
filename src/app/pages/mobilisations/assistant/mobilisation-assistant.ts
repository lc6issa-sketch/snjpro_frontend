import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, switchMap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CohorteService } from '../../../core/services/cohorte.service';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { ToastService } from '../../../core/services/toast.service';
import { CohorteDTO, MobilisationDTOs, SexeEnum, StatutMembreEnum } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { NombrePipe } from '../../../shared/pipes/format.pipes';
import { dateCourte, dateMoyenne, heure, nombre, versDate } from '../../../shared/utils/format';
import { MobilisationService } from '../../../core/services/mobilisation.service';
import { messageErreur } from '../../../shared/utils/http';

const TYPES_BESOIN = ['Santé & secourisme', 'Bâtiment & travaux publics', 'Agriculture & élevage', 'Enseignement', 'Informatique & numérique',
  'Environnement', 'Sécurité civile', 'Logistique', 'Tous profils'];
const PRISES_EN_CHARGE = ['Transport', 'Restauration', 'Hébergement', 'Indemnité'];

/** Écrans web 30 (Informations), 31 (Critères & sélection) et 32 (Confirmation) — Nouvelle mobilisation. */
@Component({
  selector: 'app-mobilisation-assistant',
  imports: [FormsModule, RouterLink, Icon, Avatar, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mobilisation-assistant.html',
  styleUrl: './mobilisation-assistant.css'
})
export class MobilisationAssistant implements OnInit {
  readonly id = input<string>();
  private readonly service = inject(MobilisationService);
  private readonly cohorteService = inject(CohorteService);
  private readonly referentiel = inject(ReferentielService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  protected readonly typesBesoin = TYPES_BESOIN;
  protected readonly prises = PRISES_EN_CHARGE;
  protected readonly statutsMembre: { cle: StatutMembreEnum; libelle: string }[] = [
    { cle: 'ACTIF', libelle: 'Actif' }, { cle: 'INACTIF', libelle: 'Inactif' }, { cle: 'SUSPENDU', libelle: 'Suspendu' }
  ];
  protected readonly etape = signal(1);
  protected readonly mobilisationId = signal<number | null>(null);
  protected readonly envoi = signal(false);
  protected readonly enregistre = signal<Date | null>(null);
  protected readonly regions = signal<string[]>([]);
  protected readonly competencesDispo = signal<string[]>([]);
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly apercu = signal<MobilisationDTOs.Apercu | null>(null);
  protected readonly calcul = signal(false);
  protected readonly exclus = signal(new Set<number>());
  protected readonly version = signal(0);

  protected info: MobilisationDTOs.Informations = { priseEnCharge: [], urgent: false };
  protected criteres: MobilisationDTOs.Criteres = { regions: [], competences: [], toutesCompetences: false, cohorteIds: [], statutsMembre: ['ACTIF'], ageMin: 18, ageMax: 35, telephoneVerifieUniquement: false, exclureDejaMobilises: false };
  protected envoiForm: MobilisationDTOs.Envoi = { canalApplication: true, canalSms: true, canalEmail: false };
  protected programmer = false;
  protected dateProgrammee = '';
  protected regionAjout = '';
  protected competenceAjout = '';

  private readonly recalcul = new Subject<void>();

  protected readonly selectionnes = computed(() => { this.version(); return Math.max(0, (this.apercu()?.total ?? 0) - this.exclus().size); });
  protected readonly resumeRegions = computed(() => Object.entries(this.apercu()?.parRegion ?? {}).map(([r, n]) => `${r} ${n}`).join(' · '));
  protected readonly titreEtape = computed(() => ['Informations générales', 'Définissez les critères pour sélectionner les membres', 'Vérifiez les informations avant l\'envoi'][this.etape() - 1]);

  constructor() {
    this.recalcul.pipe(
      debounceTime(400),
      switchMap(() => {
        const id = this.mobilisationId();
        if (!id) return of(null);
        this.calcul.set(true);
        return this.service.criteres(id, this.criteresNettoyes()).pipe(
          switchMap(() => this.service.apercu(id, 6)),
          catchError(e => { this.toast.error(messageErreur(e)); return of(null); })
        );
      }),
      takeUntilDestroyed()
    ).subscribe(a => { this.calcul.set(false); if (a) this.apercu.set(a); });
  }

  ngOnInit(): void {
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
    this.referentiel.competences().subscribe(c => this.competencesDispo.set(c));
    this.cohorteService.lister().subscribe(c => this.cohortes.set(c.filter(x => x.statut !== 'ARCHIVEE')));
    const id = this.id();
    if (id) {
      this.service.obtenir(+id).subscribe({
        next: d => {
          if (d.statut !== 'BROUILLON') { this.router.navigate(['/mobilisations', id]); return; }
          this.mobilisationId.set(+id);
          this.info = { ...d.informations, priseEnCharge: d.informations?.priseEnCharge ?? [] };
          this.criteres = { ...this.criteres, ...d.criteres, regions: d.criteres?.regions ?? [], competences: d.criteres?.competences ?? [], cohorteIds: d.criteres?.cohorteIds ?? [], statutsMembre: d.criteres?.statutsMembre?.length ? d.criteres.statutsMembre : ['ACTIF'], ageMin: d.criteres?.ageMin ?? 18, ageMax: d.criteres?.ageMax ?? 35, sexe: d.criteres?.sexe ?? undefined, toutesCompetences: !!d.criteres?.toutesCompetences };
          this.envoiForm = { ...this.envoiForm, ...(d.envoi ?? {}) };
          if (!this.envoiForm.message) this.envoiForm.message = this.messageParDefaut();
          this.etape.set(2);
          this.maj();
        },
        error: e => { this.toast.error(messageErreur(e)); this.router.navigate(['/mobilisations']); }
      });
    }
  }

  // ------------------------------------------------------------ étape 1
  protected basculerPrise(p: string): void {
    const l = this.info.priseEnCharge ?? [];
    this.info.priseEnCharge = l.includes(p) ? l.filter(x => x !== p) : [...l, p];
  }

  protected valider1(): string | null {
    if (!this.info.titre?.trim()) return 'Le titre est obligatoire.';
    if (!this.info.dateDebut || !this.info.dateFin) return 'Les dates de début et de fin sont obligatoires.';
    if (this.info.dateFin < this.info.dateDebut) return 'La date de fin doit suivre la date de début.';
    return null;
  }

  protected continuer1(): void {
    const erreur = this.valider1();
    if (erreur) { this.toast.error(erreur); return; }
    this.envoi.set(true);
    const id = this.mobilisationId();
    const dto: MobilisationDTOs.Informations = { ...this.info, titre: this.info.titre?.trim(), heureRendezVous: this.info.heureRendezVous || undefined };
    (id ? this.service.modifier(id, dto) : this.service.creer(dto)).subscribe({
      next: d => {
        this.envoi.set(false);
        this.mobilisationId.set(d.id!);
        this.enregistre.set(new Date());
        if (!this.envoiForm.message) this.envoiForm.message = this.messageParDefaut();
        if (!id) this.location.replaceState(`/mobilisations/${d.id}/edition`);
        if (!this.criteres.regions?.length && this.info.region) this.criteres.regions = [this.info.region];
        this.etape.set(2);
        this.maj();
      },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  // ------------------------------------------------------------ étape 2
  protected maj(): void { this.version.update(v => v + 1); this.recalcul.next(); }

  protected ajouterRegion(r: string): void {
    if (r && !this.criteres.regions!.includes(r)) this.criteres.regions = [...this.criteres.regions!, r];
    this.regionAjout = '';
    this.maj();
  }
  protected retirerRegion(r: string): void { this.criteres.regions = this.criteres.regions!.filter(x => x !== r); this.maj(); }
  protected ajouterCompetence(c: string): void {
    const v = c.trim();
    if (v && !this.criteres.competences!.includes(v)) this.criteres.competences = [...this.criteres.competences!, v];
    this.competenceAjout = '';
    this.maj();
  }
  protected retirerCompetence(c: string): void { this.criteres.competences = this.criteres.competences!.filter(x => x !== c); this.maj(); }
  protected choisirCohorte(id: string): void { this.criteres.cohorteIds = id ? [+id] : []; this.maj(); }
  protected basculerStatut(s: StatutMembreEnum): void {
    const l = this.criteres.statutsMembre ?? [];
    this.criteres.statutsMembre = l.includes(s) ? l.filter(x => x !== s) : [...l, s];
    this.maj();
  }
  protected sexe(s: SexeEnum | undefined): void { this.criteres.sexe = s; this.maj(); }
  protected reinitialiser(): void {
    this.criteres = { regions: [], competences: [], toutesCompetences: false, cohorteIds: [], statutsMembre: ['ACTIF'], ageMin: 18, ageMax: 35, telephoneVerifieUniquement: false, exclureDejaMobilises: false };
    this.exclus.set(new Set());
    this.maj();
  }
  protected basculerMembre(id: number): void {
    this.exclus.update(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  protected toutSelectionner(): void { this.exclus.set(new Set()); }

  protected continuer2(): void {
    if (!this.selectionnes()) { this.toast.error('Aucun membre ne correspond aux critères : élargissez la sélection.'); return; }
    if (!this.envoiForm.canalApplication && !this.envoiForm.canalSms && !this.envoiForm.canalEmail) { this.toast.error('Choisissez au moins un canal d\'envoi.'); return; }
    this.etape.set(3);
  }

  // ------------------------------------------------------------ étape 3
  protected envoyer(): void {
    const id = this.mobilisationId();
    if (!id) return;
    this.envoi.set(true);
    const corps: MobilisationDTOs.Envoi = {
      ...this.envoiForm, membresExclus: [...this.exclus()],
      programmeLe: this.programmer && this.dateProgrammee ? this.dateProgrammee + ':00' : undefined
    };
    this.service.criteres(id, this.criteresNettoyes()).pipe(switchMap(() => this.service.envoyer(id, corps))).subscribe({
      next: () => { this.toast.success(this.programmer ? 'Mobilisation programmée.' : `Mobilisation envoyée à ${nombre(this.selectionnes())} membres.`); this.router.navigate(['/mobilisations', id]); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected annuler(): void { this.router.navigate(['/mobilisations']); }

  // ------------------------------------------------------------ textes
  protected periode(): string {
    const d = versDate(this.info.dateDebut), f = versDate(this.info.dateFin);
    if (!d) return '—';
    const base = f && f.getTime() !== d.getTime() ? (d.getMonth() === f.getMonth() ? `${d.getDate()} – ${dateMoyenne(f)}` : `${dateMoyenne(d)} – ${dateMoyenne(f)}`) : dateMoyenne(d);
    return base + (this.info.heureRendezVous ? ' · ' + heure(this.info.heureRendezVous) : '');
  }
  protected dateCourte(v?: string): string { return dateCourte(v); }
  protected nomCohorte(): string { const id = this.criteres.cohorteIds?.[0]; return id ? this.cohortes().find(c => c.id === id)?.nom ?? '' : 'Toutes les cohortes'; }
  protected relance(): string {
    const lim = versDate(this.info.dateLimiteReponse);
    if (!lim) return '';
    const r = new Date(lim); r.setDate(r.getDate() - 2);
    return dateCourte(r).slice(0, 5);
  }

  private messageParDefaut(): string {
    const lieu = this.info.region || this.info.lieu || '';
    const lim = this.info.dateLimiteReponse ? ` avant le ${dateMoyenne(this.info.dateLimiteReponse).replace(/ \d{4}$/, '')}` : '';
    return `Bonjour {prénom}, le SNJ organise ${this.info.titre ? '« ' + this.info.titre + ' »' : 'une mobilisation'}${lieu ? ' à ' + lieu : ''} (${this.periode()}). `
      + `Votre profil correspond au besoin. Confirmez votre disponibilité dans l'application SNJPro${lim}.`;
  }

  private criteresNettoyes(): MobilisationDTOs.Criteres {
    return { ...this.criteres, ageMin: this.criteres.ageMin || undefined, ageMax: this.criteres.ageMax || undefined };
  }
}
