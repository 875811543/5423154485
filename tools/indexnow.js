/**
 * Notifie IndexNow des pages modifiées.
 *
 * Pourquoi ce fichier existe
 * --------------------------
 * IndexNow fait indexer une page en minutes au lieu de semaines, sur Bing,
 * Yandex et Naver. Bing alimentant l'index de ChatGPT Search, c'est aussi le
 * levier le plus direct sur la citabilité par les moteurs de réponse — la
 * partie GEO du chantier.
 *
 * Ce qu'il fait
 * -------------
 * - Lit `sitemap.xml` et compare une empreinte du contenu de chaque page à
 *   celle du dernier envoi, mémorisée dans `tools/indexnow-etat.json`,
 *   versionné avec le dépôt. Le `lastmod` ne servait pas : sa granularité est
 *   la journée, donc une seconde modification le même jour passait inaperçue.
 * - N'envoie que ce qui a changé. Soumettre les 61 adresses à chaque fois
 *   n'apporte rien et ressemble à du bruit.
 * - Poste le lot en une requête à `api.indexnow.org/indexnow`.
 *
 * La clé
 * ------
 * Elle n'est écrite nulle part dans ce script. Elle est **lue depuis le nom du
 * fichier de vérification** présent à la racine, dont le contenu doit être
 * identique au nom. Une seule source de vérité : impossible que le script et le
 * fichier divergent. Cette clé est publique par conception — c'est le principe
 * d'IndexNow, qui prouve la propriété du domaine en exigeant qu'elle soit
 * hébergée dessus.
 *
 * Usage
 * -----
 *   node tools/indexnow.js            envoie ce qui a changé
 *   node tools/indexnow.js --essai    montre ce qui serait envoyé, sans rien poster
 *   node tools/indexnow.js --tout     force l'envoi des 61 adresses
 *   node tools/indexnow.js --marque   enregistre l'etat sans rien poster
 *
 * À lancer APRÈS un `git push`, une fois le déploiement passé : notifier une
 * page que le serveur ne sert pas encore la ferait rejeter.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const RACINE = path.resolve(__dirname, '..');
const HOTE = 'dezinsect-corse.fr';
const ETAT = path.join(__dirname, 'indexnow-etat.json');

/** Trouve la clé : le nom du fichier de vérification, validé par son contenu. */
function cle() {
  const candidats = fs.readdirSync(RACINE)
    .filter(f => /^[0-9a-f]{8,128}\.txt$/i.test(f));
  if (!candidats.length) throw new Error('aucun fichier de clé IndexNow à la racine');
  if (candidats.length > 1) throw new Error('plusieurs fichiers de clé : ' + candidats.join(', '));
  const nom = candidats[0].replace(/\.txt$/, '');
  const contenu = fs.readFileSync(path.join(RACINE, candidats[0]), 'utf8');
  if (contenu !== nom)
    throw new Error('le fichier ' + candidats[0] + ' ne contient pas exactement sa clé'
      + ' (' + contenu.length + ' caractères lus, ' + nom.length + ' attendus)');
  return nom;
}

/**
 * Empreinte de ce qui fait le contenu d'une page, et de rien d'autre.
 *
 * On écarte avant de hacher :
 *  - les hashes `?v=` de cache-busting, qu'une simple retouche CSS propage sur
 *    les 61 pages d'un coup. Sans cela, changer une couleur fait notifier le
 *    site entier — précisément le bruit que ce script existe pour éviter ;
 *  - l'en-tête et le pied partagés, identiques partout : y toucher ne change
 *    ce qu'aucune page raconte.
 *
 * Même règle que `dateGit()` dans build-sitemap.js, qui ignore les commits ne
 * portant que ces deux choses.
 */
function empreinte(html) {
  const corps = html
    .replace(/\?v=[0-9a-zA-Z]+/g, '')
    .replace(/<header class="site-header"[\s\S]*?<\/header>/g, '')
    .replace(/<footer class="site-footer"[\s\S]*?<\/footer>/g, '');
  return crypto.createHash('sha256').update(corps, 'utf8').digest('hex').slice(0, 16);
}

