# Plan d'exécution SEO / GEO

Ordonné par **impact décroissant**, pas par facilité. Un lot = un commit, message
conventionnel. Chaque lot se termine par les 29 contrôles verts et une vérification propre
avant `git push`.

> **Rappel qui conditionne tout :** le déploiement est automatique. **Un `git push` met le
> site en ligne.** Chaque lot est donc une publication, pas un enregistrement. Les contrôles
> passent avant le push, jamais après.

---

## Lot 1 — `feat(schema): fusionne le JSON-LD en un @graph unique par page`

**Impact : maximal.** C'est le seul point classé bloquant sur les deux parties.

Les 47 pages portent 6 blocs isolés. Google et les moteurs de réponse doivent reconstruire
les relations entre l'entreprise, la page, le service et le fil d'Ariane. Un `@graph` les
déclare explicitement, par `@id`.

- Un seul `<script type="application/ld+json">` par page, contenant `@graph`.
- `@id` stables : `#organisation` (entité mère, définie sur l'accueil), `#website`,
  `<url>#webpage`, `<url>#service`, `<url>#breadcrumb`, `<url>#faq`.
- Toutes les pages **référencent** `https://dezinsect-corse.fr/#organisation` au lieu de le
  redéfinir.
- Ajout de `hasCredential` (Certibiocide N079373, `EducationalOccupationalCredential`,
  titulaire et validité au 19/12/2029) sur l'entité mère.
- `sameAs` complété — YouTube, Instagram, Facebook déjà connus ; `TODO(dumé)` pour l'URL
  exacte de la fiche Google Business.
- **Sans `aggregateRating` ni `review`** — voir le désaccord documenté dans `AUDIT-SEO.md §3`.

Vérification : parsing de chaque bloc par script Node, contrôle `json-ld` vert, et
comparaison avant/après du nombre d'entités déclarées — aucune ne doit disparaître
(règle absolue n° 2 d'`AGENTS.md`).

---

## Lot 2 — `feat(geo): tableaux comparatifs et signaux d'expertise`

**Impact : très élevé sur la citabilité IA, nul sur le classique.** Le site n'a **aucun**
`<table>`, alors que c'est le format le plus repris en citation par les LLM.

Quatre tableaux, en HTML sémantique (`<caption>`, `<th scope>`), chacun sur la page qui le
porte naturellement :

| Tableau | Page |
|---|---|
| Frelon asiatique / européen / oriental | `guepes-et-frelons` |
| Rat noir / surmulot / souris | `deratisation` |
| Termite / capricorne / vrillette / mérule | `traitement-anti-termites` |
| Blatte germanique / orientale | `cafards` |

Colonnes : nom scientifique latin, taille, période d'activité, habitat, signe distinctif,
traitement. Densité factuelle maximale — c'est ce que les LLM extraient.

Dans le même lot : **numéro Certibiocide N079373 visible** sur les pages de service (il n'est
aujourd'hui que sur l'accueil et les mentions légales), et **« Page mise à jour le … »** en
pied de contenu, cohérent avec le `dateModified` du JSON-LD.

---

## Lot 3 — `fix(seo): titres, descriptions et robots IA`

**Impact : élevé, effort faible.** Ce sont les lignes que voit l'internaute dans les
résultats.

- 17 titres ramenés sous 60 signes, en gardant le mot-clé et la zone, en resserrant la marque.
- 26 descriptions recalibrées entre 140 et 158 signes, chacune portant un élément
  différenciant (Certibiocide, 7 j/7, devis gratuit, « à partir de 100 € » là où c'est vrai).
- `robots.txt` : ajout de `Perplexity-User`, `Claude-SearchBot`, `meta-externalagent`,
  `CCBot`, `Amazonbot`.
- Correction de l'unique `href="/"` de `404.html`.

Vérification : contrôle `metadonnees` vert (unicité **et** longueur), aucun doublon.

---

## Lot 4 — `feat(tools): génère le sitemap depuis le système de fichiers`

**Impact : structurel.** Le sitemap est maintenu à la main et s'est désynchronisé treize fois
dans la seule journée du 2 septembre — rattrapé chaque fois par le contrôle
`sitemap-coherent`, mais rattrapé après coup.

`tools/build-sitemap.js` : parcourt les `.html`, exclut les `noindex`, lit la date du dernier
commit git touchant chaque fichier pour `lastmod`, dérive `priority` de la profondeur de
maillage. Idempotent, exécutable avant chaque push.

---

## Lot 5 — `perf(css): CSS critique en ligne et différé du reste`

**Impact : élevé sur le LCP mobile.** Quatre feuilles bloquent le rendu.

- Extraction du CSS critique (en-tête, héros, typographie de base) en ligne dans le `<head>`.
- Les quatre feuilles passent en chargement différé
  (`media="print" onload="this.media='all'"` + `<noscript>` de repli).
- `content-visibility: auto` avec `contain-intrinsic-size` sur les sections basses.

**Mesure obligatoire** : Lighthouse mobile avant et après, sur le site en ligne, reporté dans
`RAPPORT-SEO.md`. Sans mesure, ce lot n'est pas validé. Risque à surveiller : un CSS critique
mal découpé provoque un flash de contenu non stylé — capture d'écran avant/après à 360 px et
1280 px, comparée pixel à pixel.

---

## Lot 6 — `perf(img): AVIF en première source`

**Impact : direct sur le poids.** 81 images, aucune en AVIF.

Génération d'un AVIF pour chaque JPEG/WebP existant, ajouté **en première `<source>`** du
`<picture>` — WebP puis JPEG restent en repli. Aucun fichier existant n'est remplacé
(règle d'`AGENTS.md` : pour remplacer une image, on la renomme).

Le contrôle `fichiers-cites` garantit qu'aucune source ne pointera dans le vide.

---

## Lot 7 — `feat(geo): réécriture « réponse d'abord » et autonomie des passages`

**Impact : élevé mais diffus.** C'est le lot le plus long, et celui qui touche le plus de
texte rédactionnel — donc le plus risqué pour la voix du site.

- Sous chaque H2 formulé en question : premier paragraphe répondant en 40-70 mots, sans
  préambule.
- Remplacement des anaphores par l'entité nommée, pour qu'un paragraphe extrait seul reste
  compréhensible.
- Phrase définitionnelle canonique en ouverture des 9 fiches nuisibles.
- H2/H3 reformulés en requêtes réelles là où ils sont encore descriptifs.

Traité **fiche par fiche**, pas en une passe : le contrôle des sections recopiées et le
contrôle typographique doivent rester verts à chaque étape.

---

## Lot 8 — `feat(schema): Article et dateModified sur les fiches nuisibles`

Neuf fiches (`cafards`, `fourmis`, `mouches`, `moustiques-corse`, `rat-noir`,
`rat-brun-surmulot`, `souris`, `capricorne-des-maisons`, `merule-champignons-bois`) reçoivent
un nœud `Article` dans leur `@graph`, avec `dateModified` tiré de la date git réelle et
cohérent avec la mention visible ajoutée au lot 2.

---

## Lot 9 — `feat(a11y): aria-current, address, et CSP`

Le plus petit lot, gardé pour la fin parce que son impact est réel mais faible.

- `aria-current="page"` sur l'entrée de navigation active.
- `<address>` autour du bloc de contact du pied de page.
- `Content-Security-Policy` dans `.htaccess`, calibrée sur ce que le site charge réellement :
  aucune dépendance externe, une seule origine, plus Google Maps en `frame-src` — la carte est
  créée par `main.js` au clic, ce que la politique doit autoriser sans ouvrir le reste.

**Attention** : une CSP trop stricte casse la carte, et le défaut ne se voit qu'au clic.
Vérification obligatoire dans un navigateur réel, pas par lecture du fichier.

---

## Lot 10 — `docs(seo): rapport final`

`RAPPORT-SEO.md` : corrections page par page, scores Lighthouse avant/après réellement
mesurés, `TODO(dumé)` restants, et les cinq actions hors-code à plus fort impact.

---

## Hors périmètre — assumé

- **`aggregateRating` / `review`** : voir `AUDIT-SEO.md §3`. Non exécuté sans votre accord
  explicite.
- **Punaises de lit** : exclues par le brief.
- **SIREN, capital, médiateur, décennale** : jamais inventés. `TODO(dumé)` dans les mentions
  légales.
- **Refonte visuelle** : aucune. Bleu `#1A4DFB`, vert `#22C55E`, Poppins/Inter inchangés.

---

## Ordre de bataille

Les lots 1 à 4 apportent l'essentiel du gain pour un risque faible et sont indépendants les
uns des autres. Les lots 5 et 6 touchent au rendu et demandent une mesure avant/après. Le
lot 7 est le plus long et le plus délicat — il vient après, quand la structure est stable.

**Je m'arrête ici et j'attends votre validation avant d'exécuter quoi que ce soit.**
