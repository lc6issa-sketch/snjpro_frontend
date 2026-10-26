import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, concat, forkJoin, last, of, switchMap, catchError, map, toArray } from 'rxjs';
import { MembreService } from '../../../core/services/membre.service';
import { CohorteService } from '../../../core/services/cohorte.service';
import { ReferentielService } from '../../../core/services/referentiel.service';
import { ToastService } from '../../../core/services/toast.service';
import { CohorteDTO, CompetenceReferentielDTOs, MembreDTO, NiveauCompetenceEnum, ParcoursSNJDTO, SexeEnum, StatutProfessionnelEnum } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { dateCourte, dateMoyenne } from '../../../shared/utils/format';
import { NIVEAU_COMPETENCE, STATUT_PROFESSIONNEL } from '../../../shared/utils/libelles';
import { CompetenceService } from '../../../core/services/competence.service';
import { messageErreur } from '../../../shared/utils/http';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ShellService } from '../../../core/services/shell.service';

const CLE_BROUILLON = 'snjpro.brouillon.nouveau-membre';
/** Âge minimal d'un membre à l'enregistrement. */
const AGE_MINIMUM = 18;

/** Date de naissance la plus récente possible (aujourd'hui moins AGE_MINIMUM ans), au format AAAA-MM-JJ local. */
function naissanceMaximale(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - AGE_MINIMUM);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface CompetenceChoisie { intitule: string; categorie?: string; niveau: NiveauCompetenceEnum; }

interface Formulaire {
  nom: string; prenom: string; dateNaissance: string; lieuNaissance: string; sexe: SexeEnum; nationalite: string;
  groupeSanguin: string; taille: string; poids: string; categorie: 'FONCTIONNAIRE' | 'NON_FONCTIONNAIRE'; diplomes: string[];
  telephone: string; email: string; telephoneSecondaire: string; personneAPrevenir: string; personneAPrevenirTelephone: string;
  region: string; cercle: string; commune: string; quartier: string; adresseComplete: string;
  cohorteId: number | null; dateIncorporation: string; compagnie: string; section: string; brigade: string; affectation: string; statut: 'ACTIF' | 'INACTIF';
  statutPro: StatutProfessionnelEnum | 'FONCTIONNAIRE' | null; profession: string; employeur: string; secteur: string; depuis: string;
  lieuTravail: string; contrat: string; disponible: boolean;
  competences: CompetenceChoisie[];
}

const VIDE: Formulaire = {
  nom: '', prenom: '', dateNaissance: '', lieuNaissance: '', sexe: 'FEMININ', nationalite: 'Malienne', groupeSanguin: '', taille: '', poids: '',
  categorie: 'NON_FONCTIONNAIRE', diplomes: [], telephone: '', email: '', telephoneSecondaire: '', personneAPrevenir: '', personneAPrevenirTelephone: '',
  region: '', cercle: '', commune: '', quartier: '', adresseComplete: '', cohorteId: null, dateIncorporation: '', compagnie: '', section: '', brigade: '',
  affectation: '', statut: 'ACTIF', statutPro: null, profession: '', employeur: '', secteur: '', depuis: '', lieuTravail: '', contrat: '',
  disponible: true, competences: []
};

const ETAPES = [
  { titre: 'Identité', detail: 'Nom, prénom, naissance', icone: 'user' },
  { titre: 'Contact & localisation', detail: 'Téléphone, adresse', icone: 'map-pin' },
  { titre: 'Cohorte & parcours', detail: 'Incorporation, affectation', icone: 'layers' },
  { titre: 'Situation professionnelle', detail: 'Statut, emploi actuel', icone: 'briefcase' },
  { titre: 'Compétences', detail: 'Savoir-faire et niveaux', icone: 'award' },
  { titre: 'Vérification', detail: 'Contrôle et création', icone: 'check-circle' }
];

const STATUTS_PRO: { cle: StatutProfessionnelEnum | 'FONCTIONNAIRE'; libelle: string }[] = [
  { cle: 'EMPLOYE', libelle: 'Salarié(e)' }, { cle: 'FONCTIONNAIRE', libelle: 'Fonctionnaire' }, { cle: 'AUTO_EMPLOYE', libelle: 'Entrepreneur(e)' },
  { cle: 'ETUDIANT', libelle: 'Étudiant(e)' }, { cle: 'CHOMEUR', libelle: 'Sans emploi' }, { cle: 'AUTRE', libelle: 'Autre' }
];

