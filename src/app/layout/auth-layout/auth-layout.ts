import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Logo } from '../logo/logo';
import { Icon } from '../../shared/components/icon/icon';

/** Écrans de connexion : panneau vert de présentation à gauche, formulaire à droite. */
@Component({
  selector: 'app-auth-layout',
  imports: [RouterOutlet, Logo, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.html',
  styleUrl: './auth-layout.css'
})
export class AuthLayout {}
