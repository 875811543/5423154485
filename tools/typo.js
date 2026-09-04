/**
 * Typographie française — à appeler par TOUT script qui écrit du texte visible.
 *
 * Pourquoi ce fichier existe
 * --------------------------
 * Le contrôle « typographie » de `controle.js` exige une espace insécable avant
 * les signes doubles (: ; ? !) et à l'intérieur des guillemets français. Il a
 * mordu **cinq fois** sur cinq scripts d'écriture différents, à quelques heures
 * d'intervalle : titres de section, questions de FAQ, légendes de tableaux.
 *
 * À chaque fois le correctif a été réécrit sur place, dans le script fautif, et
 * le script suivant a refait l'erreur. Le défaut n'était pas dans les scripts :
 * il était dans le fait que la règle n'existait qu'une fois par script au lieu
 * d'exister une fois pour toutes.
 *
 * Usage
 * -----
 *   const { insecable, appliquer } = require('./tools/typo');
 *   texte = insecable(texte);          // une chaîne
 *   appliquer(objet);                  // un plan JSON entier, en place
 *
 * Le remplacement ignore l'intérieur des balises : un `<a href="x?y=1">` ne doit
 * pas recevoir d'insécable, et une URL contenant « ! » non plus.
 */

'use strict';

const NBSP = ' ';

/**
 * Pose les espaces insécables dans une chaîne, hors des balises HTML.
 * Accepte du HTML comme du texte brut. Idempotent : réappliquer ne change rien.
 */
function insecable(texte) {
  if (typeof texte !== 'string') return texte;
  return texte
    .split(/(<[^>]+>)/)                       // on isole les balises
    .map((morceau, i) => {
      if (i % 2) return morceau;              // les indices impairs sont les balises
      return morceau
        .replace(/ ([:;?!])/g, NBSP + '$1')   // espace avant un signe double
        .replace(/«\s/g, '«' + NBSP)          // guillemet ouvrant
        .replace(/\s»/g, NBSP + '»');         // guillemet fermant
    })
    .join('');
}

/**
 * Parcourt un objet — plan JSON, tableau, chaîne — et applique `insecable` à
 * toutes les chaînes qu'il contient. Modifie les objets en place et retourne
 * la valeur traitée.
 */
function appliquer(valeur) {
  if (typeof valeur === 'string') return insecable(valeur);
  if (Array.isArray(valeur)) return valeur.map(appliquer);
  if (valeur && typeof valeur === 'object') {
    for (const cle of Object.keys(valeur)) valeur[cle] = appliquer(valeur[cle]);
  }
  return valeur;
}

module.exports = { insecable, appliquer, NBSP };
