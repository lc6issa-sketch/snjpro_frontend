/** Libellés français et couleurs des pastilles pour les énumérations du backend. */

import { RoleEnum } from '../../models/api.models';

export type Teinte = 'green' | 'dark' | 'blue' | 'violet' | 'gold' | 'red' | 'teal' | 'grey';
export interface Etiquette { libelle: string; teinte: Teinte; }

const e = (libelle: string, teinte: Teinte): Etiquette => ({ libelle, teinte });

export const STATUT_MEMBRE: Record<string, Etiquette> = {
  ACTIF: e('Actif', 'green'), INACTIF: e('Inactif', 'grey'), ARCHIVE: e('Archivé', 'grey'),
  DECEDE: e('Décédé', 'grey'), SUSPENDU: e('Suspendu', 'red')
};

export const STATUT_COHORTE: Record<string, Etiquette> = {
  EN_FORMATION: e('En formation', 'blue'), EN_RESERVE: e('En réserve', 'violet'), LIBEREE: e('Libérée', 'green'),
  ACTIVE: e('Active', 'green'), TERMINEE: e('Terminée', 'grey'), ARCHIVEE: e('Archivée', 'grey')
};

export const STATUT_MOBILISATION: Record<string, Etiquette> = {
  BROUILLON: e('Brouillon', 'gold'), PLANIFIEE: e('Planifiée', 'blue'), EN_COURS: e('En cours', 'green'), CLOTUREE: e('Clôturée', 'grey')
};

export const REPONSE_MOBILISATION: Record<string, Etiquette> = {
  DISPONIBLE: e('Disponible', 'green'), INDISPONIBLE: e('Indisponible', 'red'), EN_ATTENTE: e('Sans réponse', 'grey')
};

export const STATUT_ACTUALITE: Record<string, Etiquette> = {
  BROUILLON: e('Brouillon', 'gold'), PROGRAMMEE: e('Programmée', 'blue'), PUBLIEE: e('Publiée', 'green'), ARCHIVEE: e('Archivée', 'grey')
};

export const CATEGORIE_ACTUALITE: Record<string, string> = {
  ANNONCE: 'Annonce', OPPORTUNITE: 'Opportunité', MOBILISATION: 'Mobilisation', RAPPORT: 'Rapport'
};

export const TYPE_OPPORTUNITE: Record<string, Etiquette> = {
  EMPLOI: e('Emploi', 'dark'), STAGE: e('Stage', 'teal'), FORMATION: e('Formation', 'violet')
};

export const STATUT_OPPORTUNITE: Record<string, Etiquette> = {
  BROUILLON: e('Brouillon', 'gold'), OUVERTE: e('Ouverte', 'green'), CLOTUREE: e('Clôturée', 'grey')
};

export const STATUT_CANDIDATURE: Record<string, Etiquette> = {
  NOUVELLE: e('Nouvelle', 'blue'), PRESELECTIONNEE: e('Présélectionnée', 'violet'), ENTRETIEN: e('Entretien', 'gold'),
  RETENUE: e('Retenue', 'green'), NON_RETENUE: e('Non retenue', 'grey')
};

export const VISIBILITE_DOCUMENT: Record<string, Etiquette> = {
  MEMBRES: e('Membres', 'green'), INTERNE: e('Interne', 'grey'), PUBLIC: e('Public', 'blue')
};

export const TYPE_DOCUMENT: Record<string, string> = {
  ATTESTATION: 'Attestation', DIPLOME: 'Diplôme', IDENTITE: 'Pièce d\'identité', PHOTO: 'Photo d\'identité',
  CARTE_MEMBRE: 'Carte de membre', CV: 'CV', AUTRE: 'Autre document'
};

export const TYPE_DEMANDE: Record<string, Etiquette> = {
  MISE_A_JOUR_PROFIL: e('Mise à jour', 'blue'), ATTESTATION: e('Attestation', 'violet'), CARTE_MEMBRE: e('Carte membre', 'teal'),
  RECLAMATION: e('Réclamation', 'red'), AUTRE: e('Autre', 'grey')
};

export const STATUT_DEMANDE: Record<string, Etiquette> = {
  EN_ATTENTE: e('En attente', 'gold'), EN_COURS: e('En cours', 'blue'), COMPLEMENT_DEMANDE: e('Complément demandé', 'violet'),
  ACCEPTEE: e('Acceptée', 'green'), REJETEE: e('Rejetée', 'red')
};

