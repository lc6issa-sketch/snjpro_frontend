import { CohorteDTO } from '../../models/api.models';
import { dateMoyenne, versDate } from '../../shared/utils/format';

/** « Janv. – juin 2025 » */
export function periodeCohorte(c?: CohorteDTO | null): string {
  if (!c) return '';
  const d = versDate(c.dateDebut), f = versDate(c.dateFin);
  if (!d && !f) return c.anneeDebut ? String(c.anneeDebut) : '';
  const mois = (x: Date) => dateMoyenne(x).split(' ')[1];
  if (d && f) {
    const debut = mois(d).charAt(0).toUpperCase() + mois(d).slice(1);
    return d.getFullYear() === f.getFullYear() ? `${debut} – ${mois(f)} ${f.getFullYear()}` : `${debut} ${d.getFullYear()} – ${mois(f)} ${f.getFullYear()}`;
  }
  return dateMoyenne(d ?? f);
}

