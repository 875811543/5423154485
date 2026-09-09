/**
 * Génère `sitemap.xml` depuis le système de fichiers.
 *
 * Pourquoi ce fichier existe
 * --------------------------
 * Le sitemap était maintenu à la main. Le 2 septembre 2026, treize pages ont été
 * ajoutées dans la journée : il s'est désynchronisé treize fois. Le contrôle
 * `sitemap-coherent` les a toutes rattrapées, mais après coup — une page créée,
 * un contrôle rouge, une correction manuelle, à chaque fois.
 *
 * Ce script inverse la charge : le sitemap n'est plus une chose qu'on met à
 * jour, c'est une chose qu'on produit.
 *
 * Ce qu'il fait
 * -------------
 * - Parcourt les `.html` de la racine, exclut ceux qui portent `noindex`.
 * - `lastmod` = date du dernier commit git touchant le fichier. Pas la date du
 *   jour : un sitemap qui prétend que tout a changé aujourd'hui perd le seul
 *   signal qu'il apporte à un moteur.
 * - Ni `priority` ni `changefreq` : Google a confirmé ignorer ces deux champs.
 *   Les écrire, c'est entretenir une opinion que personne ne lit.
 *
 * Usage
 * -----
 *   node tools/build-sitemap.js            écrit sitemap.xml
 *   node tools/build-sitemap.js --verifier  compare sans écrire, code 1 si écart
 *
 * Le module exporte `construire()`, utilisé par le contrôle `sitemap-genere`
 * pour vérifier que le dépôt porte bien ce que le générateur produit.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RACINE = path.resolve(__dirname, '..');
const SITE = 'https://dezinsect-corse.fr';

/** Date du dernier commit touchant un fichier, au format AAAA-MM-JJ. */
function dateGit(fichier) {
  try {
    // On remonte l'historique du fichier et on retient le premier commit dont
    // le diff porte autre chose qu'une ligne de hash de cache. Un commit qui ne
    // fait que propager « ?v=xxxxxxxx » touche les 51 pages à la fois : le
    // compter donnerait un sitemap où tout a changé le même jour, c'est-à-dire
    // sans aucun signal pour un moteur.
    // Le format est entre guillemets : sans eux, cmd.exe prend le « | » pour
    // un tube et la commande echoue silencieusement, le repli sur la date de
    // modification du fichier donnant alors « aujourd'hui » partout.
    const journal = execSync('git log --format="%H|%cs" -- "' + fichier + '"',
      { cwd: RACINE, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    for (const ligne of journal) {
      const [sha, date] = ligne.split('|');
      const patch = execSync('git show --format= --unified=0 ' + sha + ' -- "' + fichier + '"',
        { cwd: RACINE, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
      const modifiees = patch.split('\n')
        .filter(l => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l));
      const seulementHash = modifiees.length > 0
        && modifiees.every(l => /\?v=[0-9a-f]{8}/.test(l));
      if (!seulementHash) return date;
    }
    if (journal.length) return journal[journal.length - 1].split('|')[1];
  } catch (e) { /* dépôt absent ou fichier jamais commité */ }
  // Repli : la date de modification du fichier. Un fichier non encore commité
  // n'a pas d'histoire, et mentir sur sa date serait pire que l'approximer.
  return fs.statSync(path.join(RACINE, fichier)).mtime.toISOString().slice(0, 10);
}

/** Produit le contenu XML complet, sans rien écrire. */
function construire() {
  const pages = fs.readdirSync(RACINE)
    .filter(f => f.endsWith('.html'))
    .filter(f => !/<meta name="robots"[^>]*noindex/
      .test(fs.readFileSync(path.join(RACINE, f), 'utf8')))
    .sort();

  const url = f => {
    const slug = f === 'index.html' ? '' : f.replace(/\.html$/, '');
    return '  <url>\n'
      + '    <loc>' + SITE + '/' + slug + '</loc>\n'
      + '    <lastmod>' + dateGit(f) + '</lastmod>\n'
      + '  </url>';
  };

  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<!-- Genere par tools/build-sitemap.js — ne pas editer a la main. -->\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + pages.map(url).join('\n') + '\n'
    + '</urlset>\n';
}

module.exports = { construire, dateGit };

if (require.main === module) {
  const xml = construire();
  const cible = path.join(RACINE, 'sitemap.xml');
  const actuel = fs.existsSync(cible) ? fs.readFileSync(cible, 'utf8') : '';
  const n = (xml.match(/<loc>/g) || []).length;

  if (process.argv.includes('--verifier')) {
    if (xml.trim() === actuel.trim()) { console.log('  sitemap a jour : ' + n + ' adresses'); }
    else { console.log('  ECART : sitemap.xml differe du generateur'); process.exit(1); }
  } else if (xml === actuel) {
    console.log('  sitemap inchange : ' + n + ' adresses');
  } else {
    fs.writeFileSync(cible, xml);
    const avant = (actuel.match(/<loc>/g) || []).length;
    console.log('  sitemap ecrit : ' + avant + ' -> ' + n + ' adresses');
  }
}