const SECTEURS = ['Administration publique', 'Agriculture & élevage', 'Artisanat', 'BTP', 'Commerce', 'Éducation', 'Énergie', 'Finance & comptabilité',
  'Industrie', 'Informatique & numérique', 'Mines', 'ONG & associations', 'Santé', 'Sécurité', 'Télécommunications', 'Transport & logistique', 'Autre'];

/** Écrans web 11 à 16 — Nouveau membre (assistant en 6 étapes). */
@Component({
  selector: 'app-nouveau-membre',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nouveau-membre.html',
  styleUrl: './nouveau-membre.css'
})
export class NouveauMembre implements OnInit {
  private readonly membres = inject(MembreService);
  private readonly cohorteService = inject(CohorteService);
  private readonly referentiel = inject(ReferentielService);
  private readonly competenceService = inject(CompetenceService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly router = inject(Router);
  private readonly shell = inject(ShellService);

  protected readonly etapes = ETAPES;
  protected readonly statutsPro = STATUTS_PRO;
  protected readonly secteurs = SECTEURS;
  protected readonly niveaux = Object.entries(NIVEAU_COMPETENCE).map(([cle, v]) => ({ cle: cle as NiveauCompetenceEnum, libelle: v.libelle }));

  protected f: Formulaire = structuredClone(VIDE);
  protected readonly etape = signal(1);
  protected readonly fait = signal(0);
  protected readonly erreurs = signal<Record<string, string>>({});
  protected readonly naissanceMax = naissanceMaximale();
  protected readonly ageMinimum = AGE_MINIMUM;
  protected readonly doublons = signal<string[]>([]);
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly regions = signal<string[]>([]);
  protected readonly diplomes = signal<string[]>([]);
  protected readonly groupes = signal<string[]>([]);
  protected readonly referentielCompetences = signal<CompetenceReferentielDTOs.Competence[]>([]);
  protected readonly rechercheCompetence = signal('');
  protected readonly photo = signal<File | null>(null);
  protected readonly apercuPhoto = signal<string | null>(null);
  protected readonly certifie = signal(false);
  protected readonly envoi = signal(false);
  protected readonly version = signal(0);

  protected readonly cohorte = computed(() => { this.version(); return this.cohortes().find(c => c.id === this.f.cohorteId) ?? null; });
  protected readonly propositions = computed(() => {
    this.version();
    const q = this.rechercheCompetence().trim().toLowerCase();
    const deja = new Set(this.f.competences.map(c => c.intitule.toLowerCase()));
    const liste = this.referentielCompetences().filter(c => !deja.has((c.nom ?? '').toLowerCase()));
    return q ? liste.filter(c => (c.nom ?? '').toLowerCase().includes(q)).slice(0, 6) : [];
  });
  protected readonly suggestions = computed(() => {
    this.version();
    const deja = new Set(this.f.competences.map(c => c.intitule.toLowerCase()));
    return this.referentielCompetences().filter(c => !deja.has((c.nom ?? '').toLowerCase())).slice(0, 5);
  });
  protected readonly parcoursAuto = computed<ParcoursSNJDTO[]>(() => { this.version(); return this.parcours(); });

  ngOnInit(): void {
    this.cohorteService.lister().subscribe(c => {
      this.cohortes.set(c.filter(x => x.statut !== 'ARCHIVEE'));
      this.restaurerBrouillon();
      if (!this.f.cohorteId) {
        const enFormation = this.cohortes().find(x => x.statut === 'EN_FORMATION') ?? this.cohortes()[0];
        if (enFormation) this.choisirCohorte(enFormation.id!);
      }
    });
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
    this.referentiel.diplomes().subscribe(d => this.diplomes.set(d));
    this.referentiel.groupesSanguins().subscribe(g => this.groupes.set(g));
    this.competenceService.lister(null, undefined, 'MEMBRES', true).subscribe(c => this.referentielCompetences.set(c));
  }

  // ------------------------------------------------------------- navigation
  protected continuer(): void {
    if (!this.valider(this.etape())) return;
    const actuelle = this.etape();
    this.fait.update(f => Math.max(f, actuelle));
    if (actuelle === 1 || actuelle === 2) this.verifierDoublons();
    this.etape.set(Math.min(6, actuelle + 1));
    this.sauverBrouillon(false);
  }

  protected precedent(): void { this.etape.update(e => Math.max(1, e - 1)); }

  private valider(etape: number): boolean {
    const e: Record<string, string> = {};
    const requis = (cle: keyof Formulaire, msg: string) => { if (!String(this.f[cle] ?? '').trim()) e[cle] = msg; };
    if (etape === 1) {
      requis('nom', 'Le nom est obligatoire'); requis('prenom', 'Le prénom est obligatoire');
      requis('dateNaissance', 'La date de naissance est obligatoire'); requis('lieuNaissance', 'Le lieu de naissance est obligatoire');
      if (this.f.dateNaissance && this.f.dateNaissance > this.naissanceMax) e['dateNaissance'] = `Le membre doit avoir au moins ${AGE_MINIMUM} ans`;
    }
    if (etape === 2) {
      requis('telephone', 'Le téléphone principal est obligatoire'); requis('region', 'La région est obligatoire');
      if (this.f.telephone && this.chiffres(this.f.telephone).length !== 8) e['telephone'] = 'Saisissez les 8 chiffres du numéro';
      if (this.f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.f.email)) e['email'] = 'Adresse e-mail invalide';
      if (this.f.personneAPrevenirTelephone && this.chiffres(this.f.personneAPrevenirTelephone).length !== 8) e['personneAPrevenirTelephone'] = 'Saisissez les 8 chiffres du numéro';
    }
    if (etape === 3) {
      if (!this.f.cohorteId) e['cohorteId'] = 'Choisissez une cohorte';
      requis('dateIncorporation', 'La date d\'incorporation est obligatoire');
    }
    this.erreurs.set(e);
    return !Object.keys(e).length;
  }

