import { Injectable, signal } from '@angular/core';
import { Toast, ToastType } from '../../models/toast.model';

/** Messages éphémères affichés en bas à droite (« Membre enregistré », erreurs API…). */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private suivant = 1;

  success(message: string): void { this.afficher('success', message); }
  error(message: string): void { this.afficher('error', message, 6000); }
  info(message: string): void { this.afficher('info', message); }

  fermer(id: number): void {
    this.toasts.update(l => l.filter(t => t.id !== id));
  }

  private afficher(type: ToastType, message: string, duree = 4000): void {
    const id = this.suivant++;
    this.toasts.update(l => [...l.slice(-3), { id, type, message }]);
    setTimeout(() => this.fermer(id), duree);
  }
}
