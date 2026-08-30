# AGENTS.md — Dezinsect Corse

Instructions de travail pour tout agent intervenant sur ce dépôt.
Objectif du chantier : **réorganiser, nettoyer et fiabiliser** le site sans jamais
dégrader le SEO ni le rendu, qui sont déjà de bon niveau.

---

## 1. Ce qu'est ce projet

Site vitrine **statique** d'une entreprise de lutte anti-nuisibles en Corse.
Aucun build, aucune dépendance npm, aucun framework. Ce qui est dans le dépôt
est exactement ce qui est servi.

- **28 pages HTML** à la racine (1 accueil, 8 services, 4 zones, 10 nuisibles,
  contact, merci, 2 pages légales, lexique, FAQ, 404).
- **CSS** dans `assets/css/` : 4 feuilles partagées (`global.css` faisant socle —
  il regroupe les anciens `fonts.css`, `components.css` et `footer.css` —, plus
  `form.css` et les feuilles `pages-*.css` par famille de pages), plus une
  feuille par page dans `assets/css/pages/`. **Aucun `<style>` ni attribut `style=""` dans le HTML.**
- **1 fichier JS**, `assets/js/main.js` (125 l., ES5, IIFE, sans dépendance).
- **Polices auto-hébergées** en woff2 (Inter + Poppins) — aucun appel à Google.
- **Images** en doublons `.jpg` + `.webp` servis via `<picture>`.
- **Deux cibles de déploiement, à ne pas confondre.** La cible réelle est
  `https://dezinsect-corse.fr`, **à la racine**, sur un Apache mutualisé — c'est
  ce que déclarent tous les `canonical`, le `sitemap.xml` et le JSON-LD. La
  préversion GitHub Pages, `https://875811543.github.io/5423154485/`, est servie
  **sous un sous-chemin** et sans Apache. Tous les chemins du site restent
  **relatifs** (`assets/...`, `images/...`, `deratisation.html`) pour fonctionner
  dans les deux cas — voir règle 7.
- **Le `.htaccess` est bien dans le dépôt**, suivi depuis le commit initial, et
  il porte la réécriture d'URL. C'est lui qui rend valides les URLs sans `.html`
  utilisées par les `canonical`, le `sitemap.xml` et le JSON-LD : sa dernière
  règle sert `page.html` quand `/page` est demandé, et une règle précédente
  redirige `/page.html` vers `/page` en 301 pour éviter le contenu dupliqué.
  **Ne pas ajouter de `.html` aux URLs canoniques** en croyant corriger quelque
  chose : elles sont correctes pour la cible réelle.
  Deux réserves à garder en tête :
  - **GitHub Pages ignore `.htaccess`.** Sur la préversion, les URLs sans
    extension renvoient donc 404. C'est normal, et une raison de plus de couper
    cette préversion.
  - `/index.html` passe par deux redirections en chaîne (`/index.html` → `/index`
    → `/`). Sans gravité, mais évitable en remontant la règle `^index/?$`
    au-dessus de celle qui retire le `.html`.

**Contraintes non négociables :** pas de build step, pas de framework, pas de
dépendance externe supplémentaire. Le site doit rester déployable par simple
copie de fichiers.

---

## 2. Règles absolues

1. **Ne jamais casser une URL.** Chaque page correspond à une URL indexée.
   Renommer ou supprimer un `.html` exige, dans le même changement :
   la mise à jour de `sitemap.xml` et la correction de tous les liens internes.
   Le `.htaccess` permet d'ajouter une 301 pour rattraper l'ancienne URL, et
   c'est ce qu'il faut faire — mais uniquement sur la cible Apache : la
   préversion GitHub Pages, elle, n'a aucun filet.
2. **Ne jamais retirer de JSON-LD ni de balise meta SEO** (canonical, OG,
   Twitter, robots) au nom du nettoyage. En cas de doublon, garder le plus complet.
3. **Ne pas toucher aux numéros de téléphone, adresses, mentions de
   certification (Certibiocide) ni aux textes légaux** sans demande explicite.
   Ce sont des informations d'entreprise, pas du code.
4. **La clé Web3Forms** (`contact.html`, `index.html`) est une clé publique de
   formulaire : elle reste en clair, ne pas la « sécuriser ».
5. **Toute modification CSS/JS impose de mettre à jour le hash `?v=`** sur
   **toutes** les pages qui référencent le fichier (voir §5).
