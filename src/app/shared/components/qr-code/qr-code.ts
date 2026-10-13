import { ChangeDetectionStrategy, Component, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import QRCode from 'qrcode';

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
  readonly couleur = input('#124D2D');
  protected readonly svg = signal<SafeHtml>('');

  constructor() {
    effect(() => {
      const texte = this.contenu();
      if (!texte) { this.svg.set(''); return; }
      QRCode.toString(texte, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: this.couleur(), light: '#FFFFFF00' } })
        .then(s => this.svg.set(this.sanitizer.bypassSecurityTrustHtml(s)))
        .catch(() => this.svg.set(''));
    });
  }
}
