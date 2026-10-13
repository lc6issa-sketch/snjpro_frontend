import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MembreService } from '../../../core/services/membre.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormatFichier, MembreFilterDTO } from '../../../models/api.models';
import { Modal } from '../../../shared/components/modal/modal';
import { Icon } from '../../../shared/components/icon/icon';
import { nombre, taille } from '../../../shared/utils/format';
import { messageErreur } from '../../../shared/utils/http';

const SECTIONS = [
  { cle: 'IDENTITE', titre: 'Identité', detail: 'Nom, prénom, sexe, naissance' },
  { cle: 'CONTACT', titre: 'Contact', detail: 'Téléphone, e-mail' },
  { cle: 'COHORTE', titre: 'Cohorte & parcours', detail: 'Cohorte, affectations' },
  { cle: 'LOCALISATION', titre: 'Localisation', detail: 'Région, cercle, commune' },
  { cle: 'SITUATION', titre: 'Situation professionnelle', detail: 'Statut, profession, employeur' },
  { cle: 'COMPETENCES', titre: 'Compétences', detail: 'Compétences et niveaux' }
];

/** Écran web 10 — Exporter les membres (Excel, CSV ou PDF) selon les filtres actifs. */
@Component({
  selector: 'app-export-membres',
  imports: [FormsModule, Modal, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './export-membres.html',
  styleUrl: './export-membres.css'
})
export class ExportMembres implements OnInit {
  private readonly service = inject(MembreService);
  private readonly toast = inject(ToastService);
  readonly filtres = input<MembreFilterDTO>({});
  readonly etiquettes = input<string[]>([]);
  readonly fermer = output<void>();

  protected readonly formats: { cle: FormatFichier; titre: string; detail: string; icone: string; teinte: string }[] = [
    { cle: 'XLSX', titre: 'Excel', detail: '.xlsx', icone: 'file-spreadsheet', teinte: 'tone-lime' },
    { cle: 'CSV', titre: 'CSV', detail: '.csv', icone: 'file-text', teinte: 'tone-blue' },
    { cle: 'PDF', titre: 'PDF', detail: 'Liste imprimable', icone: 'file', teinte: 'tone-red' }
  ];
  protected readonly sectionsDispo = SECTIONS;
  protected readonly format = signal<FormatFichier>('XLSX');
  protected readonly sections = signal(new Set(['IDENTITE', 'CONTACT', 'COHORTE', 'LOCALISATION', 'SITUATION']));
  protected masquer = true;
  protected readonly estimation = signal<{ nombreMembres?: number; tailleEstimeeOctets?: number } | null>(null);
  protected readonly chargement = signal(false);
  protected readonly nombreTexte = computed(() => nombre(this.estimation()?.nombreMembres ?? 0));
  protected readonly tailleTexte = computed(() => taille(this.estimation()?.tailleEstimeeOctets));
  protected readonly sousTitre = computed(() => `${this.nombreTexte()} membres correspondent aux filtres actifs`);

  ngOnInit(): void { this.estimer(); }

  protected basculer(cle: string): void {
    this.sections.update(s => { const n = new Set(s); n.has(cle) ? n.delete(cle) : n.add(cle); return n; });
  }
  protected toutSelectionner(): void { this.sections.set(new Set(SECTIONS.map(s => s.cle))); }

  protected estimer(): void {
    this.service.estimerExport(this.requete()).subscribe(e => this.estimation.set(e));
  }

  protected exporter(): void {
    this.chargement.set(true);
    this.service.exporter(this.requete()).subscribe({
      next: () => { this.chargement.set(false); this.toast.success('Export téléchargé.'); this.fermer.emit(); },
      error: e => { this.chargement.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  private requete() {
    return { format: this.format(), sections: [...this.sections()], masquerDonneesSensibles: this.masquer, filtres: this.filtres() };
  }
}
