import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast.service';
import { DemandeDTOs } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Pill } from '../../shared/components/pill/pill';
import { Modal } from '../../shared/components/modal/modal';
import { DateHeurePipe, NombrePipe, RelatifPipe, TaillePipe } from '../../shared/pipes/format.pipes';
import { STATUT_DEMANDE, TYPE_DEMANDE } from '../../shared/utils/libelles';
import { dateCourte, heure } from '../../shared/utils/format';
import { DemandeService } from '../../core/services/demande.service';
import { messageErreur } from '../../shared/utils/http';

type Onglet = 'attente' | 'cours' | 'traitees';

const LIBELLES_CHAMPS: Record<string, string> = {
  region: 'Région', cercle: 'Cercle', commune: 'Commune', quartier: 'Quartier', adresse: 'Adresse', profession: 'Profession',
  employeur: 'Employeur', secteurActivite: 'Secteur d\'activité', email: 'E-mail', telephone: 'Téléphone', dateNaissance: 'Date de naissance',
  lieuNaissance: 'Lieu de naissance', dernierDiplome: 'Dernier diplôme', nom: 'Nom', prenom: 'Prénom'
};
const MOTIFS = ['Justificatif insuffisant ou illisible', 'Informations incohérentes', 'Demande hors du champ du SNJ', 'Autre motif'];
const ELEMENTS = ['Justificatif de domicile récent (moins de 3 mois)', 'Attestation de l\'employeur', 'Copie de la pièce d\'identité', 'Copie du diplôme'];

