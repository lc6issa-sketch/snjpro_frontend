import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, computed, inject, signal, viewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../../../shared/components/icon/icon';
import { messageErreur } from '../../../shared/utils/http';

/** Écran web 02 — Vérification en deux étapes (code SMS à 6 chiffres). */
@Component({
  selector: 'app-verification',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './verification.html',
  styleUrls: ['../auth.css', './verification.css']
})
export class Verification implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly cases = viewChildren<ElementRef<HTMLInputElement>>('case');

  protected readonly chiffres = signal<string[]>(['', '', '', '', '', '']);
  protected readonly code = computed(() => this.chiffres().join(''));
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly attente = signal(60);
  protected readonly telephone = computed(() => this.auth.deuxiemeFacteur()?.telephoneMasque ?? '');
  protected readonly minuteur = computed(() => `0:${String(this.attente()).padStart(2, '0')}`.replace('0:60', '1:00'));
  protected confiance = true;
  private horloge?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    if (!this.auth.deuxiemeFacteur()) { this.router.navigate(['/connexion']); return; }
    this.demarrer();
    setTimeout(() => this.cases()[0]?.nativeElement.focus());
  }

  ngOnDestroy(): void { clearInterval(this.horloge); }

  protected saisir(i: number, ev: Event): void {
    const el = ev.target as HTMLInputElement;
    const v = el.value.replace(/\D/g, '').slice(-1);
    el.value = v;
    this.chiffres.update(c => { const n = [...c]; n[i] = v; return n; });
    if (v && i < 5) this.cases()[i + 1]?.nativeElement.focus();
    if (this.code().length === 6) this.verifier();
  }

  protected effacer(i: number, ev: Event): void {
    if (!(ev.target as HTMLInputElement).value && i > 0) this.cases()[i - 1]?.nativeElement.focus();
  }

  protected coller(ev: ClipboardEvent): void {
    const t = (ev.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    if (!t) return;
    ev.preventDefault();
    this.chiffres.set(t.padEnd(6, ' ').split('').map(c => c.trim()));
    if (t.length === 6) this.verifier();
  }

  protected verifier(): void {
    if (this.code().length < 6 || this.chargement()) return;
    this.erreur.set(null);
    this.chargement.set(true);
    this.auth.verifierCode(this.code(), this.confiance).subscribe({
      next: r => {
        this.chargement.set(false);
        if (r.role === 'ROLE_MEMBRE') { this.router.navigate(['/acces-refuse'], { queryParams: { raison: 'membre' } }); return; }
        this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('retour') || '/tableau-de-bord');
      },
      error: e => {
        this.chargement.set(false);
        this.erreur.set(messageErreur(e, 'Code incorrect ou expiré.'));
        this.chiffres.set(['', '', '', '', '', '']);
        this.cases()[0]?.nativeElement.focus();
      }
    });
  }

  protected renvoyer(): void {
    const id = this.auth.deuxiemeFacteur()?.identifiant;
    if (!id) return;
    this.auth.demanderCode(id).subscribe({
      next: () => { this.toast.success('Un nouveau code vous a été envoyé.'); this.demarrer(); },
      error: e => this.erreur.set(messageErreur(e))
    });
  }

  private demarrer(): void {
    clearInterval(this.horloge);
    this.attente.set(60);
    this.horloge = setInterval(() => {
      this.attente.update(a => Math.max(0, a - 1));
      if (!this.attente()) clearInterval(this.horloge);
    }, 1000);
  }
}
