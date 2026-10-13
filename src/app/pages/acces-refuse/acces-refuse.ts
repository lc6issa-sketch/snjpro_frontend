import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Logo } from '../../layout/logo/logo';
import { Icon } from '../../shared/components/icon/icon';
import { dateCourte, heure } from '../../shared/utils/format';

/** Écran web 68 — Accès non autorisé (403) ; aussi affiché aux membres, qui utilisent l'application mobile. */
@Component({
  selector: 'app-acces-refuse',
  imports: [RouterLink, Logo, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './acces-refuse.html',
  styleUrl: './acces-refuse.css'
})
export class AccesRefuse {
  protected readonly auth = inject(AuthService);
  protected readonly membre = inject(ActivatedRoute).snapshot.queryParamMap.get('raison') === 'membre';
  protected readonly quand = `${dateCourte(new Date())} ${heure(new Date())}`;
}
