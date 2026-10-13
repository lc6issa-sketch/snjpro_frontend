import { HttpErrorResponse, HttpParams, HttpResponse } from '@angular/common/http';

/** Paramètres de requête : les valeurs nulles, indéfinies ou vides sont ignorées. */
export type Params = Record<string, string | number | boolean | null | undefined | (string | number)[]>;

type ValeurChamp = File | Blob | string | number | boolean | null | undefined;
/** Champs d'un envoi multipart ; une liste de fichiers est envoyée sous le même nom répété (fichiers=…&fichiers=…). */
export type ChampsFormulaire = Record<string, ValeurChamp | ValeurChamp[]>;

/** Construit les HttpParams d'une requête à partir d'un objet simple. */
export function toParams(params?: Params): HttpParams {
  let p = new HttpParams();
  if (!params) return p;
  for (const [cle, valeur] of Object.entries(params)) {
    if (valeur === null || valeur === undefined || valeur === '') continue;
    if (Array.isArray(valeur)) valeur.forEach(v => (p = p.append(cle, String(v))));
    else p = p.set(cle, String(valeur));
  }
  return p;
}

/** Construit le FormData d'un envoi multipart (fichiers et valeurs simples). */
export function formulaire(champs: ChampsFormulaire): FormData {
  const form = new FormData();
  const ajouter = (cle: string, valeur: ValeurChamp) => {
    if (valeur === null || valeur === undefined || valeur === '') return;
    if (valeur instanceof Blob) form.append(cle, valeur, (valeur as File).name ?? cle);
    else form.append(cle, String(valeur));
  };
  for (const [cle, valeur] of Object.entries(champs)) {
    if (Array.isArray(valeur)) valeur.forEach(v => ajouter(cle, v));
    else ajouter(cle, valeur);
  }
  return form;
}

/** Transforme un fichier reçu (image, PDF…) en URL locale affichable. */
export function urlLocale(fichier: Blob): string {
  return URL.createObjectURL(fichier);
}

/** Enregistre sur le poste un fichier renvoyé par l'API, sous le nom fourni par le serveur. */
export function enregistrerFichier(r: HttpResponse<Blob>): void {
  if (!r.body || typeof document === 'undefined') return;
  const disposition = r.headers.get('Content-Disposition') ?? '';
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  const simple = /filename="?([^";]+)"?/i.exec(disposition);
  const nom = utf8 ? decodeURIComponent(utf8[1]) : simple ? simple[1] : 'fichier';
  const url = URL.createObjectURL(r.body);
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/** Message lisible à partir d'une erreur renvoyée par le backend ({ error, message, details }). */
export function messageErreur(err: unknown, defaut = 'Une erreur est survenue. Réessayez.'): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return 'Impossible de joindre le serveur SNJPro. Vérifiez que le backend est démarré.';
    const corps = err.error;
    if (corps && typeof corps === 'object') {
      if (corps.errors && typeof corps.errors === 'object') {
        const premiers = Object.values(corps.errors as Record<string, string>);
        if (premiers.length) return premiers.join(' · ');
      }
      if (corps.message) return String(corps.message).replace(/\s*Utilisez forcer=true[^.]*\./, '');
    }
    if (err.status === 403) return 'Vous n\'avez pas les droits pour cette action.';
    if (err.status === 404) return 'Élément introuvable.';
  }
  return defaut;
}
