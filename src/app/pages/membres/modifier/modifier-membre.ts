import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, concat, of, toArray } from 'rxjs';
import { MembreService } from '../../../core/services/membre.service';
import { CohorteService } from '../../../core/services/cohorte.service';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { ToastService } from '../../../core/services/toast.service';
import { CohorteDTO, LocalisationDTO, MembreDTO, MembreResponseDTO, SituationProfessionnelleDTO, StatutMembreEnum, StatutProfessionnelEnum } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { RelatifPipe } from '../../../shared/pipes/format.pipes';
import { STATUT_PROFESSIONNEL } from '../../../shared/utils/libelles';
import { messageErreur } from '../../../shared/utils/http';

/** Écran web 20 — Modifier le profil d'un membre (chaque modification est tracée dans l'historique). */
@Component({
  selector: 'app-modifier-membre',
  imports: [FormsModule, RouterLink, Icon, RelatifPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './modifier-membre.html',
  styleUrl: './modifier-membre.css'
})
export class ModifierMembre implements OnInit {
  readonly id = input.required<string>();
  private readonly service = inject(MembreService);
  private readonly cohorteService = inject(CohorteService);
  private readonly referentiel = inject(ReferentielService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly statuts: { cle: StatutMembreEnum; libelle: string }[] = [
    { cle: 'ACTIF', libelle: 'Actif' }, { cle: 'INACTIF', libelle: 'Inactif' }, { cle: 'SUSPENDU', libelle: 'Suspendu' }, { cle: 'ARCHIVE', libelle: 'Archivé' }
  ];
  protected readonly statutsPro = Object.entries(STATUT_PROFESSIONNEL).map(([cle, e]) => ({ cle: cle as StatutProfessionnelEnum, libelle: e.libelle }));
  protected readonly original = signal<MembreResponseDTO | null>(null);
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly regions = signal<string[]>([]);
  protected readonly groupes = signal<string[]>([]);
  protected readonly envoi = signal(false);
  protected readonly nom = computed(() => `${this.original()?.prenom ?? ''} ${this.original()?.nom ?? ''}`.trim());

  protected m: MembreDTO | null = null;
  protected loc: LocalisationDTO = {};
  protected sit: SituationProfessionnelleDTO = {};

  ngOnInit(): void {
    this.cohorteService.lister().subscribe(c => this.cohortes.set(c));
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
    this.referentiel.groupesSanguins().subscribe(g => this.groupes.set(g));
    this.service.obtenir(+this.id()).subscribe({
      next: r => {
        this.m = {
          nom: r.nom, prenom: r.prenom, sexe: r.sexe, dateNaissance: r.dateNaissance, lieuNaissance: r.lieuNaissance, numeroTelephone: r.numeroTelephone,
          email: r.email, photoUrl: r.photoUrl, telephoneSecondaire: r.telephoneSecondaire, personneAPrevenir: r.personneAPrevenir,
          personneAPrevenirTelephone: r.personneAPrevenirTelephone, nationalite: r.nationalite, groupeSanguin: r.groupeSanguin, taille: r.taille, poids: r.poids,
          dernierDiplome: r.dernierDiplome, diplomes: r.diplomes, categorie: r.categorie, compagnie: r.compagnie,
          section: r.section, brigade: r.brigade, dateIncorporation: r.dateIncorporation, disponibleMobilisation: r.disponibleMobilisation !== false, statut: r.statut, cohorteId: r.cohorteId
        };
        this.loc = { ...(r.localisation ?? { pays: 'Mali' }) };
        this.sit = { ...(r.situationProfessionnelle ?? {}) };
        this.original.set(r);
      },
      error: e => { this.toast.error(messageErreur(e)); this.router.navigate(['/membres']); }
    });
  }

  protected enregistrer(): void {
    if (!this.m) return;
    const id = +this.id();
    const o = this.original();
    this.envoi.set(true);
    const appels: Observable<unknown>[] = [this.service.modifier(id, this.m)];
    if (this.loc.region || this.loc.cercle || this.loc.commune || this.loc.quartier) {
      appels.push(o?.localisation ? this.service.localisation(id, this.loc) : this.service.creerLocalisation(id, { pays: 'Mali', ...this.loc }));
    }
    if (this.sit.statut) appels.push(o?.situationProfessionnelle ? this.service.situation(id, this.sit) : this.service.creerSituation(id, this.sit));
    concat(...appels).pipe(toArray()).subscribe({
      next: () => { this.toast.success('Profil mis à jour.'); this.router.navigate(['/membres', id]); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }
}
