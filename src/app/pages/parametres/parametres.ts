import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CohorteService } from '../../core/services/cohorte.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { AuthAvanceDTOs, AuthResponse } from '../../models/api.models';
import { Icon } from '../../shared/components/icon/icon';
import { Avatar } from '../../shared/components/avatar/avatar';
import { RelatifPipe } from '../../shared/pipes/format.pipes';
import { telMasque } from '../../shared/utils/format';
import { CompteService } from '../../core/services/compte.service';
import { messageErreur } from '../../shared/utils/http';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { ShellService } from '../../core/services/shell.service';

type Onglet = 'profil' | 'securite' | 'notifications';

/** Écrans web 65 (Sécurité), 66 (Mon profil) et 67 (Préférences de notification). */
@Component({
  selector: 'app-parametres',
  imports: [FormsModule, Icon, Avatar, RelatifPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './parametres.html',
  styleUrl: './parametres.css'
})
export class Parametres implements OnInit {
  private readonly service = inject(CompteService);
  private readonly cohortes = inject(CohorteService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly shell = inject(ShellService);

  protected readonly onglet = signal<Onglet>('profil');
  protected readonly sessions = signal<AuthAvanceDTOs.Session[]>([]);
  protected readonly preferences = signal<AuthAvanceDTOs.Preference[]>([]);
  protected readonly envoi = signal(false);
  protected readonly perimetre = signal('National');
  protected readonly nouveau = signal('');
  protected compte: AuthAvanceDTOs.MonCompte = {};
  protected ancien = '';
  protected confirmation2 = '';
  protected deuxFacteurs = false;
  protected telephone2fa = '';
  protected modifierTelephone = false;

  protected readonly moi = computed<AuthResponse | null>(() => this.auth.utilisateur());

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(q => { const o = q.get('onglet') as Onglet; if (o) this.onglet.set(o); });
    this.service.sessions().subscribe(s => this.sessions.set(s));
    this.service.preferences().subscribe(p => this.preferences.set(p ?? []));
    this.auth.rafraichir().subscribe(() => this.remplir());
    this.remplir();
  }

  protected changerOnglet(o: Onglet): void { this.router.navigate([], { queryParams: { onglet: o }, replaceUrl: true }); }

  private remplir(): void {
    const u = this.moi();
    if (!u) return;
    this.compte = { prenom: u.prenom, nom: u.nom, email: u.email, telephone: u.telephone };
    if (u.role === 'ROLE_RESPONSABLE_REGIONAL') this.perimetre.set(`Région de ${u.region ?? '—'}`);
    else if (u.role === 'ROLE_RESPONSABLE_COHORTE' && u.cohorteId) this.cohortes.obtenir(u.cohorteId).subscribe(c => this.perimetre.set(c.nom ?? 'Cohorte'));
    this.deuxFacteurs = !!u.doubleAuthentification;
  }

  // ------------------------------------------------------------ profil
  protected changerPhoto(ev: Event): void {
    const f = (ev.target as HTMLInputElement).files?.[0];
    if (!f) return;
    if (!/^image\/(png|jpe?g)$/.test(f.type) || f.size > 2 * 1024 * 1024) { this.toast.error('Choisissez une image JPG ou PNG de 2 Mo maximum.'); return; }
    this.service.changerPhoto(f).subscribe({
      next: r => { this.auth.mettreAJour(r as AuthResponse); this.shell.chargerPhoto(); this.toast.success('Photo mise à jour.'); },
      error: e => this.toast.error(messageErreur(e))
    });
  }

  protected enregistrerProfil(): void {
    this.envoi.set(true);
    const tel = (this.compte.telephone ?? '').replace(/\D/g, '').replace(/^223(?=\d{8}$)/, '');
    this.service.modifier({ ...this.compte, telephone: tel ? '+223' + tel : undefined }).subscribe({
      next: r => { this.envoi.set(false); this.auth.mettreAJour(r as AuthResponse); this.toast.success('Profil mis à jour.'); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  // ------------------------------------------------------------ sécurité
  protected changerMotDePasse(): void {
    if (this.nouveau() !== this.confirmation2) { this.toast.error('Les deux mots de passe ne correspondent pas.'); return; }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(this.nouveau())) { this.toast.error('8 caractères minimum, avec au moins une lettre et un chiffre.'); return; }
    this.envoi.set(true);
    this.service.changerMotDePasse(this.ancien, this.nouveau()).subscribe({
      next: () => { this.envoi.set(false); this.ancien = ''; this.nouveau.set(''); this.confirmation2 = ''; this.toast.success('Mot de passe modifié.'); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }

  protected basculerDeuxFacteurs(actif: boolean): void {
    const tel = this.telephone2fa.replace(/\D/g, '');
    this.service.doubleAuthentification({ actif, telephone: tel ? '+223' + tel.replace(/^223(?=\d{8}$)/, '') : undefined }).subscribe({
      next: r => { this.deuxFacteurs = actif; this.modifierTelephone = false; this.auth.mettreAJour(r as AuthResponse); this.toast.success(actif ? 'Double authentification activée.' : 'Double authentification désactivée.'); },
      error: e => { this.deuxFacteurs = !actif; this.toast.error(messageErreur(e)); }
    });
  }

  protected telephoneMasque(): string { return telMasque(this.moi()?.telephone); }

  protected deconnecter(s: AuthAvanceDTOs.Session): void {
    this.service.deconnecterSession(s.id!).subscribe({ next: () => this.sessions.update(l => l.filter(x => x.id !== s.id)), error: e => this.toast.error(messageErreur(e)) });
  }

  protected async deconnecterAutres(): Promise<void> {
    if (!(await this.confirmation.demander('Déconnecter les autres sessions ?', 'Tous vos autres appareils devront se reconnecter.', 'Déconnecter'))) return;
    this.service.deconnecterAutres().subscribe({ next: () => { this.sessions.update(l => l.filter(x => x.sessionActuelle)); this.toast.success('Autres sessions déconnectées.'); }, error: e => this.toast.error(messageErreur(e)) });
  }

  protected iconeSession(s: AuthAvanceDTOs.Session): string { return /android|iphone|mobile|application/i.test(s.appareil ?? '') ? 'smartphone' : 'monitor'; }

  // ------------------------------------------------------------ notifications
  protected basculer(p: AuthAvanceDTOs.Preference, canal: 'application' | 'email' | 'sms'): void {
    this.preferences.update(l => l.map(x => (x.evenement === p.evenement ? { ...x, [canal]: !x[canal] } : x)));
  }

  protected enregistrerPreferences(): void {
    this.envoi.set(true);
    this.service.enregistrerPreferences({ preferences: this.preferences() }).subscribe({
      next: p => { this.envoi.set(false); this.preferences.set(p ?? []); this.toast.success('Préférences enregistrées.'); },
      error: e => { this.envoi.set(false); this.toast.error(messageErreur(e)); }
    });
  }
}
