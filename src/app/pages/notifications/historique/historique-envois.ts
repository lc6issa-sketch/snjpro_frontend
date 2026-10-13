import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';
import { NotificationDTOs, Page } from '../../../models/api.models';
import { Icon } from '../../../shared/components/icon/icon';
import { Pagination } from '../../../shared/components/pagination/pagination';
import { DateCourtePipe, NombrePipe } from '../../../shared/pipes/format.pipes';
import { TYPE_NOTIFICATION } from '../../../shared/utils/libelles';
import { NotificationService } from '../../../core/services/notification.service';
import { messageErreur } from '../../../shared/utils/http';
import { ConfirmationService } from '../../../core/services/confirmation.service';

const TEINTE: Record<string, string> = { INFORMATION: 'blue', URGENT: 'red', MOBILISATION: 'green', ACTUALITE: 'violet' };

/** Écran web 36 — Historique des envois de notifications. */
@Component({
  selector: 'app-historique-envois',
  imports: [RouterLink, Icon, Pagination, DateCourtePipe, NombrePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './historique-envois.html',
  styleUrl: './historique-envois.css'
})
export class HistoriqueEnvois implements OnInit {
  private readonly service = inject(NotificationService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  protected readonly taille = 12;
  protected readonly page = signal<Page<NotificationDTOs.Resume> | null>(null);
  protected readonly stats = signal<NotificationDTOs.Statistiques | null>(null);
  protected readonly numero = signal(0);

  ngOnInit(): void { this.charger(0); this.service.statistiques().subscribe(s => this.stats.set(s)); }

  protected charger(p: number): void { this.numero.set(p); this.service.historique(p, this.taille).subscribe(r => this.page.set(r)); }
  protected libelle(t?: string): string { return TYPE_NOTIFICATION[t ?? ''] ?? t ?? ''; }
  protected teinte(t?: string): string { return TEINTE[t ?? ''] ?? 'grey'; }
  protected canaux(n: NotificationDTOs.Resume): string {
    return (n.canaux ?? []).map(c => ({ APPLICATION: 'App', SMS: 'SMS', EMAIL: 'E-mail' } as Record<string, string>)[c] ?? c).join(' · ') || '—';
  }

  protected envoyer(n: NotificationDTOs.Resume): void {
    this.service.envoyerBrouillon(n.id!).subscribe({ next: () => { this.toast.success('Notification envoyée.'); this.charger(this.numero()); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected async supprimer(n: NotificationDTOs.Resume): Promise<void> {
    if (!(await this.confirmation.demander('Supprimer cette notification ?', n.titre, 'Supprimer', true))) return;
    this.service.supprimer(n.id!).subscribe({ next: () => this.charger(this.numero()), error: e => this.toast.error(messageErreur(e)) });
  }
}
