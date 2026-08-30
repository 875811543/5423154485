#!/usr/bin/env node
/*
 * Controle statique du depot — aucune dependance, aucun navigateur.
 *
 *   node tools/controle.js            tous les controles
 *   node tools/controle.js --liste    la liste des controles
 *   node tools/controle.js alpha      un seul controle, par son nom
 *
 * Sort en code 1 des qu'un controle echoue, pour servir de garde-fou.
 *
 * Ce fichier rassemble les verifications qui ont reellement attrape des
 * defauts sur ce site, dont trois introduits par des corrections precedentes.
 * Ce qui demande un navigateur — largeurs de rendu, contraste, poids reel —
 * n'est pas ici : voir la section « Mesurer dans un navigateur » d'AGENTS.md.
 */

'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RACINE = path.resolve(__dirname, '..');
process.chdir(RACINE);

const pages = fs.readdirSync('.').filter(f => f.endsWith('.html')).sort();
// Les fins de ligne sont normalisees a la lecture : on compare du contenu, pas
// un encodage. Sans cela, un simple `git checkout` sous Windows suffit a faire
// echouer le controle d'identite en-tete/pied — vecu.
const lire = f => fs.readFileSync(f, 'utf8').replace(/\r\n/g, '\n');
const md5 = f => crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 8);
const sansScripts = s => s.replace(/<script[\s\S]*?<\/script>/g, '');

/* ------------------------------------------------------------------ *
 *  Lecture des en-tetes d'images, sans dependance
 * ------------------------------------------------------------------ */

function infoPng(fichier) {
  const b = fs.readFileSync(fichier);
  if (b.length < 33 || b.readUInt32BE(0) !== 0x89504e47) return null;
  const typeCouleur = b[25];              // 4 = gris+alpha, 6 = RVB+alpha
  let alpha = typeCouleur === 4 || typeCouleur === 6;
  if (!alpha) {                            // une palette peut porter un chunk tRNS
    for (let i = 8; i + 8 < b.length;) {
      const taille = b.readUInt32BE(i);
      const nom = b.toString('latin1', i + 4, i + 8);
      if (nom === 'tRNS') { alpha = true; break; }
      if (nom === 'IDAT' || nom === 'IEND') break;
      i += 12 + taille;
    }
  }
  return { largeur: b.readUInt32BE(16), hauteur: b.readUInt32BE(20), alpha };
}

function infoWebp(fichier) {
  const b = fs.readFileSync(fichier);
  if (b.length < 30 || b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WEBP') return null;
  const type = b.toString('latin1', 12, 16);
  if (type === 'VP8X') {
    return {
      largeur: (b.readUIntLE(24, 3) & 0xffffff) + 1,
      hauteur: (b.readUIntLE(27, 3) & 0xffffff) + 1,
      alpha: !!(b[20] & 0x10)
    };
  }
  if (type === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return {
      largeur: (bits & 0x3fff) + 1,
      hauteur: ((bits >> 14) & 0x3fff) + 1,
      alpha: !!((bits >> 28) & 1)
    };
  }
  if (type === 'VP8 ') {
    return { largeur: b.readUInt16LE(26) & 0x3fff, hauteur: b.readUInt16LE(28) & 0x3fff, alpha: false };
  }
  return null;
}

function infoJpeg(fichier) {
  const b = fs.readFileSync(fichier);
  if (b.length < 4 || b[0] !== 0xff || b[1] !== 0xd8) return null;
  for (let i = 2; i + 9 < b.length;) {
    if (b[i] !== 0xff) { i++; continue; }
    const m = b[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
      return { hauteur: b.readUInt16BE(i + 5), largeur: b.readUInt16BE(i + 7), alpha: false };
    i += 2 + b.readUInt16BE(i + 2);
  }
  return null;
}

const infoImage = f => {
  const e = path.extname(f).toLowerCase();
  try {
    if (e === '.png') return infoPng(f);
    if (e === '.webp') return infoWebp(f);
    if (e === '.jpg' || e === '.jpeg') return infoJpeg(f);
  } catch (err) { /* fichier illisible : signale ailleurs */ }
  return null;
};

function toutesLesImages() {
  const out = [];
  (function marche(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) marche(p);
      else if (/\.(png|webp|jpe?g)$/i.test(e.name)) out.push(p.replace(/\\/g, '/'));
    }
  })('images');
  return out;
}

