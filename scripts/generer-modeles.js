// Génère src/app/models/api.models.ts à partir des DTO et énumérations Java du backend (npm run modeles).
const fs = require('fs');
const path = require('path');
// Racine du backend : variable SNJ_BACK (ex. SNJ_BACK=/chemin/snjpro_back npm run modeles), sinon ../snjpro_backend à côté de ce projet
const racineBack = process.env.SNJ_BACK || path.resolve(__dirname, '../../snjpro_backend');
const back = path.join(racineBack, 'src/main/java/com/example/snjpro_backend') + '/';
const out = path.resolve(__dirname, '../src/app/models/api.models.ts');

const files = [
  ...fs.readdirSync(back + 'dto').map(f => back + 'dto/' + f),
  ...fs.readdirSync(back + 'enumeration').map(f => back + 'enumeration/' + f),
  back + 'controller/HistoriqueController.java',
  back + 'controller/RechercheGlobaleController.java',
];

const enums = {};          // nom simple -> valeurs
const enumOwners = {};     // nom simple -> conteneur (Enumerations) ou null
const blocks = [];         // { container, name, kind, fields }

function stripComments(s) {
  return s.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

// DÃ©coupe le corps d'une classe en membres de premier niveau (nested types gÃ©rÃ©s sÃ©parÃ©ment).
function parseBody(body) {
  const fields = [];
  let depth = 0, buf = '';
  for (const ch of body) {
    if (ch === '{') { depth++; buf = ''; continue; }
    if (ch === '}') { depth--; buf = ''; continue; }
    if (depth > 0) continue;
    buf += ch;
    if (ch === ';') {
      let st = buf.replace(/@\w+(\.\w+)*(\([^()]*(\([^()]*\)[^()]*)*\))?/g, ' ').replace(/\s+/g, ' ').trim();
      buf = '';
      st = st.replace(/\s*=.*;$/, ';');
      if (/\bstatic\b/.test(st) || /\(/.test(st)) continue;
      const m = st.match(/^(?:private |protected |public )?(?:final )?(.+?)\s+(\w+)\s*;$/);
      if (m) fields.push({ type: m[1].trim(), name: m[2] });
    }
  }
  return fields;
}

// Trouve les types (class/record/enum) et leur corps, rÃ©cursivement.
function scan(src, container) {
  const re = /(?:public |private |protected )?(?:static )?(?:final )?(class|record|enum|interface)\s+(\w+)(?:<[^>]*>)?\s*(\(([^)]*)\))?[^{]*\{/g;
  let m;
  const found = [];
  while ((m = re.exec(src))) {
    // trouver la fin du corps
    let i = re.lastIndex, depth = 1;
    while (depth > 0 && i < src.length) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
    const body = src.slice(re.lastIndex, i - 1);
    found.push({ kind: m[1], name: m[2], recordParams: m[4], body, start: m.index, end: i });
    re.lastIndex = i;
  }
  for (const f of found) {
    if (f.kind === 'enum') {
      const vals = f.body.split(';')[0].split(',').map(v => v.replace(/\(.*\)/s, '').trim()).filter(v => /^[A-Z_0-9]+$/.test(v));
      enums[f.name] = vals; enumOwners[f.name] = container;
      continue;
    }
    if (f.kind === 'interface') continue;
    let fields;
    if (f.kind === 'record') {
      fields = splitParams(f.recordParams || '').map(p => {
        const t = p.replace(/@\w+(\([^)]*\))?/g, '').trim();
        const k = t.lastIndexOf(' ');
        return { type: t.slice(0, k).trim(), name: t.slice(k + 1) };
      });
    } else {
      fields = parseBody(f.body);
    }
    blocks.push({ container, name: f.name, fields });
    scan(f.body, container || f.name);
  }
}

function splitParams(s) {
  const res = []; let d = 0, cur = '';
  for (const ch of s) {
    if (ch === '<') d++; if (ch === '>') d--;
    if (ch === ',' && d === 0) { res.push(cur); cur = ''; } else cur += ch;
  }
  if (cur.trim()) res.push(cur);
  return res;
}

for (const f of files) {
  if (!f.endsWith('.java')) continue;
  const src = stripComments(fs.readFileSync(f, 'utf8'));
  const base = path.basename(f, '.java');
  if (base.endsWith('Controller')) {
    // seulement les classes imbriquÃ©es
    const inner = src.slice(src.indexOf('{') + 1);
    scan(inner, base.replace('Controller', ''));
  } else {
    scan(src, null);
  }
}

// Conteneurs : DTO groupÃ©s (MobilisationDTOs) -> namespace ; classes imbriquÃ©es dans un DTO simple -> namespace du DTO.
const containers = {};
for (const b of blocks) {
  const c = b.container;
  (containers[c || ''] ||= []).push(b);
}
const topNames = new Set((containers[''] || []).map(b => b.name));

let enNamespace = false;
function tsType(t, ctx) {
  t = t.replace(/\bjava\.\w+\.(\w+\.)*/g, '').replace(/\bcom\.example\.snj_pro_backend\.\w+\./g, '').trim();
  const gen = t.match(/^(\w+(?:\.\w+)*)<(.+)>$/);
  if (gen) {
    const g = gen[1].split('.').pop(), args = splitParams(gen[2]).map(a => a.trim());
    if (['List', 'Set', 'Collection', 'Page'].includes(g)) return g === 'Page' ? `Page<${tsType(args[0], ctx)}>` : `${tsType(args[0], ctx)}[]`;
    if (g === 'Map') return `Record<string, ${tsType(args[1], ctx)}>`;
    if (g === 'Optional') return tsType(args[0], ctx);
    return 'any';
  }
  if (t.endsWith('[]')) return t === 'byte[]' ? 'string' : `${tsType(t.slice(0, -2), ctx)}[]`;
  const simple = t.split('.').pop();
  const prim = {
    String: 'string', LocalDate: 'string', LocalDateTime: 'string', LocalTime: 'string', Instant: 'string', UUID: 'string',
    Long: 'number', long: 'number', Integer: 'number', int: 'number', Double: 'number', double: 'number', Float: 'number',
    float: 'number', BigDecimal: 'number', Short: 'number', short: 'number', Boolean: 'boolean', boolean: 'boolean',
    Object: 'any', MultipartFile: 'File',
  };
  if (prim[simple]) return prim[simple];
  if (enums[simple]) return simple;
  // classe : locale au conteneur ?
  const qual = t.includes('.') ? t.split('.') : null;
  if (qual && qual.length === 2) {
    const [c, n] = qual;
    if (containers[c] && containers[c].some(b => b.name === n)) return `${c}.${n}`;
    if (c === ctx) return n;
  }
  if (ctx && containers[ctx] && containers[ctx].some(b => b.name === simple)) return topNames.has(ctx) && !enNamespace ? ctx + '.' + simple : simple;
  if (topNames.has(simple)) return simple;
  for (const c of Object.keys(containers)) if (c && containers[c].some(b => b.name === simple)) return `${c}.${simple}`;
  return 'any';
}

let ts = '// Fichier genere automatiquement depuis les DTO Java du backend SNJPro (scripts/generer-modeles.js).\n// Ne pas modifier a la main : relancer le generateur apres un changement cote backend.\n\n';
ts += `export interface Page<T> {\n  content: T[];\n  totalElements: number;\n  totalPages: number;\n  number: number;\n  size: number;\n  first: boolean;\n  last: boolean;\n  empty: boolean;\n}\n\n`;
for (const [name, vals] of Object.entries(enums)) {
  ts += `export type ${name} = ${vals.map(v => `'${v}'`).join(' | ')};\n`;
  ts += `export const ${name}_VALUES: ${name}[] = [${vals.map(v => `'${v}'`).join(', ')}];\n\n`;
}
function iface(b, indent, ctx) {
  let s = `${indent}export interface ${b.name} {\n`;
  for (const f of b.fields) s += `${indent}  ${f.name}?: ${tsType(f.type, ctx)};\n`;
  return s + `${indent}}\n`;
}
enNamespace = false;
for (const b of containers[''] || []) if (b.fields.length || !containers[b.name]) ts += iface(b, '', b.name) + '\n';
for (const [c, list] of Object.entries(containers)) {
  if (!c) continue;
  enNamespace = true;
  ts += `export namespace ${c} {\n`;
  for (const b of list) ts += iface(b, '  ', c);
  ts += `}\n\n`;
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, ts);
console.log('enums', Object.keys(enums).length, 'blocks', blocks.length, 'containers', Object.keys(containers).join(','));

