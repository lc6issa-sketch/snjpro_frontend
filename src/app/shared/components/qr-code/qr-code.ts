import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import QRCode from 'qrcode';
import { ApparenceService } from '../../../core/services/apparence.service';

/** Dessine en SVG le QR code d'un contenu (présence d'une activité, carte de membre). */
@Component({
  selector: 'app-qr-code',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './qr-code.html',
  styleUrl: './qr-code.css'
})
export class QrCode {
  private readonly sanitizer = inject(DomSanitizer);
  readonly contenu = input<string | null | undefined>('');
  readonly taille = input(160);
  /** Couleur des modules ; par défaut, la couleur principale de la charte du logo choisi. */
  readonly couleur = input<string | null>(null);
  protected readonly svg = signal<SafeHtml>('');
  private readonly apparence = inject(ApparenceService);

  constructor() {
    effect(() => {
      const texte = this.contenu();
      const couleur = this.couleur() ?? (this.apparence.logo() === 'OR' ? '#141212' : '#124D2D');
      if (!texte) { this.svg.set(''); return; }
      QRCode.toString(texte, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: couleur, light: '#FFFFFF00' } })
        .then(s => this.svg.set(this.sanitizer.bypassSecurityTrustHtml(s)))
        .catch(() => this.svg.set(''));
    });
  }
}
