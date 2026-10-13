import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { AuthAvanceDTOs } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { AccesPublicService } from '../../../core/services/acces-public.service';
import { messageErreur } from '../../../shared/utils/http';
import { LIBELLES_ROLES } from '../../../shared/utils/libelles';

/**
 * Choix d'un mot de passe à partir d'un lien reçu par e-mail :
 * /reinitialiser-mot-de-passe?jeton=… (mot de passe oublié) et /invitation?jeton=… (compte créé par un administrateur).
 */
@Component({
  selector: 'app-nouveau-mot-de-passe',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './nouveau-mot-de-passe.html',
  styleUrl: '../auth.css'
})
export class NouveauMotDePasse implements OnInit {
  private readonly service = inject(AccesPublicService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly jeton = this.route.snapshot.queryParamMap.get('jeton') ?? '';
  protected readonly invitation = this.route.snapshot.routeConfig?.path === 'invitation';
  protected readonly info = signal<AuthAvanceDTOs.InfoInvitation | null>(null);
  protected readonly motDePasse = signal('');
  protected confirmation = '';
  protected username = '';
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);
  protected readonly valide = computed(() => /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(this.motDePasse()));

  ngOnInit(): void {
    if (this.invitation && this.jeton) {
      this.service.infoInvitation(this.jeton).subscribe({
        next: i => { this.info.set(i); this.username = (i.email ?? '').split('@')[0]; },
        error: e => this.erreur.set(messageErreur(e, 'Invitation invalide ou expirée.'))
      });
    }
  }

  protected role(r?: string): string { return (r && LIBELLES_ROLES[r as keyof typeof LIBELLES_ROLES]) || r || ''; }

  protected valider(): void {
    if (this.motDePasse() !== this.confirmation) { this.erreur.set('Les deux mots de passe ne correspondent pas.'); return; }
    this.erreur.set(null);
    this.chargement.set(true);
    const req = this.invitation
      ? this.service.accepterInvitation({ jeton: this.jeton, username: this.username.trim(), motDePasse: this.motDePasse() })
      : this.service.reinitialiser(this.jeton, this.motDePasse());
    req.subscribe({
      next: () => {
        this.toast.success(this.invitation ? 'Compte activé. Vous pouvez vous connecter.' : 'Mot de passe modifié. Vous pouvez vous connecter.');
        this.router.navigate(['/connexion']);
      },
      error: e => { this.chargement.set(false); this.erreur.set(messageErreur(e)); }
    });
  }
}
