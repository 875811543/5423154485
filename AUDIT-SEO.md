# Audit SEO / GEO — dezinsect-corse.fr

**Date :** 2 septembre 2026 · **Périmètre :** 51 pages HTML, `robots.txt`, `sitemap.xml`,
`.htaccess`, `assets/css`, `assets/js` · **Méthode :** mesure par script sur les fichiers
réels, jamais par supposition. Chaque chiffre de ce document est reproductible.

Le dépôt a déjà reçu un travail SEO important et dispose de **29 contrôles automatiques**
(`tools/controle.js`) qui tournent verts. Un audit utile doit donc commencer par dire ce qui
est **déjà conforme**, sinon il fait refaire l'existant.

---

## 1. Déjà conforme — ne pas y toucher

Vérifié par comptage sur les 51 pages :

| Point | Mesure |
|---|---|
| `canonical` absolue et unique | **51/51**, aucun doublon |
| `<meta name="robots">` explicite | **51/51** |
| Un seul `<h1>` par page | **51/51**, aucune page à 0 ou 2 |
| `<main>` présent | **51/51** |
| `<nav aria-label>` | **51/51** |
| Skip-link « Aller au contenu principal » | **51/51** |
| Hiérarchie de titres sans saut | contrôle `a11y-structure` vert |
| `alt` descriptif et non générique | contrôle `a11y-structure` vert |
| JSON-LD parsable | **0 bloc invalide** sur ~300 |
| `BreadcrumbList` | 50/51 (absent de l'accueil — correct) |
| `FAQPage` identique au texte visible | contrôle `json-ld` vert |
| `speakable` | 49/51 |
| `HowTo` | 6 pages |
| Images `width`/`height` en dur | **110/110 balises `<img>`** |
| `<picture>` + WebP + variante mobile 760 px | 51/51 |
| LCP en `fetchpriority="high"` + `<link rel="preload">` | 51/51 |
| Polices **self-hosted** woff2, `font-display: swap`, préchargées | 8 fichiers, oui |
| JS en `defer`, zéro dépendance externe | oui |
| Cohérence des URLs internes | **1 seule anomalie** (voir §2) |
| Maillage : profondeur maximale depuis l'accueil | **2 clics**, zéro orpheline |
| Sitemap ↔ pages indexables | cohérent, `lastmod` réel, `changefreq` + `priority` sur 47/47 |
| `.htaccess` : Brotli, gzip, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HTTPS+non-www | tous présents |
| Cache : 1 an sur les assets, `?v=` sur CSS/JS | oui, contrôle `hashes` vert |

---

## 2. Problèmes détectés

Gravité : **B** bloquant · **I** important · **C** cosmétique.

### Partie 1 — SEO technique

| Fichier / portée | Problème | Gravité |
|---|---|---|
| 51 pages | **Aucune image AVIF.** `<picture>` sert WebP + JPEG. AVIF pèse 20-30 % de moins à qualité égale — gain direct sur le LCP mobile | **I** |
| 51 pages | **Aucun CSS critique en ligne.** 4 feuilles bloquantes dans le `<head>` (`global`, page, `form`, page-spécifique). Le rendu attend les 4 | **I** |
| 51 pages | **`content-visibility: auto` absent** sur les sections sous la ligne de flottaison | **C** |
| 51 pages | **`<address>` absent.** L'adresse du pied de page est un `<a>` vers Google Maps, sans balise sémantique | **C** |
| 51 pages | **`aria-current` absent** de la navigation : rien n'indique la page active, ni au lecteur d'écran ni au moteur | **I** |
| 17 pages | **Titre > 60 signes** (max 69). La marque en fin de titre est tronquée dans les résultats | **C** |
| 26 pages | **Description hors 140-158 signes** (min 104, max 166). Sous 140, on gaspille de la surface d'affichage | **I** |
| `404.html` | Un `href="/"` — **seule** URL interne à slash final du site. Toutes les autres sont relatives sans extension | **C** |
| `.htaccess` | **Aucune `Content-Security-Policy`** | **I** |
| `robots.txt` | **5 robots IA non déclarés** : `Perplexity-User`, `Claude-SearchBot`, `meta-externalagent`, `CCBot`, `Amazonbot` | **I** |
| `tools/` | **Pas de `build-sitemap.js`.** Le sitemap est maintenu à la main : il s'est désynchronisé 13 fois aujourd'hui, rattrapé à chaque fois par le contrôle `sitemap-coherent` | **I** |

### Partie 2 — Données structurées

| Fichier / portée | Problème | Gravité |
|---|---|---|
| 47 pages | **JSON-LD éclaté en 6 blocs isolés** au lieu d'un `@graph` unique. Les entités ne sont pas reliées par `@id` : Google reconstruit les liens au lieu de les lire | **B** |
| 49 pages | **Aucun `@graph`** | **B** |
| 51 pages | **`hasCredential` absent** du bloc entreprise : le Certibiocide n'existe pas en données structurées | **I** |
| 51 pages | **`sameAs` à vérifier** — la fiche Google Business n'est pas certaine d'y figurer | **I** |
| 9 fiches nuisibles | **`Article` + `dateModified` absents** | **I** |
| `404`, `merci` | Aucun JSON-LD — **correct**, ce sont des pages `noindex` | — |

### Partie 3 — GEO (moteurs de réponse IA)

| Fichier / portée | Problème | Gravité |
|---|---|---|
| racine | **`llms.txt` absent** | **I** |
| 51 pages | **Aucun tableau comparatif** (`<table>`) sur tout le site. C'est le format le plus repris en citation par les LLM, et le site n'en a pas un seul | **B** |
| 49 pages | **Numéro Certibiocide N079373 absent** — présent uniquement sur `index` et `mentions-legales` | **I** |
| 51 pages | **Aucune mention « Page mise à jour le … »** visible | **I** |
| fiches nuisibles | **Pas de phrase définitionnelle canonique** en ouverture | **I** |
| toutes | **Autonomie des passages non vérifiée** : anaphores (« il », « ce traitement ») à remplacer par l'entité nommée | **I** |
| toutes | **Format « réponse d'abord » non systématique** sous les H2 en question | **I** |

---

## 3. Le point de désaccord — à trancher par le propriétaire

> **Le brief demande `aggregateRating` + `review` dans le `LocalBusiness`. Je recommande de ne pas le faire.**

Ce balisage **a existé** sur ce site et **a été retiré le 2 septembre 2026** parce que
**Search Console le signalait en erreur** : « Type d'objet non valide pour le champ
`parent_node` ». Google refuse depuis 2019 les extraits d'avis qu'un site publie sur
lui-même (`LocalBusiness` auto-noté). Le balisage n'apporte aucun extrait enrichi et
génère une erreur permanente dans la console.

Les sept avis restent **affichés en HTML** dans la section « Ce que disent nos clients » :
ils sont lisibles par les humains comme par les LLM. Seul le balisage a disparu.

**Le remettre reviendrait à recréer une erreur corrigée il y a quelques heures.**
Dites-moi si vous voulez que je le fasse quand même — c'est votre décision, pas la mienne.

---

## 4. Informations manquantes — je n'inventerai pas

| Information | Pourquoi elle manque |
|---|---|
| **SIREN / RCS** | Société en cours d'immatriculation (garde-fou du brief). Obligation légale ouverte |
| ~~**URL exacte de la fiche Google Business**~~ | **Fournie le 2 septembre 2026.** Le lien de partage résout vers une recherche « Dezinsect Corse » portant `kgmid=/g/11x7nktl5f` — l'identifiant de l'établissement dans le Knowledge Graph. Le site déclare par ailleurs `cid=6330082989377733098` dans `hasMap` sur 44 pages. **Non vérifié d'ici que les deux désignent la même fiche** : Google oppose un mur de consentement à toute requête automatisée. Voir §6 |
| ~~**Horaires réels**~~ | **Confirmés le 2 septembre 2026** : 08:00-20:00, 7 j/7. Le JSON-LD les déclarait déjà sans qu'ils aient jamais été validés. Ils peuvent désormais être affichés en clair — ce que le GEO recommande, un horaire cité étant une donnée vérifiable |
| **Chenilles processionnaires** | Service vendu sur l'ancien site, absent d'ici. Méthode et saison inconnues |
| **Marque MABI** | Nommée six fois sur l'ancien site, jamais ici. Matériel actuel à confirmer |
| **Méthode moustiques** | Confirmée le 2 septembre : pulvérisation, granulés larvicides, pièges CO₂ |

---

## 5. Ce que l'audit ne mesure pas

- **Lighthouse** : aucun score n'est mesuré dans ce document. Les affirmations de performance
  ci-dessus portent sur des causes vérifiables dans le code (feuilles bloquantes, formats
  d'image), pas sur un score. Une mesure Lighthouse réelle sera faite sur le site en ligne
  avant et après le lot performance, et reportée dans `RAPPORT-SEO.md`.
- **Volumes de recherche** : Semrush reste sans unités API. Aucun arbitrage de ce document
  ne repose sur un volume estimé.


---

## 6. Fiche Google Business — ce qui sera écrit dans le schema

Deux identifiants sont connus, et ils ne se valent pas.

| Identifiant | Origine | Fiabilité |
|---|---|---|
| `kgmid=/g/11x7nktl5f` | Lien de partage transmis par le propriétaire | **Certaine** — vient de sa propre fiche |
| `cid=6330082989377733098` | Déjà dans le dépôt, champ `hasMap` de 44 pages | **Héritée**, jamais vérifiée |

Ce qui sera écrit au lot 1, et pourquoi :

- **`sameAs`** recevra `https://www.google.com/maps/place/?cid=6330082989377733098`.
  C'est la forme canonique d'une fiche d'établissement, et c'est déjà celle que le site
  emploie dans `hasMap` : les deux champs resteront cohérents.
- **`identifier`** recevra le MID sous forme de `PropertyValue`
  (`propertyID: "Google Knowledge Graph MID"`, `value: "/g/11x7nktl5f"`). C'est un type
  schema.org valide, et c'est l'identifiant le plus stable qui existe pour une entité Google.

**`TODO(dumé)` — une vérification de trente secondes :** ouvrez
`https://www.google.com/maps/place/?cid=6330082989377733098` dans votre navigateur. Si vous
tombez sur votre fiche, tout est juste et il n'y a rien à faire. Sinon, dites-le-moi : le
`cid` hérité serait faux, et il faudrait le corriger sur les 44 pages, pas seulement dans le
`sameAs`.
