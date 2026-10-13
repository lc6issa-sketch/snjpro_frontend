import { Injectable, signal } from '@angular/core';
import { DemandeConfirmation } from '../../models/confirmation.model';

/** Boîte « Êtes-vous sûr ? » intégrée à l'application (les dialogues natifs du navigateur ne sont pas utilisés). */
@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  readonly demande = signal<DemandeConfirmation | null>(null);
  private resoudre: ((ok: boolean) => void) | null = null;

  demander(titre: string, message?: string, action = 'Confirmer', danger = false): Promise<boolean> {
    this.resoudre?.(false);
    this.demande.set({ titre, message, action, danger });
    return new Promise(r => (this.resoudre = r));
  }

  repondre(ok: boolean): void {
    this.demande.set(null);
    this.resoudre?.(ok);
    this.resoudre = null;
  }
}
