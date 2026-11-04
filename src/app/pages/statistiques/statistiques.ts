import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CohorteDTO, FormatFichier, SexeEnum, StatistiqueDTOs, TypeRapport } from '../../models/api.models';
import { Point, Segment } from '../../models/graphique.model';
import { StatistiqueService } from '../../core/services/statistique.service';
import { CohorteService } from '../../core/services/cohorte.service';
import { ReferentielService } from '../../core/services/referentiel.service';
import { ToastService } from '../../core/services/toast.service';
import { AreaChart } from '../../shared/components/charts/area-chart/area-chart';
import { Donut } from '../../shared/components/charts/donut/donut';
import { Icon } from '../../shared/components/icon/icon';
import { Modal } from '../../shared/components/modal/modal';
import { NombrePipe, TaillePipe, DateCourtePipe } from '../../shared/pipes/format.pipes';
import { TYPE_RAPPORT } from '../../shared/utils/libelles';
import { messageErreur } from '../../shared/utils/http';
import { aujourdhuiIso, nombre } from '../../shared/utils/format';

/** Tuile de la carte des régions, en pourcentage de la zone de dessin. */
interface Tuile { libelle: string; valeur: number; niveau: number; x: number; y: number; l: number; h: number; }
interface Rect { x: number; y: number; l: number; h: number; }

// Proportions de la zone de la carte des régions (largeur / hauteur)
const LARGEUR = 100, HAUTEUR = 56;

/** Couleur de chaque situation professionnelle (libellés renvoyés par l'API). */
const COULEURS_SITUATION: Record<string, string> = {
  'Salariés': 'var(--primary)', 'Sans emploi': 'var(--switch-off)', 'Entrepreneurs': 'var(--secondary)',
  'Étudiants': 'var(--blue)', 'Retraités': 'var(--gold)', 'Autres': 'var(--violet)', 'Non renseigné': 'var(--text-3)'
};

export const FORMATS_EXPORT: { format: FormatFichier; libelle: string; icone: string }[] = [
  { format: 'XLSX', libelle: 'Excel (.xlsx)', icone: 'file-spreadsheet' },
  { format: 'CSV', libelle: 'CSV (.csv)', icone: 'file' },
  { format: 'PDF', libelle: 'PDF (.pdf)', icone: 'file-text' }
];

