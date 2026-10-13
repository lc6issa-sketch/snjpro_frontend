import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { AuthService } from './auth.service';
import { CompteService } from './compte.service';
import { DemandeService } from './demande.service';
import { ImportService } from './import.service';
import { MembreService } from './membre.service';
import { MessagerieService } from './messagerie.service';
import { MobilisationService } from './mobilisation.service';
import { NotificationService } from './notification.service';
import { SouvenirService } from './souvenir.service';

/** État partagé de la coquille : compteurs du menu, panneaux ouverts. */
@Injectable({ providedIn: 'root' })
export class ShellService {
  private readonly auth = inject(AuthService);
  private readonly compteService = inject(CompteService);
  private readonly membreService = inject(MembreService);
  private readonly mobilisationService = inject(MobilisationService);
  private readonly demandeService = inject(DemandeService);
  private readonly importService = inject(ImportService);
  private readonly souvenirService = inject(SouvenirService);
  private readonly notificationService = inject(NotificationService);
  private readonly messagerieService = inject(MessagerieService);

  readonly badges = signal<Record<string, number>>({});
  readonly alertesNonLues = signal(0);
  readonly messagesNonLus = signal(0);
  readonly panneauNotifications = signal(false);
  readonly recherche = signal(false);
  /** Photo de l'utilisateur connecté (URL locale), affichée dans la barre du haut et la barre latérale. */
  readonly photo = signal<string | null>(null);

  chargerPhoto(): void {
    const ancienne = this.photo();
    if (!this.auth.utilisateur()?.photoUrl) { this.photo.set(null); return; }
    this.compteService.photoUrl().pipe(catchError(() => of(null))).subscribe(u => {
      if (ancienne) URL.revokeObjectURL(ancienne);
      this.photo.set(u);
    });
  }

  /** Rafraîchit les compteurs affichés dans la barre latérale et la barre du haut. */
  rafraichir(): void {
    const ok = <T>(o: Observable<T>) => o.pipe(catchError(() => of(null)));
    const voir = (m: string) => this.auth.peutVoir(m);
    forkJoin({
      membres: voir('MEMBRES') ? ok(this.membreService.rechercher({}, { page: 0, size: 1 })) : of(null),
      mobilisations: voir('MOBILISATION') ? ok(this.mobilisationService.statistiques()) : of(null),
      demandes: voir('DEMANDES') ? ok(this.demandeService.statistiques()) : of(null),
      imports: voir('IMPORT') ? ok(this.importService.sessions(0, 1)) : of(null),
      souvenirs: voir('SOUVENIRS') && !this.auth.aRole('ROLE_DIRECTION') ? ok(this.souvenirService.statistiques()) : of(null),
      alertes: ok(this.notificationService.alertesNonLues()),
      messages: ok(this.messagerieService.nonLus())
    }).subscribe(r => {
      const enCours = r.imports?.content?.[0];
      this.badges.set({
        membres: r.membres?.totalElements ?? 0,
        mobilisation: r.mobilisations?.enCours ?? 0,
        demandes: r.demandes?.enAttente ?? 0,
        import: enCours && enCours.statut !== 'TERMINE' && enCours.statut !== 'ANNULE' ? enCours.doublons ?? 0 : 0,
        souvenirs: r.souvenirs?.enAttente ?? 0
      });
      this.alertesNonLues.set(r.alertes?.nonLues ?? 0);
      this.messagesNonLus.set(r.messages?.nonLus ?? 0);
    });
  }
}
