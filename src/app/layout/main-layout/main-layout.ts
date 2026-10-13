import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';
import { Recherche } from '../recherche/recherche-globale';
import { NotificationsPanel } from '../notifications-panel/notifications-panel';
import { AuthService } from '../../core/services/auth.service';
import { ShellService } from '../../core/services/shell.service';

/** Coquille de l'espace de gestion : barre latérale verte, barre du haut, contenu. */
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Sidebar, Topbar, Recherche, NotificationsPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css'
})
export class MainLayout implements OnInit {
  protected readonly shell = inject(ShellService);
  private readonly auth = inject(AuthService);

  constructor() {
    inject(Router).events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed())
      .subscribe(() => this.shell.panneauNotifications.set(false));
  }

  ngOnInit(): void {
    this.auth.rafraichir().subscribe(() => { this.shell.rafraichir(); this.shell.chargerPhoto(); });
    this.shell.rafraichir();
  }
}
