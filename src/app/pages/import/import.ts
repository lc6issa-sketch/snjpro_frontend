import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CohorteService } from '../../core/services/cohorte.service';
import { ToastService } from '../../core/services/toast.service';
import { CohorteDTO, DecisionDoublon, ImportAssistantDTOs } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { NombrePipe, TaillePipe } from '../../shared/pipes/format.pipes';
import { dateCourte, heure, nombre } from '../../shared/utils/format';
import { ImportService } from '../../core/services/import.service';
import { messageErreur } from '../../shared/utils/http';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { ShellService } from '../../core/services/shell.service';

type Etape = 1 | 2 | 3 | 4;

/** Écrans web 53 à 57 — Assistant d'import Excel / CSV (fichier, correspondance, vérification, import). */
@Component({
  selector: 'app-import',
  imports: [FormsModule, Icon, NombrePipe, TaillePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './import.html',
  styleUrl: './import.css'
})
export class Import implements OnInit {
  private readonly service = inject(ImportService);
  private readonly cohorteService = inject(CohorteService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly shell = inject(ShellService);
  private readonly router = inject(Router);

  protected readonly etape = signal<Etape>(1);
  protected readonly cohortes = signal<CohorteDTO[]>([]);
  protected readonly analyse = signal<ImportAssistantDTOs.Analyse | null>(null);
  protected readonly verification = signal<ImportAssistantDTOs.Verification | null>(null);
  protected readonly resultat = signal<ImportAssistantDTOs.Resultat | null>(null);
  protected readonly ongletVerif = signal<'doublons' | 'erreurs'>('doublons');
  protected readonly ouvert = signal<number | null>(null);
  protected readonly chargement = signal(false);
  protected readonly survol = signal(false);
  protected readonly toutesColonnes = signal(false);
  protected readonly duree = signal<number | null>(null);
  protected cohorteId: number | null = null;
  protected correspondance: Record<string, string | null> = {};

  protected readonly session = computed(() => this.resultat()?.session ?? this.verification()?.session ?? this.analyse()?.session ?? null);
  protected readonly colonnes = computed(() => {
    const c = this.analyse()?.colonnes ?? [];
    return this.toutesColonnes() ? c : c.slice(0, 8);
  });
  protected readonly resume = computed(() => {
    const c = this.analyse()?.colonnes ?? [];
    return { auto: c.filter(x => x.etat === 'AUTO').length, verifier: c.filter(x => x.etat === 'A_VERIFIER').length, ignorees: c.filter(x => x.etat === 'IGNOREE').length };
  });
  protected readonly apercu = computed(() => Object.entries(this.analyse()?.apercu ?? {}).slice(0, 7)
    .map(([cle, v]) => ({ libelle: this.analyse()?.champsDisponibles?.find(c => c.cle === cle)?.libelle ?? cle, valeur: v })));
  protected readonly doublonActif = computed(() => {
    const d = this.verification()?.doublons ?? [];
    const o = this.ouvert();
    return d.find(x => x.ligne === o) ?? d.find(x => !x.decision) ?? d[0] ?? null;
  });
  protected readonly ligneActive = computed(() => this.doublonActif()?.ligne ?? null);
  protected readonly part = computed(() => {
    const v = this.verification();
    const t = v?.totalLignes || 1;
    return { valides: Math.round(((v?.lignesValides ?? 0) / t) * 100), erreurs: Math.round(((v?.lignesEnErreur ?? 0) / t) * 100), doublons: Math.round(((v?.doublonsDetectes ?? 0) / t) * 100) };
  });
  protected readonly aImporter = computed(() => {
    const v = this.verification();
    if (!v) return 0;
    const ignores = (v.doublons ?? []).filter(d => !d.decision || d.decision === 'IGNORER' || d.decision === 'FUSIONNER').length;
    return Math.max(0, (v.lignesValides ?? 0) - ignores);
  });

  ngOnInit(): void {
    this.cohorteService.lister().subscribe(c => {
      this.cohortes.set(c.filter(x => x.statut !== 'ARCHIVEE'));
      this.cohorteId ??= this.cohortes().find(x => x.statut === 'EN_FORMATION')?.id ?? this.cohortes()[0]?.id ?? null;
    });
  }

  // ------------------------------------------------------------ étape 1
  protected choisir(ev: Event): void { const f = (ev.target as HTMLInputElement).files?.[0]; if (f) this.analyser(f); (ev.target as HTMLInputElement).value = ''; }
  protected deposer(ev: DragEvent): void { ev.preventDefault(); this.survol.set(false); const f = ev.dataTransfer?.files?.[0]; if (f) this.analyser(f); }

  private analyser(f: File): void {
    if (!this.cohorteId) { this.toast.error('Choisissez d\'abord la cohorte de destination.'); return; }
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) { this.toast.error('Format non pris en charge : utilisez un fichier .xlsx, .xls ou .csv.'); return; }
    if (f.size > 20 * 1024 * 1024) { this.toast.error('Le fichier dépasse 20 Mo.'); return; }
    this.chargement.set(true);
    this.service.analyser(f, this.cohorteId).subscribe({
      next: a => { this.chargement.set(false); this.ouvrirAnalyse(a); },
      error: e => { this.chargement.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  private ouvrirAnalyse(a: ImportAssistantDTOs.Analyse): void {
    this.analyse.set(a);
    this.correspondance = Object.fromEntries((a.colonnes ?? []).map(c => [c.entete!, c.champ ?? null]));
    this.verification.set(null);
    this.resultat.set(null);
    this.etape.set(2);
  }

  // ------------------------------------------------------------ étape 2
  protected changerChamp(entete: string, champ: string | null): void {
    const id = this.session()?.id;
    if (!id) return;
    if (champ) for (const [k, v] of Object.entries(this.correspondance)) if (v === champ && k !== entete) this.correspondance[k] = null;
    this.correspondance[entete] = champ;
    this.service.correspondance(id, this.correspondance).subscribe({ next: a => this.analyse.set(a), error: e => this.toast.error(messageErreur(e)) });
  }

  protected verifier(): void {
    const id = this.session()?.id;
    if (!id) return;
    const manquants = this.analyse()?.champsObligatoiresManquants ?? [];
    if (manquants.length) { this.toast.error(`Associez d'abord : ${manquants.join(', ')}.`); return; }
    this.chargement.set(true);
    const debut = performance.now();
    this.service.verifier(id).subscribe({
      next: v => {
        this.chargement.set(false);
        this.duree.set(Math.max(1, Math.round((performance.now() - debut) / 1000)));
        this.verification.set(v);
        this.ongletVerif.set(v.doublons?.length ? 'doublons' : 'erreurs');
        this.ouvert.set(null);
        this.etape.set(3);
      },
      error: e => { this.chargement.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  // ------------------------------------------------------------ étape 3
  protected decider(d: ImportAssistantDTOs.DoublonLigne, decision: DecisionDoublon): void {
    const id = this.session()?.id;
    if (!id) return;
    this.service.decider(id, d.ligne!, decision).subscribe({
      next: maj => {
        this.verification.update(v => v ? { ...v, doublons: v.doublons?.map(x => (x.ligne === maj.ligne ? maj : x)), doublonsSansDecision: (v.doublons ?? []).filter(x => x.ligne !== maj.ligne && !x.decision).length } : v);
        this.ouvert.set(null);
      },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected deciderTous(decision: DecisionDoublon): void {
    const id = this.session()?.id;
    if (id) this.service.deciderTous(id, decision).subscribe({ next: v => this.verification.set(v), error: e => this.toast.error(messageErreur(e)) });
  }

  protected exporterErreurs(): void { const id = this.session()?.id; if (id) this.service.exporterErreurs(id).subscribe({ error: e => this.toast.error(messageErreur(e)) }); }

  protected async importer(): Promise<void> {
    const id = this.session()?.id;
    const v = this.verification();
    if (!id || !v) return;
    if (v.doublonsSansDecision && !(await this.confirmation.demander('Des doublons restent à traiter', `${v.doublonsSansDecision} doublon(s) sans décision seront ignorés. Continuer ?`, 'Importer'))) return;
    this.chargement.set(true);
    const debut = performance.now();
    this.service.importer(id).subscribe({
      next: r => { this.chargement.set(false); this.duree.set(Math.max(1, Math.round((performance.now() - debut) / 1000))); this.resultat.set(r); this.etape.set(4); this.shell.rafraichir(); },
      error: e => { this.chargement.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected async annuler(): Promise<void> {
    const id = this.session()?.id;
    if (id && !(await this.confirmation.demander('Abandonner cet import ?', 'Le fichier sera supprimé et aucun membre ne sera créé.', 'Abandonner', true))) return;
    if (id) this.service.supprimer(id).subscribe();
    this.nouveau();
  }

  // ------------------------------------------------------------ étape 4
  protected rapport(): void { const id = this.session()?.id; if (id) this.service.rapport(id).subscribe({ error: e => this.toast.error(messageErreur(e)) }); }
  protected voirMembres(): void { this.router.navigate(['/membres'], { queryParams: { cohorteId: this.session()?.cohorteId } }); }
  protected nouveau(): void { this.analyse.set(null); this.verification.set(null); this.resultat.set(null); this.etape.set(1); }

  // ------------------------------------------------------------ libellés
  protected libelleChamp(cle?: string | null): string { return this.analyse()?.champsDisponibles?.find(c => c.cle === cle)?.libelle ?? cle ?? ''; }
  protected decisionTexte(d?: DecisionDoublon): string { return d === 'FUSIONNER' ? 'Fusionner' : d === 'CONSERVER_LES_DEUX' ? 'Conserver les deux' : d === 'IGNORER' ? 'Ignorer' : ''; }
  protected sousTitre(): string {
    const s = this.session();
    if (!s) return 'Intégrez les anciens fichiers Excel ou CSV dans la base SNJPro';
    if (this.etape() === 4 && s.dateImport) return `${s.nomFichier} · import terminé le ${dateCourte(s.dateImport)} à ${heure(s.dateImport)}`;
    return `${s.nomFichier} · ${nombre(s.totalLignes)} lignes · ${this.analyse()?.colonnes?.length ?? 0} colonnes détectées`;
  }
  protected nombre(n?: number | null): string { return nombre(n); }

}
