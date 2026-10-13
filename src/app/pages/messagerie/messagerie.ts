import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, switchMap, of, catchError } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastService } from '../../core/services/toast.service';
import { MessagerieDTOs } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { Modal } from '../../shared/components/modal/modal';
import { HeurePipe, RelatifPipe, TaillePipe } from '../../shared/pipes/format.pipes';
import { MessagerieService } from '../../core/services/messagerie.service';
import { messageErreur } from '../../shared/utils/http';
import { ShellService } from '../../core/services/shell.service';

/** Écran web 08 — Messagerie avec les membres, les directions régionales et les groupes de cohorte. */
@Component({
  selector: 'app-messagerie',
  imports: [FormsModule, Icon, Avatar, Modal, HeurePipe, RelatifPipe, TaillePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './messagerie.html',
  styleUrl: './messagerie.css'
})
export class Messagerie implements OnInit, OnDestroy {
  private readonly service = inject(MessagerieService);
  private readonly toast = inject(ToastService);
  private readonly shell = inject(ShellService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly zone = viewChild<ElementRef<HTMLDivElement>>('zone');

  protected readonly conversations = signal<MessagerieDTOs.ConversationDTO[]>([]);
  protected readonly active = signal<MessagerieDTOs.ConversationDTO | null>(null);
  protected readonly messages = signal<MessagerieDTOs.MessageDTO[]>([]);
  protected readonly recherche = signal('');
  protected readonly envoi = signal(false);
  protected readonly fichier = signal<File | null>(null);
  protected readonly nouvelle = signal(false);
  protected readonly contacts = signal<MessagerieDTOs.Contact[]>([]);
  protected readonly contact = signal<MessagerieDTOs.Contact | null>(null);
  protected texte = '';
  protected rechercheContact = '';
  protected premierMessage = '';
  private horloge?: ReturnType<typeof setInterval>;
  private readonly saisie = new Subject<string>();
  private readonly saisieContact = new Subject<string>();
  protected readonly nombre = computed(() => this.conversations().length);

  constructor() {
    this.saisie.pipe(debounceTime(300), takeUntilDestroyed()).subscribe(() => this.chargerConversations());
    this.saisieContact.pipe(debounceTime(250), switchMap(q => this.service.contacts(q || undefined).pipe(catchError(() => of([])))), takeUntilDestroyed())
      .subscribe(c => this.contacts.set(c));
  }

  ngOnInit(): void {
    const cible = Number(this.route.snapshot.queryParamMap.get('conversation'));
    this.chargerConversations(cible || undefined);
    this.horloge = setInterval(() => { this.chargerConversations(); if (this.active()) this.chargerMessages(false); }, 10000);
  }

  ngOnDestroy(): void { clearInterval(this.horloge); }

  protected chercher(q: string): void { this.recherche.set(q); this.saisie.next(q); }

  protected ouvrir(c: MessagerieDTOs.ConversationDTO): void {
    this.active.set(c);
    this.router.navigate([], { queryParams: { conversation: c.id }, replaceUrl: true });
    this.chargerMessages(true);
  }

  protected envoyer(): void {
    const c = this.active();
    const f = this.fichier();
    if (!c || (!this.texte.trim() && !f)) return;
    this.envoi.set(true);
    const req = f ? this.service.envoyerFichier(c.id!, f, this.texte.trim() || undefined) : this.service.envoyer(c.id!, this.texte.trim());
    req.subscribe({
      next: m => { this.envoi.set(false); this.texte = ''; this.fichier.set(null); this.messages.update(l => [...l, m]); this.defiler(); this.chargerConversations(); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected joindre(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (f && f.size > 20 * 1024 * 1024) { this.toast.error('Le fichier dépasse 20 Mo.'); return; }
    this.fichier.set(f ?? null);
  }

  protected telecharger(m: MessagerieDTOs.MessageDTO): void { this.service.telechargerPieceJointe(m.id!).subscribe({ error: e => this.toast.error(messageErreur(e)) }); }
  protected voirProfil(id: number): void { this.router.navigate(['/membres', id]); }

  protected ouvrirNouvelle(): void { this.contact.set(null); this.rechercheContact = ''; this.premierMessage = ''; this.nouvelle.set(true); this.saisieContact.next(''); }
  protected chercherContact(q: string): void { this.rechercheContact = q; this.saisieContact.next(q); }

  protected creer(): void {
    const c = this.contact();
    if (!c) return;
    this.service.creer({ destinataireUserId: c.userId, membreId: c.membreId, service: c.service, premierMessage: this.premierMessage.trim() || undefined }).subscribe({
      next: conv => { this.nouvelle.set(false); this.chargerConversations(conv.id); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected groupeCohorte(): void {
    this.service.groupeCohorte().subscribe({
      next: conv => { this.nouvelle.set(false); this.chargerConversations(conv.id); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  private chargerConversations(ouvrir?: number): void {
    this.service.conversations(this.recherche() || undefined).subscribe(l => {
      this.conversations.set(l);
      const id = ouvrir ?? this.active()?.id;
      const c = id ? l.find(x => x.id === id) : null;
      if (ouvrir && c) this.ouvrir(c);
      else if (c) this.active.set(c);
      else if (!this.active() && l.length) this.ouvrir(l[0]);
    });
  }

  private chargerMessages(defiler: boolean): void {
    const c = this.active();
    if (!c) return;
    this.service.messages(c.id!, 0, 100).subscribe(p => {
      const avant = this.messages().length;
      this.messages.set([...(p.content ?? [])].sort((a, b) => (a.dateEnvoi ?? '').localeCompare(b.dateEnvoi ?? '')));
      if (defiler || this.messages().length !== avant) this.defiler();
      this.shell.rafraichir();
    });
  }

  private defiler(): void { setTimeout(() => { const z = this.zone()?.nativeElement; if (z) z.scrollTop = z.scrollHeight; }); }
}