6. **Pas de refonte visuelle non demandée.** Le nettoyage est structurel ;
   le rendu final doit rester pixel-identique sauf demande contraire.
7. **Ne jamais réintroduire de chemin absolu commençant par `/`.** La préversion
   est servie sous le sous-chemin `/5423154485/` : un `href="/assets/..."` ou un
   `href="/deratisation"` y renvoie un 404. C'est ce qui a fait servir le site
   entier sans CSS, sans images et sans navigation. La règle ne vaut que pour
   les **ressources et liens internes** ; les URLs absolues des `canonical`, du
   `sitemap.xml`, du JSON-LD et des balises Open Graph doivent au contraire
   rester en `https://dezinsect-corse.fr/…`, c'est leur rôle.
   **Le contrôle vaut aussi pour les `url()` des CSS**, pas seulement pour le
   HTML : les huit `@font-face` de `global.css` pointaient vers
   `/assets/fonts/…`. Les polices se chargeaient donc sur le domaine réel, mais
   renvoyaient 404 sur la préversion GitHub Pages, où le rendu retombait sur les
   polices système — et les deux `preload` du `<head>`, eux relatifs,
   téléchargeaient des fichiers que personne n'utilisait. Corrigé en
   `url('../fonts/…')`, relatif à l'emplacement de la feuille.
   **Et pour le JavaScript** : le formulaire redirigeait vers `'/merci'` en dur,
   qui renvoyait 404 sur la préversion. Corrigé en `'merci.html'`, valide sur les
   deux cibles. Les trois contrôles sont à passer ensemble, un chemin absolu
   pouvant se cacher dans chacun des trois langages :
   ```sh
   grep -rn "url('/" assets/css/
   grep -rn "location.href = '/" *.html assets/js/
   # plus le contrôle des href/src du §6
   ```
8. **Ne jamais remettre de style dans le HTML**, ni `<style>`, ni `style=""`.
   Tout style nouveau va dans un fichier de `assets/css/`.

---

## 3. État des lieux — le travail à faire

Classé par valeur décroissante. Vérifié sur le dépôt, pas supposé.

### P1 — Duplication header/footer — ✅ FAIT

Header et footer restent copiés-collés dans les 28 pages (pas de build), mais ils
sont désormais **strictement identiques** : le contrôle §6 renvoie une seule ligne
pour le header et une seule pour le footer.

Ce qui avait divergé, et qui a été aligné :

- header : indentation de l'entrée « Moustiques » du sous-menu (10 pages) ;
- footer : `decoding="async"` absent du logo (15 pages).

Aucune autre différence n'existait. Les « 5 variantes de footer » relevées
initialement étaient un artefact de la commande de contrôle, qui démarrait au
premier `<footer` de la page (voir ci-dessous).

**À savoir avant de rouvrir ce chantier :** toute évolution de la navigation reste
à répéter sur 28 fichiers, par `sed` sur `*.html`, jamais page par page. Ne pas
introduire d'injection JS côté client pour le header/footer : cela dégraderait le
SEO et le rendu initial.

#### Blocs `<footer>` de contenu — à ne pas confondre avec le footer de site

Cinq pages portent un bloc `<footer>` **avant** `<footer class="site-footer">`.
C'est du contenu de page, volontaire et visuel : ne pas l'uniformiser.

| Bloc | Pages |
|---|---|
| `<footer class="contact-footer">` | `anti-nuisible-corte`, `anti-nuisibles-costa-verde`, `anti-nuisibles-grand-ajaccio-porto-vecchio`, `traitement-injection-bati-termites` |
| `<footer class="zones-bottom-bar">` | `index` |

C'est pourquoi le contrôle §6 cible `<footer class="site-footer"` et non `<footer`.

### P2 — CSS dispersé — ✅ TERMINÉ

Il ne reste **aucun style dans le HTML** : zéro bloc `<style>`, zéro attribut
`style=""` sur les 28 pages. Le chemin parcouru :

- `footer.css` porté aux 28 pages ; second `:root` fusionné dans le premier.
- **1860 lignes** de `<style>` sorties vers `assets/css/pages/<slug>.css`,
  une feuille par page.
- **379 attributs `style=""`** supprimés. Les motifs partagés par plusieurs
  pages sont dans `components.css` ; le reste est dans la feuille de sa page.
- `fonts.css`, `components.css` et `footer.css` ont ensuite été concaténés dans
  `global.css`, dans leur ordre de chargement d'origine : 3 requêtes bloquantes
  en moins sur chacune des 28 pages, cascade inchangée. Vérifié avec
  `tools/compare-rendered-styles.sh` à 390, 768, 1024 et 1280 px.
