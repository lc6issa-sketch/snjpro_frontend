import { ChangeDetectionStrategy, Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationDTOs } from '../../models/api.models';
import { RelatifPipe } from '../../shared/pipes/format.pipes';
import { NotificationService } from '../../core/services/notification.service';
import { ShellService } from '../../core/services/shell.service';

/** Liens des alertes vers les écrans concernés. */
const LIENS: Record<string, (id?: number) => string> = {
  IMPORT: () => '/import', DEMANDE: id => `/demandes${id ? '?id=' + id : ''}`, MOBILISATION: id => (id ? `/mobilisations/${id}` : '/mobilisations'),
  MEMBRE: id => (id ? `/membres/${id}` : '/membres'), UTILISATEUR: () => '/utilisateurs',
  COHORTE: id => (id ? `/cohortes/${id}` : '/cohortes'), ACTIVITE: () => '/activites', SOUVENIR: id => `/souvenirs${id ? '?id=' + id : ''}`, OPPORTUNITE: id => (id ? `/opportunites/${id}` : '/opportunites')
};

const STYLE: Record<string, { icone: string; teinte: string }> = {
  IMPORT: { icone: 'copy', teinte: 'tone-gold' }, DEMANDE: { icone: 'file-text', teinte: 'tone-blue' }, MOBILISATION: { icone: 'megaphone', teinte: 'tone-lime' },
  UTILISATEUR: { icone: 'user', teinte: 'tone-violet' }, INVITATION: { icone: 'user', teinte: 'tone-violet' }, RAPPORT: { icone: 'bar-chart', teinte: 'tone-teal' },
  SOUVENIR: { icone: 'image', teinte: 'tone-violet' }
};

/** Panneau déroulant des alertes (cloche de la barre du haut). */
@Component({
  selector: 'app-notifications-panel',
  imports: [RelatifPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './notifications-panel.html',
  styleUrl: './notifications-panel.css'
})
export class NotificationsPanel implements OnInit {
  private readonly service = inject(NotificationService);
  protected readonly shell = inject(ShellService);
  private readonly router = inject(Router);
  protected readonly alertes = signal<NotificationDTOs.Alerte[]>([]);
  protected readonly nonLues = signal(false);

  ngOnInit(): void { this.charger(); }

  protected style(a: NotificationDTOs.Alerte) { return STYLE[a.type ?? ''] ?? STYLE[a.lienType ?? ''] ?? { icone: 'bell', teinte: 'tone-green' }; }

  protected filtrer(nonLues: boolean): void { this.nonLues.set(nonLues); this.charger(); }

  protected ouvrir(a: NotificationDTOs.Alerte): void {
    if (!a.lu && a.id) this.service.alerteLue(a.id).subscribe(() => this.shell.rafraichir());
    const lien = LIENS[a.lienType ?? a.type ?? ''];
    this.shell.panneauNotifications.set(false);
    if (lien) this.router.navigateByUrl(lien(a.lienId));
  }

  protected toutLu(): void {
    this.service.toutLu().subscribe(() => { this.alertes.update(l => l.map(a => ({ ...a, lu: true }))); this.shell.rafraichir(); });
  }

  protected toutVoir(): void { this.shell.panneauNotifications.set(false); this.router.navigateByUrl('/historique'); }

  @HostListener('document:click') fermer(): void { this.shell.panneauNotifications.set(false); }

  private charger(): void {
    this.service.alertes(this.nonLues(), 0, 12).subscribe(p => this.alertes.set(p.content ?? []));
  }
}
