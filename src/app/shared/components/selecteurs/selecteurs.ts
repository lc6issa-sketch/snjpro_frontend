import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, Injector, afterNextRender, computed, inject, signal, viewChild
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Icon } from '../icon/icon';

type Mode = 'select' | 'date' | 'month' | 'datetime-local' | 'time';
type VueCalendrier = 'jours' | 'mois' | 'annees';
type Controle = HTMLSelectElement | HTMLInputElement;

interface OptionListe { index: number; libelle: string; desactive: boolean; choisi: boolean; }
interface Position { top: number | null; bottom: number | null; left: number; minWidth: number | null; maxHeight: number | null; haut: boolean; }

const TYPES_DATE = ['date', 'month', 'datetime-local', 'time'];
const LARGEURS: Record<Mode, number> = { select: 0, date: 296, month: 296, 'datetime-local': 420, time: 140 };
const HAUTEURS: Record<Mode, number> = { select: 320, date: 370, month: 300, 'datetime-local': 370, time: 300 };
const JOURS_SEMAINE = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];
const MOIS_COURTS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
const MOIS_LONGS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const pad = (n: number) => String(n).padStart(2, '0');
const isoJour = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoMois = (a: number, m: number) => `${a}-${pad(m + 1)}`;
const heureActuelle = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/**
 * Remplace, pour toute l'application, les popups natives des listes déroulantes (<select>)
 * et des champs date / mois / date-heure / heure par des panneaux aux couleurs SNJPro.
 * Le contrôle natif reste en place (ngModel, validation, clavier) : seule sa popup est interceptée,
 * et la valeur choisie lui est réécrite avec les événements input/change habituels.
 */
@Component({
  selector: 'app-selecteurs',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './selecteurs.html',
  styleUrl: './selecteurs.css'
})
export class Selecteurs {
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly panneau = viewChild<ElementRef<HTMLElement>>('panneau');
  private readonly liste = viewChild<ElementRef<HTMLElement>>('liste');
  private readonly colH = viewChild<ElementRef<HTMLElement>>('colH');
  private readonly colM = viewChild<ElementRef<HTMLElement>>('colM');

  protected readonly joursSemaine = JOURS_SEMAINE;
  protected readonly heures = Array.from({ length: 24 }, (_, i) => pad(i));
  protected readonly minutes = Array.from({ length: 60 }, (_, i) => pad(i));

  private cible: Controle | null = null;
  protected readonly mode = signal<Mode | null>(null);
  protected readonly pos = signal<Position>({ top: null, bottom: null, left: 0, minWidth: null, maxHeight: null, haut: false });
  protected readonly requis = signal(false);

  // Liste déroulante
  protected readonly options = signal<OptionListe[]>([]);
  protected readonly actif = signal(-1);
  private recherche = '';
  private rechercheTimer: ReturnType<typeof setTimeout> | undefined;

  // Calendrier / heure
  private readonly valeur = signal('');
  private readonly bornes = signal<{ min: string; max: string }>({ min: '', max: '' });
  protected readonly vue = signal({ annee: 2000, mois: 0 });
  protected readonly vueCal = signal<VueCalendrier>('jours');

  private readonly partieDate = computed(() => {
    const m = this.mode(), v = this.valeur();
    return m === 'time' ? '' : m === 'month' ? v.slice(0, 7) : v.slice(0, 10);
  });
  private readonly partieHeure = computed(() => {
    const m = this.mode(), v = this.valeur();
    return m === 'time' ? v.slice(0, 5) : m === 'datetime-local' ? v.slice(11, 16) : '';
  });
  protected readonly heureChoisie = computed(() => this.partieHeure().slice(0, 2));
  protected readonly minuteChoisie = computed(() => this.partieHeure().slice(3, 5));

  protected readonly titre = computed(() => {
    const { annee, mois } = this.vue();
    switch (this.vueCal()) {
      case 'jours': return `${MOIS_LONGS[mois]} ${annee}`;
      case 'mois': return String(annee);
      default: { const debut = Math.floor(annee / 12) * 12; return `${debut} – ${debut + 11}`; }
    }
  });