/** Écrans web 46 (Demandes des membres), 47 (Rejeter) et 48 (Demander un complément). */
@Component({
  selector: 'app-demandes',
  imports: [FormsModule, RouterLink, Icon, Avatar, Pill, Modal, DateHeurePipe, NombrePipe, RelatifPipe, TaillePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demandes.html',
  styleUrl: './demandes.css'
})
export class Demandes implements OnInit {
  private readonly service = inject(DemandeService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly STATUT = STATUT_DEMANDE;
  protected readonly TYPE = TYPE_DEMANDE;
  protected readonly motifs = MOTIFS;
  protected readonly elementsPossibles = ELEMENTS;
  protected readonly demandes = signal<DemandeDTOs.Resume[]>([]);
  protected readonly stats = signal<DemandeDTOs.Statistiques | null>(null);
  protected readonly onglet = signal<Onglet>('attente');
  protected readonly recherche = signal('');
  protected readonly selection = signal<DemandeDTOs.Detail | null>(null);
  protected readonly rejet = signal(false);
  protected readonly complement = signal(false);
  protected readonly envoi = signal(false);

  protected reponse = '';
  protected appliquer = true;
  protected motif = MOTIFS[0];
  protected messageRejet = '';
  protected elements = new Set<string>([ELEMENTS[0]]);
  protected messageComplement = '';
  protected delai = 7;

  protected readonly filtrees = computed(() => {
    const o = this.onglet(), q = this.recherche().trim().toLowerCase();
    return this.demandes().filter(d => {
      const groupe = d.statut === 'EN_ATTENTE' ? 'attente' : d.statut === 'EN_COURS' || d.statut === 'COMPLEMENT_DEMANDE' ? 'cours' : 'traitees';
      return groupe === o && (!q || `${d.membre} ${d.objet} ${d.numeroSuivi}`.toLowerCase().includes(q));
    });
  });
  protected readonly compte = computed(() => {
    const l = this.demandes();
    return {
      attente: l.filter(d => d.statut === 'EN_ATTENTE').length,
      cours: l.filter(d => d.statut === 'EN_COURS' || d.statut === 'COMPLEMENT_DEMANDE').length,
      traitees: l.filter(d => d.statut === 'ACCEPTEE' || d.statut === 'REJETEE').length
    };
  });
  protected readonly traitee = computed(() => ['ACCEPTEE', 'REJETEE'].includes(this.selection()?.resume?.statut ?? ''));

  ngOnInit(): void {
    this.charger(() => {
      const id = Number(this.route.snapshot.queryParamMap.get('id'));
      const cible = id ? this.demandes().find(d => d.id === id) : this.filtrees()[0];
      if (cible) this.ouvrir(cible);
    });
  }

  protected changerOnglet(o: Onglet): void {
    this.onglet.set(o);
    const premiere = this.filtrees()[0];
    if (premiere) this.ouvrir(premiere); else this.selection.set(null);
  }

  protected ouvrir(d: DemandeDTOs.Resume): void {
    this.service.obtenir(d.id!).subscribe(det => {
      this.selection.set(det);
      this.reponse = det.resume?.reponse ?? this.reponseParDefaut(det);
      this.appliquer = !!det.modifications?.length;
    });
  }

  protected libelleChamp(c?: string): string { return LIBELLES_CHAMPS[c ?? ''] ?? c ?? ''; }
  protected soumise(d: DemandeDTOs.Resume): string { return d.dateCreation ? `soumise le ${dateCourte(d.dateCreation)} à ${heure(d.dateCreation)}` : ''; }
  protected piece(): void { const id = this.selection()?.resume?.id; if (id) this.service.pieceJointe(id).subscribe({ error: e => this.toast.error(messageErreur(e)) }); }

  // ------------------------------------------------------------ décisions
  protected valider(): void {
    const id = this.selection()?.resume?.id;
    if (!id) return;
    this.envoi.set(true);
    this.service.valider(id, { reponse: this.reponse.trim() || undefined, appliquerModification: this.appliquer }).subscribe({
      next: d => this.apres(d, 'Demande validée. Le membre est notifié.'),
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected ouvrirRejet(): void { this.motif = MOTIFS[0]; this.messageRejet = ''; this.rejet.set(true); }
  protected rejeter(): void {
    const id = this.selection()?.resume?.id;
    if (!id) return;
    this.envoi.set(true);
    this.service.rejeter(id, { motif: this.motif, message: this.messageRejet.trim() || undefined }).subscribe({
      next: d => { this.rejet.set(false); this.apres(d, 'Demande rejetée. Le membre est notifié.'); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected ouvrirComplement(): void { this.elements = new Set([ELEMENTS[0]]); this.messageComplement = ''; this.delai = 7; this.complement.set(true); }
  protected basculerElement(e: string): void { this.elements.has(e) ? this.elements.delete(e) : this.elements.add(e); }
  protected demanderComplement(): void {
    const id = this.selection()?.resume?.id;
    if (!id) return;
    if (!this.elements.size && !this.messageComplement.trim()) { this.toast.error('Indiquez les éléments à fournir.'); return; }
    this.envoi.set(true);
    this.service.complement(id, { elements: [...this.elements], message: this.messageComplement.trim() || undefined, delaiJours: this.delai }).subscribe({
      next: d => { this.complement.set(false); this.apres(d, 'Demande de complément envoyée au membre.'); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected exporter(): void {
    const lignes = [['Numéro', 'Membre', 'Identifiant', 'Type', 'Objet', 'Statut', 'Soumise le'],
      ...this.demandes().map(d => [d.numeroSuivi, d.membre, d.identifiantSnj, TYPE_DEMANDE[d.type ?? '']?.libelle, d.objet, STATUT_DEMANDE[d.statut ?? '']?.libelle, dateCourte(d.dateCreation)])];
    const csv = '﻿' + lignes.map(l => l.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = `demandes_${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private apres(d: DemandeDTOs.Detail, message: string): void {
    this.envoi.set(false);
    this.toast.success(message);
    this.selection.set(d);
    this.charger();
  }

  private reponseParDefaut(d: DemandeDTOs.Detail): string {
    const prenom = (d.resume?.membre ?? '').split(' ')[0];
    if (d.resume?.type === 'MISE_A_JOUR_PROFIL') return `Bonjour ${prenom}, votre demande de mise à jour a bien été prise en compte.`;
    if (d.resume?.type === 'ATTESTATION') return `Bonjour ${prenom}, votre attestation est disponible dans « Mes documents ».`;
    return `Bonjour ${prenom}, votre demande a bien été traitée.`;
  }

  private charger(ensuite?: () => void): void {
    this.service.lister().subscribe(l => { this.demandes.set(l); ensuite?.(); });
    this.service.statistiques().subscribe(s => this.stats.set(s));
  }
}
