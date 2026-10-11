/**
 * Controle « curatif-bois » : le traitement curatif des bois attaques n'est pas
 * une prestation de l'entreprise. Seul le PREVENTIF charpente est propose.
 *
 * Regle du proprietaire, 11 octobre 2026. Le site presentait pourtant le curatif
 * du bois en une quinzaine d'endroits : « notre traitement curatif du bois » (un
 * lien), « bûchage, injection sous pression » dans cinq fiches de l'outil
 * d'identification marquees « Nous traitons ce nuisible », un `Service` JSON-LD
 * « Traitement Xylophages », « injection des charpentes » sur trois pages de
 * secteur. Aucun n'etait faux au sens strict : ils disaient « notre » la ou il
 * fallait « nous ne le faisons pas ».
 *
 * Ce que le controle refuse, dans le texte visible ET dans le JSON-LD (l'en-tete
 * et le pied, qui portent les menus, sont ecartes) :
 *   1. une phrase qui associe « curatif » a un bois (charpente, bois, capricorne,
 *      vrillette, lyctus, xylophage, poutre) sans dire que nous ne le faisons pas ;
 *   2. « bûchage », partout ;
 *   3. une phrase qui associe « injection » a un bois sans parler de termites ;
 *      (« traitement curatif du bois » est refuse meme a cote d'un termite : c'est
 *      la phrase du lien qui renvoyait vers un curatif du bois qui n'existe pas) ;
 *   4. une fiche de l'outil d'identification pour un insecte du bois (capricorne,
 *      vrillettes, lyctus, hesperophane) qui ne soit pas « SUR APPEL » ;
 *   5. un `Service` JSON-LD sur le bois ou les xylophages dont le serviceType
 *      ne dise pas « preventif ».
 *
 * Ce qu'il laisse : les termites. Une phrase qui cite un termite, une station,
 * un piege, un appat ou une barriere est hors champ — les stations curatives
 * murales, les barrieres par injection dans les murs et le sol restent proposees.
 * Une phrase qui nie la prestation (« nous ne realisons pas le traitement
 * curatif ») passe aussi : c'est la formulation voulue.
 *
 * Eprouve sur l'etat d'avant le lot : voir la fonction `trouver`, appelee sur
 * les pages de HEAD~, elle retrouve les passages à reformuler.
 */
'use strict';

const BOIS = /(charpente|\bbois\b|boiseries|capricorne|vrillette|lyctus|xylophage|poutre)/i;
const NEG = /(ne r[ée]alisons pas|nous ne [a-zéèêàâîïôûç']+ pas|pas de (traitement )?curatif|ne rel[eè]ve(nt)? pas|n[’']est pas|non r[ée]alis|ne se (traite|rattrape)|ne r[ée]infeste)/i;
const TERMITE = /(termite|station|pi[eè]ge|app[aâ]t|barri[eè]re|termiticide)/i;
const FICHES_BOIS = ['fiche-capricorne', 'fiche-petite-vrillette', 'fiche-grosse-vrillette', 'fiche-lyctus', 'fiche-hesperophane'];

const nu = s => s
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;| /g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

function sansMobilier(h) {
  return h
    .replace(/<header class="site-header"[\s\S]*?<\/header>/, '')
    .replace(/<footer class="site-footer"[\s\S]*?<\/footer>/, '')
    .replace(/<div class="sticky-mobile-bar">[\s\S]*?<\/div>/, '');
}

/** Les morceaux de texte d'une page : balises de texte, meta, chaines du JSON-LD. */
function morceaux(h) {
  const out = [];
  const t = sansMobilier(h);
  for (const m of t.matchAll(/<(p|li|h[1-6]|summary|td|th|caption|figcaption|dd|dt|strong|em|small)\b[^>]*>([\s\S]*?)<\/\1>/g)) out.push(nu(m[2]));
  for (const m of t.matchAll(/<meta[^>]*content="([^"]*)"/g)) out.push(nu(m[1]));
  for (const m of t.matchAll(/"(?:text|name|description|headline|serviceType)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) out.push(nu(m[1]));
  return out;
}

function services(h) {
  const res = [];
  for (const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let o; try { o = JSON.parse(m[1]); } catch (e) { continue; }
    const marche = n => {
      if (Array.isArray(n)) return n.forEach(marche);
      if (n && typeof n === 'object') {
        if ([].concat(n['@type'] || '').includes('Service')) res.push(n);
        Object.values(n).forEach(marche);
      }
    };
    marche(o);
  }
  return res;
}

/** Renvoie la liste des problemes d'une page (nom de fichier + HTML). */
function trouver(f, h) {
  const pbs = [];
  const vus = new Set();
  for (const bloc of morceaux(h)) {
    for (const ph of bloc.split(/(?<=[.;!?])\s+/)) {
      if (vus.has(ph)) continue;
      const neg = NEG.test(ph), ter = TERMITE.test(ph);
      let motif = null;
      if (/b[uû]chage/i.test(ph) && !neg) motif = 'bûchage';
      else if (/curati(f|ve|fs|ves)[^.;]{0,25}\b(du|des|de la) (bois|charpentes?)/i.test(ph) && !neg) motif = 'traitement curatif du bois';
      else if (/curati(f|ve|fs|ves)\b/i.test(ph) && BOIS.test(ph) && !neg && !ter) motif = 'curatif + bois';
      else if (/\binject(ion|ions|er|ons|é|ée|ées|és)\b/i.test(ph) && BOIS.test(ph) && !neg && !ter) motif = 'injection + bois';
      if (motif) { vus.add(ph); pbs.push(f + ' : ' + motif + ' — « ' + ph.slice(0, 130) + (ph.length > 130 ? '…' : '') + ' »'); }
    }
  }
  if (f === 'identifier-nuisible.html') {
    for (const id of FICHES_BOIS) {
      const a = h.indexOf('id="' + id + '"');
      if (a < 0) { pbs.push(f + ' : fiche ' + id + ' introuvable'); continue; }
      const b = h.indexOf('</details>', a);
      const st = (h.slice(a, b).match(/class="ident-statut" data-statut="([^"]*)"/) || [])[1];
      if (st !== 'SUR APPEL') pbs.push(f + ' : ' + id + ' porte le statut « ' + st + ' » ; « SUR APPEL » attendu (le curatif du bois n\'est pas assure)');
    }
  }
  for (const s of services(h)) {
    const id = [s.name, s.serviceType].join(' ');
    if (BOIS.test(id) && !/termite/i.test(id) && !/pr[ée]venti/i.test(String(s.serviceType || '') + ' ' + String(s.name || ''))) {
      pbs.push(f + ' : Service JSON-LD « ' + (s.name || '') + ' » sur le bois sans « préventif » dans son nom ni son serviceType');
    }
  }
  return pbs;
}

function verifier(pages, lire) {
  const pbs = [];
  for (const f of pages) pbs.push(...trouver(f, lire(f)));
  return pbs;
}

module.exports = { verifier, trouver };
