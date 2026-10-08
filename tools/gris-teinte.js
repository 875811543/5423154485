/**
 * Refuse le gris secondaire (--muted, #64748B) sur un fond autre que blanc.
 *
 *   node tools/gris-teinte.js          liste ce qu'il trouve
 *
 * Utilise par tools/controle.js (controle « gris-teinte »).
 *
 * POURQUOI UN MODULE A PART, ET POURQUOI IL LIT LE HTML
 * -----------------------------------------------------
 * Le piege a mordu quatre fois : --muted vaut 4,76:1 sur du blanc PUR et passe
 * sous 4,5 des qu'un fond est teinte — 4,55 sur --surface, 4,34 sur #F1F5F9,
 * 4,25 sur --surface-blue. Chercher « --muted » dans les feuilles ne dit rien :
 * le fond n'est presque jamais porte par la meme regle que le texte, il vient
 * d'un ANCETRE (.geo-section, .cta-final, un degrade sur un conteneur...). Le
 * controle doit donc reconstruire, pour chaque element qui porte du texte, sa
 * couleur effective ET son fond effectif, comme le ferait le navigateur.
 *
 * CE QUE C'EST : une approximation statique de la cascade — selecteurs simples,
 * combinateurs, specificite, ordre, !important, heritage de color, variables CSS.
 * CE QUE CE N'EST PAS : un moteur de rendu. Pseudo-classes d'etat (:hover,
 * :focus...) et pseudo-elements sont ignores ; une regle de media query est
 * comptee comme toujours active ; un element masque est evalue comme visible.
 * Ces choix surestiment le risque plutot que de le sous-estimer.
 *
 * VALIDE contre la mesure navigateur (axe + relevé du fond effectif, 68 pages,
 * 360 et 1280 px) : voir AGENTS.md, « Le gris secondaire ».
 */
'use strict';
const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const MUTED_HEX = '#64748b';

/* ----------------------------------------------------------------------- *
 *  CSS
 * ----------------------------------------------------------------------- */

