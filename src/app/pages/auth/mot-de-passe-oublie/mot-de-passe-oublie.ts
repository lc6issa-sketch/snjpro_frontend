import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../../../shared/components/icon/icon';
import { AccesPublicService } from '../../../core/services/acces-public.service';
import { messageErreur } from '../../../shared/utils/http';

/** Écrans web 03 (saisie de l'e-mail) et 04 (« Vérifiez votre boîte mail »). */
@Component({
  selector: 'app-mot-de-passe-oublie',
  imports: [FormsModule, RouterLink, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mot-de-passe-oublie.html',
  styleUrl: '../auth.css'
})
export class MotDePasseOublie {
  private readonly service = inject(AccesPublicService);
  private readonly toast = inject(ToastService);
  protected email = '';
  protected readonly envoye = signal(false);
  protected readonly chargement = signal(false);
  protected readonly erreur = signal<string | null>(null);

  protected envoyer(renvoi = false): void {
    this.erreur.set(null);
    this.chargement.set(true);
    this.service.motDePasseOublie(this.email.trim()).subscribe({
      next: () => { this.chargement.set(false); this.envoye.set(true); if (renvoi) this.toast.success('E-mail renvoyé.'); },
      error: e => { this.chargement.set(false); this.erreur.set(messageErreur(e)); }
    });
  }
}
