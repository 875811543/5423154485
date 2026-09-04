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
      // L'AVIF a ete ajoute au site apres coup : sans lui dans cette liste, le
      // controle « orphelins » restait aveugle a tout un format, et un fichier
      // genere mais jamais reference passait inapercu.
      else if (/\.(png|webp|jpe?g|avif)$/i.test(e.name)) out.push(p.replace(/\\/g, '/'));
    }
  })('images');
  return out;
}

/* ------------------------------------------------------------------ *
 *  Les controles
 * ------------------------------------------------------------------ */

const CONTROLES = [

{ nom: 'entete-pied', titre: 'En-tete et pied de page identiques sur toutes les pages',
  run() {
    const pbs = [];
    for (const [nom, motif] of [['en-tete', /<header class="site-header"[\s\S]*?<\/header>/],
                                ['pied', /<footer class="site-footer"[\s\S]*?<\/footer>/]]) {
      const vus = new Map();
      for (const f of pages) {
        const m = lire(f).match(motif);
        if (!m) { pbs.push(nom + ' absent de ' + f); continue; }
        // aria-current="page" marque le lien de la page courante : il DOIT
        // differer d'une page a l'autre, c'est sa raison d'etre. On le retire
        // avant de comparer, sinon la regle « mobilier identique » interdirait
        // de signaler la page active — deux exigences justes qui s'annulent.
        const normalise = m[0].replace(/ aria-current="page"/g, '');
        const k = crypto.createHash('md5').update(normalise).digest('hex').slice(0, 8);
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
    // Les liens internes sont sans extension (le .htaccess sert page.html
    // quand on demande /page) : une cible resout donc soit telle quelle,
    // soit avec .html ajoute. « ./ » designe l'accueil.
    // « ./ » et « / » designent l'accueil. Le second vient de la balise
    // <base> de la page 404 ; sans ce cas explicite, il ne passait que par
    // accident, fs.existsSync('/') renvoyant vrai sous Windows parce que « / »
    // y designe la racine du disque.
    const resout = c => (c === './' || c === '/') ? fs.existsSync('index.html')
      : fs.existsSync(c) || fs.existsSync(c + '.html');
    return [...cibles].filter(c => !resout(c)).map(c => 'cible absente : ' + c);
  }},

{ nom: 'octets', titre: 'Ni CRLF, ni BOM, ni caracteres mal encodes',
  run() {
    // Deux hasards propres au developpement sous Windows, invisibles a tout
    // test de rendu et qui ne se manifestent qu'une fois le fichier servi.
    //
    // core.autocrlf vaut true sur ce poste : sans le .gitattributes qui
    // impose eol=lf, chaque checkout produirait des CRLF — y compris dans le
    // .htaccess, ou selon la configuration d'Apache le retour chariot est
    // compte comme faisant partie de la valeur d'une directive. Ce controle
    // existe parce qu'un seul fichier protege aujourd'hui contre cela.
    //
    // Le BOM, lui, fait basculer certains navigateurs en mode de
    // compatibilite quand il precede <!DOCTYPE>, invalide la premiere regle
    // d'une feuille CSS, et empeche l'analyse d'un JSON.
    const pbs = [];
    const textes = [];
    (function marche(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.name === '.git' || e.name === 'node_modules') continue;
        const p = (d === '.' ? '' : d + '/') + e.name;
        if (e.isDirectory()) marche(p);
        else if (/\.(html|css|js|json|xml|txt|webmanifest)$/i.test(e.name) || e.name === '.htaccess')
          textes.push(p);
      }
    })('.');

    // Suites d'octets typiques d'un texte UTF-8 relu comme du latin-1 puis
    // reecrit : « A tilde, e accent » la ou il devrait y avoir « e accent ».
    // Le texte reste a peu pres lisible, et on ne s'en apercoit qu'en relisant
    // vraiment la page. Des dizaines de fichiers de ce depot sont reecrits par
    // script a chaque session.
    //
    // Le motif est construit par codes de caracteres, et non ecrit en clair :
    // sinon ce fichier contiendrait lui-meme les suites qu'il traque, et le
    // controle se signalerait tout seul — ce qui est arrive.
    const C3 = String.fromCharCode(0xC3);     // A tilde
    const C2 = String.fromCharCode(0xC2);     // A circonflexe
    const suffixes = [0xA9, 0xA8, 0xAA, 0xA0, 0xA7, 0xB9, 0xB4, 0xAE, 0xBB]
      .map(x => String.fromCharCode(x)).join('');
    const mojibake = new RegExp('[' + C3 + C2 + '][' + suffixes + ']');

    // Une entite doublement echappee s'affiche litteralement : le visiteur lit
    // « et-commercial n b s p point-virgule » dans le texte de la page.
    const doubleEchappee = new RegExp('&' + 'amp;(nbsp|amp|lt|gt|quot|eacute|egrave|agrave'
      + '|ccedil|rsquo|laquo|raquo|hellip|mdash|ndash|euro);');

    for (const f of textes) {
      const b = fs.readFileSync(f);
      if (b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF)
        pbs.push(f + ' : commence par un BOM');
      for (let i = 0; i + 1 < b.length; i++)
        if (b[i] === 0x0D && b[i + 1] === 0x0A) { pbs.push(f + ' : fins de ligne CRLF'); break; }

      const s = b.toString('utf8');
      const m = s.match(mojibake);
      if (m) pbs.push(f + ' : caracteres mal encodes, autour de « ' + m[0] + ' »');
      const d = s.match(doubleEchappee);
      if (d) pbs.push(f + ' : entite doublement echappee « ' + d[0] + ' », affichee telle quelle');

      // Une lettre accentuee ecrite en entite numerique — « b&#226;ti » pour
      // « bâti » — s'affiche correctement mais rend la source illisible, et
      // detonne au milieu de milliers d'accents ecrits en clair. C'est un
      // residu d'outil d'edition. On ne vise que la plage latine accentuee :
      // les entites numeriques d'espaces fines ou de symboles restent
      // legitimes.
      if (/\.html$/i.test(f)) {
        const num = s.match(/&#(1[9-9][2-9]|2[0-5][0-9]|338|339|376);/);
        if (num) pbs.push(f + ' : lettre accentuee en entite numerique « ' + num[0]
          + ' » = « ' + String.fromCharCode(+num[1]) + ' »');
      }
    }
    if (!fs.existsSync('.gitattributes'))
      pbs.push('.gitattributes absent : rien n\'empeche plus les CRLF au checkout');
    return pbs;
  }},

{ nom: 'casse', titre: 'La casse des chemins correspond aux fichiers reels',
  run() {
    // Windows resout les chemins sans tenir compte de la casse, Linux la
    // respecte. Un lien vers « Images/Logo.png » alors que le fichier est
    // « images/logo.png » fonctionne en developpement et renvoie 404 sur le
    // serveur. Le controle « cibles » ne peut pas le voir : fs.existsSync est
    // insensible a la casse sous Windows, donc il valide les deux.
    //
    // On compare donc les chaines a la liste reelle des fichiers.
    //
    // Les attributs content= sont exclus a dessein : un titre comme
    // « Contact | Devis gratuit » y commence par un mot qui ressemble a un nom
    // de page, et les inclure produisait quatre faux positifs.
    const reels = new Set();
    (function marche(d) {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        if (e.name === '.git' || e.name === 'node_modules') continue;
        const p = (d === '.' ? '' : d + '/') + e.name;
        if (e.isDirectory()) marche(p); else reels.add(p);
      }
    })('.');
    const parMinuscule = new Map();
    for (const f of reels) parMinuscule.set(f.toLowerCase(), f);

    const pbs = [];
    const vus = new Set();
    for (const f of pages)
      for (const m of lire(f).matchAll(/(?:href|src|srcset)="([^"]+)"/g))
        for (const brut of m[1].split(',').map(x => x.trim().split(' ')[0])) {
          const cible = brut.replace(/[?#].*$/, '');
          if (!cible || /^(https?:|mailto:|tel:|data:|#|\/)/.test(cible)) continue;
          if (cible === './') continue;
          for (const cand of [cible, cible + '.html']) {
            if (reels.has(cand)) break;
            const vrai = parMinuscule.get(cand.toLowerCase());
            if (vrai) {
              const cle = cand + '|' + vrai;
              if (!vus.has(cle)) {
                vus.add(cle);
                pbs.push(f + ' : ecrit « ' + cand + ' », fichier « ' + vrai + ' »');
              }
              break;
            }
          }
        }

    // deux fichiers ne differant que par la casse : impossible a servir
    const vusMin = new Map();
    for (const f of reels) {
      const k = f.toLowerCase();
      if (vusMin.has(k)) pbs.push('deux fichiers ne different que par la casse : ' + vusMin.get(k) + ' et ' + f);
      else vusMin.set(k, f);
    }
    return pbs;
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
      // Le JSON-LD porte du texte deja decode, le HTML porte des entites :
      // sans les decoder ici, toute reponse contenant une espace insecable
      // est declaree absente alors qu'elle est bien presente.
      const entites = t => t
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
        .replace(/&#39;|&rsquo;/g, '\u2019')
        .replace(/&laquo;|&raquo;|&quot;/g, '"');
      const visible = entites(sansScripts(src).replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ');
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
              const debut = entites(String(t)).replace(/\s+/g, ' ').trim().slice(0, 45);
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

{ nom: 'identifiants', titre: 'Identifiants uniques, references aria et ancres resolues',
  run() {
    // Un identifiant en double casse label[for], aria-labelledby et les liens
    // de fragment : le navigateur ne retient que le premier, en silence. C'est
    // le defaut classique de la generation de pages depuis un gabarit — dix
    // pages de ce site ont ete produites ainsi.
    //
    // Rien de tout cela ne se voit au rendu : Chrome repare et affiche.
    const pbs = [];
    for (const f of pages) {
      const s = sansScripts(lire(f));

      const vus = new Map();
      for (const m of s.matchAll(/\sid="([^"]+)"/g))
        vus.set(m[1], (vus.get(m[1]) || 0) + 1);
      for (const [id, n] of vus)
        if (n > 1) pbs.push(f + ' : identifiant « ' + id + ' » declare ' + n + ' fois');

      for (const attr of ['aria-labelledby', 'aria-describedby', 'aria-controls'])
        for (const m of s.matchAll(new RegExp('\\s' + attr + '="([^"]+)"', 'g')))
          for (const id of m[1].split(/\s+/).filter(Boolean))
            if (!vus.has(id)) pbs.push(f + ' : ' + attr + ' pointe vers « ' + id + ' », qui n\'existe pas');

      for (const m of s.matchAll(/<label[^>]*\sfor="([^"]+)"/g))
        if (!vus.has(m[1])) pbs.push(f + ' : label for="' + m[1] + '" sans champ correspondant');

      for (const m of s.matchAll(/href="#([^"]+)"/g))
        if (!vus.has(m[1])) pbs.push(f + ' : ancre #' + m[1] + ' sans cible');
    }
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

{ nom: 'liens-externes', titre: 'Tout lien ouvrant un onglet porte rel="noopener"',
  run() {
    // Sans noopener, la page ouverte recoit un window.opener utilisable pour
    // rediriger l'onglet d'origine vers une page qu'elle choisit. Les
    // navigateurs recents l'impliquent pour target="_blank", mais pas tous, et
    // la protection saute des qu'un rel explicite est pose sans noopener.
    //
    // Ce controle reste hors ligne : verifier que les liens repondent demande
    // le reseau, ce qui rendrait tools/controle.js lent et intermittent alors
    // qu'il doit pouvoir tourner a chaque modification. La joignabilite se
    // verifie a part, ponctuellement.
    const pbs = [];
    for (const f of pages)
      for (const m of lire(f).matchAll(/<a\b([^>]*)>/g)) {
        const attrs = m[1];
        if (!/target="_blank"/.test(attrs)) continue;
        const rel = (attrs.match(/rel="([^"]*)"/) || [])[1] || '';
        if (!/\bnoopener\b/.test(rel)) {
          const href = (attrs.match(/href="([^"]*)"/) || [])[1] || '(sans href)';
          pbs.push(f + ' : target="_blank" sans noopener — ' + href.slice(0, 70));
        }
      }
    return pbs;
  }},

{ nom: 'sitemap', titre: 'Le sitemap decrit exactement les pages indexables',
  run() {
    // Le sitemap a ete edite a chaque ajout de page, a la main ou par script.
    // Une page indexable oubliee n'est pas crawlee ; une page en noindex qui y
    // figure envoie deux consignes contradictoires a Google.
    //
    // Un controle du sitemap existait deja ici, mais son motif contenait une
    // concatenation JavaScript non evaluee : il ne pouvait rien matcher. Du
    // code mort qui se donnait l'air d'un controle. Celui-ci est eprouve.
    const sm = lire('sitemap.xml');
    const declarees = [...sm.matchAll(/<loc>https:\/\/dezinsect-corse\.fr\/([^<]*)<\/loc>/g)]
      .map(m => m[1]);
    const ensemble = new Set(declarees);
    const pbs = [];

    const vus = new Set();
    for (const u of declarees) {
      if (vus.has(u)) pbs.push('url en double dans le sitemap : /' + u);
      vus.add(u);
    }

    const slug = f => f === 'index.html' ? '' : f.replace(/\.html$/, '');
    const fichiers = new Set(pages.map(slug));
    for (const u of ensemble)
      if (!fichiers.has(u)) pbs.push('url au sitemap sans fichier : /' + u);

    for (const f of pages) {
      const noindex = /<meta name="robots"[^>]*noindex/i.test(lire(f));
      const present = ensemble.has(slug(f));
      if (!noindex && !present) pbs.push(f + ' : indexable mais absente du sitemap');
      if (noindex && present) pbs.push(f + ' : en noindex mais presente au sitemap');
    }
    return pbs;
  }},

{ nom: 'doublons', titre: 'Aucune section entiere recopiee d une page a l autre',
  run() {
    // L'article de saisonnalite d'actualites.html avait ete ecrit en copiant
    // le bloc equivalent d'anti-nuisibles-costa-verde.html : quatre phrases
    // identiques mot pour mot entre deux pages visant toutes deux la Corse.
    //
    // On ne compare que le corps editorial — l'en-tete, le pied, la nav et la
    // barre d'appel sont identiques par construction.
    //
    // Le critere n'est pas le nombre de phrases partagees mais leur nature.
    // Une premiere version de ce controle comptait les phrases communes et
    // declenchait a 5 : elle ne rattrapait pas le decalque d'actualites.html,
    // qui n'en partageait que 4. Compter plus bas aurait fait echouer les
    // pages nuisibles, qui partagent legitimement leurs blocs de navigation.
    //
    // On ecarte donc d'abord les phrases presentes sur MOBILIER pages ou plus
    // — a ce stade de diffusion, une phrase est du mobilier de site, pas du
    // contenu — puis on signale toute paire qui en partage encore SEUIL.
    const MOBILIER = 4;
    const SEUIL = 3;
    const corps = f => {
      let s = lire(f);
      const d = s.indexOf('<main'), fin = s.lastIndexOf('</main>');
      if (d === -1 || fin === -1) return '';
      return s.slice(d, fin)
        .replace(/<script[\s\S]*?<\/script>/g, '')
        .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
        .replace(/<nav class="breadcrumb"[\s\S]*?<\/nav>/g, ' ')
        .replace(/<footer class="contact-footer"[\s\S]*?<\/footer>/g, ' ');
    };
    const phrases = h => h.replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&[a-z]+;/g, ' ')
      .replace(/\s+/g, ' ').trim()
      .split(/(?<=[.!?])\s+/)
      .map(p => p.trim().toLowerCase().replace(/[«»"'\u2019,;:()–—-]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter(p => p.split(' ').length >= 12);

    const par = pages.map(f => [f, new Set(phrases(corps(f)))]);

    const diffusion = new Map();
    for (const [, ps] of par) for (const p of ps)
      diffusion.set(p, (diffusion.get(p) || 0) + 1);
    for (const [, ps] of par) for (const p of [...ps])
      if (diffusion.get(p) >= MOBILIER) ps.delete(p);

    const pbs = [];
    for (let i = 0; i < par.length; i++) for (let j = i + 1; j < par.length; j++) {
      let n = 0;
      for (const p of par[i][1]) if (par[j][1].has(p)) n++;
      if (n >= SEUIL)
        pbs.push(par[i][0] + ' et ' + par[j][0] + ' partagent ' + n + ' phrases entieres');
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

,

{ nom: 'formulaires', titre: 'Les deux formulaires sont identiques et couvrent les services vendus',
  run() {
    // Le site porte deux formulaires, sur l'accueil et sur contact. Ils ont
    // diverge sans que rien ne le signale : la liste des services omettait les
    // moustiques, pourtant vendus, et la demande arrivait en « Autre demande »,
    // donc sans qualification. Deux copies d'une meme chose finissent toujours
    // par diverger si rien ne les compare.
    const pbs = [];
    const porteurs = pages.filter(p => /<form[\s\S]*?web3forms/i.test(lire(p)));
    if (porteurs.length < 2) return pbs;   // un seul formulaire : rien a comparer

    const signature = p => {
      const s = lire(p);
      const champs = (s.match(/<(?:input|select|textarea)[^>]*name="([^"]+)"/g) || [])
        .map(x => (x.match(/name="([^"]+)"/) || [])[1]).sort().join(',');
      const options = (s.match(/<option[^>]*>[^<]*/g) || [])
        .map(x => x.replace(/.*>/, '').trim()).join('|');
      const cle = (s.match(/name="access_key"[^>]*value="([^"]+)"/) || [])[1] || '';
      return { champs, options, cle };
    };
    const ref = signature(porteurs[0]);
    for (const p of porteurs.slice(1)) {
      const s = signature(p);
      for (const k of ['champs', 'options', 'cle'])
        if (s[k] !== ref[k])
          pbs.push(p + ' : ' + k + ' differe de ' + porteurs[0] + '\n            '
            + porteurs[0] + ' : ' + ref[k] + '\n            ' + p + ' : ' + s[k]);
    }

    // Un service vendu mais absent du menu deroulant arrive sans qualification.
    const opts = (lire(porteurs[0]).match(/<option[^>]*>[^<]*/g) || [])
      .map(x => x.replace(/.*>/, '').trim().toLowerCase()).join(' ');
    const SERVICES = { 'guepes-et-frelons': 'frelons', deratisation: 'ratisation',
      'traitement-anti-termites': 'termites', desinsectisation: 'sinsectisation',
      'moustiques-corse': 'moustiques' };
    for (const [page, mot] of Object.entries(SERVICES))
      if (pages.includes(page + '.html') && !opts.includes(mot))
        pbs.push(porteurs[0] + ' : ' + page + ' est un service du site, absent du menu deroulant');

    return pbs;
  }}

,

{ nom: 'nom-accessible', titre: 'Le texte visible est contenu dans le nom accessible',
  run() {
    // Critere 2.5.3 des WCAG, niveau A. Quand un lien porte un aria-label, ce
    // libelle REMPLACE son texte visible pour les technologies d'assistance.
    // Si le texte affiche n'y figure pas, l'utilisateur en commande vocale
    // prononce ce qu'il lit et rien ne se declenche.
    //
    // Dix-huit liens du site etaient dans ce cas, tous des boutons d'appel :
    // « Expertise & Devis : 06 85 75 30 40 » annonce comme « Appeler DEZINSECT
    // CORSE au 06 85 75 30 40 ». Ecrire un aria-label plus descriptif que le
    // texte visible est le reflexe naturel, et c'est l'erreur.
    //
    // La comparaison se fait sur la source telle quelle, entites comprises :
    // le texte visible « Expertise &amp; Devis » n'est contenu dans l'attribut
    // que s'il y est ecrit de la meme facon.
    const pbs = [];
    for (const f of pages) {
      const s = lire(f).replace(/<script[\s\S]*?<\/script>/g, '');
      for (const m of s.matchAll(/<a\b[^>]*aria-label="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const visible = m[2].replace(/<[^>]+>/g, ' ').replace(/[\u2190\u2192]/g, '')
          .replace(/\s+/g, ' ').trim();
        if (!visible) continue;          // lien sans texte : l'aria-label est la seule source
        if (m[1].toLowerCase().includes(visible.toLowerCase())) continue;
        pbs.push(f + ' : « ' + visible.slice(0, 46) + ' » absent de « ' + m[1].slice(0, 56) + ' »');
      }
    }
    return pbs;
  }}

,

{ nom: 'a11y-structure', titre: 'Langue declaree, titres sans saut, images decrites',
  run() {
    const pbs = [];
    for (const f of pages) {
      const s = lire(f).replace(/<script[\s\S]*?<\/script>/g, '');

      // 1. Sans lang, la synthese vocale lit le francais a l'anglaise.
      const lang = s.match(/<html[^>]*\slang="([^"]*)"/);
      if (!lang || !/^fr/i.test(lang[1]))
        pbs.push(f + ' : langue absente ou non francaise (' + (lang ? lang[1] : 'aucun attribut') + ')');

      // 2. Un lecteur d'ecran navigue de titre en titre : un niveau saute
      // casse la carte de la page. Critere 1.3.1 des WCAG.
      const niv = [];
      for (const m of s.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/g))
        niv.push({ n: +m[1], t: m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() });
      if (niv.length && niv[0].n !== 1)
        pbs.push(f + ' : le premier titre est un h' + niv[0].n + ', pas un h1');
      for (let i = 1; i < niv.length; i++)
        if (niv[i].n > niv[i - 1].n + 1)
          pbs.push(f + ' : saut h' + niv[i - 1].n + ' vers h' + niv[i].n
            + ' avant « ' + niv[i].t.slice(0, 38) + ' »');

      // 3. Pour un lecteur d'ecran, une image n'existe que par son alt. Un alt
      // absent fait lire le nom du fichier ; un alt generique ne dit rien.
      for (const m of s.matchAll(/<img\b[^>]*>/g)) {
        const src = (m[0].match(/src="([^"]*)"/) || [])[1] || '?';
        const alt = m[0].match(/\salt="([^"]*)"/);
        if (!alt) { pbs.push(f + ' : image sans alt — ' + src.split('/').pop()); continue; }
        const t = alt[1].trim();
        if (!t) { pbs.push(f + ' : alt vide — ' + src.split('/').pop()); continue; }
        if (/^(image|photo|illustration|img|visuel)\b/i.test(t))
          pbs.push(f + ' : alt generique « ' + t.slice(0, 40) + ' » — ' + src.split('/').pop());
      }
    }
    return pbs;
  }}

,

{ nom: 'typographie', titre: 'Espace insecable devant les signes doubles et les guillemets',
  run() {
    // En francais, deux-points, point-virgule, point d'interrogation et point
    // d'exclamation se precedent d'une espace insecable, et les guillemets en
    // encadrent une. Avec une espace ordinaire, le navigateur coupe la ligne
    // juste avant le signe : le visiteur lit une ligne qui commence par « ? ».
    // Mesure a 320 px avant correction : onze coupures reelles.
    //
    // On n'examine que le texte hors balises : un deux-points d'attribut ou
    // d'URL n'est pas concerne. La regle exige une espace ORDINAIRE avant le
    // signe, ce qui exclut d'office les point-virgules d'entites — le « ; » de
    // &amp; est precede d'un « p », pas d'une espace.
    const pbs = [];
    for (const f of pages) {
      const src = lire(f);
      // decoupage strict sur les frontieres de balises
      let i = 0, dansScript = false;
      while (i < src.length) {
        const d = src.indexOf('<', i);
        const segment = d === -1 ? src.slice(i) : src.slice(i, d);
        if (!dansScript && segment) {
          for (const m of segment.matchAll(/ ([:;?!])(?=[\s]|$)/g))
            pbs.push(f + ' : espace ordinaire avant « ' + m[1] + ' » — «\u00a0'
              + segment.slice(Math.max(0, m.index - 34), m.index + 2).replace(/\s+/g, ' ').trim() + '\u00a0»');
          for (const m of segment.matchAll(/« | »/g))
            pbs.push(f + ' : guillemet sans insecable');
        }
        if (d === -1) break;
        const fin = src.indexOf('>', d);
        if (fin === -1) break;
        const balise = src.slice(d, fin + 1);
        if (/^<(script|style)\b/i.test(balise)) dansScript = true;
        if (/^<\/(script|style)>/i.test(balise)) dansScript = false;
        i = fin + 1;
      }
    }
    return pbs;
  }}

,

{ nom: 'metadonnees', titre: 'Title, description et canonical presents et uniques',
  run() {
    const pbs = [];
    const dec = v => v.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
    const champ = (h, re) => { const m = h.match(re); return m ? dec(m[1]).trim() : null; };
    const vus = { title: {}, description: {}, canonical: {} };

    for (const f of pages) {
      const h = lire(f).split('\n').join(' ');
      // une page en noindex n'a pas a porter de canonical : 404 et merci
      const noindex = /<meta name="robots"[^>]*noindex/.test(h);
      const v = {
        title: champ(h, /<title>([^<]*)</),
        description: champ(h, /<meta name="description" content="([^"]*)"/),
        canonical: champ(h, /<link rel="canonical" href="([^"]*)"/)
      };
      for (const k of ['title', 'description', 'canonical']) {
        if (!v[k]) { if (!(k === 'canonical' && noindex)) pbs.push(f + ' : pas de ' + k); continue; }
        (vus[k][v[k]] = vus[k][v[k]] || []).push(f);
      }
      // longueur affichee, entites decodees
      if (v.title && v.title.length > 70) pbs.push(f + ' : title de ' + v.title.length + ' signes affiches, tronque dans les resultats');
      if (v.description && v.description.length > 170) pbs.push(f + ' : description de ' + v.description.length + ' signes affiches, tronquee');
    }
    for (const k of ['title', 'description', 'canonical'])
      for (const [val, fs_] of Object.entries(vus[k]))
        if (fs_.length > 1) pbs.push(k + ' partage par ' + fs_.join(', ') + ' : « ' + val.slice(0, 60) + ' »');
    return pbs;
  }}

,

{ nom: 'maillage', titre: 'Chaque page est citee par une autre et reste a trois clics',
  run() {
    const pbs = [];
    const existe = new Set(pages);
    // servies autrement que par un lien : ErrorDocument, et la cible du formulaire
    const SANS_LIEN = new Set(['404.html', 'merci.html']);
    const liens = {}, entrants = {};

    for (const f of pages) {
      const h = sansScripts(lire(f));
      const s2 = new Set();
      for (const m of h.matchAll(/href="([^"#?:]+)"/g)) {
        let c = m[1].replace(/^[.][/]/, '');
        if (/^(https?:|mailto:|tel:)/.test(m[1])) continue;
        if (c === '' || c === 'index') c = 'index.html';   // le logo pointe « ./ »
        if (!c.endsWith('.html')) c += '.html';
        if (existe.has(c) && c !== f) s2.add(c);
      }
      liens[f] = [...s2];
      for (const c of s2) (entrants[c] = entrants[c] || new Set()).add(f);
    }

    for (const f of pages)
      if (!SANS_LIEN.has(f) && !(entrants[f] && entrants[f].size))
        pbs.push(f + ' : aucune page ne la cite, elle n existe que dans le sitemap');

    const prof = { 'index.html': 0 };
    const file = ['index.html'];
    while (file.length) {
      const n = file.shift();
      for (const c of liens[n] || []) if (!(c in prof)) { prof[c] = prof[n] + 1; file.push(c); }
    }
    for (const f of pages) {
      if (SANS_LIEN.has(f)) continue;
      if (!(f in prof)) pbs.push(f + ' : inatteignable depuis l accueil');
      else if (prof[f] > 3) pbs.push(f + ' : a ' + prof[f] + ' clics de l accueil');
    }
    return pbs;
  }}

,

{ nom: 'fichiers-cites', titre: 'Tout fichier cite existe reellement dans le depot',
  run() {
    const pbs = new Set();
    for (const f of pages) {
      const h = lire(f);
      for (const m of h.matchAll(/(?:src|srcset|href)="([^"]+[.](?:jpg|jpeg|png|webp|svg|ico|woff2|css|js))"/g))
        for (const c of m[1].split(',').map(x => x.trim().split(/\s+/)[0])) {
          if (!c || /^(https?:|data:)/.test(c)) continue;
          if (!fs.existsSync(c.split('?')[0])) pbs.add(c + ' : cite par ' + f + ', absent du depot');
        }
    }
    return [...pbs];
  }}

,

{ nom: 'sitemap-coherent', titre: 'Le sitemap declare exactement les pages indexables',
  run() {
    if (!fs.existsSync('sitemap.xml')) return ['sitemap.xml absent'];
    const pbs = [];
    const sm = lire('sitemap.xml');
    const fichier = u => {
      const p = u.replace(/^https?:[/][/][^/]+[/]/, '').replace(/[/]$/, '');
      return (p === '' ? 'index' : p) + '.html';
    };
    const declares = new Map([...sm.matchAll(/<loc>([^<]+)<[/]loc>/g)].map(m => [fichier(m[1]), m[1]]));
    const noindex = f => /<meta name="robots"[^>]*noindex/.test(lire(f));

    for (const [f, u] of declares) {
      if (!pages.includes(f)) pbs.push(u + ' : declaree au sitemap, page absente du depot');
      else if (noindex(f)) pbs.push(u + ' : declaree au sitemap alors que la page est en noindex');
    }
    for (const f of pages)
      if (!declares.has(f) && !noindex(f)) pbs.push(f + ' : indexable mais absente du sitemap');

    // le canonical doit designer la meme adresse que le sitemap
    for (const [f, u] of declares) {
      if (!pages.includes(f)) continue;
      const m = lire(f).match(/<link rel="canonical" href="([^"]+)"/);
      if (m && m[1].replace(/[/]$/, '') !== u.replace(/[/]$/, ''))
        pbs.push(f + ' : le sitemap dit ' + u + ', le canonical dit ' + m[1]);
    }
    return pbs;
  }}

,

{ nom: 'entite-entreprise', titre: 'L entreprise est declaree une seule fois et en entier',
  run() {
    const pbs = [];
    const TYPES = ['PestControlService', 'LocalBusiness', 'Organization', 'HomeAndConstructionBusiness'];
    const ID = 'https://dezinsect-corse.fr/#organisation';
    // Ce qui caracterise l'entreprise. Une declaration qui n'en porte qu'une
    // partie decrit une entreprise plus pauvre que la vraie.
    const REQUIS = ['name', 'address', 'telephone', 'geo', 'areaServed',
      'openingHoursSpecification', 'image', 'logo', 'description', 'hasCredential', 'sameAs'];

    const completes = [];   // { page, noeud, chemin }
    const parcourir = (o, ch, f) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(x => parcourir(x, ch, f)); return; }
      const t = [].concat(o['@type'] || '');
      if (t.some(x => TYPES.includes(x))) {
        const cles = Object.keys(o).filter(k => k !== '@type' && k !== '@id' && k !== '@context');
        if (cles.length) completes.push({ f, o, ch: ch || '(racine)' });
        else if (o['@id'] !== ID) pbs.push(f + ' : reference l entreprise par un @id inattendu — ' + o['@id']);
      }
      for (const k of Object.keys(o)) parcourir(o[k], ch ? ch + '.' + k : k, f);
    };

    for (const f of pages) {
      for (const m of lire(f).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
        let o; try { o = JSON.parse(m[1]); } catch (e) { continue; }
        parcourir(o, '', f);
      }
    }

    // 1. une seule declaration complete sur tout le site
    if (completes.length !== 1) {
      pbs.push(completes.length + ' declarations completes de l entreprise (attendu : 1)');
      const parPage = {};
      for (const c of completes) parPage[c.f] = (parPage[c.f] || 0) + 1;
      for (const f of Object.keys(parPage).slice(0, 6))
        pbs.push('    ' + f + ' : ' + parPage[f] + ' declaration(s)');
      if (Object.keys(parPage).length > 6) pbs.push('    … et ' + (Object.keys(parPage).length - 6) + ' autres pages');
    }

    // 2. elle porte le jeu complet, et elle porte le bon @id
    for (const c of completes.slice(0, 3)) {
      const manque = REQUIS.filter(k => !(k in c.o));
      if (manque.length) pbs.push(c.f + ' : declaration incomplete, manque ' + manque.join(', '));
      if (c.o['@id'] !== ID) pbs.push(c.f + ' : @id de l entreprise vaut ' + c.o['@id'] + ', attendu ' + ID);
    }

    // 3. l'areaServed de l'entite est un SUR-ENSEMBLE de celui de tous les
    //    Service. C'est ce defaut qui a coute le lot 1 : des pages de ville
    //    creees une a une ont declare des communes que l'entreprise ne
    //    revendiquait nulle part. Une page ajoutee demain le refera sans ce
    //    controle.
    if (completes.length === 1) {
      const zonesEntite = new Set([].concat(completes[0].o.areaServed || [])
        .map(a => typeof a === 'string' ? a : a.name));
      const manquantes = new Map();
      const zones = (o, f, dansService) => {
        if (!o || typeof o !== 'object') return;
        if (Array.isArray(o)) return o.forEach(x => zones(x, f, dansService));
        const t = [].concat(o['@type'] || '');
        const ici = dansService || t.includes('Service') || t.some(x => TYPES.includes(x));
        if (ici && o.areaServed)
          for (const a of [].concat(o.areaServed)) {
            const n = typeof a === 'string' ? a : a.name;
            if (n && !zonesEntite.has(n)) {
              if (!manquantes.has(n)) manquantes.set(n, new Set());
              manquantes.get(n).add(f);
            }
          }
        for (const k of Object.keys(o)) zones(o[k], f, ici);
      };
      for (const f of pages)
        for (const m of lire(f).matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))
          { let o; try { o = JSON.parse(m[1]); } catch (e) { continue; } zones(o, f, false); }
      for (const [n, fs_] of [...manquantes].slice(0, 8))
        pbs.push('commune « ' + n +' » declaree par ' + [...fs_].join(', ')
          + ' mais absente de l areaServed de l entreprise');
      if (manquantes.size > 8) pbs.push('… et ' + (manquantes.size - 8) + ' autres communes dans le meme cas');
    }

    // 4. aucune valeur contradictoire d'une declaration a l'autre
    if (completes.length > 1) {
      for (const k of REQUIS) {
        const vues = new Set(completes.map(c => JSON.stringify(c.o[k])));
        if (vues.size > 1) pbs.push('champ « ' + k + ' » : ' + vues.size + ' valeurs differentes selon la page');
      }
    }
    return pbs;
  }}

,

{ nom: 'tableaux', titre: 'Les pages comparatives portent un tableau semantique',
  run() {
    const pbs = [];
    // Les quatre comparaisons qu'un client fait vraiment avant d'appeler.
    const ATTENDUS = {
      'guepes-et-frelons.html': 'frelon asiatique / europeen / oriental',
      'deratisation.html': 'rat noir / surmulot / souris',
      'traitement-anti-termites.html': 'termite / capricorne / vrillette / merule',
      'cafards.html': 'blatte germanique / orientale'
    };

    for (const [f, quoi] of Object.entries(ATTENDUS)) {
      if (!pages.includes(f)) { pbs.push(f + ' : page absente du depot'); continue; }
      const h = lire(f);
      const tables = h.match(/<table[\s\S]*?<\/table>/g) || [];
      if (!tables.length) { pbs.push(f + ' : aucun tableau — comparaison attendue : ' + quoi); continue; }
      for (const t of tables) {
        if (!/<caption[\s>]/.test(t)) pbs.push(f + ' : tableau sans <caption>');
        if (!/<thead[\s>]/.test(t)) pbs.push(f + ' : tableau sans <thead>');
        const th = t.match(/<th\b[^>]*>/g) || [];
        if (!th.length) pbs.push(f + ' : tableau sans <th>');
        else if (th.some(x => !/scope=/.test(x)))
          pbs.push(f + ' : ' + th.filter(x => !/scope=/.test(x)).length + ' <th> sans attribut scope');
        // un nom latin, marque du fait verifiable
        if (!/<em>[A-Z][a-z]+ [a-z]+<\/em>/.test(t))
          pbs.push(f + ' : tableau sans nom scientifique — un tableau sans donnee verifiable ne se fait pas citer');
      }
      // debordement sur telephone
      const i2 = h.indexOf('<table');
      if (i2 !== -1 && !/table-wrap|overflow-x/.test(h.slice(Math.max(0, i2 - 400), i2)))
        pbs.push(f + ' : tableau hors conteneur defilant — deborde a 360 px');
    }
    return pbs;
  }}

,

{ nom: 'sitemap-genere', titre: 'Le sitemap est genere, pas ecrit a la main',
  run() {
    const pbs = [];
    const OUTIL = 'tools/build-sitemap.js';

    if (!fs.existsSync(OUTIL)) {
      pbs.push(OUTIL + ' absent : le sitemap est maintenu a la main');
    } else {
      // Le generateur doit etre idempotent et faire autorite : ce qu'il produit
      // doit etre exactement ce que porte le depot.
      let produit;
      try { produit = require(path.resolve(OUTIL)).construire(); }
      catch (e) { pbs.push(OUTIL + ' : ' + e.message.slice(0, 90)); }
      if (produit !== undefined) {
        const actuel = fs.existsSync('sitemap.xml') ? lire('sitemap.xml') : '';
        if (produit.trim() !== actuel.trim())
          pbs.push('sitemap.xml differe de ce que produit le generateur — il a ete edite a la main, ou le generateur n a pas ete relance');
      }
    }

    // Regle posee explicitement : aucune page indexable absente du sitemap.
    if (fs.existsSync('sitemap.xml')) {
      const sm = lire('sitemap.xml');
      for (const f of pages) {
        if (/<meta name="robots"[^>]*noindex/.test(lire(f))) continue;
        const slug = f === 'index.html' ? '' : f.replace(/\.html$/, '');
        const url = 'https://dezinsect-corse.fr/' + slug;
        if (!sm.includes('<loc>' + url + '</loc>'))
          pbs.push(f + ' : page indexable absente du sitemap');
      }
    }
    return pbs;
  }}

,

{ nom: 'formats-images', titre: 'Chaque picture sert AVIF, WebP et un repli, avec ses dimensions',
  run() {
    const pbs = new Set();
    for (const f of pages) {
      for (const m of lire(f).matchAll(/<picture>([\s\S]*?)<\/picture>/g)) {
        const bloc = m[1];
        const img = (bloc.match(/<img\b[^>]*>/) || [])[0];
        if (!img) { pbs.add(f + ' : <picture> sans <img> de repli'); continue; }

        const src = (img.match(/src="([^"]+)"/) || [])[1];
        if (!src) { pbs.add(f + ' : <img> sans src'); continue; }

        // 4. dimensions conservees
        if (!/\bwidth=/.test(img) || !/\bheight=/.test(img))
          pbs.add(src + ' : <img> sans width ou height (' + f + ')');

        // 1. les deux sources, dans le bon ordre
        const types = [...bloc.matchAll(/<source[^>]*type="image\/(avif|webp)"/g)].map(x => x[1]);
        if (!types.includes('avif')) pbs.add(src + ' : aucune source AVIF (' + f + ')');
        if (!types.includes('webp')) pbs.add(src + ' : aucune source WebP (' + f + ')');
        if (types.includes('avif') && types.includes('webp')
            && types.indexOf('avif') > types.indexOf('webp'))
          pbs.add(src + ' : AVIF declare apres WebP, il ne sera jamais servi (' + f + ')');

        // 2 et 3. tous les fichiers REELLEMENT references existent.
        //    On ne devine pas les noms depuis le src de l'<img> : un <picture>
        //    peut servir les variantes -760 en source et le pleine taille en
        //    repli, auquel cas les deux jeux n'ont pas le meme nom de base.
        //    Deviner produisait ici une fausse alerte.
        if (!fs.existsSync(src)) pbs.add(src + ' : repli absent du depot (' + f + ')');
        for (const m2 of bloc.matchAll(/<source[^>]*srcset="([^"]+)"/g))
          for (const c of m2[1].split(',').map(x => x.trim().split(/\s+/)[0]))
            if (c && !fs.existsSync(c.split('?')[0]))
              pbs.add(c + ' : source declaree mais fichier absent (' + f + ')');
      }
    }
    return [...pbs];
  }}

,

{ nom: 'nav-courante', titre: 'La page active est signalee dans les menus, et le pied porte une address',
  run() {
    const pbs = [];
    for (const f of pages) {
      const h = lire(f);
      const slug = f === 'index.html' ? './' : f.replace(/\.html$/, '');

      // Les deux menus, isoles chacun de leur cote.
      const menus = [
        ['entete', (h.match(/<nav class="site-nav"[\s\S]*?<\/nav>/) || [''])[0]],
        ['mobile', (h.match(/<div class="mobile-menu"[\s\S]*?<\/div>\s*<\/div>/) || [''])[0]]
      ];

      const cible = m => m.includes('href="' + slug + '"');
      for (const [nom, m] of menus) {
        if (!m) { pbs.push(f + ' : menu ' + nom + ' introuvable'); continue; }
        const n = (m.match(/aria-current="page"/g) || []).length;
        if (cible(m) && n === 0) pbs.push(f + ' : menu ' + nom + ' — la page y figure mais rien ne la signale comme active');
        if (n > 1) pbs.push(f + ' : menu ' + nom + ' — ' + n + ' liens marques « page courante », il n en faut qu un');
        if (!cible(m) && n > 0) pbs.push(f + ' : menu ' + nom + ' — un lien est marque actif alors que la page n y figure pas');
      }

      // Le pied de page decrit des coordonnees : c'est ce que <address> designe.
      if (!/<address[\s>]/.test(h)) pbs.push(f + ' : bloc de coordonnees du pied sans <address>');
    }
    return pbs;
  }}

,

{ nom: 'pas-de-js-en-ligne', titre: 'Aucun JavaScript en ligne dans le HTML',
  run() {
    const pbs = [];
    for (const f of pages) {
      const h = lire(f);

      // 1. gestionnaires en ligne
      for (const m of h.matchAll(/\s(on[a-z]+)="/g)) {
        const ligne = h.slice(0, m.index).split('\n').length;
        pbs.push(f + ':' + ligne + ' : gestionnaire en ligne ' + m[1] + ' — interdit par la CSP');
      }

      // 2. <script> sans src, hors donnees structurees
      for (const m of h.matchAll(/<script\b([^>]*)>/g)) {
        const attrs = m[1];
        if (/\bsrc=/.test(attrs)) continue;
        if (/type="application\/ld\+json"/.test(attrs)) continue;   // donnees, pas code
        const ligne = h.slice(0, m.index).split('\n').length;
        pbs.push(f + ':' + ligne + ' : <script> en ligne — interdit par la CSP');
      }

      // 3. pseudo-protocole javascript:
      if (/href="javascript:/i.test(h)) pbs.push(f + ' : href="javascript:" — interdit par la CSP');
    }
    return pbs;
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
