/** Dégradé et icône de couverture d'une actualité selon sa catégorie (maquette 37). */
export function couverture(categorie?: string, statut?: string): { fond: string; icone: string } {
  if (statut === 'ARCHIVEE') return { fond: FOND_MARQUE, icone: 'file-text' };
  switch (categorie) {
    case 'OPPORTUNITE': return { fond: 'linear-gradient(135deg, #7FA8F5, #2E6BE6)', icone: 'briefcase' };
    case 'MOBILISATION': return { fond: 'linear-gradient(135deg, var(--secondary-light), var(--secondary))', icone: 'megaphone' };
    case 'RAPPORT': return { fond: 'linear-gradient(135deg, #FFD166, #E8A600)', icone: 'bar-chart' };
    default: return statut === 'BROUILLON'
      ? { fond: 'linear-gradient(135deg, #B7A1F7, #7A56E8)', icone: 'id-card' }
      : { fond: FOND_MARQUE, icone: 'layers' };
  }
}

/** Dégradé aux couleurs de la charte (suit le logo choisi). */
const FOND_MARQUE = 'linear-gradient(135deg, var(--sombre-1), var(--sombre-2) 60%, var(--sombre-3))';
