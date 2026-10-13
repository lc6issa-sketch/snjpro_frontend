import { CohorteDTO } from './api.models';

/** Tableau de bord d'une cohorte, tel que renvoyé par GET /cohortes/{id}/tableau-de-bord. */
export interface TableauCohorte {
  cohorte: CohorteDTO;
  recruesInitiales?: number;
  membres: number;
  membresActifs: number;
  membresInactifs: number;
  pourcentageActifs?: number;
  pourcentageProfilsAJour: number;
  mobilisesAnnee: number;
  mobilisationsAnnee: number;
  dureeMois?: number;
  /** libellé de la situation professionnelle -> nombre de membres actifs */
  situationActuelle: Record<string, number>;
  compagnies: string[];
}
