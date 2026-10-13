import { ChangeDetectionStrategy, Component, ElementRef, HostListener, computed, inject, signal, viewChild, AfterViewInit, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RechercheGlobale } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { RechercheService } from '../../core/services/recherche.service';
import { ShellService } from '../../core/services/shell.service';
import { LIBELLES_ROLES } from '../../shared/utils/libelles';

interface Resultat { type: 'membre' | 'utilisateur' | 'cohorte' | 'action'; titre: string; detail: string; lien: string; statut?: { libelle: string; teinte: string }; icone?: string; touche?: string; }

const ACTIONS: Resultat[] = [
  { type: 'action', titre: 'Créer un nouveau membre', detail: '', lien: '/membres/nouveau', icone: 'plus', touche: 'N' },
  { type: 'action', titre: 'Importer un fichier Excel', detail: '', lien: '/import', icone: 'upload', touche: 'I' },
  { type: 'action', titre: 'Lancer une mobilisation', detail: '', lien: '/mobilisations/nouvelle', icone: 'megaphone', touche: 'M' }
];

/** Palette de recherche globale (Ctrl K) : membres, utilisateurs, cohortes et actions rapides. */
@Component({
  selector: 'app-recherche-globale',
  imports: [FormsModule, Icon, Avatar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './recherche-globale.html',
  styleUrl: './recherche-globale.css'
})
export class Recherche implements AfterViewInit {
  private readonly service = inject(RechercheService);
  private readonly shell = inject(ShellService);
  private readonly router = inject(Router);
  private readonly champ = viewChild<ElementRef<HTMLInputElement>>('champ');

  protected readonly texte = signal('');
  protected readonly resultats = signal<RechercheGlobale.Resultats | null>(null);
  protected readonly chargement = signal(false);
  protected readonly curseur = signal(0);
  private readonly saisies = new Subject<string>();

  protected readonly groupes = computed(() => {
    const r = this.resultats();
    const g: { titre: string; items: Resultat[] }[] = [];
    if (r && this.texte().length >= 2) {
      const membres = (r.membres ?? []).map<Resultat>(m => ({
        type: 'membre', titre: `${m.prenom} ${m.nom}`, lien: `/membres/${m.id}`,
        detail: [m.identifiantSnj, m.cohorteNom, m.localisation?.region].filter(Boolean).join(' · '),
        statut: (m.tauxCompletude ?? 100) < 50 ? { libelle: 'Incomplet', teinte: 'red' } : m.statut === 'ACTIF' ? { libelle: 'Actif', teinte: 'green' } : { libelle: m.statut ?? '', teinte: 'grey' }
      }));
      if (membres.length) g.push({ titre: `Membres · ${r.totalMembres} résultat${(r.totalMembres ?? 0) > 1 ? 's' : ''}`, items: membres });
      const users = (r.utilisateurs ?? []).map<Resultat>(u => ({
        type: 'utilisateur', titre: `${u.prenom ?? ''} ${u.nom ?? ''}`.trim() || (u.username ?? ''), lien: `/utilisateurs?id=${u.id}`,
        detail: `${u.role ? LIBELLES_ROLES[u.role] : ''}${u.actif === false ? ' · compte désactivé' : ''}`
      }));
      if (users.length) g.push({ titre: `Utilisateurs · ${users.length} résultat${users.length > 1 ? 's' : ''}`, items: users });
      const cohortes = (r.cohortes ?? []).map<Resultat>(c => ({ type: 'cohorte', titre: c.nom ?? '', lien: `/cohortes/${c.id}`, detail: c.centre ?? c.region ?? '' }));
      if (cohortes.length) g.push({ titre: 'Cohortes', items: cohortes });
    }
    g.push({ titre: 'Actions rapides', items: ACTIONS });
    return g;
  });
  private readonly aplati = computed(() => this.groupes().flatMap(g => g.items));
  protected readonly total = computed(() => this.aplati().filter(r => r.type !== 'action').length);

  constructor() {
    this.saisies.pipe(
      debounceTime(200), distinctUntilChanged(),
      switchMap(q => {
        if (q.trim().length < 2) { this.chargement.set(false); return of(null); }
        this.chargement.set(true);
        return this.service.rechercher(q.trim(), 5).pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(inject(DestroyRef))
    ).subscribe(r => { this.resultats.set(r); this.chargement.set(false); this.curseur.set(0); });
  }

  ngAfterViewInit(): void { setTimeout(() => this.champ()?.nativeElement.focus()); }

  protected saisir(v: string): void { this.texte.set(v); this.saisies.next(v); }
  protected index(r: Resultat): number { return this.aplati().indexOf(r); }
  protected fermer(): void { this.shell.recherche.set(false); }
  protected ouvrir(r: Resultat): void { this.fermer(); this.router.navigateByUrl(r.lien); }

  @HostListener('document:keydown', ['$event']) clavier(ev: KeyboardEvent): void {
    const n = this.aplati().length;
    if (ev.key === 'Escape') this.fermer();
    else if (ev.key === 'ArrowDown') { ev.preventDefault(); this.curseur.update(c => (c + 1) % n); }
    else if (ev.key === 'ArrowUp') { ev.preventDefault(); this.curseur.update(c => (c - 1 + n) % n); }
    else if (ev.key === 'Enter') { const r = this.aplati()[this.curseur()]; if (r) this.ouvrir(r); }
  }
}