export const STATUT_SOUVENIR: Record<string, Etiquette> = {
  EN_ATTENTE: e('À valider', 'gold'), PUBLIE: e('Publié', 'green'), REJETE: e('Rejeté', 'red')
};

export const STATUT_ACTIVITE: Record<string, Etiquette> = {
  PLANIFIEE: e('Planifiée', 'blue'), EN_COURS: e('En cours', 'green'), TERMINEE: e('Terminée', 'grey')
};

export const MODE_PRESENCE: Record<string, Etiquette> = {
  QR_CODE: e('QR code', 'green'), CODE: e('Code', 'teal'), MANUEL: e('Manuel', 'blue')
};

export const TYPE_NOTIFICATION: Record<string, string> = {
  INFORMATION: 'Information', URGENT: 'Urgent', MOBILISATION: 'Mobilisation', ACTUALITE: 'Actualité'
};

export const STATUT_PROFESSIONNEL: Record<string, Etiquette> = {
  EMPLOYE: e('Salarié(e)', 'green'), AUTO_EMPLOYE: e('Entrepreneur', 'blue'), CHOMEUR: e('Sans emploi', 'gold'),
  ETUDIANT: e('Étudiant(e)', 'violet'), RETRAITE: e('Retraité(e)', 'grey'), AUTRE: e('Autre', 'grey')
};

export const NIVEAU_COMPETENCE: Record<string, { libelle: string; points: number }> = {
  DEBUTANT: { libelle: 'Débutant', points: 1 }, INTERMEDIAIRE: { libelle: 'Intermédiaire', points: 2 },
  AVANCE: { libelle: 'Avancé', points: 3 }, EXPERT: { libelle: 'Expert', points: 4 }
};

export const SEXE: Record<string, string> = { MASCULIN: 'Homme', FEMININ: 'Femme' };

export const TYPE_RAPPORT: Record<string, string> = {
  EFFECTIFS_COHORTES: 'Rapport des effectifs', COMPETENCES: 'Répartition par compétences', MOBILISATIONS: 'Bilan des mobilisations',
  PROFILS_INCOMPLETS: 'Profils incomplets', STATISTIQUES_COHORTES: 'Statistiques par cohorte'
};

/** Actions de l'historique -> libellé et couleur. */
export function etiquetteAction(action?: string): Etiquette {
  const a = (action ?? '').toUpperCase();
  if (a.includes('SUPPRESSION') || a.includes('REJET')) return e(libelleAction(a), 'red');
  if (a.includes('DESACTIV')) return e(libelleAction(a), 'red');
  if (a.includes('CREATION') || a.includes('AJOUT') || a.includes('INVITATION')) return e(libelleAction(a), 'green');
  if (a.includes('IMPORT') || a.includes('FUSION')) return e(libelleAction(a), 'violet');
  if (a.includes('ROLE') || a.includes('PERMISSION') || a.includes('STATUT')) return e(libelleAction(a), 'gold');
  if (a.includes('EXPORT') || a.includes('RAPPORT')) return e(libelleAction(a), 'teal');
  if (a.includes('MODIFICATION') || a.includes('RESTAURATION') || a.includes('PHOTO')) return e(libelleAction(a), 'blue');
  return e(libelleAction(a), 'grey');
}

export function libelleAction(a: string): string {
  const t = a.replace(/_/g, ' ').toLowerCase();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function etiquette(dico: Record<string, Etiquette>, cle?: string | null): Etiquette {
  return (cle && dico[cle]) || e(cle ?? '—', 'grey');
}

/** Libellés des rôles tels qu'affichés dans les maquettes. */
export const LIBELLES_ROLES: Record<RoleEnum, string> = {
  ROLE_ADMIN_SYSTEME: 'Administrateur',
  ROLE_ADMIN_SNJ: 'Agent SNJ',
  ROLE_DIRECTION: 'Direction',
  ROLE_RESPONSABLE_REGIONAL: 'Resp. régional',
  ROLE_RESPONSABLE_COHORTE: 'Resp. cohorte',
  ROLE_MEMBRE: 'Membre',
  ROLE_PARTENAIRE: 'Partenaire'
};
