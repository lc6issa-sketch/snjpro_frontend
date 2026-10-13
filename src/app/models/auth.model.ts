/** Étape en attente de la double authentification (après le mot de passe). */
export interface DeuxiemeFacteur { identifiant: string; telephoneMasque?: string; seSouvenir: boolean; }
