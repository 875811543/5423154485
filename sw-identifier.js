/* ==========================================================================
   Service worker de l'outil d'identification — sw-identifier.js

   Enregistre UNIQUEMENT depuis identifier-nuisible (voir le bloc 14 de
   assets/js/identifier-nuisible.js). Aucune autre page du site ne
   l'enregistre.

   Il est a la RACINE, donc sa portee couvre tout le domaine et l'evenement
   fetch se declenche pour toutes les requetes. C'est pourquoi il commence par
   ecarter tout ce qui n'est pas l'outil : pour ces requetes il ne fait RIEN
   — pas d'appel a respondWith —, et le navigateur suit son chemin normal,
   exactement comme si aucun service worker n'existait. Le site reste donc
   servi par le reseau et par le cache HTTP habituels.

   Strategie : RESEAU D'ABORD, cache en secours. Une page mise en cache ne
   doit jamais masquer une version plus recente ; le cache ne sert qu'a rendre
   l'outil utilisable hors connexion, sur un chantier sans reseau.

   VERSION : a incrementer quand la liste PRECACHE change. Les ressources
   sont listees avec leur empreinte ?v=, donc une modification de CSS ou de JS
   change deja l'URL mise en cache ; la version protege en plus le HTML.
   ========================================================================== */
"use strict";

var VERSION = "ident-1";
var CACHE = "dz-" + VERSION;

/* La page et ses ressources propres. Les empreintes sont celles du HTML au
   moment de l'ecriture : si elles changent, l'ancienne entree devient
   simplement inutilisee et le cache est purge au changement de VERSION. */
var PRECACHE = [
  "identifier-nuisible",
  "assets/css/global.css",
  "assets/css/pages/identifier-nuisible.css",
  "assets/js/main.js",
  "assets/js/identifier-nuisible.js",
  "assets/fonts/inter-latin-400-normal.woff2",
  "assets/fonts/poppins-latin-800-normal.woff2",
  "images/logo-icone.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // addAll echoue en bloc si une seule requete echoue : on ajoute une a
      // une pour qu'une police absente n'empeche pas la mise en cache du reste.
      return Promise.all(PRECACHE.map(function (u) {
        return c.add(new Request(u, { cache: "reload" }))["catch"](function () { });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (noms) {
      return Promise.all(noms.map(function (n) {
        // on ne supprime que nos propres caches, jamais ceux d'un autre outil
        return (n.indexOf("dz-") === 0 && n !== CACHE) ? caches["delete"](n) : null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/** L'URL fait-elle partie de l'outil ? */
function concerne(url) {
  if (url.origin !== self.location.origin) { return false; }
  var p = url.pathname.replace(/^\/+/, "");
  if (p === "identifier-nuisible" || p === "identifier-nuisible.html") { return true; }
  return /^assets\/(css|js|fonts)\//.test(p) || p === "images/logo-icone.png";
}

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") { return; }

  var url;
  try { url = new URL(e.request.url); } catch (err) { return; }

  // Toute URL etrangere a l'outil : on ne repond pas. Le navigateur fait
  // comme si ce service worker n'existait pas.
  if (!concerne(url)) { return; }

  e.respondWith(
    fetch(e.request).then(function (rep) {
      if (rep && rep.ok) {
        var copie = rep.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copie); });
      }
      return rep;
    })["catch"](function () {
      return caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
        if (hit) { return hit; }
        // hors connexion et rien en cache : on rend la page de l'outil si
        // c'est une navigation, sinon on laisse l'echec remonter.
        if (e.request.mode === "navigate") {
          return caches.match("identifier-nuisible", { ignoreSearch: true });
        }
        return Response.error();
      });
    })
  );
});