  // ------------------------------------------------------------- champs
  protected maj(): void { this.version.update(v => v + 1); }

  protected choisirCohorte(id: number): void {
    this.f.cohorteId = id;
    const c = this.cohortes().find(x => x.id === id);
    if (c?.dateDebut && !this.f.dateIncorporation) this.f.dateIncorporation = c.dateDebut;
    this.maj();
  }

  /** Diplômes du référentiel pas encore choisis. */
  protected diplomesDisponibles(): string[] { return this.diplomes().filter(d => !this.f.diplomes.includes(d)); }

  protected ajouterDiplome(d: string): void {
    if (!d || this.f.diplomes.includes(d)) return;
    this.f.diplomes = [...this.f.diplomes, d];
    this.maj();
  }

  protected retirerDiplome(d: string): void { this.f.diplomes = this.f.diplomes.filter(x => x !== d); this.maj(); }

  protected choisirPhoto(ev: Event): void {
    const fichier = (ev.target as HTMLInputElement).files?.[0];
    if (!fichier) return;
    if (!/^image\/(png|jpe?g)$/.test(fichier.type)) { this.toast.error('La photo doit être au format JPG ou PNG.'); return; }
    if (fichier.size > 2 * 1024 * 1024) { this.toast.error('La photo ne doit pas dépasser 2 Mo.'); return; }
    this.photo.set(fichier);
    this.apercuPhoto.set(URL.createObjectURL(fichier));
  }

  protected ajouterCompetence(nom: string, categorie?: string): void {
    const intitule = nom.trim();
    if (!intitule || this.f.competences.some(c => c.intitule.toLowerCase() === intitule.toLowerCase())) return;
    this.f.competences = [...this.f.competences, { intitule, categorie, niveau: 'INTERMEDIAIRE' }];
    this.rechercheCompetence.set('');
    this.maj();
  }

  protected retirerCompetence(i: number): void { this.f.competences = this.f.competences.filter((_, k) => k !== i); this.maj(); }
  protected niveau(i: number, n: NiveauCompetenceEnum): void { this.f.competences[i].niveau = n; this.maj(); }

  // ------------------------------------------------------------- doublons
  private verifierDoublons(): void {
    const tel = this.chiffres(this.f.telephone);
    this.membres.verifierDoublons({
      prenom: this.f.prenom, nom: this.f.nom, dateNaissance: this.f.dateNaissance || undefined,
      telephone: tel ? '+223' + tel : undefined, email: this.f.email || undefined
    }).subscribe({ next: r => this.doublons.set(r.motifs ?? []), error: () => this.doublons.set([]) });
  }

