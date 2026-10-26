import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Icon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { ShellService } from '../../core/services/shell.service';
import { MODES_THEME, ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  imports: [Icon, Avatar, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.html',
  styleUrl: './topbar.css'
})
export class Topbar {
  protected readonly auth = inject(AuthService);
  protected readonly shell = inject(ShellService);
  protected readonly theme = inject(ThemeService);
  protected readonly modes = MODES_THEME;
  private readonly router = inject(Router);
  protected readonly menu = signal(false);

  protected basculerNotifications(ev: Event): void {
    ev.stopPropagation();
    this.shell.panneauNotifications.update(v => !v);
  }

  @HostListener('document:click') fermerMenu(): void { this.menu.set(false); }

  @HostListener('document:keydown', ['$event']) raccourci(ev: KeyboardEvent): void {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k') {
      ev.preventDefault();
      this.shell.recherche.set(true);
    }
  }
}
