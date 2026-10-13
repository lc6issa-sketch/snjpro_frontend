/** Fonctions de mise en forme partagées (nombres, dates, tailles, libellés). */

const MOIS_COURTS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function initiales(nom?: string | null): string {
  if (!nom) return '?';
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  if (mots.length === 1) return mots[0].slice(0, 2).toUpperCase();
  return (mots[0][0] + mots[mots.length - 1][0]).toUpperCase();
}

/** 24318 -> « 24 318 » (espace fine insécable, comme dans les maquettes). */
export function nombre(n?: number | null, decimales = 0): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  return n.toLocaleString('fr-FR', { minimumFractionDigits: decimales, maximumFractionDigits: decimales }).replace(/ | /g, ' ');
}

export function pourcent(n?: number | null, decimales = 0): string {
  return n === null || n === undefined ? '—' : `${nombre(n, decimales)} %`;
}

export function versDate(v?: string | Date | null): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v.length === 10 ? v + 'T00:00:00' : v);
  return isNaN(d.getTime()) ? null : d;
}

/** 14/03/1998 */
export function dateCourte(v?: string | Date | null): string {
  const d = versDate(v);
  if (!d) return '—';
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** 12 sept. 2026 */
export function dateMoyenne(v?: string | Date | null): string {
  const d = versDate(v);
  return d ? `${d.getDate()} ${MOIS_COURTS[d.getMonth()]} ${d.getFullYear()}` : '—';
}

/** mardi 29 septembre */
export function dateLongue(v?: string | Date | null, avecAnnee = false): string {
  const d = versDate(v);
  return d ? `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS_LONGS[d.getMonth()]}${avecAnnee ? ' ' + d.getFullYear() : ''}` : '—';
}

export function moisCourt(v?: string | Date | null): string {
  const d = versDate(v);
  return d ? MOIS_COURTS[d.getMonth()].replace('.', '').toUpperCase() : '';
}

export function moisLong(m: number): string { return MOIS_LONGS[m] ?? ''; }

/** 10:24 */
export function heure(v?: string | Date | null): string {
  if (typeof v === 'string' && /^\d{2}:\d{2}/.test(v)) return v.slice(0, 5);
  const d = versDate(v);
  return d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '';
}

/** 29/09 · 10:24 */
export function dateHeure(v?: string | Date | null): string {
  const d = versDate(v);
  return d ? `${pad(d.getDate())}/${pad(d.getMonth() + 1)} · ${heure(d)}` : '—';
}

/** « il y a 5 min », « Hier, 16:42 », « 12 sept. 2026 » */
export function relatif(v?: string | Date | null): string {
  const d = versDate(v);
  if (!d) return '—';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'à l\'instant';
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  const aujourdhui = new Date();
  const hier = new Date(); hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === aujourdhui.toDateString()) return `il y a ${Math.floor(s / 3600)} h`;
  if (d.toDateString() === hier.toDateString()) return `Hier, ${heure(d)}`;
  if (s < 7 * 86400) return `il y a ${Math.floor(s / 86400)} j`;
  return dateMoyenne(d);
}

/** Version courte pour les listes : « 5 min », « 2 h », « Hier », « 3 j ». */
export function relatifCourt(v?: string | Date | null): string {
  const d = versDate(v);
  if (!d) return '';
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))} min`;
  const hier = new Date(); hier.setDate(hier.getDate() - 1);
  if (d.toDateString() === new Date().toDateString()) return `${Math.floor(s / 3600)} h`;
  if (d.toDateString() === hier.toDateString()) return 'Hier';
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} j`;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

/** 1 258 291 -> « 1,2 Mo » */
export function taille(octets?: number | null): string {
  if (octets === null || octets === undefined) return '—';
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${nombre(Math.round(octets / 1024))} Ko`;
  if (octets < 1024 ** 3) return `${nombre(octets / 1024 / 1024, 1)} Mo`;
  return `${nombre(octets / 1024 ** 3, 1)} Go`;
}

/** +22376123412 -> « +223 76 •• •• 12 » */
export function telMasque(t?: string | null): string {
  if (!t) return '—';
  const c = t.replace(/\s/g, '');
  const local = c.startsWith('+223') ? c.slice(4) : c;
  if (local.length < 8) return t;
  return `+223 ${local.slice(0, 2)} •• •• ${local.slice(-2)}`;
}

export function age(dateNaissance?: string | null): number | null {
  const d = versDate(dateNaissance);
  if (!d) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
}

/** Date du jour au format ISO (AAAA-MM-JJ) utilisé par l'API. */
export function aujourdhuiIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function pad(n: number): string { return n < 10 ? '0' + n : String(n); }
