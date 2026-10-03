#!/usr/bin/env node
/**
 * Met a jour le nombre d'avis Google partout ou le site l'ecrit en dur.
 *
 *   node tools/maj-avis.js        affiche le nombre actuel, emplacement par emplacement
 *   node tools/maj-avis.js 25     le porte a 25 partout
 *
 * Pourquoi ce script existe
 * -------------------------
 * Le site est statique : rien ne lit les avis chez Google. Le nombre est ecrit
 * a cinq endroits — quatre sur l'accueil, et la pastille du pied sur les 67
 * pages. La liste tenue a la main dans AGENTS.md en annoncait deux, puis
 * quatre ; l'occurrence visible du hero n'y a jamais figure. Une liste qu'on
 * recopie se perime, celle-ci est donc la seule : le controle `avis` de
 * controle.js importe EMPLACEMENTS d'ici.
 *
 * Ce que le script ne fait pas
 * ----------------------------
 * Il ne touche JAMAIS a la note (5,0). Un avis a moins de cinq etoiles la
 * ferait passer a 4,9, et seul le proprietaire peut le confirmer : afficher
 * une note fausse est pire qu'afficher un nombre en retard. Les motifs
 * acceptent donc n'importe quelle note, et la laissent telle quelle.
 *
 * Il refuse d'ecrire si un emplacement est introuvable, ou s'il ne compte pas
 * le nombre d'occurrences attendu : un remaniement de la page aurait alors
 * deplace le texte, et une mise a jour partielle passerait pour complete.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');

// Chaque motif capture le nombre dans son groupe 2 ; les groupes 1 et 3 sont
// le texte qui l'entoure, recopie tel quel. `pages: 'toutes'` vaut pour les
// 67 pages, sinon la liste des fichiers. `fois` est le nombre d'occurrences
// attendu dans chaque fichier.
const EMPLACEMENTS = [
  { nom: 'hero, aria-label', pages: ['index.html'], fois: 1,
    motif: /(aria-label="\d,\d · )(\d+)( avis sur Google")/g },
  { nom: 'hero, texte visible', pages: ['index.html'], fois: 1,
    motif: /(<span class="hero-confiance__note"><strong>\d,\d<\/strong> · )(\d+)( avis<\/span>)/g },
  { nom: 'bloc avis, sous la note', pages: ['index.html'], fois: 1,
    motif: /(<span class="reviews__score-meta">)(\d+)( avis Google<\/span>)/g },
  { nom: 'bloc avis, lien', pages: ['index.html'], fois: 1,
    motif: /(Lire les )(\d+)( avis sur Google)/g },
  { nom: 'pied de page, pastille', pages: 'toutes', fois: 1,
    motif: /(Google \d,\d &middot; )(\d+)( avis<\/a>)/g },
];

const toutesLesPages = () =>
  fs.readdirSync(RACINE).filter(f => f.endsWith('.html')).sort();

const fichiersDe = e => (e.pages === 'toutes' ? toutesLesPages() : e.pages);

const lire = f => fs.readFileSync(path.join(RACINE, f), 'utf8');

/**
 * Releve chaque occurrence : [{ emplacement, fichier, nombres: [..] }].
 * Un fichier sans le bon nombre d'occurrences produit un probleme.
 */
function relever() {
  const releves = [], problemes = [];
  for (const e of EMPLACEMENTS) {
    for (const f of fichiersDe(e)) {
      const nombres = [...lire(f).matchAll(e.motif)].map(m => Number(m[2]));
      if (nombres.length !== e.fois)
        problemes.push(f + ' : ' + e.nom + ' — ' + nombres.length + ' occurrence(s), ' + e.fois + ' attendue(s)');
      releves.push({ emplacement: e.nom, fichier: f, nombres });
    }
  }
  return { releves, problemes };
}

module.exports = { EMPLACEMENTS, relever };

if (require.main !== module) return;

const arg = process.argv[2];
const { releves, problemes } = relever();

if (problemes.length) {
  console.error('Emplacements introuvables — rien n a ete ecrit :');
  for (const p of problemes) console.error('  ' + p);
  console.error('Mettre a jour EMPLACEMENTS dans tools/maj-avis.js avant de relancer.');
  process.exit(1);
}

const actuels = [...new Set(releves.flatMap(r => r.nombres))];

if (arg === undefined) {
  for (const e of EMPLACEMENTS) {
    const r = releves.filter(x => x.emplacement === e.nom);
    const v = [...new Set(r.flatMap(x => x.nombres))].join(', ');
    console.log('  ' + e.nom.padEnd(26) + v + (r.length > 1 ? '  (' + r.length + ' pages)' : ''));
  }
  console.log(actuels.length === 1 ? '\nNombre actuel : ' + actuels[0]
    : '\nINCOHERENT : plusieurs nombres coexistent (' + actuels.join(', ') + ')');
  process.exit(actuels.length === 1 ? 0 : 1);
}

if (!/^[1-9]\d{0,3}$/.test(arg)) {
  console.error('Nombre invalide : ' + arg + ' — attendu un entier positif, par exemple 25.');
  process.exit(1);
}
const nouveau = Number(arg);

if (actuels.length === 1 && nouveau < actuels[0])
  console.warn('Attention : ' + nouveau + ' est inferieur au nombre actuel (' + actuels[0] + '). Un avis supprime chez Google ? Ecrit quand meme.');

const fichiers = [...new Set(EMPLACEMENTS.flatMap(fichiersDe))];
let modifies = 0;
for (const f of fichiers) {
  const avant = lire(f);
  let apres = avant;
  for (const e of EMPLACEMENTS) {
    if (!fichiersDe(e).includes(f)) continue;
    apres = apres.replace(e.motif, (m, a, n, b) => a + nouveau + b);
  }
  if (apres !== avant) { fs.writeFileSync(path.join(RACINE, f), apres, 'utf8'); modifies++; }
}

console.log('Avis : ' + actuels.join(', ') + ' -> ' + nouveau + ' — ' + modifies + ' fichier(s) modifie(s).');
console.log('La note n a pas ete touchee. Relancer ensuite : node tools/controle.js avis');