- Trois feuilles de `assets/css/pages/` faisant moins de 1 Ko ont rejoint la
  feuille de portée de leur page (`404` et `merci` → `pages-legales.css`,
  `lexique-nuisibles` → `pages-nuisibles.css`). Fusionner vers `global.css`
  aurait au contraire cassé la cascade : ces règles sont des surcharges.

#### Le bandeau d'en-tête rendait à trois hauteurs différentes

Le HTML du header est identique sur les 28 pages depuis P1, mais il ne *rendait*
pas pareil : les liens de navigation et le bouton CTA mesuraient 44 px sur 17
pages, 40 px sur 10, et 36 px sur l'accueil. Deux causes, toutes deux par
héritage — aucune feuille ne redéfinit `site-header` ni `site-nav` :

- `.site-header` n'avait pas de `line-height`, il suivait donc celui que chaque
  page pose sur `body` (`1.6`, `1.65` ou `normal` selon la page). Corrigé par un
  `line-height: 1.6` explicite sur `.site-header`, qui couvre aussi le menu
  mobile, imbriqué dedans.
- `--font-heading` et `--font-body` étaient redéfinis dans huit feuilles avec une
  pile de repli plus courte (`'Poppins', sans-serif`). Sans effet là où la feuille
  charge avant `global.css`, mais `pages/index.css` charge après : l'accueil
  rendait son texte dans une autre police que les 27 autres pages. Les huit
  redéfinitions sont supprimées, la définition de `global.css` fait foi.

Mesuré après coup sur les 28 pages, à 1280 et 390 px : header, conteneur, nav et
CTA ont exactement les mêmes position, largeur et hauteur partout.

**Leçon générale :** une hauteur qui varie d'une page à l'autre sans qu'aucune
règle ne cible l'élément vient presque toujours d'un `line-height` hérité. Poser
la valeur explicitement sur le composant partagé, plutôt que de chercher la
surcharge.

#### Les composants partagés ne doivent hériter de rien

Le bandeau n'était pas un cas isolé. Un relevé des composants partagés sur les
28 pages, à vraie largeur de viewport, a montré la même dérive sur le pied de
page, le fil d'Ariane, le lien d'évitement et le bouton « retour en haut ».
Deux causes, toutes deux par héritage :

- `body { line-height }` vaut `1.6` dans sept feuilles de page, `1.65` dans
  celle de la FAQ, et n'est posé nulle part dans `global.css` — donc `normal`
  sur les onze pages restantes. Le pied de page passait de 391 à 426 px selon
  la page.
- **Le reset des marges par défaut n'existe que dans 17 des 28 feuilles.** Sur
  les onze autres, le navigateur appliquait ses valeurs propres au pied de
  page : marges sur `p` et `h3`, et surtout un `padding-left: 40px` sur les
  `<ul>`, qui décalait les colonnes de liens vers la droite.

Corrigé en figeant dans `global.css` le `line-height` de `.site-footer`,
`.breadcrumb`, `.skip-link`, `.back-to-top` et `.sticky-mobile-bar`, et en y
ajoutant un reset limité au pied de page (`.site-footer p/h3/ul`). Le corps de
texte des pages n'est pas touché : la règle 6 interdit la refonte visuelle non
demandée, et la divergence qui se voyait était celle des composants communs.

**Règle à suivre :** tout composant présent sur les 28 pages doit poser
lui-même ce dont il dépend — `line-height`, marges, `padding` de liste. S'il
hérite, il rendra différemment selon la feuille de la page qui le porte. Le
script de relevé est dans le scratchpad (`viewport/composants.js`), à rejouer
après toute modification de `global.css`.

#### Barre d'appel mobile — une seule, en HTML, sur les 28 pages

Le site en portait **deux** superposées. `main.js` injectait un
`<div class="mobile-call-bar">` sur chacune des 28 pages, pendant que 16 pages
déclaraient en plus un `<div class="sticky-mobile-bar">` dans leur HTML. Sur ces
16 pages les deux barres se chevauchaient en bas de l'écran ; sur les 12 autres,
le `body { padding-bottom: 76px }` de `global.css` réservait la place d'une barre
qui n'était que celle du JS.

