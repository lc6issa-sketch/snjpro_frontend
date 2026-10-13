import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CohorteService } from '../../../core/services/cohorte.service';
import { MembreService } from '../../../core/services/membre.service';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { ToastService } from '../../../core/services/toast.service';
import { CibleNotification, CohorteDTO, MembreResponseDTO, NotificationDTOs, TypeNotification } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { NombrePipe } from '../../../shared/pipes/format.pipes';
import { nombre } from '../../../shared/utils/format';
import { NotificationService } from '../../../core/services/notification.service';
import { messageErreur } from '../../../shared/utils/http';

const TYPES: { cle: TypeNotification; libelle: string }[] = [
  { cle: 'INFORMATION', libelle: 'Information' }, { cle: 'URGENT', libelle: 'Urgent' }, { cle: 'MOBILISATION', libelle: 'Mobilisation' }, { cle: 'ACTUALITE', libelle: 'Actualité' }
];

/** Écran web 35 — Nouvelle notification aux membres, avec aperçu mobile et envois récents. */
@Component({
  selector: 'app-nouvelle-notification',
  imports: [FormsModule, RouterLink, Icon, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nouvelle-notification.html',
  styleUrl: './nouvelle-notification.css'
})
export class NouvelleNotification implements OnInit {
  private readonly service = inject(NotificationService);
  private readonly cohorteService = inject(CohorteService);
  private readonly membreService = inject(MembreService);
  private readonly referentiel = inject(ReferentielService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly types = TYPES;
  protected readonly regions = signal<string[]>([]);
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly estimation = signal<NotificationDTOs.Estimation | null>(null);
  protected readonly selection = signal<MembreResponseDTO[]>([]);
  protected readonly propositions = signal<MembreResponseDTO[]>([]);
  protected readonly envoi = signal(false);
  protected readonly version = signal(0);

  protected f: NotificationDTOs.Envoi = { type: 'INFORMATION', titre: '', message: '', cible: 'TOUS', valeurs: [], canalApplication: true, canalSms: true, canalEmail: false };
  protected programmer = false;
  protected dateProgrammee = '';
  protected rechercheMembre = '';
  private readonly calcul = new Subject<void>();
  private readonly recherche = new Subject<string>();

  protected readonly nombreTexte = computed(() => nombre(this.estimation()?.nombreDestinataires ?? 0));
  protected readonly libelleCohorte = computed(() => {
    this.version();
    const c = this.cohortes().find(x => String(x.id) === this.f.valeurs?.[0]);
    return c ? `${c.nom} · ${nombre(c.nombreMembres)}` : 'Choisir une cohorte';
  });

  constructor() {
    this.calcul.pipe(debounceTime(250), switchMap(() => this.service.estimer(this.f.cible!, this.f.valeurs ?? [], !!this.f.canalSms).pipe(catchError(() => of(null)))), takeUntilDestroyed())
      .subscribe(e => this.estimation.set(e));
    this.recherche.pipe(debounceTime(250), switchMap(q => q.trim().length < 2 ? of(null) : this.membreService.rechercher({ query: q.trim() }, { size: 6 }).pipe(catchError(() => of(null)))), takeUntilDestroyed())
      .subscribe(p => this.propositions.set(p?.content ?? []));
  }

  ngOnInit(): void {
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
    this.cohorteService.lister().subscribe(c => this.cohortes.set(c.filter(x => x.statut !== 'ARCHIVEE')));
    const q = this.route.snapshot.queryParamMap;
    if (q.get('type')) this.f.type = q.get('type') as TypeNotification;
    if (q.get('titre')) this.f.titre = q.get('titre')!;
    const ids = (q.get('membres') ?? '').split(',').filter(x => /^\d+$/.test(x));
    if (ids.length) {
      this.f.cible = 'SELECTION';
      this.f.valeurs = ids;
      ids.slice(0, 30).forEach(id => this.membreService.obtenir(+id).subscribe(m => this.selection.update(s => [...s, m])));
    }
    this.maj();
  }

  protected maj(): void { this.version.update(v => v + 1); this.calcul.next(); }

  protected cible(c: CibleNotification): void {
    if (this.f.cible === c) return;
    this.f.cible = c;
    this.f.valeurs = c === 'SELECTION' ? this.selection().map(m => String(m.id)) : [];
    if (c === 'COHORTE' && this.cohortes().length) this.f.valeurs = [String(this.cohortes()[0].id)];
    this.maj();
  }

  protected basculerRegion(r: string): void {
    const v = this.f.valeurs ?? [];
    this.f.valeurs = v.includes(r) ? v.filter(x => x !== r) : [...v, r];
    this.maj();
  }

  protected chercherMembre(q: string): void { this.rechercheMembre = q; this.recherche.next(q); }
  protected ajouterMembre(m: MembreResponseDTO): void {
    if (!this.selection().some(x => x.id === m.id)) this.selection.update(s => [...s, m]);
    this.f.valeurs = this.selection().map(x => String(x.id));
    this.rechercheMembre = '';
    this.propositions.set([]);
    this.maj();
  }
  protected retirerMembre(m: MembreResponseDTO): void {
    this.selection.update(s => s.filter(x => x.id !== m.id));
    this.f.valeurs = this.selection().map(x => String(x.id));
    this.maj();
  }

  protected envoyer(brouillon: boolean): void {
    if (!this.f.titre?.trim() || !this.f.message?.trim()) { this.toast.error('Le titre et le message sont obligatoires.'); return; }
    if (this.f.cible !== 'TOUS' && !this.f.valeurs?.length) { this.toast.error('Choisissez les destinataires.'); return; }
    if (!brouillon && !this.f.canalApplication && !this.f.canalSms && !this.f.canalEmail) { this.toast.error('Choisissez au moins un canal d\'envoi.'); return; }
    this.envoi.set(true);
    const dto: NotificationDTOs.Envoi = { ...this.f, titre: this.f.titre.trim(), brouillon, programmeLe: this.programmer && this.dateProgrammee ? this.dateProgrammee + ':00' : undefined };
    this.service.envoyer(dto).subscribe({
      next: r => {
        this.envoi.set(false);
        this.toast.success(brouillon ? 'Brouillon enregistré.' : this.programmer ? 'Notification programmée.' : `Notification envoyée à ${nombre(r.nombreDestinataires)} membres.`);
        this.f = { type: 'INFORMATION', titre: '', message: '', cible: 'TOUS', valeurs: [], canalApplication: true, canalSms: true, canalEmail: false };
        this.selection.set([]);
        this.programmer = false;
        this.maj();
      },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }
}
