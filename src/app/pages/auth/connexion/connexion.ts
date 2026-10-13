import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Icon } from '../../../shared/components/icon/icon';
import { messageErreur } from '../../../shared/utils/http';

/** Écran web 01 — Connexion. */
@Component({
  selector: 'app-connexion',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './connexion.html',
  styleUrl: '../auth.css'
})
export class Connexion {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected identifiant = '';
  protected motDePasse = '';
  protected seSouvenir = true;
  protected readonly voir = signal(false);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly expire = !!this.route.snapshot.queryParamMap.get('expire');

  protected seConnecter(): void {
    this.erreur.set(null);
    this.chargement.set(true);
    this.auth.login(this.identifiant.trim(), this.motDePasse, this.seSouvenir).subscribe({
      next: r => {
        this.chargement.set(false);
        if (r.deuxiemeFacteurRequis) { this.router.navigate(['/verification'], { queryParamsHandling: 'preserve' }); return; }
        if (r.role === 'ROLE_MEMBRE') { this.router.navigate(['/acces-refuse'], { queryParams: { raison: 'membre' } }); return; }
        this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('retour') || '/tableau-de-bord');
      },
      error: e => { this.chargement.set(false); this.erreur.set(messageErreur(e, 'Identifiants incorrects.')); }
    });
  }

  /** Connexion par code à usage unique envoyé sur le téléphone du compte. */
  protected codeSms(): void {
    if (!this.identifiant.trim()) { this.erreur.set('Saisissez d\'abord votre adresse e-mail ou votre identifiant.'); return; }
    this.erreur.set(null);
    this.chargement.set(true);
    this.auth.demanderCode(this.identifiant.trim()).subscribe({
      next: () => { this.chargement.set(false); this.router.navigate(['/verification']); },
      error: e => { this.chargement.set(false); this.erreur.set(messageErreur(e)); }
    });
  }
}