Ce qui a été fait : l'injection JS est supprimée, `.sticky-mobile-bar` est ajoutée
au HTML des 12 pages qui ne l'avaient pas, et sa CSS — jusque-là recopiée dans six
feuilles avec des divergences de padding et de taille de police — vit maintenant
en un seul endroit dans `global.css`. Un `line-height: 1.6` explicite a été ajouté
sur `.sticky-call-btn` : sans lui, la hauteur variait de 69 à 72 px selon le
`line-height` hérité de la feuille de chaque page.

Mesuré page par page après coup : les 28 barres rendent `fixed`/`flex`, fond
`#FFFFFF`, padding 10 px, hauteur 71 px. **Ne pas réintroduire d'injection JS
pour cette barre** — même raison qu'en P1 pour le header.

Elle porte ensuite **deux** boutons, un par ligne téléphonique. Le fond et la
couleur du texte ne sont **pas** posés sur `.sticky-call-btn` : la section
« Boutons de conversion en vert » de `global.css` les impose en `!important` à
tous les CTA d'appel. La ligne principale garde donc le vert plein du système ;
la seconde est déclinée en contour via `.sticky-mobile-bar .sticky-call-btn--alt`
— sélecteur à deux classes, nécessaire pour passer devant ce bloc, la
spécificité seule ne suffisant pas puisqu'il est déclaré plus bas dans le
fichier. Sous 360 px l'icône disparaît plutôt que de tronquer le numéro.

En-tête : le second numéro apparaît à partir de **1320 px** seulement, et sans
icône. Le conteneur est plafonné à 1280 px ; marque + navigation + deux boutons
demandent 1209 px, il reste 31 px. Avec l'icône sur le second bouton, la marge
tombait à 7 px.

#### Mesurer une largeur de viewport réelle

`--window-size=390` **ne donne pas un viewport de 390 px** : Chrome headless a un
plancher de fenêtre à 500 px sur cette machine, et rend donc à 500. Toute
vérification « en mobile » faite ainsi teste une autre largeur que celle annoncée.
Passer par l'émulation CDP (`page.setViewport`) via `puppeteer-core`, installé
**hors du dépôt** — la contrainte « aucune dépendance npm » porte sur le site
livré, pas sur l'outillage de mesure, qui doit rester dans un répertoire externe.

#### Ce qui rend cette extraction risquée — à savoir avant d'y retoucher

Un attribut `style=""` a la **spécificité maximale** : il gagne contre tout
sélecteur. Le passer en classe fait donc gagner n'importe quelle règle qui
perdait avant, souvent de façon invisible. Trois pièges rencontrés :

- **Spécificité.** `.procedure-intro` (0,1,0) perd contre `.method-box p`
  (0,1,1), quel que soit l'ordre de chargement. Les modificateurs s'écrivent
  donc `.bloc.bloc--variante`, et les règles de contenu sont portées par un
  sélecteur descendant réel (`.form-group--consent label`), jamais par une
  classe seule qui perdrait la bataille.
- **Ordre de chargement.** Sur plusieurs pages, la feuille de la page est
  chargée **avant** `global.css` — héritage de la position du `<style>` d'origine,
  fidèlement conservée. Elle perd donc les égalités. Ne pas la déplacer : essayé
  sur `traitement-injection-bati-termites`, ça casse le padding du fil d'Ariane.
  Passer par la spécificité, qui est indépendante de l'ordre.
- **Collisions de noms.** `.faq-card` existait déjà dans `global.css`.
  Vérifier `grep -r ".<nom>" assets/css/` avant de créer une classe.

#### Variables CSS : toutes ne sont pas globales

`--accent-blue`, `--text-main`, `--text-muted`, `--border-color`, `--primary`
ne sont **pas** définies dans le `:root` de `global.css` — seulement dans
certaines feuilles de page. `--accent-blue` par exemple n'existe que sur 7 des
28 pages. Une règle mutualisée dans la partie « composants » de `global.css` ne
doit utiliser que les variables de son `:root` (`--primary-blue`, `--muted`, `--border`,
`--surface`, `--ink`, `--body-text`, `--font-heading`…), sinon la propriété est
invalide sur les autres pages, sans erreur visible.

#### Les `!important` de `global.css` — mesuré, ils restent nécessaires

31 occurrences. **L'hypothèse « vider l'inline les rendra inutiles » a été
testée, et elle est fausse.**

