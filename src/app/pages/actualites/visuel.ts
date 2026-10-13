/** Dégradé et icône de couverture d'une actualité selon sa catégorie (maquette 37). */
export function couverture(categorie?: string, statut?: string): { fond: string; icone: string } {
  if (statut === 'ARCHIVEE') return { fond: 'linear-gradient(135deg, #0A2A17, #124D2D 60%, #1F6B3C)', icone: 'file-text' };
  switch (categorie) {
    case 'OPPORTUNITE': return { fond: 'linear-gradient(135deg, #7FA8F5, #2E6BE6)', icone: 'briefcase' };
    case 'MOBILISATION': return { fond: 'linear-gradient(135deg, #A6D46A, #6FA334)', icone: 'megaphone' };
    case 'RAPPORT': return { fond: 'linear-gradient(135deg, #FFD166, #E8A600)', icone: 'bar-chart' };
    default: return statut === 'BROUILLON'
      ? { fond: 'linear-gradient(135deg, #B7A1F7, #7A56E8)', icone: 'id-card' }
      : { fond: 'linear-gradient(135deg, #0A2A17, #124D2D 60%, #1F6B3C)', icone: 'layers' };
  }
}