/** Écran web — Statistiques (maquette Figma « Statistiques »). */
@Component({
  selector: 'app-statistiques',
  imports: [FormsModule, AreaChart, Donut, Icon, Modal, NombrePipe, TaillePipe, DateCourtePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './statistiques.html',
  styleUrl: './statistiques.css'
})
export class Statistiques implements OnInit {
  private readonly service = inject(StatistiqueService);
  private readonly cohorteService = inject(CohorteService);
  private readonly referentiel = inject(ReferentielService);
  private readonly toast = inject(ToastService);

  protected readonly stats = signal<StatistiqueDTOs.Statistiques | null>(null);
  protected readonly chargement = signal(false);
  protected readonly annees = signal<number[]>([]);
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly regions = signal<string[]>([]);

  /** Filtres en cours de saisie, appliqués au clic sur « Appliquer ». */
  protected brouillon: StatistiqueDTOs.Filtres = {};
  protected readonly filtres = signal<StatistiqueDTOs.Filtres>({});
  protected readonly filtresActifs = computed(() => Object.values(this.filtres()).some(v => v !== undefined && v !== null && v !== ''));

  protected readonly serie = signal<'competences' | 'completude'>('competences');
  protected readonly menuExport = signal(false);
  protected readonly formats = FORMATS_EXPORT;

  protected readonly rapports = signal<StatistiqueDTOs.RapportDTO[]>([]);
  protected readonly tousRapports = signal(false);
  protected readonly telechargement = signal<number | null>(null);
  protected readonly typesRapport = Object.entries(TYPE_RAPPORT).map(([cle, libelle]) => ({ cle: cle as TypeRapport, libelle }));
  protected readonly generation = signal(false);
  protected readonly envoi = signal(false);
  protected demande: StatistiqueDTOs.DemandeRapport = {};

  protected readonly periode = computed(() => {
    const a = this.annees();
    return a.length ? (a.length > 1 ? `${a[0]} – ${a[a.length - 1]}` : `${a[0]}`) : '';
  });

  // ------------------------------------------------------------ Carte des régions

  private readonly regionsRenseignees = computed(() =>
    (this.stats()?.repartitionGeographique ?? []).filter(r => r.libelle !== 'Non renseigné' && (r.valeur ?? 0) > 0));
  protected readonly sansRegion = computed(() =>
    this.stats()?.repartitionGeographique?.find(r => r.libelle === 'Non renseigné')?.valeur ?? 0);

  /** Seuils de la légende : 4 bornes régulières et arrondies, calées sur la région la plus peuplée. */
  protected readonly bornes = computed(() => {
    const max = Math.max(0, ...this.regionsRenseignees().map(r => r.valeur ?? 0));
    const pas = pasArrondi(max / 4);
    return [1, 2, 3, 4].map(i => i * pas);
  });
  protected readonly legendeCarte = computed(() => {
    const b = this.bornes();
    const pas = b[0];
    return [
      { niveau: 1, texte: `< ${nombre(b[0])}` },
      ...[0, 1, 2].map(i => ({ niveau: i + 2, texte: pas === 1 ? nombre(b[i]) : `${nombre(b[i])} – ${nombre(b[i + 1] - 1)}` })),
      { niveau: 5, texte: `≥ ${nombre(b[3])}` }
    ];
  });
  protected readonly tuiles = computed<Tuile[]>(() => {
    const regions = this.regionsRenseignees(), b = this.bornes();
    const rects = disposer(regions.map(r => r.valeur ?? 0), { x: 0, y: 0, l: LARGEUR, h: HAUTEUR });
    return regions.map((r, i) => ({
      libelle: r.libelle ?? '', valeur: r.valeur ?? 0, niveau: b.filter(x => (r.valeur ?? 0) >= x).length + 1,
      x: (rects[i].x / LARGEUR) * 100, y: (rects[i].y / HAUTEUR) * 100, l: (rects[i].l / LARGEUR) * 100, h: (rects[i].h / HAUTEUR) * 100
    }));
  });

  // ------------------------------------------------------------ Pyramide des âges

  protected readonly pyramide = computed(() => this.stats()?.pyramideAges ?? []);
  private readonly maxPyramide = computed(() =>
    Math.max(0.1, ...this.pyramide().flatMap(t => [t.pourcentageHommes ?? 0, t.pourcentageFemmes ?? 0])));
  protected largeur(p?: number): number { return ((p ?? 0) / this.maxPyramide()) * 100; }
  protected readonly ageRenseigne = computed(() => this.pyramide().some(t => (t.hommes ?? 0) + (t.femmes ?? 0) > 0));

  // ------------------------------------------------------------ Situation professionnelle

  protected readonly situations = computed(() => (this.stats()?.situationProfessionnelle ?? []).map(s => ({
    ...s, couleur: COULEURS_SITUATION[s.libelle ?? ''] ?? 'var(--teal)'
  })));
  protected readonly segments = computed<Segment[]>(() =>
    this.situations().map(s => ({ libelle: s.libelle ?? '', valeur: s.valeur ?? 0, couleur: s.couleur })));
  protected readonly totalSituation = computed(() => nombre(this.stats()?.profilsAvecSituation));

  // ------------------------------------------------------------ Courbe

  protected readonly points = computed<Point[]>(() => {
    const s = this.stats();
    const serie = this.serie() === 'competences' ? s?.competencesParAnnee : s?.completudeParAnnee;
    return Object.entries(serie ?? {}).map(([a, v]) => ({ libelle: a, valeur: v }));
  });
  /** Écart entre la première et la dernière année affichées, en points. */
  protected readonly evolution = computed(() => {
    const p = this.points();
    return p.length > 1 ? p[p.length - 1].valeur - p[0].valeur : null;
  });

  // ------------------------------------------------------------ Rapports

  protected readonly rapportsAffiches = computed(() => this.tousRapports() ? this.rapports() : this.rapports().slice(0, 5));

  ngOnInit(): void {
    this.charger();
    this.service.rapports().subscribe(r => this.rapports.set(r));
    this.cohorteService.lister().subscribe(c => this.cohortes.set(c));
    this.referentiel.regionsMali().subscribe(r => this.regions.set(r));
  }

  private charger(): void {
    this.chargement.set(true);
    this.service.statistiques(this.filtres()).subscribe({
      next: s => {
        this.stats.set(s);
        this.chargement.set(false);
        // la liste des années vient de la première vue complète, pour rester stable quand on filtre
        if (!this.annees().length) this.annees.set(Object.keys(s.completudeParAnnee ?? {}).map(Number).sort((a, b) => a - b));
      },
      error: e => { this.chargement.set(false); this.toast.error(messageErreur(e, 'Impossible de charger les statistiques.')); }
    });
  }

  protected appliquer(): void {
    const b = this.brouillon;
    this.filtres.set({
      annee: b.annee ? +b.annee : undefined, cohorteId: b.cohorteId ? +b.cohorteId : undefined,
      region: b.region || undefined, sexe: (b.sexe || undefined) as SexeEnum | undefined
    });
    this.charger();
  }

  protected reinitialiser(): void {
    this.brouillon = {};
    this.filtres.set({});
    this.charger();
  }

  protected exporter(format: FormatFichier): void {
    this.menuExport.set(false);
    this.service.exporter(this.filtres(), format).subscribe({
      next: () => this.toast.success('Statistiques exportées.'),
      error: e => this.toast.error(messageErreur(e, 'L\'export a échoué.'))
    });
  }

  protected ouvrirGeneration(): void {
    this.demande = { type: 'EFFECTIFS_COHORTES', format: 'PDF', region: this.filtres().region, au: aujourdhuiIso() };
    this.generation.set(true);
  }

  protected generer(): void {
    if (this.demande.du && this.demande.au && this.demande.du > this.demande.au) {
      this.toast.error('La date de début doit précéder la date de fin.');
      return;
    }
    this.envoi.set(true);
    this.service.genererRapport({ ...this.demande, region: this.demande.region || undefined }).subscribe({
      next: r => {
        this.envoi.set(false);
        this.generation.set(false);
        this.rapports.update(l => [r, ...l]);
        this.toast.success('Rapport généré : il est disponible dans la liste.');
      },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e, 'La génération du rapport a échoué.')); }
    });
  }

  protected telecharger(r: StatistiqueDTOs.RapportDTO): void {
    if (!r.id) return;
    this.telechargement.set(r.id);
    this.service.telechargerRapport(r.id).subscribe({
      next: () => this.telechargement.set(null),
      error: e => { this.telechargement.set(null); this.toast.error(messageErreur(e, 'Téléchargement impossible.')); }
    });
  }

  protected libelleType(t?: TypeRapport): string { return t ? TYPE_RAPPORT[t] ?? t : 'Rapport'; }
  protected libelleFormat(f?: FormatFichier): string { return f === 'XLSX' ? 'Excel' : f ?? ''; }

  @HostListener('document:click') fermerMenus(): void { this.menuExport.set(false); }
}