  protected readonly jours = computed(() => {
    const { annee, mois } = this.vue();
    const { min, max } = this.bornes();
    const choisi = this.partieDate(), auj = isoJour(new Date());
    const decalage = (new Date(annee, mois, 1).getDay() + 6) % 7;
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(annee, mois, 1 - decalage + i);
      const iso = isoJour(d);
      return {
        iso, jour: d.getDate(), hors: d.getMonth() !== mois, auj: iso === auj, choisi: iso === choisi,
        off: (!!min && iso < min.slice(0, 10)) || (!!max && iso > max.slice(0, 10))
      };
    });
  });

  protected readonly moisGrille = computed(() => {
    const { annee } = this.vue();
    const { min, max } = this.bornes();
    const choisi = this.partieDate().slice(0, 7), auj = isoJour(new Date()).slice(0, 7);
    return MOIS_COURTS.map((libelle, index) => {
      const iso = isoMois(annee, index);
      return { index, libelle, auj: iso === auj, choisi: iso === choisi, off: (!!min && iso < min.slice(0, 7)) || (!!max && iso > max.slice(0, 7)) };
    });
  });

  protected readonly anneesGrille = computed(() => {
    const debut = Math.floor(this.vue().annee / 12) * 12;
    const { min, max } = this.bornes();
    const choisi = this.partieDate().slice(0, 4), auj = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => {
      const annee = debut + i;
      return { annee, auj: annee === auj, choisi: String(annee) === choisi, off: (!!min && annee < +min.slice(0, 4)) || (!!max && annee > +max.slice(0, 4)) };
    });
  });

  constructor() {
    afterNextRender(() => {
      const doc = this.document;
      const ecouteurs: [string, (e: never) => void, AddEventListenerOptions][] = [
        ['mousedown', (e: MouseEvent) => this.surMouseDown(e), { capture: true }],
        ['click', (e: MouseEvent) => this.surClick(e), { capture: true }],
        ['keydown', (e: KeyboardEvent) => this.surKeyDown(e), { capture: true }],
        ['scroll', (e: Event) => this.surScroll(e), { capture: true, passive: true }]
      ];
      for (const [type, f, o] of ecouteurs) doc.addEventListener(type, f as EventListener, o);
      const redim = () => this.placer();
      doc.defaultView?.addEventListener('resize', redim);
      this.destroyRef.onDestroy(() => {
        for (const [type, f, o] of ecouteurs) doc.removeEventListener(type, f as EventListener, o);
        doc.defaultView?.removeEventListener('resize', redim);
      });
    });
  }

  // ---------- Interception des contrôles natifs ----------

  private selectEligible(cible: EventTarget | null): HTMLSelectElement | null {
    const el = cible instanceof Element ? cible.closest('select') : null;
    return el && !el.multiple && el.size <= 1 && !el.disabled ? el : null;
  }

  private dateEligible(cible: EventTarget | null): HTMLInputElement | null {
    return cible instanceof HTMLInputElement && TYPES_DATE.includes(cible.type) && !cible.disabled && !cible.readOnly ? cible : null;
  }

  private dansPanneau(cible: EventTarget | null): boolean {
    return cible instanceof Node && !!this.panneau()?.nativeElement.contains(cible);
  }

  private surMouseDown(e: MouseEvent): void {
    if (this.dansPanneau(e.target)) { e.preventDefault(); return; }   // garde le focus sur le contrôle
    if (e.button !== 0) { this.fermer(); return; }
    const select = this.selectEligible(e.target);
    if (select) {
      e.preventDefault();                                             // empêche la popup native
      select.focus();
      if (this.cible === select) this.fermer(); else this.ouvrir(select);
      return;
    }
    if (this.cible && e.target !== this.cible) this.fermer();
  }

  private surClick(e: MouseEvent): void {
    const input = this.dateEligible(e.target);
    if (!input) return;
    e.preventDefault();                                               // empêche le calendrier natif
    if (this.cible !== input) this.ouvrir(input);
  }

  private surKeyDown(e: KeyboardEvent): void {
    const ouvrirTouche = (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) || e.key === 'F4';
    if (!this.cible) {
      const select = this.selectEligible(e.target);
      if (select && (ouvrirTouche || e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); this.ouvrir(select); return; }
      const input = this.dateEligible(e.target);
      if (input && ouvrirTouche) { e.preventDefault(); this.ouvrir(input); }
      return;
    }
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); this.fermer(true); return; }
    if (e.key === 'Tab') { this.fermer(); return; }
    if (this.mode() === 'select') this.naviguerListe(e);
    else if (e.key === 'Enter' || ouvrirTouche) { e.preventDefault(); this.fermer(true); }
  }

  private surScroll(e: Event): void {
    if (this.cible && !this.dansPanneau(e.target)) this.placer();
  }

  // ---------- Ouverture / fermeture ----------

  private ouvrir(el: Controle): void {
    this.cible = el;
    this.requis.set(el.required);
    if (el instanceof HTMLSelectElement) {
      const options = Array.from(el.options)
        .filter(o => !o.hidden)
        .map(o => ({ index: o.index, libelle: o.text, desactive: o.disabled, choisi: o.selected }));
      this.options.set(options);
      this.actif.set(options.findIndex(o => o.choisi));
      this.mode.set('select');
    } else {
      const mode = el.type as Mode;
      this.valeur.set(el.value);
      this.bornes.set({ min: el.min, max: el.max });
      const base = el.value && mode !== 'time' ? el.value.slice(0, 10) : '';
      const [a, m] = base ? base.split('-').map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
      this.vue.set({ annee: a, mois: (m || 1) - 1 });
      this.vueCal.set(mode === 'month' ? 'mois' : 'jours');
      this.mode.set(mode);
    }
    this.placer();
    afterNextRender(() => this.centrerSelection(), { injector: this.injector });
  }

  protected fermer(rendreFocus = false): void {
    const el = this.cible;
    if (!el) return;
    this.cible = null;
    this.mode.set(null);
    clearTimeout(this.rechercheTimer);
    this.recherche = '';
    if (rendreFocus && el.isConnected) el.focus();
  }

  private placer(): void {
    const el = this.cible, mode = this.mode();
    if (!el || !mode) return;
    const r = el.getBoundingClientRect();
    const vw = this.document.documentElement.clientWidth, vh = this.document.defaultView?.innerHeight ?? 800;
    if (!el.isConnected || (r.width === 0 && r.height === 0) || r.bottom < 0 || r.top > vh) { this.fermer(); return; }
    const marge = 6;
    const hauteur = mode === 'select' ? Math.min(this.options().length * 38 + 14, HAUTEURS.select) : HAUTEURS[mode];
    const dessous = vh - r.bottom - marge - 8, dessus = r.top - marge - 8;
    const haut = dessous < hauteur && dessus > dessous;
    const largeur = mode === 'select' ? r.width : LARGEURS[mode];
    this.pos.set({
      top: haut ? null : r.bottom + marge,
      bottom: haut ? vh - r.top + marge : null,
      left: Math.max(8, Math.min(r.left, vw - largeur - 8)),
      minWidth: mode === 'select' ? Math.max(r.width, 160) : null,
      maxHeight: mode === 'select' ? Math.max(120, Math.min(HAUTEURS.select, haut ? dessus : dessous)) : null,
      haut
    });
  }

  private centrerSelection(): void {
    const centrer = (col: HTMLElement | undefined, el: Element | null | undefined) => {
      if (col && el instanceof HTMLElement) col.scrollTop = el.offsetTop - col.offsetTop - (col.clientHeight - el.offsetHeight) / 2;
    };
    const liste = this.liste()?.nativeElement;
    centrer(liste, liste?.querySelector('li.actif'));
    for (const col of [this.colH()?.nativeElement, this.colM()?.nativeElement]) centrer(col, col?.querySelector('.choisi'));
  }

  // ---------- Liste déroulante ----------

  protected survoler(i: number): void {
    if (!this.options()[i]?.desactive) this.actif.set(i);
  }

  protected choisir(i: number): void {
    const select = this.cible, option = this.options()[i];
    if (!(select instanceof HTMLSelectElement) || !option || option.desactive) return;
    if (select.selectedIndex !== option.index) {
      select.selectedIndex = option.index;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.fermer(true);
  }

  private naviguerListe(e: KeyboardEvent): void {
    const options = this.options();
    const deplacer = (depart: number, pas: number) => {
      for (let i = depart; i >= 0 && i < options.length; i += pas) if (!options[i].desactive) { this.actif.set(i); break; }
    };
    switch (e.key) {
      case 'ArrowDown': deplacer(this.actif() + 1, 1); break;
      case 'ArrowUp': deplacer(this.actif() - 1, -1); break;
      case 'Home': case 'PageUp': deplacer(0, 1); break;
      case 'End': case 'PageDown': deplacer(options.length - 1, -1); break;
      case 'Enter': case ' ':
        if (e.key === ' ' && this.recherche) { this.chercher(e.key); break; }
        this.choisir(this.actif()); break;
      default:
        if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
        this.chercher(e.key);
    }
    e.preventDefault();
    afterNextRender(() => {
      const liste = this.liste()?.nativeElement, li = liste?.querySelector<HTMLElement>('li.actif');
      if (!liste || !li) return;
      if (li.offsetTop < liste.scrollTop) liste.scrollTop = li.offsetTop - 6;
      else if (li.offsetTop + li.offsetHeight > liste.scrollTop + liste.clientHeight) liste.scrollTop = li.offsetTop + li.offsetHeight - liste.clientHeight + 6;
    }, { injector: this.injector });
  }

  private chercher(car: string): void {
    clearTimeout(this.rechercheTimer);
    this.recherche += car.toLocaleLowerCase('fr');
    this.rechercheTimer = setTimeout(() => this.recherche = '', 700);
    const sansAccent = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('fr').trim();
    const cle = sansAccent(this.recherche);
    const options = this.options();
    const depart = this.recherche.length === 1 ? this.actif() + 1 : this.actif();
    for (let k = 0; k < options.length; k++) {
      const i = (depart + k + options.length) % options.length;
      if (!options[i].desactive && sansAccent(options[i].libelle).startsWith(cle)) { this.actif.set(i); return; }
    }
  }

  // ---------- Calendrier ----------

  protected basculerVue(): void {
    this.vueCal.update(v => v === 'jours' ? 'mois' : 'annees');
  }

  protected decaler(sens: number): void {
    const { annee, mois } = this.vue();
    switch (this.vueCal()) {
      case 'jours': { const d = new Date(annee, mois + sens, 1); this.vue.set({ annee: d.getFullYear(), mois: d.getMonth() }); break; }
      case 'mois': this.vue.set({ annee: annee + sens, mois }); break;
      default: this.vue.set({ annee: annee + sens * 12, mois });
    }
  }

  protected choisirAnnee(annee: number): void {
    this.vue.update(v => ({ ...v, annee }));
    this.vueCal.set('mois');
  }

  protected choisirMois(mois: number): void {
    if (this.mode() === 'month') { this.ecrire(isoMois(this.vue().annee, mois)); this.fermer(true); return; }
    this.vue.update(v => ({ ...v, mois }));
    this.vueCal.set('jours');
  }

  protected choisirJour(iso: string): void {
    if (this.mode() === 'datetime-local') { this.ecrire(`${iso}T${this.partieHeure() || '08:00'}`); return; }
    this.ecrire(iso);
    this.fermer(true);
  }

  protected choisirHeure(h: string): void {
    this.ecrireHeure(`${h}:${this.minuteChoisie() || '00'}`);
  }

  protected choisirMinute(mn: string): void {
    this.ecrireHeure(`${this.heureChoisie() || '08'}:${mn}`);
  }

  private ecrireHeure(heure: string): void {
    if (this.mode() === 'time') this.ecrire(heure);
    else this.ecrire(`${this.partieDate() || isoJour(new Date())}T${heure}`);
  }

  protected effacer(): void {
    this.ecrire('');
    this.fermer(true);
  }

  protected maintenant(): void {
    const auj = new Date();
    switch (this.mode()) {
      case 'month': this.ecrire(isoMois(auj.getFullYear(), auj.getMonth())); break;
      case 'time': this.ecrire(heureActuelle()); break;
      case 'datetime-local': this.ecrire(`${isoJour(auj)}T${heureActuelle()}`); break;
      default: this.ecrire(isoJour(auj));
    }
    this.fermer(true);
  }

  private ecrire(valeur: string): void {
    const input = this.cible;
    if (!(input instanceof HTMLInputElement)) return;
    input.value = valeur;
    this.valeur.set(input.value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
}
