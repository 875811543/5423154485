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
 * - Lit `sitemap.xml` et compare chaque `lastmod` à celui du dernier envoi,
 *   mémorisé dans `tools/indexnow-etat.json`, versionné avec le dépôt.
 * - N'envoie que ce qui a changé. Soumettre les 47 adresses à chaque fois
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
 *   node tools/indexnow.js --tout     force l'envoi des 47 adresses
 *
 * À lancer APRÈS un `git push`, une fois le déploiement passé : notifier une
 * page que le serveur ne sert pas encore la ferait rejeter.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

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

/** Les adresses du sitemap, avec leur date de dernière modification. */
function adresses() {
  const xml = fs.readFileSync(path.join(RACINE, 'sitemap.xml'), 'utf8');
  const out = {};
  for (const m of xml.matchAll(/<url>[\s\S]*?<\/url>/g)) {
    const loc = (m[0].match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const mod = (m[0].match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (loc) out[loc] = mod || '';
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