function sansCommentaires(s) { return s.replace(/\/\*[\s\S]*?\*\//g, ' '); }

/** Coupe a la virgule/point-virgule de premier niveau (hors parentheses, guillemets). */
function decoupe(s, sep) {
  const out = []; let d = 0, q = null, cur = '';
  for (const c of s) {
    if (q) { cur += c; if (c === q) q = null; continue; }
    if (c === '"' || c === "'") { q = c; cur += c; continue; }
    if (c === '(' || c === '[') d++;
    if (c === ')' || c === ']') d--;
    if (c === sep && d === 0) { out.push(cur); cur = ''; } else cur += c;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function declarations(corps) {
  const out = [];
  for (const d of decoupe(corps, ';')) {
    const i = d.indexOf(':'); if (i < 0) continue;
    const prop = d.slice(0, i).trim().toLowerCase();
    let val = d.slice(i + 1).trim();
    const important = /!\s*important\s*$/i.test(val);
    val = val.replace(/!\s*important\s*$/i, '').trim();
    if (prop) out.push({ prop, val, important });
  }
  return out;
}

/** Aplatit une feuille en liste de regles { selecteurs[], decls[] }. @media est traversee ; @keyframes et @font-face ignorees. */
function regles(css) {
  const out = [];
  (function lire(s) {
    let i = 0;
    while (i < s.length) {
      const o = s.indexOf('{', i); if (o < 0) break;
      const prelude = s.slice(i, o).trim();
      // fin du bloc : accolades equilibrees
      let d = 1, j = o + 1;
      while (j < s.length && d > 0) { if (s[j] === '{') d++; else if (s[j] === '}') d--; j++; }
      const corps = s.slice(o + 1, j - 1);
      if (/^@(media|supports|layer|container)/i.test(prelude)) lire(corps);
      else if (!/^@/.test(prelude)) out.push({ selecteurs: decoupe(prelude, ',').map(x => x.trim()).filter(Boolean), decls: declarations(corps) });
      i = j;
    }
  })(sansCommentaires(css));
  return out;
}

/* ----------------------------------------------------------------------- *
 *  Selecteurs
 * ----------------------------------------------------------------------- */

const ETATS = /:(hover|focus|focus-visible|focus-within|active|visited|checked|disabled|target|link|any-link|placeholder-shown|read-only|invalid|valid|required|optional|in-range|out-of-range|enabled|default|indeterminate|open)\b/;

function analyse(sel) {
  if (/::|:(before|after|first-line|first-letter|selection|marker)\b/.test(sel)) return null;
  if (ETATS.test(sel)) return null;
  // decoupe en compositions, en gardant le combinateur qui precede chacune
  const comps = []; let ids = 0, cls = 0, tags = 0;
  const brutes = sel.replace(/\s*([>+~])\s*/g, ' $1 ').trim().split(/\s+(?![^\[]*\])(?![^(]*\))/);
  let combPrec = ' ';
  for (const b of brutes) {
    if (b === '>' || b === '+' || b === '~') { combPrec = b; continue; }
    const m = b.match(/^(\*|[a-zA-Z][\w-]*)?((?:\.[\w-]+|#[\w-]+|\[[^\]]+\]|:[\w-]+(?:\([^)]*\))?)*)$/);
    if (!m) return null;
    const c = { comb: combPrec, tag: m[1] && m[1] !== '*' ? m[1].toLowerCase() : null, id: null, classes: [], attrs: [] };
    if (c.tag) tags++;
    for (const t of (m[2].match(/\.[\w-]+|#[\w-]+|\[[^\]]+\]|:[\w-]+(?:\([^)]*\))?/g) || [])) {
      if (t[0] === '.') { c.classes.push(t.slice(1)); cls++; }
      else if (t[0] === '#') { c.id = t.slice(1); ids++; }
      else if (t[0] === '[') {
        const a = t.slice(1, -1).match(/^([\w:-]+)\s*(?:([~|^$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+)))?/);
        if (a) c.attrs.push({ nom: a[1].toLowerCase(), op: a[2] || null, val: a[3] != null ? a[3] : (a[4] != null ? a[4] : a[5]) });
        cls++;
      } else cls++;   // pseudo-classe structurelle : ignoree, comptee en specificite
    }
    comps.push(c); combPrec = ' ';
  }
  if (!comps.length) return null;
  return { comps, spec: ids * 10000 + cls * 100 + tags };
}

function testeAttr(el, a) {
  const v = el.attrs[a.nom];
  if (v === undefined) return false;
  if (!a.op) return true;
  switch (a.op) {
    case '=': return v === a.val;
    case '^=': return v.startsWith(a.val);
    case '$=': return v.endsWith(a.val);
    case '*=': return v.includes(a.val);
    case '~=': return v.split(/\s+/).includes(a.val);
    case '|=': return v === a.val || v.startsWith(a.val + '-');
    default: return false;
  }
}

function composition(el, c) {
  if (c.tag && el.tag !== c.tag) return false;
  if (c.id && el.id !== c.id) return false;
  for (const k of c.classes) if (!el.classes.includes(k)) return false;
  for (const a of c.attrs) if (!testeAttr(el, a)) return false;
  return true;
}

function correspond(el, comps, i) {
  const c = comps[i];
  if (!composition(el, c)) return false;
  if (i === 0) return true;
  switch (c.comb) {
    case '>': return !!el.parent && correspond(el.parent, comps, i - 1);
    case ' ': for (let p = el.parent; p; p = p.parent) if (correspond(p, comps, i - 1)) return true; return false;
    case '+': { const k = el.parent ? el.parent.enfants.indexOf(el) : -1; return k > 0 && correspond(el.parent.enfants[k - 1], comps, i - 1); }
    case '~': { const k = el.parent ? el.parent.enfants.indexOf(el) : -1; for (let q = 0; q < k; q++) if (correspond(el.parent.enfants[q], comps, i - 1)) return true; return false; }
    default: return false;
  }
}

/* ----------------------------------------------------------------------- *
 *  HTML
 * ----------------------------------------------------------------------- */

const VIDES = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr', 'path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'use', 'stop']);

function lisHtml(html) {
  const s = html.replace(/<!--[\s\S]*?-->/g, ' ');
  const racine = { tag: '#racine', enfants: [], attrs: {}, classes: [], parent: null, texte: false };
  let cur = racine;
  const re = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[^\s=>\/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  const tous = [];
  while ((m = re.exec(s))) {
    if (m[5] !== undefined) { if (/\S/.test(m[5].replace(/&nbsp;|&#160;/g, ' '))) cur.texte = true; continue; }
    const fermant = m[1] === '/', tag = m[2].toLowerCase();
    if (fermant) {
      for (let p = cur; p && p !== racine; p = p.parent) if (p.tag === tag) { cur = p.parent; break; }
      continue;
    }
    const attrs = {};
    for (const a of m[3].matchAll(/([^\s=>\/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[a[1].toLowerCase()] = a[2] != null ? a[2] : (a[3] != null ? a[3] : (a[4] != null ? a[4] : ''));
    }
    const el = { tag, attrs, id: attrs.id || null, classes: (attrs.class || '').split(/\s+/).filter(Boolean), parent: cur, enfants: [], texte: false };
    cur.enfants.push(el); tous.push(el);
    if (tag === 'script' || tag === 'style') {
      const f = s.toLowerCase().indexOf('</' + tag, re.lastIndex);
      re.lastIndex = f < 0 ? s.length : s.indexOf('>', f) + 1;
      continue;
    }
    if (!VIDES.has(tag) && m[4] !== '/') cur = el;
  }
  return tous;
}

/* ----------------------------------------------------------------------- *
 *  Couleurs, fonds, variables
 * ----------------------------------------------------------------------- */

function resous(val, vars, prof) {
  prof = prof || 0;
  if (prof > 6) return val;
  return val.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g, (tout, nom, repli) => {
    if (vars[nom] !== undefined) return resous(vars[nom], vars, prof + 1);
    if (repli !== undefined) return resous(repli.trim(), vars, prof + 1);
    return tout;
  });
}

function norm(hex) {
  hex = hex.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(hex)) hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  return hex;
}

function estMuted(valeur) {
  const v = valeur.toLowerCase().replace(/\s+/g, '');
  return v === MUTED_HEX || v === 'rgb(100,116,139)';
}

/** blanc | teinte | image | none  */
function typeFond(valeur) {
  const v = valeur.toLowerCase();
  if (/gradient\(|url\(/.test(v)) return 'image';
  if (/^(none|transparent|inherit|initial|unset|revert)\b/.test(v.trim())) return 'none';
  const hex = v.match(/#[0-9a-f]{3,8}\b/);
  const rgb = v.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.%]+))?\s*\)/);
  const nom = v.match(/\b(white|black|red|blue|green|gray|grey)\b/);
  if (hex) {
    const h = norm(hex[0]);
    if (h.length === 9 && h.endsWith('00')) return 'none';
    return h.slice(0, 7) === '#ffffff' ? 'blanc' : 'teinte';
  }
  if (rgb) {
    const a = rgb[4] === undefined ? 1 : parseFloat(rgb[4]) / (rgb[4].endsWith('%') ? 100 : 1);
    if (a === 0) return 'none';
    return (+rgb[1] === 255 && +rgb[2] === 255 && +rgb[3] === 255) ? 'blanc' : 'teinte';
  }
  if (nom) return nom[1] === 'white' ? 'blanc' : 'teinte';
  return 'none';
}

/* ----------------------------------------------------------------------- *
 *  Analyse d'une page
 * ----------------------------------------------------------------------- */

const cacheFeuilles = {};
function feuille(rel) {
  if (!cacheFeuilles[rel]) {
    const f = path.join(RACINE, rel);
    cacheFeuilles[rel] = fs.existsSync(f) ? regles(fs.readFileSync(f, 'utf8')) : [];
  }
  return cacheFeuilles[rel];
}

function analyserPage(html) {
  const liens = [...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"?]+)/g)].map(m => m[1]).filter(h => !/^https?:/.test(h));
  // variables : :root de toutes les feuilles, dans l'ordre de chargement
  const vars = {};
  for (const l of liens) for (const r of feuille(l)) {
    if (r.selecteurs.some(s => /^(:root|html)$/.test(s))) for (const d of r.decls) if (d.prop.startsWith('--') && vars[d.prop] === undefined) vars[d.prop] = d.val;
  }
  // regles indexees par clef de leur composition la plus a droite
  const idx = { classe: {}, id: {}, tag: {}, autres: [] };
  let ordre = 0;
  for (const l of liens) for (const r of feuille(l)) {
    const pertinent = r.decls.filter(d => d.prop === 'color' || d.prop === 'background' || d.prop === 'background-color' || d.prop === 'background-image');
    if (!pertinent.length) { ordre++; continue; }
    for (const sel of r.selecteurs) {
      const a = analyse(sel); if (!a) continue;
      const fin = a.comps[a.comps.length - 1];
      const rec = { sel, a, decls: pertinent, ordre: ordre++, feuille: l };
      if (fin.classes.length) (idx.classe[fin.classes[0]] = idx.classe[fin.classes[0]] || []).push(rec);
      else if (fin.id) (idx.id[fin.id] = idx.id[fin.id] || []).push(rec);
      else if (fin.tag) (idx.tag[fin.tag] = idx.tag[fin.tag] || []).push(rec);
      else idx.autres.push(rec);
    }
  }
  const els = lisHtml(html);

  const memo = new Map();
  function gagnants(el) {
    if (memo.has(el)) return memo.get(el);
    const cand = [...(idx.tag[el.tag] || []), ...idx.autres];
    for (const c of el.classes) if (idx.classe[c]) cand.push(...idx.classe[c]);
    if (el.id && idx.id[el.id]) cand.push(...idx.id[el.id]);
    const g = { color: null, bgc: null, bgi: null };
    const bat = (cle, rec, d) => {
      const poids = (d.important ? 1e9 : 0) + rec.a.spec * 1e3 + 0;   // l'ordre departage ci-dessous
      const c = g[cle];
      if (!c || poids > c.poids || (poids === c.poids && rec.ordre >= c.ordre)) g[cle] = { poids, ordre: rec.ordre, val: resous(d.val, vars), sel: rec.sel, feuille: rec.feuille };
    };
    for (const rec of cand) {
      if (!correspond(el, rec.a.comps, rec.a.comps.length - 1)) continue;
      for (const d of rec.decls) {
        if (d.prop === 'color') bat('color', rec, d);
        else if (d.prop === 'background' || d.prop === 'background-color') bat('bgc', rec, d);
        else if (d.prop === 'background-image') bat('bgi', rec, d);
      }
    }
    memo.set(el, g);
    return g;
  }

  function couleurEffective(el) {          // color s'herite
    for (let e = el; e && e.tag !== '#racine'; e = e.parent) {
      const c = gagnants(e).color;
      if (c && !/^(inherit|currentcolor|initial|unset)$/i.test(c.val.trim())) return c;
    }
    return null;
  }
  function fondEffectif(el) {              // le fond ne s'herite pas : on remonte jusqu'au premier pose
    for (let e = el; e && e.tag !== '#racine'; e = e.parent) {
      const g = gagnants(e);
      if (g.bgi && typeFond(g.bgi.val) === 'image') return { type: 'image', src: g.bgi, porteur: e };
      if (g.bgc) {
        const t = typeFond(g.bgc.val);
        if (t !== 'none') return { type: t, src: g.bgc, porteur: e };
      }
    }
    return { type: 'blanc', src: null, porteur: null };
  }

  const trouves = [];
  for (const el of els) {
    if (!el.texte || el.tag === 'script' || el.tag === 'style') continue;
    const c = couleurEffective(el);
    if (!c || !estMuted(c.val)) continue;
    const f = fondEffectif(el);
    if (f.type === 'blanc') continue;
    trouves.push({ el, couleur: c, fond: f });
  }
  return trouves;
}

/* ----------------------------------------------------------------------- *
 *  API
 * ----------------------------------------------------------------------- */

function sig(el) { return el.tag + (el.classes.length ? '.' + el.classes.join('.') : ''); }

function verifier() {
  const pages = fs.readdirSync(RACINE).filter(f => /\.html$/.test(f)).sort();
  const vus = new Map();
  for (const f of pages) {
    for (const t of analyserPage(fs.readFileSync(path.join(RACINE, f), 'utf8'))) {
      const cle = t.couleur.feuille + ' :: ' + t.couleur.sel + '  =>  fond ' + t.fond.type
        + (t.fond.src ? ' (' + t.fond.src.sel + ' : ' + t.fond.src.val.slice(0, 40) + ')' : '');
      if (!vus.has(cle)) vus.set(cle, { pages: new Set(), exemple: sig(t.el) });
      vus.get(cle).pages.add(f.replace('.html', ''));
    }
  }
  return [...vus.entries()].map(([cle, v]) =>
    cle + '   [' + v.exemple + ' — ' + v.pages.size + ' page(s) : ' + [...v.pages].slice(0, 3).join(', ') + (v.pages.size > 3 ? '…' : '') + ']');
}

module.exports = { verifier, analyserPage, regles, lisHtml, analyse };

if (require.main === module) {
  const pbs = verifier();
  if (!pbs.length) { console.log('  aucun gris secondaire sur un fond non blanc'); process.exit(0); }
  console.log('  ' + pbs.length + ' regle(s) posent --muted sur un fond non blanc :');
  for (const p of pbs) console.log('    ' + p);
  process.exit(1);
}
