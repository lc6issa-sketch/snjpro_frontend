import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, input, signal } from '@angular/core';
import { ActiviteDTOs } from '../../../models/api.models';
import { Logo } from '../../../layout/logo/logo';
import { Icon } from '../../../shared/components/icon/icon';
import { Avatar } from '../../../shared/components/avatar/avatar';
import { QrCode } from '../../../shared/components/qr-code/qr-code';
import { HeurePipe } from '../../../shared/pipes/format.pipes';
import { dateLongue, heure } from '../../../shared/utils/format';
import { ActiviteService } from '../../../core/services/activite.service';

/** Écran web 52 — Projection plein écran du QR code de présence (renouvelé toutes les 30 secondes). */
@Component({
  selector: 'app-projection',
  imports: [Logo, Icon, Avatar, QrCode, HeurePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './projection.html',
  styleUrl: './projection.css'
})
export class Projection implements OnInit, OnDestroy {
  readonly id = input.required<string>();
  private readonly service = inject(ActiviteService);
  protected readonly p = signal<ActiviteDTOs.Projection | null>(null);
  protected readonly restant = signal(30);
  private horloge?: ReturnType<typeof setInterval>;
  private titre = computed(() => (this.p()?.activite?.titre ?? '').split(' '));
  protected readonly debutTitre = computed(() => this.titre().slice(0, Math.ceil(this.titre().length / 2)).join(' '));
  protected readonly finTitre = computed(() => this.titre().slice(Math.ceil(this.titre().length / 2)).join(' '));
  protected readonly quand = computed(() => {
    const a = this.p()?.activite;
    const j = dateLongue(a?.date, true);
    return `${j.charAt(0).toUpperCase()}${j.slice(1)}${a?.heureDebut ? ' · ' + heure(a.heureDebut) : ''}`;
  });

  ngOnInit(): void {
    this.charger();
    this.horloge = setInterval(() => {
      this.restant.update(r => r - 1);
      if (this.restant() <= 0) this.charger();
    }, 1000);
  }

  ngOnDestroy(): void { clearInterval(this.horloge); }

  protected fermer(): void { window.close(); history.back(); }

  private charger(): void {
    this.service.projection(+this.id()).subscribe({
      next: p => { this.p.set(p); this.restant.set(Math.max(1, p.codeQr?.secondesRestantes ?? 30)); },
      error: () => this.restant.set(10)
    });
  }
}