/* ------------------------------------------------------------------ *
 *  Les controles
 * ------------------------------------------------------------------ */

const CONTROLES = [

{ nom: 'entete-pied', titre: 'En-tete et pied de page identiques sur les 28 pages',
  run() {
    const pbs = [];
    for (const [nom, motif] of [['en-tete', /<header class="site-header"[\s\S]*?<\/header>/],
                                ['pied', /<footer class="site-footer"[\s\S]*?<\/footer>/]]) {
      const vus = new Map();
      for (const f of pages) {
        const m = lire(f).match(motif);
        if (!m) { pbs.push(nom + ' absent de ' + f); continue; }
        const k = crypto.createHash('md5').update(m[0]).digest('hex').slice(0, 8);
        if (!vus.has(k)) vus.set(k, []);
        vus.get(k).push(f);
      }
      if (vus.size > 1) {
        pbs.push(nom + ' : ' + vus.size + ' variantes');
        for (const [, l] of vus) pbs.push('    ' + l.length + ' pages : ' + l.slice(0, 4).join(', '));
      }
    }
    return pbs;
  }},

{ nom: 'styles-en-ligne', titre: 'Aucun style dans le HTML',
  run: () => pages.filter(f => /<style|\sstyle="/.test(lire(f))).map(f => f + ' porte un style en ligne') },

{ nom: 'cibles', titre: 'Chaque cible referencee existe',
  run() {
    const cibles = new Set();
    for (const f of pages)
      for (const m of lire(f).matchAll(/(?:href|src|srcset)="([^"]+)"/g))
        for (const u of m[1].split(',').map(x => x.trim().split(' ')[0])) {
          const c = u.replace(/[?#].*$/, '');
          if (c && !/^(https?:|mailto:|tel:|data:|#)/.test(c)) cibles.add(c);
        }
    return [...cibles].filter(c => !fs.existsSync(c)).map(c => 'cible absente : ' + c);
  }},

{ nom: 'hashes', titre: 'Les hashes ?v= correspondent aux fichiers',
  run() {
    const pbs = [];
    const actifs = [];
    (function marche(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) marche(p);
        else if (/\.(css|js)$/.test(e.name)) actifs.push(p.replace(/\\/g, '/'));
      }
    })('assets');
    for (const f of actifs) {
      const nom = path.basename(f);
      const reel = md5(f);
      const refs = new Set();
      for (const p of pages)
        for (const m of lire(p).matchAll(new RegExp(nom.replace('.', '\\.') + '\\?v=([a-f0-9]+)', 'g')))
          refs.add(m[1]);
      if (!refs.size) continue;
      for (const r of refs) if (r !== reel) pbs.push(nom + ' : reference ' + r + ', reel ' + reel);
    }
    return pbs;
  }},

{ nom: 'chemins-absolus', titre: 'Aucun chemin absolu, dans aucun des trois langages',
  run() {
    const pbs = [];
    for (const f of pages) {
      const s = lire(f);
      for (const m of s.matchAll(/(?:href|src)="(\/[^"/][^"]*)"/g)) pbs.push(f + ' : ' + m[1]);
      for (const m of s.matchAll(/location\.(?:href|replace|assign)\s*[=(]\s*['"](\/[^'"]*)/g)) pbs.push(f + ' (JS) : ' + m[1]);
    }
    const css = [];
    (function marche(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) marche(p); else if (e.name.endsWith('.css')) css.push(p);
      }
    })('assets/css');
    for (const f of css)
      for (const m of lire(f).matchAll(/url\(\s*['"]?(\/[^'")]*)/g)) pbs.push(f + ' : url(' + m[1] + ')');
    if (fs.existsSync('assets/js/main.js'))
      for (const m of lire('assets/js/main.js').matchAll(/location\.(?:href|replace|assign)\s*[=(]\s*['"](\/[^'"]*)/g))
        pbs.push('assets/js/main.js : ' + m[1]);
    return pbs;
  }},

{ nom: 'alpha', titre: 'Aucune transparence perdue entre un PNG et son WebP',
  run() {
    const pbs = [];
    for (const p of toutesLesImages().filter(f => f.endsWith('.png'))) {
      const w = p.replace(/\.png$/, '.webp');
      if (!fs.existsSync(w)) continue;
      const ip = infoImage(p), iw = infoImage(w);
      if (!ip || !iw) continue;
      if (ip.alpha && !iw.alpha)
        pbs.push(path.basename(w) + ' : le PNG est transparent, le WebP n a pas de canal alpha'
               + ' — les zones transparentes seront aplaties sur du noir');
    }
    return pbs;
  }},

{ nom: 'dimensions', titre: 'Les attributs width/height decrivent le fichier servi',
  run() {
    const pbs = [];
    const vus = new Set();
    for (const f of pages)
      for (const m of lire(f).matchAll(/<img\s+[^>]*src="(images\/[^"]+)"[^>]*>/g)) {
        const bloc = m[0], src = m[1];
        const w = (bloc.match(/\swidth="(\d+)"/) || [])[1];
        const h = (bloc.match(/\sheight="(\d+)"/) || [])[1];
        if (!w || !h) continue;
        // le navigateur prend la source WebP quand elle existe
        const webp = src.replace(/\.(png|jpe?g)$/i, '.webp');
        const reel = infoImage(fs.existsSync(webp) ? webp : src);
        if (!reel) continue;
        const rAtt = +w / +h, rReel = reel.largeur / reel.hauteur;
        if (Math.abs(rAtt - rReel) / rReel > 0.01) {
          const cle = src + w + h;
          if (vus.has(cle)) continue;
          vus.add(cle);
          pbs.push(path.basename(src) + ' : declare ' + w + 'x' + h
                 + ', fichier ' + reel.largeur + 'x' + reel.hauteur + ' (rapports differents)');
        }
      }
    return pbs;
  }},

{ nom: 'taille-css', titre: 'Toute image sans dimension en CSS rend a la taille de son fichier',
  run() {
    // Sans navigateur on ne resout pas la cascade. On signale donc le cas a
    // risque : une image porte une classe, aucune feuille ne pose de width ou
    // de height pour cette classe, et ses attributs different du fichier. Elle
    // rendra alors a la taille du fichier, ce qui est rarement voulu.
    const css = [];
    (function marche(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) marche(p); else if (e.name.endsWith('.css')) css.push(lire(p));
      }
    })('assets/css');
    const toutCss = css.join('\n');
    const pbs = [];
    const vus = new Set();
    for (const f of pages)
      for (const m of lire(f).matchAll(/<img\s+[^>]*class="([^"]+)"[^>]*>/g)) {
        const bloc = m[0];
        const classes = m[1].split(/\s+/).filter(Boolean);
        const w = (bloc.match(/\swidth="(\d+)"/) || [])[1];
        if (!w) continue;
        const dimensionnee = classes.some(c => {
          const re = new RegExp('\\.' + c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b[^{]*\\{[^}]*\\b(?:width|height)\\s*:', 'm');
          return re.test(toutCss);
        });
        if (dimensionnee) continue;
        const src = (bloc.match(/src="([^"]+)"/) || [])[1] || '';
        const webp = src.replace(/\.(png|jpe?g)$/i, '.webp');
        const reel = infoImage(fs.existsSync(webp) ? webp : src);
        if (!reel) continue;
        if (+w !== reel.largeur) continue;   // coherent : le fichier fait la taille voulue
        const cle = classes.join('.') + src;
        if (vus.has(cle)) continue;
        vus.add(cle);
        pbs.push(path.basename(src) + ' (.' + classes.join('.') + ') : aucune dimension en CSS,'
               + ' l image rendra en ' + reel.largeur + 'x' + reel.hauteur);
      }
    return pbs;
  }},

{ nom: 'paires', titre: 'Un WebP et son repli ont les memes dimensions',
  run() {
    const pbs = [];
    for (const w of toutesLesImages().filter(f => f.endsWith('.webp') && !f.includes('-760'))) {
      for (const ext of ['.jpg', '.png']) {
        const r = w.replace(/\.webp$/, ext);
        if (!fs.existsSync(r)) continue;
        const iw = infoImage(w), ir = infoImage(r);
        if (!iw || !ir) continue;
        if (iw.largeur !== ir.largeur || iw.hauteur !== ir.hauteur)
          pbs.push(path.basename(w) + ' ' + iw.largeur + 'x' + iw.hauteur
                 + ' contre ' + path.basename(r) + ' ' + ir.largeur + 'x' + ir.hauteur);
      }
    }
    return pbs;
  }},

{ nom: 'json-ld', titre: 'JSON-LD valide, references resolues, reponses visibles',
  run() {
    const pbs = [];
    const definis = new Set(), references = new Map();
    for (const f of pages) {
      const src = lire(f);
      const visible = sansScripts(src).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
      let i = 0;
      for (const b of src.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        i++;
        let d;
        try { d = JSON.parse(b[1]); } catch (e) { pbs.push(f + ' bloc ' + i + ' : JSON invalide — ' + e.message); continue; }
        (function parcours(n) {
          if (Array.isArray(n)) return n.forEach(parcours);
          if (!n || typeof n !== 'object') return;
          // un noeud qui porte un @type *definit* l'entite ; un noeud reduit a
          // son @id ne fait qu'y renvoyer. La resolution se fait a l'echelle du
          // site : c'est ainsi que Google consolide les entites.
          if (n['@id']) {
            if (n['@type']) definis.add(n['@id']);
            else if (Object.keys(n).length === 1 && !references.has(n['@id'])) references.set(n['@id'], f);
          }
          if (n['@type'] === 'BreadcrumbList' && Array.isArray(n.itemListElement))
            n.itemListElement.forEach((e, k) => {
              if (e.position !== k + 1) pbs.push(f + ' : fil d Ariane, position ' + e.position + ' au rang ' + (k + 1));
              if (!e.name) pbs.push(f + ' : fil d Ariane, element sans nom');
            });
          if (n['@type'] === 'Question') {
            const t = n.acceptedAnswer && n.acceptedAnswer.text;
            if (!t) pbs.push(f + ' : question sans reponse — ' + String(n.name).slice(0, 40));
            else {
              const debut = String(t).replace(/\s+/g, ' ').trim().slice(0, 45);
              if (debut && !visible.includes(debut))
                pbs.push(f + ' : reponse absente du texte visible — ' + String(n.name).slice(0, 45));
            }
          }
          if (n['@type'] === 'PestControlService' || n['@type'] === 'LocalBusiness')
            for (const champ of ['name', 'address', 'telephone'])
              if (!n[champ]) pbs.push(f + ' : ' + n['@type'] + ' sans ' + champ);
          Object.values(n).forEach(parcours);
        })(d);
      }
    }
    for (const [id, f] of references) if (!definis.has(id)) pbs.push(f + ' : reference @id non resolue — ' + id);
    return pbs;
  }},

{ nom: 'nap', titre: 'Nom, adresse et telephone coherents partout',
  run() {
    const champs = { name: new Map(), telephone: new Map(), streetAddress: new Map(), addressLocality: new Map(), postalCode: new Map() };
    for (const f of pages) {
      for (const b of lire(f).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        let d; try { d = JSON.parse(b[1]); } catch (e) { continue; }
        (function parcours(n) {
          if (Array.isArray(n)) return n.forEach(parcours);
          if (!n || typeof n !== 'object') return;
          if (n['@type'] === 'PestControlService' || n['@type'] === 'LocalBusiness') {
            const v = { name: n.name, telephone: JSON.stringify(n.telephone) };
            if (n.address) Object.assign(v, {
              streetAddress: n.address.streetAddress,
              addressLocality: n.address.addressLocality,
              postalCode: n.address.postalCode
            });
            for (const [k, val] of Object.entries(v)) {
              if (val === undefined) continue;
              if (!champs[k].has(val)) champs[k].set(val, []);
              champs[k].get(val).push(f);
            }
          }
          Object.values(n).forEach(parcours);
        })(d);
      }
    }
    const pbs = [];
    for (const [k, m] of Object.entries(champs))
      if (m.size > 1) pbs.push(k + ' : ' + m.size + ' valeurs — ' + [...m.keys()].map(x => String(x).slice(0, 30)).join(' | '));
    return pbs;
  }},

{ nom: 'h1-canonical', titre: 'Un seul h1 par page, canonical present',
  run() {
    const pbs = [];
    const sitemap = fs.existsSync('sitemap.xml') ? lire('sitemap.xml') : '';
    for (const f of pages) {
      const s = lire(f);
      const n = (s.match(/<h1[\s>]/g) || []).length;
      if (n !== 1) pbs.push(f + ' : ' + n + ' balises h1');
      const noindex = /name="robots"[^>]*noindex/.test(s);
      if (!noindex && !/rel="canonical"/.test(s)) pbs.push(f + ' : indexable mais sans canonical');
      if (noindex && sitemap && new RegExp('<loc>[^<]*/' + f.replace('.html', '') + '</loc>').test(sitemap))
        pbs.push(f + ' : en noindex mais declaree au sitemap');
    }
    return pbs;
  }},

{ nom: 'mobilier', titre: 'Chaque page porte le mobilier commun, une fois et une seule',
  run() {
    // Une page creee a partir d'un gabarit perd facilement un de ces blocs :
    // c'est arrive a actualites.html, batie en remplacant le <main> d'une page
    // existante — la barre d'appel y etait, et a disparu avec.
    const attendus = [
      ['barre d appel mobile', /class="sticky-mobile-bar"/g],
      ['lien d evitement', /class="skip-link"/g],
      ['en-tete de site', /<header class="site-header"/g],
      ['pied de site', /<footer class="site-footer"/g],
      ['bloc d appel de l en-tete', /class="site-header__appel"/g]
    ];
    const pbs = [];
    for (const f of pages) {
      const s = lire(f);
      for (const [nom, re] of attendus) {
        const n = (s.match(re) || []).length;
        if (n !== 1) pbs.push(f + ' : ' + n + ' ' + nom + ' (1 attendu)');
      }
    }
    return pbs;
  }},

{ nom: 'orphelins', titre: 'Aucune image inutilisee dans le depot',
  run() {
    const tout = pages.map(lire).join('\n') + (fs.existsSync('manifest.json') ? lire('manifest.json') : '');
    return toutesLesImages()
      .filter(f => !tout.includes(path.basename(f)) && !/favicon|icon-512/.test(f))
      .map(f => 'jamais referencee : ' + f);
  }}

];

/* ------------------------------------------------------------------ *
 *  Execution
 * ------------------------------------------------------------------ */

const arg = process.argv[2];
if (arg === '--liste') {
  for (const c of CONTROLES) console.log('  ' + c.nom.padEnd(18) + c.titre);
  process.exit(0);
}
const aLancer = arg ? CONTROLES.filter(c => c.nom === arg) : CONTROLES;
if (!aLancer.length) { console.error('Controle inconnu : ' + arg + '  (voir --liste)'); process.exit(2); }

let echecs = 0;
console.log(pages.length + ' pages, ' + toutesLesImages().length + ' images\n');
for (const c of aLancer) {
  let pbs;
  try { pbs = c.run(); }
  catch (e) { pbs = ['le controle a leve une erreur : ' + e.message]; }
  if (!pbs.length) console.log('  ok      ' + c.titre);
  else {
    echecs++;
    console.log('  ECHEC   ' + c.titre);
    for (const p of pbs.slice(0, 12)) console.log('            ' + p);
    if (pbs.length > 12) console.log('            … et ' + (pbs.length - 12) + ' autres');
  }
}
console.log('\n' + (echecs ? echecs + ' controle(s) en echec' : 'tous les controles passent'));
process.exit(echecs ? 1 : 0);
