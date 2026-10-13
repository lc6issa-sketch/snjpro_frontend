/**
 * Mise en forme légère du contenu des actualités (syntaxe proche du Markdown) :
 * **gras**, *italique*, __souligné__, « # » / « ## » pour les titres, « - » pour les listes, [texte](https://lien).
 * Le texte est échappé avant conversion : aucun HTML saisi n'est interprété.
 */
export function enHtml(source?: string | null): string {
  const lignes = echapper(source ?? '').split(/\r?\n/);
  const html: string[] = [];
  let liste = false;
  const fermer = () => { if (liste) { html.push('</ul>'); liste = false; } };
  for (const brute of lignes) {
    const l = brute.trim();
    if (!l) { fermer(); continue; }
    if (/^[-•]\s+/.test(l)) {
      if (!liste) { html.push('<ul>'); liste = true; }
      html.push(`<li>${enLigne(l.replace(/^[-•]\s+/, ''))}</li>`);
      continue;
    }
    fermer();
    if (l.startsWith('## ')) html.push(`<h3>${enLigne(l.slice(3))}</h3>`);
    else if (l.startsWith('# ')) html.push(`<h2>${enLigne(l.slice(2))}</h2>`);
    else html.push(`<p>${enLigne(l)}</p>`);
  }
  fermer();
  return html.join('');
}

export function nombreMots(source?: string | null): number {
  return (source ?? '').replace(/[*_#\-[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
}

function enLigne(t: string): string {
  return t
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<u>$1</u>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function echapper(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
