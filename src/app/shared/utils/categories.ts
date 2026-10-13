/** Icône et couleur d'une catégorie de compétences, déduites de son nom (maquettes 05 et 27). */
export interface StyleCategorie { icone: string; teinte: string; pill: string; }

const REGLES: [RegExp, StyleCategorie][] = [
  [/informati|num[ée]rique|r[ée]seau|t[ée]l[ée]com|web/i, { icone: 'code', teinte: 'tone-blue', pill: 'blue' }],
  [/sant[ée]|secour|infirm|m[ée]dic/i, { icone: 'heart', teinte: 'tone-red', pill: 'red' }],
  [/b[âa]timent|btp|travaux|ma[çc]on|[ée]lectric/i, { icone: 'hard-hat', teinte: 'tone-gold', pill: 'gold' }],
  [/agri|[ée]levage|mara[îi]ch|p[êe]che/i, { icone: 'sprout', teinte: 'tone-lime', pill: 'green' }],
  [/enseign|[ée]ducation|formation/i, { icone: 'book-open', teinte: 'tone-violet', pill: 'violet' }],
  [/m[ée]cani|auto|soudure|industri/i, { icone: 'wrench', teinte: 'tone-teal', pill: 'teal' }],
  [/langue|bambara|fran[çc]ais|anglais/i, { icone: 'message-square', teinte: 'tone-blue', pill: 'blue' }],
  [/admin|gestion|compta|financ|secr[ée]tari/i, { icone: 'briefcase', teinte: 'tone-grey', pill: 'grey' }],
  [/sport|encadrement/i, { icone: 'award', teinte: 'tone-lime', pill: 'green' }]
];

export function styleCategorie(nom?: string | null): StyleCategorie {
  for (const [re, s] of REGLES) if (re.test(nom ?? '')) return s;
  return { icone: 'award', teinte: 'tone-green', pill: 'dark' };
}
