/**
 * Controle des delais CHIFFRES : tout delai d'intervention promis en heures ou en
 * jours doit valoir « 24 h » (guepes et frelons) ou « 24 a 48 h » (autres
 * nuisibles) — la regle unique du 15 octobre 2026. Tout autre chiffre fait echouer.
 *
 * Complete le controle par formules (« par tournees », « delai realiste »…), qui ne
 * voyait pas une promesse chiffree differente : « sous 48 h », « sous 72 heures »,
 * « en 3 jours », « dans les 5 jours ».
 *
 * CE QUI EST UN DELAI. Une duree en heures, jours ou semaines (chiffres ou lettres :
 * « deux jours ») introduite par une marque de promesse — sous, en, dans, dans un
 * delai de, d'ici, moins de, « < », delai (d'intervention), intervention, urgence,
 * reponse, rappel. « 7j/7 » n'en est pas une.
 *
 * CE QUI NE L'EST PAS, ET EST EXCLU. Une promesse reconnue dont le voisinage (70
 * caracteres de chaque cote) parle d'autre chose qu'une intervention : temps d'action
 * d'un produit (« baisse d'activite en une a deux semaines apres traitement par
 * gel »), cycle des insectes (« de l'oeuf a l'adulte »), reconstitution d'une
 * population, validite d'un document, controles de pieges. Les durees en MOIS et en
 * ANS ne sont jamais lues comme des delais : « controles a 3, 6, 9 et 12 mois », « six
 * mois de validite », « dix ans ». La liste des mots d'exclusion est EXCLUS, plus bas :
 * un mot ajoute doit etre justifie par un cas reel.
 *
 * LIMITE. Une promesse sans marque (« delai 3 jours » est vue, « 3 jours maximum » non)
 * ou noyee dans un voisinage a mot d'exclusion passe. Le controle par formules et la
 * relecture couvrent le reste.
 */
'use strict';

const NUM = '(?:\\d+|une?|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|douze|quinze|vingt|trente)';
const PLAGE = NUM + '(?:\\s*(?:à|a|-|–|ou|et)\\s*' + NUM + ')?';
const UNITE = '(?:h|heures?|jours?|semaines?)(?![a-zà-ÿ])';
const PREP = "(?:sous(?: un délai de)?|en moins de|en|dans un délai de|dans les|dans|d.ici|moins de|au plus tard sous|délai(?: d.intervention)?(?: de| :)?|intervention(?: de| en| sous| :)?|urgence(?: de| en| sous| :)?|réponse(?: de| en| sous| :)?|rappel(?: de| en| sous| :)?|&lt;|<)";
const RE = new RegExp('(?:^|[^a-zà-ÿ0-9])' + PREP + '\\s*(' + PLAGE + ')\\s*(' + UNITE + ')', 'gi');
const EXCLUS = /(produit|gel\b|appât|effet|baisse|activité|cycle|génération|reconstitu|revenu|larve|œuf|oeuf|ponte|séchage|évacuation|rentrée|valab|validité|garantie|contrôle|piège|suivi|colonie|essaim|vendange|trempage|compromise|moustique|mouche|fumier|congeler|conservation|durée|à compter|semaines? après|loueur|locataire)/i;
const MOTS = { une: 1, un: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9, dix: 10, douze: 12, quinze: 15, vingt: 20, trente: 30 };
const valeur = s => (/^\d+$/.test(s) ? +s : MOTS[s.toLowerCase()]);

const nu = s => s.replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;| | /g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

/** Texte a lire dans une page : visible, chaines du JSON-LD, meta. Sans en-tete, pied ni barre d'appel. */
function texte(h) {
  const t = h
    .replace(/<header class="site-header"[\s\S]*?<\/header>/, '')
    .replace(/<footer class="site-footer"[\s\S]*?<\/footer>/, '')
    .replace(/<div class="sticky-mobile-bar">[\s\S]*?<\/div>/, '');
  const json = t.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
    (x, j) => ' ' + (j.match(/"(?:text|name|description)"\s*:\s*"(?:[^"\\]|\\.)*"/g) || []).join(' ') + ' ');
  const metas = [...t.matchAll(/<meta[^>]*content="([^"]*)"/g)].map(m => m[1]).join(' ');
  return nu(json + ' ' + metas);
}

/** Les promesses de delai d'un texte : { valide, exclu, extrait, contexte }. */
function analyser(txt) {
  const out = [];
  let m; RE.lastIndex = 0;
  while ((m = RE.exec(txt))) {
    const plage = m[1].split(/\s*(?:à|a|-|–|ou|et)\s*/).map(x => valeur(x.trim()));
    const heures = /^h/i.test(m[2]);
    const valide = heures && ((plage.length === 1 && plage[0] === 24) || (plage.length === 2 && plage[0] === 24 && plage[1] === 48));
    const ctx = txt.slice(Math.max(0, m.index - 70), m.index + m[0].length + 70);
    out.push({ valide, exclu: !valide && EXCLUS.test(ctx), extrait: m[0].trim(), contexte: ctx });
  }
  return out;
}

function verifier(pages, lire) {
  const pbs = [];
  for (const f of pages) {
    for (const r of analyser(texte(lire(f)))) {
      if (!r.valide && !r.exclu) pbs.push(f + ' : delai chiffre « ' + r.extrait + ' » — seuls « 24 h » (guepes et frelons) et « 24 a 48 h » (autres nuisibles) sont permis : « …' + r.contexte + '… »');
    }
  }
  return pbs;
}

module.exports = { verifier, analyser, texte };
