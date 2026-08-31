#!/usr/bin/env node
/*
 * Aligne les <lastmod> du sitemap sur la derniere modification reelle de
 * chaque page, telle que git la connait.
 *
 *   node tools/sitemap-dates.js            affiche ce qui serait change
 *   node tools/sitemap-dates.js --ecrire   applique
 *
 * Pourquoi ce n'est pas un controle de tools/controle.js : la date git d'un
 * fichier change au moment meme ou l'on commite. Un controle comparant les
 * deux echouerait systematiquement juste apres chaque commit, puisque le
 * sitemap aurait ete ecrit avant. C'est donc une etape a passer AVANT de
 * televerser, pas un garde-fou permanent.
 *
 * Google traite lastmod comme un indice pour decider quand repasser. Annoncer
 * une date d'il y a une semaine sur une page reecrite le jour meme retarde sa
 * reindexation — precisement pour le travail le plus recent.
 */

'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const RACINE = path.resolve(__dirname, '..');
process.chdir(RACINE);

const ECRIRE = process.argv.includes('--ecrire');
const F = 'sitemap.xml';

let sm = fs.readFileSync(F, 'utf8');
const eol = sm.includes('\r\n') ? '\r\n' : '\n';

const dateGit = fichier => {
  try {
    const d = cp.execSync('git log -1 --format=%ad --date=short -- "' + fichier + '"',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
  } catch (e) { return null; }
};

const motif = /(<loc>https:\/\/dezinsect-corse\.fr\/([^<]*)<\/loc>\s*<lastmod>)([^<]*)(<\/lastmod>)/g;

const changements = [];
sm = sm.replace(motif, (tout, avant, slug, date, apres) => {
  const fichier = (slug === '' ? 'index' : slug) + '.html';
  if (!fs.existsSync(fichier)) return tout;
  const reel = dateGit(fichier);
  if (!reel || reel === date) return tout;
  changements.push([fichier, date, reel]);
  return avant + reel + apres;
});

if (!changements.length) {
  console.log('  toutes les dates du sitemap sont a jour');
  process.exit(0);
}

for (const [f, avant, apres] of changements)
  console.log('  ' + f.replace('.html', '').padEnd(42) + avant + '  ->  ' + apres);
console.log('\n  ' + changements.length + ' date(s) ' + (ECRIRE ? 'mises a jour' : 'a mettre a jour'));

if (ECRIRE) {
  fs.writeFileSync(F, sm);
  console.log('  sitemap.xml ecrit');
} else {
  console.log('  relancer avec --ecrire pour appliquer');
}