/** Plus grand pas « rond » entier (1, 2 ou 5 × 10ⁿ) qui ne dépasse pas v. */
function pasArrondi(v: number): number {
  if (v < 2) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  return [5, 2, 1].map(m => m * p).find(x => x <= v) ?? p;
}

/** Carte proportionnelle « squarifiée » : découpe la zone en rectangles proches du carré, dans l'ordre des valeurs (décroissantes). */
function disposer(valeurs: number[], zone: Rect): Rect[] {
  const total = valeurs.reduce((s, v) => s + v, 0);
  if (!total) return [];
  const aires = valeurs.map(v => (v / total) * zone.l * zone.h);
  const pire = (rangee: number[], cote: number) => {
    const s = rangee.reduce((a, b) => a + b, 0);
    return Math.max((cote * cote * Math.max(...rangee)) / (s * s), (s * s) / (cote * cote * Math.min(...rangee)));
  };
  const res: Rect[] = [];
  let { x, y, l, h } = zone, i = 0;
  while (i < aires.length) {
    const cote = Math.min(l, h);
    const rangee = [aires[i++]];
    while (i < aires.length && pire([...rangee, aires[i]], cote) <= pire(rangee, cote)) rangee.push(aires[i++]);
    const s = rangee.reduce((a, b) => a + b, 0);
    if (l >= h) {
      const larg = s / h;
      let yy = y;
      for (const a of rangee) { res.push({ x, y: yy, l: larg, h: a / larg }); yy += a / larg; }
      x += larg; l -= larg;
    } else {
      const haut = s / l;
      let xx = x;
      for (const a of rangee) { res.push({ x: xx, y, l: a / haut, h: haut }); xx += a / haut; }
      y += haut; h -= haut;
    }
  }
  return res;
}