Une fois les 379 attributs `style=""` supprimés, retirer les 26 `!important` du
bloc des boutons de conversion a été essayé : le rendu change sur **28 pages sur
28**. Ils ne servaient pas seulement à passer devant l'inline. Neuf des dix
sélecteurs du bloc (`.btn-phone`, `.sticky-call-btn`, `.btn-devis`,
`.form-submit-btn`, `.ty-btn--primary`, `.err-btn--primary`…) sont redéfinis
dans `form.css` ou dans une feuille de `assets/css/pages/` chargée après
`global.css`. Ne pas retenter sans un plan qui traite ces redéfinitions.

Répartition actuelle :

- 4 relèvent de `prefers-reduced-motion` — légitimes ;
- 1 masque le menu mobile au-dessus de 1024px — non tranché ;
- 26 protègent le bloc des boutons verts — nécessaires, cf. ci-dessus.

Un seul a pu être retiré : `color: #fff !important` sur `.mobile-menu__cta`,
qui se battait contre une règle du **même fichier** (le bloc des boutons, plus
bas, gagnait déjà). Retrait vérifié sans effet, en 1280px **et en 390px** — la
largeur où ce menu est visible. Contrôler en desktop seul n'aurait rien prouvé.

### P3 — Cohérence SEO

- Balise `google-site-verification` encore en commentaire (`index.html`).
- `.htaccess` porte un « ⚠️ À COMPLÉTER avant la bascule du domaine » : les 301
  d'anciennes URLs sont partielles, à croiser avec l'export Search Console.
- `sitemap.xml` : `lastmod` identique partout (`2026-08-25`).
- Densité JSON-LD très variable (0 à 6 blocs) — normal pour `404`/`merci`,
  à vérifier pour `contact`, `mentions-legales`, `politique-confidentialite`
  (1 seul bloc chacune).

### P4 — Poids et médias

6 Mo d'images. Quatre fichiers dépassent 200 Ko et méritent une recompression :
`termites-ouvrieres-termitiere.{jpg,webp}`,
`degats-xylophages-tronc-arbre-corse.{jpg,webp}`.

### Déjà vérifié et conforme — ne pas « re-corriger »

- 0 lien interne cassé, 0 image référencée manquante.
- Exactement 1 `<h1>` par page.
- `noindex` correct sur `merci.html` et `404.html`.
- `sitemap.xml` cohérent avec les fichiers présents.
- Deux numéros de téléphone coexistent volontairement (140 vs 61 occurrences).

---

## 4. Conventions du code

### HTML

- `lang="fr"`, encodage UTF-8, textes et commentaires **en français**.
- Ordre du `<head>` : charset / theme-color / viewport → title + description +
  robots + canonical → Open Graph → Twitter → icônes + manifest → polices
  (preload puis `global.css`) → preload image LCP → CSS → JSON-LD.
- Classes en **BEM** : `site-header`, `site-header__inner`, `site-header__brand`,
  `site-nav__submenu`, modificateurs d'état en `is-` (`is-open`, `is-visible`).
- **Variantes mobiles.** Neuf photos ont une déclinaison `-760.webp`, servie par
  une `<source media="(max-width: 767px)">` placée **avant** la source normale —
  le navigateur retient la première dont le `media` correspond. Le choix de
  `media` plutôt que `srcset`/`sizes` est délibéré : il est déterministe et
  n'oblige pas à deviner une densité d'écran. Le `<link rel="preload" as="image">`
  de ces pages est dédoublé avec le même `media`, **sans quoi le mobile
  téléchargerait les deux fichiers** et la variante coûterait plus qu'elle ne
  rapporte. Seuil retenu : au moins 25 Ko d'économie, sinon la variante ne vaut
  pas le fichier supplémentaire.
- Images toujours en `<picture>` avec `<source type="image/webp">`, `alt` en
  français descriptif, `width`/`height` explicites.
- Accessibilité : `skip-link` en premier enfant du `<body>`, `aria-label` sur les
  repères, `aria-expanded` tenu à jour, `aria-hidden="true"` sur les SVG décoratifs.

### CSS

Design tokens dans `:root` de `global.css` — **toujours** passer par les variables :

```
--primary-blue #1A4DFB   --primary-blue-dark #0F37BE
--cta-green #22C55E      --cta-green-dark #12AE4C   --on-cta #06231A
--accent-green #0F7A38   --accent-green-bg #EAF7EC
--ink #0F172A   --body-text #334155   --muted #64748B   --muted-light #94A3B8
--border #E2E8F0   --surface #F8FAFC   --surface-blue #EDF2FF
--font-heading Poppins   --font-body Inter   --header-height 72px
```

Rôle des fichiers :

