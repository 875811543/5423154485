/**
 * Verifie que toute page dont le CONTENU change dans le commit en cours
 * porte une date de mise a jour au jour meme — dans le JSON-LD comme dans la
 * mention visible.
 *
 *   node tools/verifie-dates.js            controle l'index (commit en cours)
 *   node tools/verifie-dates.js --essai    meme chose, sans code de sortie 1
 *
 * POURQUOI CE SCRIPT EXISTE, ET POURQUOI IL NE REJOUE PAS tools/controle.js
 * ------------------------------------------------------------------------
 * Le controle `articles-lexique` de tools/controle.js compare dateModified a
 * la date du dernier commit de fond, lue dans `git log`. Avant le commit,
 * cette date est encore celle du commit PRECEDENT : le controle passe. Elle
 * ne devient le jour meme qu'une fois le commit ecrit — et c'est seulement au
 * push suivant que l'ecart se voit.
 *
 * C'est exactement ce qui s'est produit trois fois : merule et moustiques le
 * 24 septembre 2026, capricorne le 26. A chaque fois le hook de pre-push a
 * refuse la publication, apres coup, sur un commit deja ecrit.
 *
 * Un hook de pre-commit qui se contenterait de relancer tools/controle.js ne
 * changerait donc rien : verifie, il passe au vert sur le cas meme qu'il est
 * cense attraper. Ce serait du code mort qui se donne l'air d'un controle.
 *
 * Ce script raisonne autrement : il compare la version HEAD du fichier a la
 * version mise en scene dans l'index, sans passer par `git log`. Si le
 * contenu propre differe, la date doit etre celle du jour, point.
 *
 * Pour outrepasser volontairement : git commit --no-verify
 */
'use strict';
const { execSync } = require('child_process');
const path = require('path');

const RACINE = path.resolve(__dirname, '..');
const ESSAI = process.argv.includes('--essai');

const MOIS = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];

const maintenant = new Date();
const AUJOURDHUI = maintenant.getFullYear() + '-'
  + String(maintenant.getMonth() + 1).padStart(2, '0') + '-'
  + String(maintenant.getDate()).padStart(2, '0');

const git = (cmd, brut) => execSync('git ' + cmd, {
  cwd: RACINE, encoding: brut ? 'buffer' : 'utf8',
  maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore']
});

/**
 * Le fichier reduit a son contenu propre : sans les blocs partages par toutes
 * les pages, sans les empreintes de cache. Meme normalisation que
 * tools/build-sitemap.js — si l'une des deux evolue, l'autre doit suivre.
 */
function contenuPropre(texte) {
  return texte
    .replace(/<header class="site-header"[\s\S]*?<\/header>/, '')
    .replace(/<footer class="site-footer"[\s\S]*?<\/footer>/, '')
    .replace(/<div class="sticky-mobile-bar">[\s\S]*?<\/div>/, '')
    .replace(/\?v=[0-9a-f]{8}/g, '')
    .replace(/\r\n/g, '\n')
    .trimEnd();
}

/**
 * La version d'un fichier a une revision donnee, ou null s'il n'y existe pas.
 * La revision vide designe l'index : `git show :fichier`. Passer ':' comme
 * revision produirait `::fichier`, que git rejette — et le script sautait
 * alors toutes les pages en silence, ce qui en faisait un controle mort.
 */
function version(rev, fichier) {
  try { return git('show "' + rev + ':' + fichier + '"'); }
  catch (e) { return null; }
}
const DANS_INDEX = '';

// --- les pages mises en scene dans ce commit --------------------------------
let stagees;
try {
  stagees = git('diff --cached --name-only --diff-filter=ACM')
    .split('\n').map(x => x.trim())
    .filter(f => /^[^/]+\.html$/.test(f));
} catch (e) {
  console.log('  verifie-dates : aucun index lisible, controle ignore');
  process.exit(0);
}

if (!stagees.length) process.exit(0);

const pbs = [];
for (const f of stagees) {
  const apres = version(DANS_INDEX, f);
  if (apres === null) continue;
  const avant = version('HEAD', f);

  // Une page nouvelle compte comme un changement de contenu.
  const change = avant === null || contenuPropre(avant) !== contenuPropre(apres);
  if (!change) continue;

  // La page porte-t-elle une date a tenir ? Beaucoup n'en ont pas.
  const json = apres.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/);
  const vis = apres.match(/<time class="maj-date" datetime="(\d{4}-\d{2}-\d{2})">([^<]*)<\/time>/);
  if (!json && !vis) continue;

  if (json && json[1] !== AUJOURDHUI)
    pbs.push(f + ' : "dateModified" vaut ' + json[1] + ', le contenu change aujourd hui (' + AUJOURDHUI + ')');

  if (vis) {
    if (vis[1] !== AUJOURDHUI)
      pbs.push(f + ' : la mention visible date du ' + vis[1] + ', le contenu change aujourd hui (' + AUJOURDHUI + ')');
    else {
      // La date lisible doit dire la meme chose que l'attribut.
      const attendu = maintenant.getDate() + ' ' + MOIS[maintenant.getMonth()] + ' ' + maintenant.getFullYear();
      const lu = vis[2].normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (lu !== attendu)
        pbs.push(f + ' : la mention visible affiche « ' + vis[2] + ' » mais son datetime dit ' + vis[1]);
    }
  }
}

if (!pbs.length) {
  if (stagees.length) console.log('  dates de mise a jour : coherentes');
  process.exit(0);
}

console.log('');
console.log('  COMMIT REFUSE — date de mise a jour non suivie');
for (const p of pbs) console.log('    ' + p);
console.log('');
console.log('  Le contenu principal d une page a change : sa date doit suivre,');
console.log('  dans le JSON-LD ET dans la mention visible, dans CE commit.');
console.log('  Sans quoi le hook de pre-push le refusera apres coup.');
console.log('');
console.log('  Pour outrepasser volontairement : git commit --no-verify');
process.exit(ESSAI ? 0 : 1);