  protected voirFiche(motif: string): void {
    const id = /SNJ-\d{4}-\d+/.exec(motif)?.[0];
    if (!id) return;
    this.membres.rechercher({ query: id }, { size: 1 }).subscribe(p => {
      const m = p.content?.[0];
      if (m) window.open(`/membres/${m.id}`, '_blank');
    });
  }

  // ------------------------------------------------------------- résumé
  protected readonly texte = {
    sexe: () => (this.f.sexe === 'FEMININ' ? 'Femme' : 'Homme'),
    naissance: () => `${this.f.sexe === 'FEMININ' ? 'Née' : 'Né'} le ${dateCourte(this.f.dateNaissance)} à ${this.f.lieuNaissance}`,
    statutPro: () => STATUTS_PRO.find(s => s.cle === this.f.statutPro)?.libelle ?? 'Non renseignée',
    niveau: (n: NiveauCompetenceEnum) => NIVEAU_COMPETENCE[n].libelle,
    periode: (p: ParcoursSNJDTO) => `${dateMoyenne(p.dateDebut)}${p.dateFin ? ' – ' + dateMoyenne(p.dateFin) : ' – aujourd\'hui'}`
  };

  // ------------------------------------------------------------- création
  protected async creer(forcer = false): Promise<void> {
    if (!this.certifie() || this.envoi()) return;
    for (const n of [1, 2, 3]) if (!this.valider(n)) { this.etape.set(n); return; }
    this.envoi.set(true);
    this.membres.creer(this.dto(), forcer).pipe(
      switchMap(m => this.complements(m.id!).pipe(map(echecs => ({ m, echecs }))))
    ).subscribe({
      next: ({ m, echecs }) => {
        this.effacerBrouillon();
        this.shell.rafraichir();
        if (echecs) this.toast.info(`Membre ${m.identifiantSnj} créé. ${echecs} élément(s) du profil n'ont pas pu être enregistrés.`);
        else this.toast.success(`Membre ${m.identifiantSnj} créé.`);
        this.router.navigate(['/membres', m.id]);
      },
      error: async (e: unknown) => {
        this.envoi.set(false);
        if (e instanceof HttpErrorResponse && e.status === 409 && !forcer) {
          const ok = await this.confirmation.demander('Doublon potentiel', messageErreur(e) + ' Créer quand même ce membre ?', 'Créer quand même');
          if (ok) this.creer(true);
          return;
        }
        this.toast.error(messageErreur(e));
      }
    });
  }

  /** Enregistre les parties du profil qui passent par des endpoints dédiés ; renvoie le nombre d'échecs. */
  private complements(id: number): Observable<number> {
    const appels: Observable<boolean>[] = [];
    const ok = <T>(o: Observable<T>) => o.pipe(map(() => true), catchError(() => of(false)));
    appels.push(ok(this.membres.creerLocalisation(id, {
      pays: 'Mali', region: this.f.region, cercle: this.f.cercle || undefined, commune: this.f.commune || undefined,
      quartier: this.f.quartier || undefined, adresseComplete: this.f.adresseComplete || undefined
    })));
    if (this.f.statutPro) {
      const fonctionnaire = this.f.statutPro === 'FONCTIONNAIRE';
      const description = [fonctionnaire ? 'Fonctionnaire' : '', this.f.contrat, this.f.lieuTravail].filter(Boolean).join(' · ');
      appels.push(ok(this.membres.creerSituation(id, {
        statut: fonctionnaire ? 'EMPLOYE' : (this.f.statutPro as StatutProfessionnelEnum), profession: this.f.profession || undefined,
        nomEmployeur: this.f.employeur || undefined, secteurActivite: this.f.secteur || undefined,
        dateDebutActivite: this.f.depuis ? this.f.depuis + '-01' : undefined, description: description || undefined
      })));
    }
    this.f.competences.forEach(c => appels.push(ok(this.membres.ajouterCompetence(id, { intitule: c.intitule, categorie: c.categorie, niveau: c.niveau }))));
    this.parcours().forEach(p => appels.push(ok(this.membres.ajouterParcours(id, p))));
    const photo = this.photo();
    if (photo) appels.push(ok(this.membres.changerPhoto(id, photo)));
    return concat(...appels).pipe(toArray(), map(r => r.filter(x => !x).length), last());
  }