| Fichier | Portée |
|---|---|
| `global.css` | `@font-face`, reset, tokens, header, nav, cartes, CTA, animations, composants mutualisés, footer (28 pages) |
| `form.css` | formulaires (`contact`, `index`) |
| `pages-nuisibles.css` | fiches nuisibles (11 pages) ; porte aussi la surcharge de `lexique-nuisibles`, fusionnée depuis `pages/` |
| `pages-zones.css` | pages de zones (4 pages) |
| `pages-services.css` | pages de services (6 pages) |
| `pages-legales.css` | `mentions-legales`, `politique-confidentialite`, `merci`, `404` ; porte aussi les surcharges de `404` et `merci`, fusionnées depuis `pages/` |
| `page-accueil.css` | `index` uniquement |

Les `<link>` se posent dans cet ordre : `global` → fichier
de portée de la page. Le fichier de portée charge en dernier, donc il l'emporte
sur `global.css` à spécificité égale.

Mobile-first, breakpoint desktop de l’en-tête à `1200px` (aligné sur le `resize`
de `main.js` — les deux valeurs doivent rester identiques). Mesuré **en HTTP** :
la marque, la navigation et le bouton d’appel demandent 1190 px.
**Deux seuils faux ont été posés avant d’en arriver là, tous deux mesurés en
`file://`** : 1024 px à l’origine, puis 1120 px. Sans serveur, les `@font-face`
ne se chargent pas, tout rend en police système donc plus étroit, et le seuil
mesuré est trop bas — le numéro se retrouve coupé sur la bande entre le seuil
posé et le seuil réel. **Toute mesure de largeur doit se faire en HTTP.**
Un second bouton d’appel dans l’en-tête a été tenté puis retiré : avec les vraies
polices, marque + navigation + deux boutons demandent 1349 px alors que le
conteneur est plafonné à 1280 — il ne tient à aucune largeur. Le second numéro
reste dans la barre mobile, le pied de page et le menu mobile.
Les autres media queries à `1024px` (grilles de contenu, `footer-grid`) sont
indépendantes et restent à cette valeur.

### JavaScript

`main.js` est le **seul** fichier JS et doit le rester — et le seul endroit
où mettre un comportement partagé. Le gestionnaire du formulaire de devis y a
été rapatrié depuis `contact.html` et `index.html`, où il était recopié à
l'identique, et le chargeur de carte depuis `contact.html` et
`zones-dintervention.html`, même chose. Un correctif sur le formulaire demandait
jusque-là de modifier deux fichiers.
Un seul script reste en ligne, dans la FAQ : il gère le défilement vers une
ancre entrante. Il ne concerne qu'une page, et le déplacer l'activerait sur les
27 autres — c'est une raison suffisante pour le laisser où il est.
Tout bloc rapatrié doit porter une garde d'existence (`if (form)`) ou un
sélecteur qui ne fait rien à vide, puisque `main.js` s'exécute sur les 28 pages. Style : IIFE,
`"use strict"`, ES5 (`var`, `function`), pas de dépendance, garde d'existence
avant chaque `addEventListener`. Tout nouveau comportement s'ajoute comme un bloc
commenté dans ce fichier.

---

## 5. Procédure de modification d'un asset (obligatoire)

Les CSS sont référencés avec un hash de cache-busting. Après toute édition d'un
fichier de `assets/css/` ou `assets/js/`, recalculer et propager :

```sh
# 1. nouveau hash (8 premiers caractères du md5 du fichier)
h=$(md5sum assets/css/global.css | cut -c1-8)

# 2. propagation sur toutes les pages concernées
sed -i "s|global\.css?v=[a-f0-9]*|global.css?v=$h|g" *.html
```

Ne pas tenir de liste de hashes en dur : elle se périme à la première édition.
Propager sur tous les assets d'un coup, puis contrôler :

```sh
# propagation
for c in assets/css/*.css assets/css/pages/*.css assets/js/*.js; do
  n=197610basename ); h=197610md5sum  | cut -c1-8)
  sed -i "s|$n?v=[a-zA-Z0-9]*|$n?v=$h|g" *.html
done

# controle : le hash reference doit egaler le md5 reel du fichier
for c in assets/css/*.css assets/css/pages/*.css assets/js/*.js; do
  n=197610basename ); r=197610md5sum  | cut -c1-8)
  u=$(grep -oh "$n?v=[a-f0-9]*" *.html | sort -u | sed 's/.*v=//')
  [ "$r" = "$u" ] || echo "ECART $n : fichier=$r pages='$u'"
done
```

