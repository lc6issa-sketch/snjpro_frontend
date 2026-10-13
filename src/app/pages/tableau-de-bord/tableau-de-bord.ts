import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StatistiqueDTOs } from '../../models/api.models';
import { BarChart } from '../../shared/components/charts/bar-chart/bar-chart';
import { Donut } from '../../shared/components/charts/donut/donut';
import { Point } from '../../models/graphique.model';
import { NombrePipe } from '../../shared/pipes/format.pipes';
import { ExportMembres } from '../membres/export-membres/export-membres';
import { nombre } from '../../shared/utils/format';
import { StatistiqueService } from '../../core/services/statistique.service';

/** Écran web 05 — Tableau de bord. */
@Component({
  selector: 'app-tableau-de-bord',
  imports: [RouterLink, BarChart, Donut, NombrePipe, ExportMembres],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tableau-de-bord.html',
  styleUrl: './tableau-de-bord.css'
})
export class TableauDeBord implements OnInit {
  private readonly service = inject(StatistiqueService);
  protected readonly auth = inject(AuthService);
  protected readonly tdb = signal<StatistiqueDTOs.TableauDeBord | null>(null);
  protected readonly charge = signal<Date | null>(null);
  protected readonly exporter = signal(false);

  protected readonly evolution = computed<Point[]>(() =>
    Object.entries(this.tdb()?.evolutionEffectifs ?? {}).map(([a, v]) => ({ libelle: a, valeur: v })));
  protected readonly periode = computed(() => {
    const e = this.evolution();
    return e.length ? `${e[0].libelle} – ${e[e.length - 1].libelle}` : '';
  });
  protected readonly sexe = computed(() => (this.tdb()?.repartitionSexe ?? []).map(s => ({
    libelle: s.libelle ?? '', valeur: s.valeur ?? 0, couleur: s.libelle === 'Femmes' ? 'var(--secondary)' : 'var(--primary)'
  })));
  protected readonly texteTotal = computed(() => nombre(this.tdb()?.membresEnregistres?.valeur));
  protected readonly majTexte = computed(() => (this.charge() ? 'à l\'instant' : '…'));

  ngOnInit(): void {
    this.service.tableauDeBord().subscribe(t => { this.tdb.set(t); this.charge.set(new Date()); });
  }

  protected statut(t: StatistiqueDTOs.TableauDeBord, cle: string): number { return t.cohortesParStatut?.[cle] ?? 0; }
}