  private dto(): MembreDTO {
    const tel = this.chiffres(this.f.telephone);
    const tel2 = this.chiffres(this.f.telephoneSecondaire);
    const telPrevenir = this.chiffres(this.f.personneAPrevenirTelephone);
    return {
      nom: this.f.nom.trim().toUpperCase(), prenom: this.f.prenom.trim(), sexe: this.f.sexe, dateNaissance: this.f.dateNaissance,
      lieuNaissance: this.f.lieuNaissance.trim(), numeroTelephone: '+223' + tel, email: this.f.email.trim() || undefined,
      telephoneSecondaire: tel2 ? '+223' + tel2 : undefined, personneAPrevenir: this.f.personneAPrevenir.trim() || undefined,
      personneAPrevenirTelephone: telPrevenir ? '+223' + telPrevenir : undefined,
      nationalite: this.f.nationalite || undefined, groupeSanguin: this.f.groupeSanguin || undefined,
      taille: this.f.taille ? Number(String(this.f.taille).replace(',', '.')) : undefined,
      poids: this.f.poids ? Number(String(this.f.poids).replace(',', '.')) : undefined,
      diplomes: this.f.diplomes, categorie: this.f.categorie,
      compagnie: this.f.compagnie || undefined, section: this.f.section || undefined, brigade: this.f.brigade.trim() || undefined,
      dateIncorporation: this.f.dateIncorporation || undefined,
      disponibleMobilisation: this.f.disponible, statut: this.f.statut, cohorteId: this.f.cohorteId ?? undefined
    };
  }

  private parcours(): ParcoursSNJDTO[] {
    const c = this.cohorte();
    if (!c) return [];
    const l: ParcoursSNJDTO[] = [];
    l.push({ intitule: `Incorporation — ${c.nom}`, type: 'INCORPORATION', dateDebut: this.f.dateIncorporation || c.dateDebut, lieu: c.centre });
    if (c.dateDebut || c.dateFin) l.push({ intitule: `Formation initiale${c.centre ? ' — ' + c.centre : ''}`, type: 'FORMATION', dateDebut: c.dateDebut, dateFin: c.dateFin, lieu: c.centre });
    if (this.f.affectation.trim()) l.push({ intitule: `Affectation — ${this.f.affectation.trim()}`, type: 'AFFECTATION', dateDebut: c.dateFin || this.f.dateIncorporation, lieu: this.f.affectation.trim() });
    return l;
  }

  // ------------------------------------------------------------- brouillon
  protected sauverBrouillon(message = true): void {
    try { localStorage.setItem(CLE_BROUILLON, JSON.stringify({ f: this.f, etape: this.etape(), fait: this.fait() })); } catch { /* stockage indisponible */ }
    if (message) this.toast.success('Brouillon enregistré sur cet appareil.');
  }

  private restaurerBrouillon(): void {
    try {
      const brut = localStorage.getItem(CLE_BROUILLON);
      if (!brut) return;
      const b = JSON.parse(brut) as { f: Formulaire & { dernierDiplome?: string }; etape: number; fait: number };
      this.f = { ...structuredClone(VIDE), ...b.f };
      // Brouillon enregistré avant la saisie de plusieurs diplômes
      if (!Array.isArray(this.f.diplomes)) this.f.diplomes = b.f.dernierDiplome ? [b.f.dernierDiplome] : [];
      this.etape.set(b.etape || 1);
      this.fait.set(b.fait || 0);
      this.maj();
      this.toast.info('Brouillon restauré.');
    } catch { /* brouillon illisible : ignoré */ }
  }

  private effacerBrouillon(): void { try { localStorage.removeItem(CLE_BROUILLON); } catch { /* rien */ } }

  protected annuler(): void { this.effacerBrouillon(); this.router.navigate(['/membres']); }

  protected joindre(valeurs: (string | null | undefined)[], sep: string): string { return valeurs.filter(v => !!v).join(sep); }
  protected chiffres(t: string): string { return (t ?? '').replace(/\D/g, '').replace(/^223(?=\d{8}$)/, ''); }
  protected libelleStatutPro(cle: string): string { return STATUT_PROFESSIONNEL[cle]?.libelle ?? cle; }
}