Une sortie vide au second bloc vaut validation. Une sortie non vide signale soit
un hash non propagé, soit deux valeurs différentes coexistant selon les pages.

Un CSS modifié sans hash mis à jour = correctif invisible pour les visiteurs
existants. C'est l'erreur la plus facile à commettre sur ce projet.

---

## 6. Vérifications avant de déclarer un travail terminé

À rejouer systématiquement — aucune n'exige d'outil externe :

```sh
# aucun chemin absolu (casserait tout sous le sous-chemin GitHub Pages)
grep -oh '\(href\|src\|srcset\)="/[^"]*"' *.html

# aucun style dans le HTML
grep -l '<style\| style="' *.html

# liens internes et assets : chaque cible referencee doit exister
grep -oh '\(href\|src\)="[^"]*"' *.html \
  | sed 's/^[a-z]*="//;s/"$//;s/?.*//;s/#.*//' \
  | grep -v '^https\?:\|^mailto:\|^tel:\|^data:\|^$' | sort -u \
  | while read f; do [ -e "$f" ] || echo "CIBLE MANQUANTE: $f"; done

# aucune classe utilisee sans definition CSS
grep -oh 'class="[^"]*"' *.html | sed 's/class="//;s/"//' | tr ' ' '\n' \
  | sort -u | while read c; do
      [ -z "$c" ] || grep -rqF ".$c" assets/css/ || echo "CLASSE NON DEFINIE: .$c"
    done

# Seule sortie attendue : .contact-footer, pose sur les blocs <footer> de
# contenu de 4 pages. Sans CSS ni JS associe, c'est un simple repere semantique.

# un seul h1 par page
for f in *.html; do n=$(grep -c "<h1" $f); [ "$n" = 1 ] || echo "H1=$n $f"; done

# canonical présent (sauf 404 et merci)
for f in *.html; do grep -q 'rel="canonical"' $f || echo "SANS CANONICAL: $f"; done

# divergence header / footer
for f in *.html; do echo "$(sed -n '/<header class="site-header"/,/<\/header>/p' $f | md5sum | cut -c1-8) $f"; done | sort | uniq -c -w8
for f in *.html; do echo "$(sed -n '/<footer class="site-footer"/,/<\/footer>/p' $f | md5sum | cut -c1-8) $f"; done | sort | uniq -c -w8

# cohérence des hashes de cache-busting
grep -oh 'assets/[a-z]*/[a-z-]*\.[a-z]*?v=[a-f0-9]*' *.html | sort | uniq -c
```

Le contrôle header/footer converge vers **une seule** ligne pour le header et
**une seule** pour le footer depuis P1 : toute sortie à plusieurs lignes est une
régression. Le motif du footer est bien `<footer class="site-footer"` — utiliser
`<footer` tout court agrège les blocs de contenu des 5 pages listées en §3 et
produit un faux positif.

### Comparer le rendu avant / après une modification CSS

```sh
tools/compare-rendered-styles.sh                 # compare a HEAD, en 1280px
tools/compare-rendered-styles.sh HEAD~3 390      # autre reference, autre largeur
```

Chrome headless relève ~50 propriétés calculées et la boîte de chaque élément
sur les 28 pages (~9000 éléments), dans l'état courant et dans un worktree Git
de référence, et signale toute divergence. C'est ce contrôle qui a permis
d'extraire 379 attributs `style=""` sans régression : il a attrapé une perte
d'`object-fit` sur 20 images, une collision de nom de classe, et trois pertes de
bataille de spécificité — aucune n'était visible sans mesure.

**Rejouer a plusieurs largeurs.** Les media queries du site couvrent une
trentaine de points de bascule : une regression peut n'exister qu'a une seule
largeur. Au minimum 390, 768, 1024 et 1280. Le chantier CSS a ete valide aux
quatre.

**Ne pas comparer par capture d'écran.** Mesuré sur ce dépôt : 14 pages sur 28
donnent deux images différentes sans aucune modification (lazy-loading, polices).

Deux sources de bruit connues dans le comparateur lui-même : le point pulsant de
`guepes-et-frelons` (box-shadow animé) diverge toujours, et une section de
l'accueil diverge environ 1 fois sur 10. **Tout écart isolé doit être re-mesuré
page par page avant d'être traité comme une régression.**

Vérifier aussi visuellement, a minima : accueil, une fiche nuisible, une page de
zone, `contact` (envoi du formulaire compris), en mobile et en desktop.