/**
 * Les adresses du sitemap, avec une empreinte du fichier qu'elles servent.
 *
 * L'état ne retenait auparavant que le `lastmod`, qui n'a qu'une granularité
 * de journée. Deux modifications le même jour se ressemblaient donc : la
 * seconde n'était jamais notifiée, et ne pouvait plus jamais l'être. On
 * compare le contenu réel, seule chose qui décide si une page a changé.
 */
function adresses() {
  const xml = fs.readFileSync(path.join(RACINE, 'sitemap.xml'), 'utf8');
  const out = {};
  for (const m of xml.matchAll(/<url>[\s\S]*?<\/url>/g)) {
    const loc = (m[0].match(/<loc>([^<]+)<\/loc>/) || [])[1];
    if (!loc) continue;
    const slug = loc.replace('https://' + HOTE + '/', '');
    const f = path.join(RACINE, (slug === '' ? 'index' : slug) + '.html');
    out[loc] = fs.existsSync(f) ? empreinte(fs.readFileSync(f, 'utf8')) : '';
  }
  return out;
}

function poster(corps) {
  return new Promise((resolve, reject) => {
    const donnees = Buffer.from(JSON.stringify(corps), 'utf8');
    const req = https.request({
      hostname: 'api.indexnow.org', path: '/indexnow', method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': donnees.length }
    }, res => {
      let txt = '';
      res.on('data', c => txt += c);
      res.on('end', () => resolve({ code: res.statusCode, corps: txt.slice(0, 300) }));
    });
    req.on('error', reject);
    req.write(donnees);
    req.end();
  });
}

(async () => {
  const essai = process.argv.includes('--essai');
  const tout = process.argv.includes('--tout');

  const k = cle();
  const actuel = adresses();
  const precedent = fs.existsSync(ETAT)
    ? JSON.parse(fs.readFileSync(ETAT, 'utf8')).adresses || {}
    : {};

  const aEnvoyer = Object.keys(actuel)
    .filter(u => tout || precedent[u] !== actuel[u])
    .sort();

  console.log('  clé      : ' + k);
  console.log('  sitemap  : ' + Object.keys(actuel).length + ' adresses');
  console.log('  à envoyer: ' + aEnvoyer.length + (tout ? '  (--tout)' : ''));
  for (const u of aEnvoyer.slice(0, 12)) console.log('      ' + u);
  if (aEnvoyer.length > 12) console.log('      … et ' + (aEnvoyer.length - 12) + ' autres');

  if (!aEnvoyer.length) { console.log('\n  rien de nouveau depuis le dernier envoi'); return; }
  if (essai) { console.log('\n  --essai : rien n a ete poste'); return; }

  // --marque : enregistre l'etat courant comme deja notifie, sans rien poster.
  // Pour le cas ou ces adresses viennent d'etre envoyees autrement — ou, comme
  // le jour ou ce drapeau est ne, apres un changement de methode d'empreinte
  // qui fait paraitre neuf ce qui vient d'etre transmis.
  if (process.argv.includes('--marque')) {
    fs.writeFileSync(ETAT, JSON.stringify({
      dernierEnvoi: new Date().toISOString().slice(0, 19) + 'Z',
      adresses: actuel
    }, null, 2) + '\n');
    console.log('\n  --marque : etat enregistre sans envoi (' + aEnvoyer.length + ' adresses)');
    return;
  }

  const r = await poster({
    host: HOTE,
    key: k,
    keyLocation: 'https://' + HOTE + '/' + k + '.txt',
    urlList: aEnvoyer
  });

  // 200 et 202 valent acceptation. Tout le reste est un refus qu'il faut voir.
  console.log('\n  réponse IndexNow : ' + r.code + (r.corps ? '  ' + r.corps : ''));
  if (r.code !== 200 && r.code !== 202) {
    console.log('  ENVOI REFUSE — l etat n est pas mis a jour, on pourra reessayer');
    process.exit(1);
  }

  fs.writeFileSync(ETAT, JSON.stringify({
    dernierEnvoi: new Date().toISOString().slice(0, 19) + 'Z',
    adresses: actuel
  }, null, 2) + '\n');
  console.log('  état mis à jour : ' + ETAT.replace(RACINE + path.sep, ''));
})().catch(e => { console.log('  ERREUR : ' + e.message); process.exit(1); });
