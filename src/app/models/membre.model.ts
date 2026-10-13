/** Pagination et tri d'une recherche de membres (page, taille, tri Spring). */
export interface PaginationMembres { page?: number; size?: number; sort?: string; }

/** Critères de vérification des doublons avant création / modification d'un membre. */
export interface CriteresDoublon { prenom?: string; nom?: string; dateNaissance?: string; telephone?: string; email?: string; exclureId?: number; }