---

## 7. Méthode de travail attendue

- **Par lots homogènes, pas page par page.** Ces 28 fichiers sont des variations
  d'un même gabarit : utiliser `sed`/scripts sur l'ensemble, puis vérifier avec §6.
  Une correction appliquée à une seule page recrée exactement la divergence
  qu'on cherche à supprimer.
- **Un commit par nature de changement** (normalisation du footer, extraction du
  CSS inline, recompression des images…), jamais un commit fourre-tout : en
  statique, le diff HTML est le seul filet de sécurité.
- **Annoncer avant d'agir** sur tout ce qui touche les URLs, le `.htaccess` ou
  le `sitemap.xml` : l'impact porte sur le référencement en production, pas sur le code.
- Messages de commit en français, à l'impératif
  (`Normalise le footer sur les 28 pages`).

---

## 8. Contexte de production

- Domaine canonique : `https://dezinsect-corse.fr` (sans `www`, HTTPS forcé).
- URLs servies **sans** `.html` — toujours écrire les liens internes en `/page`.
- Hébergement Apache mutualisé ; `.htaccess` est la seule configuration serveur.
- Le site a migré depuis un ancien builder : les 301 de `.htaccess` protègent
  l'historique de référencement. Ne jamais en supprimer une sans preuve qu'elle
  est devenue inutile.
 | sort -u \n  | while read f; do [ -e "" ] || echo "CIBLE MANQUANTE: "; done

# images référencées absentes
grep -oh 'src="/images/[^"]*"' *.html | sed 's|src="/||;s|"||' | sort -u \
  | while read i; do [ -f "$i" ] || echo "IMAGE MANQUANTE: $i"; done

# un seul h1 par page
for f in *.html; do n=$(grep -c "<h1" $f); [ "$n" = 1 ] || echo "H1=$n $f"; done

# canonical présent (sauf 404 et merci)
for f in *.html; do grep -q 'rel="canonical"' $f || echo "SANS CANONICAL: $f"; done

# divergence header / footer
for f in *.html; do echo "$(sed -n '/<header class="site-header"/,/<\/header>/p' $f | md5sum | cut -c1-8) $f"; done | sort | uniq -c -w8
for f in *.html; do echo "$(sed -n '/<footer class="site-footer"/,/<\/footer>/p' $f | md5sum | cut -c1-8) $f"; done | sort | uniq -c -w8

# cohérence des hashes de cache-busting
grep -oh 'assets/[a-z]*/[a-z-]*\.[a-z]*?v=[a-f0-9]*' *.html | sort | uniq -c
```

Le contrôle header/footer converge vers **une seule** ligne pour le header et
**une seule** pour le footer depuis P1 : toute sortie à plusieurs lignes est une
régression. Le motif du footer est bien `<footer class="site-footer"` — utiliser
`<footer` tout court agrège les blocs de contenu des 5 pages listées en §3 et
produit un faux positif.

Vérifier aussi visuellement, a minima : accueil, une fiche nuisible, une page de
zone, `contact` (envoi du formulaire compris), en mobile et en desktop.

---

## 7. Méthode de travail attendue

- **Par lots homogènes, pas page par page.** Ces 28 fichiers sont des variations
  d'un même gabarit : utiliser `sed`/scripts sur l'ensemble, puis vérifier avec §6.
  Une correction appliquée à une seule page recrée exactement la divergence
  qu'on cherche à supprimer.
- **Un commit par nature de changement** (normalisation du footer, extraction du
  CSS inline, recompression des images…), jamais un commit fourre-tout : en
  statique, le diff HTML est le seul filet de sécurité.
- **Annoncer avant d'agir** sur tout ce qui touche les URLs, le `.htaccess` ou
  le `sitemap.xml` : l'impact porte sur le référencement en production, pas sur le code.
- Messages de commit en français, à l'impératif
  (`Normalise le footer sur les 28 pages`).

---

## 8. Contexte de production

- Domaine canonique : `https://dezinsect-corse.fr` (sans `www`, HTTPS forcé).
- URLs servies **sans** `.html` — toujours écrire les liens internes en `/page`.
- Hébergement Apache mutualisé ; `.htaccess` est la seule configuration serveur.
- Le site a migré depuis un ancien builder : les 301 de `.htaccess` protègent
  l'historique de référencement. Ne jamais en supprimer une sans preuve qu'elle
  est devenue inutile.
