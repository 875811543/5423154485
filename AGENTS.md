# AGENTS.md — Dezinsect Corse

Instructions de travail pour tout agent intervenant sur ce dépôt.
Objectif du chantier : **réorganiser, nettoyer et fiabiliser** le site sans jamais
dégrader le SEO ni le rendu, qui sont déjà de bon niveau.

---

## 1. Ce qu'est ce projet

Site vitrine **statique** d'une entreprise de lutte anti-nuisibles en Corse.
Aucun build, aucune dépendance npm, aucun framework. Ce qui est dans le dépôt
est exactement ce qui est servi.

- **67 pages HTML** à la racine, au 1er octobre 2026 : 1 accueil, 10 services et
  pages piliers, 4 zones, **29 pages « service + ville »**, 10 fiches nuisibles
  plus le lexique, 5 actualités, l’outil d’identification, contact, merci, 2 pages
  légales, la FAQ et 404.
  **62 sont au `sitemap.xml`** ; les cinq autres sont hors index par choix —
  `404`, `merci`, les deux pages légales, et `traitement-odeurs` dont le service
  n'est pas lancé.

  **Les passages ci-dessous qui parlent de « 28 pages » décrivent des chantiers
  menés quand le site en comptait 28.** Ils gardent ce chiffre parce qu'il dit ce
  qui a été mesuré à l'époque — mais toute commande à relancer aujourd'hui porte
  sur les 67, et un `sed` sur `*.html` en touche 67.
- **Liens internes sans extension.** Les `href` internes s'ecrivent
  `deratisation`, pas `deratisation.html` ; l'accueil s'ecrit `./`. Le
  `.htaccess` sert `page.html` quand on demande `/page`, et redirige
  `/page.html` vers `/page` en 301 : ecrire les liens en `.html` faisait
  donc payer une redirection a chaque clic et a chaque passage de robot,
  sur 2057 liens. Ils restent **relatifs** — la regle 7 tient toujours.
  Consequence assumee, tranchee par le proprietaire du site : l'apercu
  GitHub Pages, servi sous un sous-chemin, ne resout plus ces liens. Seul
  `dezinsect-corse.fr` fait foi.
- Le serveur de test (`scratchpad/viewport/serveur.js`) rejoue cette
  reecriture. Sans cela toute mesure de navigation faite en local est
  fausse : il repondait 404 la ou Apache sert la page.

- `tarifs-anti-nuisibles-corse` vise le groupe « prix / tarif / devis ».
  **Deux montants sont publiables, et deux seulement : « à partir de 100 € »
  pour un nid de guêpes ou de frelons, et « 15 à 30 €/m² » pour la protection
  préventive d’une charpente — ce dernier donné par le propriétaire le
  21 septembre 2026.** Ne jamais y ajouter d’autre fourchette, d’ordre de
  grandeur ni de prix « indicatif », en particulier pour la dératisation — ce sont des
  informations d’entreprise, voir règle 3. Le script de génération vérifie
  qu’aucun autre montant en euros n’apparaît sur la page.
  Elle est citée dans le sous-menu « Nos services » et dans la colonne « Infos
  pratiques » du pied.

### La navigation, au 3 octobre 2026

Premier niveau, dans cet ordre, puis les deux boutons d’appel :

> **Nos services ▾ · Nos zones ▾ · Guide des nuisibles ▾ · Infos pratiques ▾ ·
> Contact**

- « Accueil » n’y figure plus : le logo y mène, et porte pour cela un
  complément « , accueil » réservé aux lecteurs d’écran
  (`.visuellement-cachee`). Pas d’`aria-label` : les trois de l’en-tête ont été
  retirés à dessein, et un `aria-label` ne contenant pas le texte visible
  « DezinsectCorse » casserait le critère « label dans le nom ».
- « Guide des nuisibles » porte `identifier-nuisible`, `lexique-nuisibles` et
  les douze fiches ; « Infos pratiques » porte la FAQ, les actualités et le
  calendrier. Les deux remplacent l’ancien « Ressources », lui-même issu de
  « Lexique ».
- `aria-current="page"` est posé **à deux endroits** : le lien, et son parent
  (`<button>` en bureau, `<summary>` en mobile) — sans quoi, menu replié, rien
  n’indique où l’on est. Le contrôle `nav-courante` compte les deux séparément.
- Les entrées de premier niveau n’ont **pas** d’icône — les `<svg>` qu’on y voit
  sont les chevrons des sous-menus.

**Le seuil de bascule bureau vaut 1220 px**, et c’est un minimum mesuré : 17 px
de marge, 1216 px ne passe plus. Il est posé **aux deux endroits**, la media
query de `global.css` et le `resize` de `main.js`, qui doivent rester
identiques. Le commentaire qui l’accompagne dans `global.css` décrit les trois
façons de se tromper en le mesurant, rencontrées toutes les trois ici — à lire
avant d’y toucher.

### Le pied de page, au 3 octobre 2026

Fond bleu nuit (`--ink`), texte clair, **toutes les combinaisons au niveau AA**
mesurées sur le fond *effectif* — les pastilles et le bandeau sont en `rgba`,
lire la couleur déclarée ne suffit pas. Quatre blocs : bandeau d’appel, bloc
d’identité, quatre colonnes de liens, barre finale.

**Les quatre colonnes sont des `<details>` OUVERTS dans le HTML, et c’est
`main.js` qui les replie sous 768 px.** L’inverse — fermés dans le HTML,
rouverts en CSS au-dessus de 768 px — ne fonctionne pas, et c’est le piège à
retenir :

> Chrome masque le contenu d’un `<details>` fermé par `content-visibility` sur
> un slot interne. **Aucune déclaration `display` d’auteur ne le lève.** Quatre
> parades ont été mesurées ; seul `::details-content` y parvient, et il est trop
> récent pour qu’on en dépende.

Conséquence assumée : **sans JavaScript, le mobile voit les quatre colonnes
dépliées.** C’est plus long, mais tout reste atteignable — l’inverse aurait
rendu quarante liens invisibles.

**Le soulignement des liens du pied ne s'applique qu'avec un pointeur qui
survole** : `@media (hover: hover) { .site-footer a:hover { … } }`. Sur écran
tactile, `:hover` reste collé au dernier élément touché — un lien restait
souligné après un tap, « contrairement aux autres ». Reproduit en tactile
émulé (`none` → `underline`) avant d'être corrigé, éprouvé dans les deux sens
après : le tap ne souligne plus, la souris souligne toujours.

Les groupes du pied portent leurs liens de **contenu** seulement. Une page de
service n'a pas sa place dans « Zones d'intervention » (c'était le cas de
« Termites en Costa Verde »), ni une page d'information dans « Nuisibles
traités » : la mérule est sous « Infos pratiques », libellée « Mérule
(information) ».

Deux autres choses à savoir :

- le bouton du bandeau **ne porte pas `.btn-devis`**. Cette classe ne reçoit du
  bloc des boutons verts que le fond et la couleur, en `!important`, et aucune
  mise en page : c’est elle qui avait livré un lien souligné sur fond vert à
  l’accueil. Le bouton du pied pose donc sa mise en page en entier ;
- sa cible **diffère sur trois pages**. Sur `contact`, `index` et
  `identifier-nuisible`, qui portent déjà le formulaire, il y descend par une
  ancre locale au lieu de recharger `contact`. C’est la seule différence entre
  les 67 pieds, et le contrôle `entete-pied` la normalise avant de comparer,
  comme il le fait d’`aria-current`.
- `etat-parasitaire-termites-corse` vise le groupe réglementaire (« état
  parasitaire », « diagnostic termites obligatoire vente », « commune déclarée
  infestée »). **Elle dit explicitement que nous ne réalisons pas le diagnostic
  réglementaire** et vise le traitement curatif qui le suit : l’état parasitaire
  exige une certification de diagnostiqueur distincte du Certibiocide. Ne pas
  retourner ce cadrage sans vérifier que l’entreprise détient cette
  certification — ce serait revendiquer une qualification qu’elle n’a peut-être
  pas, sur une page qui parle d’un document annexé à un acte de vente.
- Les **29 pages service + ville** (dératisation, désinsectisation, cafards, termites,
  moustiques, guêpes et frelons, traitement du bois, déclinés sur Bastia, Ajaccio,
  Porto-Vecchio, Calvi, Corte, Aléria, Ghisonaccia, Folelli, Solenzara, la
  Balagne, l'Alta Rocca, la Costa Verde, Moriani, Borgo-Biguglia) visent
  les requêtes « service + ville », que les pages de zones ne couvraient pas.
  Elles réutilisent `pages-zones.css` sans une règle nouvelle. **Ne pas en
  décliner mécaniquement pour les 53 communes** : le contenu doit être
  réellement propre à chaque ville, sinon Google les traite comme du
  remplissage et elles affaiblissent les pages existantes.
- **CSS** dans `assets/css/` : 4 feuilles partagées (`global.css` faisant socle —
  il regroupe les anciens `fonts.css`, `components.css` et `footer.css` —, plus
  `form.css` et les feuilles `pages-*.css` par famille de pages), plus une
  feuille par page dans `assets/css/pages/`. **Aucun `<style>` ni attribut `style=""` dans le HTML.**
- **1 fichier JS**, `assets/js/main.js` (480 l., ES5, IIFE, sans dépendance).
- **Polices auto-hébergées** en woff2 (Inter + Poppins) — aucun appel à Google.
- **Images** en doublons `.jpg` + `.webp` servis via `<picture>`.
- **Aucun service tiers chargé au premier rendu.** La carte Google et toute vidéo
  passent par une façade : l’iframe n’est créée qu’au clic. Mesuré : un `<iframe>`
  YouTube coûte **4,2 Mo et 17 requêtes**, dont `googleads.doubleclick.net` et
  `static.doubleclick.net` — des traceurs publicitaires qui déposent des cookies
  avant tout consentement. La façade coûte 0 Ko tant que personne ne clique.
  Les logos de réseaux sont des **SVG inline**, jamais des images distantes.
  **Le logo est en `.png` + `.webp` et porte de la transparence.** Son WebP avait
  été encodé sans canal alpha : les coins transparents s’étaient aplatis sur du
  noir, et comme le navigateur préfère le WebP, un cadre noir entourait le logo
  sur les 28 pages. Réencodé en `cwebp -lossless -exact`. Contrôle après toute
  régénération : `webpinfo images/logo-icone.webp` doit afficher `Alpha: 1`.
  **Sa taille d’affichage est posée en CSS** (`.site-header__logo`), pas par les
  attributs `width`/`height` du HTML, qui décrivent le fichier. Sans cette règle
  le logo rend en 96×96 et déborde d’un bandeau haut de 72 px.
- **Une seule cible de déploiement.** `https://dezinsect-corse.fr`, **à la
  racine**, chez **Hostinger** — mutualisé sous LiteSpeed, qui lit les
  `.htaccess` nativement. C'est ce que déclarent tous les `canonical`, le
  `sitemap.xml` et le JSON-LD.
  **Le déploiement est automatique depuis GitHub** — mis en place le 2 septembre
  2026. Hostinger déploie la branche `main` vers `public_html` à chaque
  publication. **Un `git push` met le site en ligne**, sans archive à fabriquer
  ni téléversement dans hPanel.

  Ce que cela change pour une session qui travaille ici : **pousser est un acte
  public**, plus un enregistrement local. Les 41 contrôles doivent passer avant
  le push, pas après, et une page à moitié écrite ne se commite pas « pour la
  nuit ». Vérifier après coup se fait en interrogeant le site réel — les treize
  pages ajoutées le 2 septembre étaient en ligne avant même qu'on pense à les
  téléverser.

  **Cette règle a cédé deux fois**, une fois en poussant un contrôle rouge
  connu, une fois en poussant un sitemap périmé faute d'avoir relancé le
  générateur. Les deux sont partis en ligne. Une règle qui repose sur la
  mémoire finit par céder, donc elle est désormais mécanique :
  `.githooks/pre-push` refuse la publication tant que `tools/controle.js`
  n'est pas vert. Le hook est versionné, mais Git ne le branche pas tout
  seul — **une fois par clone** :

  ```bash
  git config core.hooksPath .githooks
  ```

  `git push --no-verify` l'outrepasse. C'est pour les cas où l'on sait
  précisément pourquoi, pas pour se débarrasser d'un rouge gênant.

  **Un second hook, `.githooks/pre-commit`, bloque plus tôt.** Il lance
  `tools/verifie-dates.js`, qui applique la règle ci-dessous.

### Toute modification de contenu impose de bouger la date, dans le même commit

**Dès qu'on touche au contenu principal d'une page** — c'est-à-dire à autre
chose que l'en-tête, le pied de page, la barre d'appel mobile ou les
empreintes `?v=` —, il faut porter la date du jour **aux deux endroits** :

- `"dateModified"` dans le JSON-LD ;
- la mention visible `<time class="maj-date" datetime="…">…</time>`, dont le
  texte lisible doit dire la même chose que l'attribut.

Les deux vont ensemble et dans **le commit qui change le contenu**, pas dans
un commit de rattrapage.

**Pourquoi c'est mécanisé plutôt que laissé à la vigilance :** l'oubli s'est
produit **trois fois** — `merule` et `moustiques-corse` le 24 septembre 2026,
`capricorne-des-maisons` le 26. À chaque fois le hook de pre-push a refusé la
publication, mais après coup, sur un commit déjà écrit qu'il a fallu compléter
d'un second.

**Et pourquoi `pre-commit` ne relance pas `tools/controle.js` :** son contrôle
`articles-lexique` compare `dateModified` à la date du dernier commit de fond,
lue dans `git log`. Avant le commit, cette date est encore celle du commit
**précédent** — le contrôle passe. Vérifié sur le cas réel : un changement de
fond mis en scène avec une date périmée ressort vert. Un pre-commit qui se
contenterait de rejouer `controle.js` serait **du code mort qui se donne l'air
d'un contrôle**, le pire cas, puisqu'il rassurerait.

`tools/verifie-dates.js` raisonne autrement : il compare la version **HEAD** du
fichier à celle de **l'index**, sans passer par `git log`. Éprouvé sur six cas —
date périmée (refuse), date à jour (passe), `datetime` correct mais texte
visible incohérent (refuse), changement limité à l'en-tête (passe), changement
limité à une empreinte `?v=` (passe), page sans date modifiée (passe).

Un piège rencontré en l'écrivant, et corrigé : `git show ":fichier"` désigne
l'index, mais la révision passée au script était déjà `':'`, ce qui produisait
`"::fichier"`. Git refusait, la lecture renvoyait `null`, et le script sautait
**toutes** les pages en silence. Il ne se déclenchait jamais. C'est pour cela
qu'il faut éprouver un contrôle avant de lui faire confiance.

`git commit --no-verify` l'outrepasse.

  **La bascule a eu lieu le 2 septembre 2026 au matin.** Ce qui suit décrit la
  version qu'elle a remplacée, et reste utile pour comprendre d'où vient le
  travail fait ici :

  - La version en ligne enferme **tout son contenu dans une `<iframe srcdoc>`**.
    Mesure page par page dans un navigateur réel : **164 mots indexables** sur
    l'ensemble du site, contre 6 037 enfermés dans les iframes. Quatorze de ses
    seize pages n'ont **aucun titre** dans leur propre document, pas même un
    `h1`. Une recherche sur la chaîne `dezinsect-corse.fr` ne remonte aucune de
    ses pages — pas même pour son propre nom de domaine.
  - Ce dépôt sert **43 621 mots** et 762 titres, tous dans le document de leur
    page, sans iframe et sans JavaScript. C'est la correction de ce défaut, et
    c'est ce qui rend le référencement possible plutôt que meilleur.
  - Le sitemap de cette version déclarait seize adresses, dont **six n'existaient
    plus ici**. Elles sont redirigées dans le `.htaccess` — les six redirections
    ont été vérifiées en ligne le 2 septembre, chacune arrivant sur la bonne cible — voir le bloc de redirections et
    son commentaire, qui explique comment la liste a été établie sans Search
    Console et ce qu'elle ne peut pas couvrir.
  - **Rien du site en ligne n'a été perdu**, vérifié le 1er septembre 2026. Son
    texte a été extrait des seize pages dans un navigateur — il est dans une
    iframe, donc illisible autrement — puis comparé mot à mot à l'ensemble du
    dépôt, sans liste préétablie : tous les mots distinctifs d'un côté, présence
    de chacun de l'autre. Sur 2 800 mots testés, quatre manquaient. Deux
    micro-régions ont été remises (piémont casinquais, Gravona) ; deux relèvent
    du propriétaire et sont portées à la liste de mise en ligne (les chenilles
    processionnaires, service vendu en ligne et absent ici ; la marque MABI du
    matériel, nommée six fois en ligne). Le reste des écarts était de la
    reformulation. **Ne pas refaire cette comparaison** — et si un mot du site
    en ligne semble manquer, chercher la reformulation avant de conclure : trois
    fausses alertes sur quatre venaient de là (« déclaration en mairie » contre
    « déclarer le foyer en mairie »).

  Un ancien domaine, `dezinsect20.fr`, remonte encore en première position sur
  la marque mais **ne résout plus en DNS**, ni avec ni sans `www`. Le premier
  résultat sur le nom de l'entreprise est donc un lien mort. Savoir si le
  propriétaire possède encore ce domaine reste une question ouverte.
  La préversion GitHub Pages (`https://875811543.github.io/5423154485/`, servie
  sous un sous-chemin et sans réécriture) **n'est plus une cible**. Décision du
  propriétaire du site, prise en connaissance de cause quand les liens internes
  sont passés en URL sans extension : ces liens n'y résolvent plus. Elle reste à
  couper côté réglages du dépôt.
  Les chemins du site restent néanmoins **relatifs** (`assets/...`,
  `images/...`, `deratisation`) — voir règle 7. Ce n'est plus pour la
  préversion, c'est parce que rien n'oblige à des chemins absolus et qu'un
  chemin relatif ne peut pas casser en changeant de racine.
- **Le `.htaccess` est bien dans le dépôt**, suivi depuis le commit initial, et
  il porte la réécriture d'URL. C'est lui qui rend valides les URLs sans `.html`
  utilisées par les `canonical`, le `sitemap.xml` et le JSON-LD : sa dernière
  règle sert `page.html` quand `/page` est demandé, et une règle précédente
  redirige `/page.html` vers `/page` en 301 pour éviter le contenu dupliqué.
  **Ne pas ajouter de `.html` aux URLs canoniques** en croyant corriger quelque
  chose : elles sont correctes pour la cible réelle.
  Deux réserves à garder en tête :
  - **Rien ne fonctionne sans ce `.htaccess`.** Depuis que les liens internes
    sont sans extension, un hébergement qui ne le lit pas sert un site dont
    toute la navigation renvoie 404. LiteSpeed (Hostinger) le lit ; GitHub
    Pages non. À vérifier en premier si la navigation casse après un
    changement d'hébergement.
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
hérite, il rendra différemment selon la feuille de la page qui le porte.
Pour le vérifier après une modification de `global.css`, relever les propriétés
calculées des composants partagés sur les 28 pages et comparer — la recette est
en §6, « Mesurer dans un navigateur ».

#### Et un composant partagé se style dans `global.css`, jamais dans une feuille de page

**Règle absolue, et elle a mordu trois fois.** Dès qu'une classe sert sur
**plus d'une page**, sa mise en page va dans `global.css`. Une feuille de
`assets/css/pages/` ne décrit que ce qui est propre à **sa** page.

Les trois fois :

1. `.sticky-mobile-bar` était recopiée dans six feuilles, avec des divergences
   de padding et de taille de police ;
2. la règle de la bulle WhatsApp vivait dans `pages/index.css` : elle ne
   s'appliquait donc qu'à l'accueil, et la bulle mesurait 48 px là et 56 px
   sur les 64 autres pages ;
3. **`.btn-phone`** — le cas le plus coûteux. Sa mise en page vivait dans
   `services-anti-nuisibles.css`, `zones-dintervention.css` et
   `questions-frequentes-….css`, donc **absente de la quatrième page** qui
   utilise la classe. L'outil d'identification a livré en production des
   boutons carrés au texte souligné, avec des icônes à 300 px.

Deux pièges à connaître avant de centraliser :

- **L'ordre de chargement décide.** Les quatre pages qui portent `.btn-phone`
  chargent leur feuille **avant** `global.css` : à spécificité égale, c'est
  `global.css` qui gagne. Monter dans `global.css` une propriété dont la valeur
  **diffère** d'une page à l'autre ne la centralise pas, cela **écrase** les
  écarts. Ne monter que les propriétés dont les valeurs mesurées sont
  identiques ; laisser les autres dans la feuille de page, avec un commentaire
  qui dit pourquoi.
- **Beaucoup de ce qu'une feuille de page déclare est déjà mort.** Les trois
  feuilles posaient `background-color: var(--accent-blue)`, `color: #FFFFFF`,
  `box-shadow` et `transition` sur `.btn-phone` : le bloc des boutons verts de
  `global.css` les impose en `!important`, donc rien de tout cela ne
  s'appliquait. Mesuré : les quatre boutons rendent `rgb(34, 197, 94)`, pas du
  bleu. Le relevé a permis d'en retirer **27 déclarations** sans toucher au
  rendu.

Le chantier de centralisation s'est vérifié ainsi : relevé de **7 569
propriétés calculées** sur les quatre pages, à 360, 412 et 1280 px, avant et
après. **Douze écarts, tous sur `align-items` et `justify-content` de
`zones-dintervention`**, qui passent de `normal` à `center` — sans effet, son
bouton étant en `display: block`, et les boîtes ne bougeant pas d'un pixel.

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

### Sous 768 px, la barre du bas est le seul appel — règle du 8 octobre 2026

Là où la barre d'appel du bas est visible (sous 768 px), **toutes les paires
d'appel Dumé / Antoine du contenu sont masquées** : blocs d'appel (`.cta-final`,
`.action-cta-box`, `.cta-block`, `.cta-mobile`), appels en ligne
(`.inline-call-wrapper`), hero, pastilles d'appel du pied et boutons des fiches
d'identification. **Au-dessus, rien ne change.** Les quatre emplacements du
tableau ci-dessous restent vrais : en bureau il n'y a pas de barre du bas, donc
les paires y sont nécessaires.

- **Les seuils** : la barre se masque à `min-width: 768px`, les paires à
  `max-width: 767px`. Deux media queries, parce qu'une media query ne lit pas de
  variable CSS — et inverser la barre (cachée par défaut) toucherait un
  composant qui marche. Elles sont **dans `global.css`, côte à côte dans le
  fichier**, et le contrôle `appels-mobile` les compare. Mesuré au bord : à
  767 px la barre est visible et les paires masquées, à 768 px l'inverse.
- **Un bloc d'appel ne reste jamais vide** : à côté de chaque paire, le HTML porte
  `<a class="appel-devis" href="…">Demander un devis</a>`, invisible en bureau,
  vert sous 768 px. L'ancre est `#dezinsectContactForm` sur `index`, `contact`
  et `identifier-nuisible` (qui portent le formulaire), `contact#dezinsectContactForm`
  ailleurs — la même règle que le bouton du pied.
- **Spécificité** : le masquage et `.appel-devis` sont écrits `body …` /
  `body a.appel-devis`. Sans cela, `.cta-block a` (feuille `pages-services.css`)
  imposait son propre `display` au bouton et le rendait visible en bureau —
  constaté sur `traitement-injection-bati-termites`, en mesure, pas en lecture.
- **Ce qui reste volontairement** : les liens `tel:` en prose (« appelez-nous au… »),
  la ligne du bloc `.contact-footer`, la barre « URGENCE NID » de
  `guepes-et-frelons`, les boutons uniques des pages 404 et merci, la liste de
  `contact`. Ce sont des liens isolés, pas des paires Dumé / Antoine.
- **Fiches d'identification** : seules les deux pastilles `.btn-phone` de chaque
  encart sont masquées ; « Remplir la fiche » et l'envoi de photo restent, donc
  l'encart garde une action.
- **Piège de mesure** : sur `identifier-nuisible`, mesurer la **visibilité** des
  boutons des fiches conclut qu'ils sont masqués en bureau aussi — l'outil cache
  les fiches non choisies. Mesurer le `display` calculé.

### Les deux lignes téléphoniques : où elles doivent figurer

**Règle en vigueur depuis le 24 septembre 2026 : les deux numéros, à quatre
endroits.**

| Emplacement | 06 85 75 30 40 | 06 29 42 16 38 |
|---|---|---|
| Bandeau de bureau (`.site-header__cta` / `.site-header__cta2`) | ✅ en premier | ✅ |
| Menu mobile (`.tel-pair`) | ✅ | ✅ |
| Barre d'appel mobile (`.sticky-mobile-bar`) | ✅ | ✅ |
| Pied de page | ✅ | ✅ |

Plus le bloc d'appel de l'accueil (`.btn-call`), qui porte les deux également.
**Toujours en lien `tel:`**, jamais en texte brut.

Les deux pastilles du bandeau sont traitées **à égalité** — même fond, même
couleur, même poids — et tiennent côte à côte parce que leur remplissage
horizontal est ramené de 18 à 14 px. Mesuré en HTTP : 148 + 146 px pour les deux
boutons, et il reste 139 px de libre à 1280 px, 59 px à 1200 px. La navigation
tient sur **une seule rangée** à toutes les largeurs où elle est visible.

Sous 1200 px le bloc entier disparaît au profit du menu mobile : c'est voulu,
la barre d'en-tête ne doit pas être surchargée sur petit écran. À 1024 et
768 px il n'y a donc rien à faire tenir — le burger est seul.

**Cette règle a changé deux fois le même jour** : le bandeau est d'abord passé
à un seul numéro (le second diluait l'appel à l'action), puis est revenu aux
deux sur décision du propriétaire. Ne pas « rationaliser » dans un sens ou dans
l'autre sans le lui demander. Le contrôle `lignes-tel` fige la version en
vigueur, y compris l'ordre des deux boutons.

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

Répartition actuelle dans `global.css` (26 ; le dépôt en compte 34 en tout,
les 8 autres étant dans des feuilles de page) :

- 4 relèvent de `prefers-reduced-motion` — légitimes ;
- 1 masque le menu mobile au-dessus de 1024px — non tranché ;
- 1 est `[hidden] { display: none !important }` — **exception assumée**, voir
  ci-dessous ;
- le reste protège le bloc des boutons verts — nécessaires, cf. ci-dessus.

#### `[hidden]` : l'exception assumée

```css
[hidden] { display: none !important; }
```

C'est le seul `!important` que ce dépôt pose **par principe** et non pour
sortir d'une bataille de spécificité précise. L'usage est reconnu : la règle du
navigateur est `[hidden] { display: none }`, de spécificité (0,1,0), et
**n'importe quelle classe d'auteur la bat**. Un composant qui déclare
`display: flex` reste donc affiché alors que le script vient de poser `hidden`
dessus — et rien ne le signale.

Le défaut s'est produit **trois fois** ici, toujours de la même façon. Le cas
qui a décidé de la règle : `.ident-statut` et `.ident-fil` portent
`display: flex`, et laissaient une barre bleu pâle vide de 328 × 24 px sous le
sélecteur de profil de l'outil d'identification, à l'étape 1, dans les deux
profils.

**Vérifié avant d'être posée**, et c'est la condition à reproduire si on y
touche : relevé sur les 67 pages, à 390 et 1280 px, des éléments portant
`hidden` et pourtant rendus. **Aucun.** La règle ne masque donc rien de
volontairement visible. Une version locale à l'outil, sans `!important`,
existait d'abord ; elle a été retirée en posant celle-ci, pour ne pas laisser
deux garde-fous dont un seul sert.

Un seul a pu être retiré : `color: #fff !important` sur `.mobile-menu__cta`,
qui se battait contre une règle du **même fichier** (le bloc des boutons, plus
bas, gagnait déjà). Retrait vérifié sans effet, en 1280px **et en 390px** — la
largeur où ce menu est visible. Contrôler en desktop seul n'aurait rien prouvé.

### P3 — Cohérence SEO

- Balise `google-site-verification` encore en commentaire (`index.html`, ligne 13,
  valeur `XXXX`). Exact, mais plus bloquant : Search Console accepte aussi la
  vérification par enregistrement DNS, qui ne touche pas au dépôt.
- ~~`.htaccess` porte un « ⚠️ À COMPLÉTER avant la bascule »~~ — **réglé.** Le
  bloc de six redirections a été établi depuis le sitemap du site remplacé, et
  son commentaire explique la méthode et sa seule réserve. Les six ont été
  vérifiées en ligne le 2 septembre 2026, chacune arrivant sur la bonne cible.
- ~~`sitemap.xml` : `lastmod` identique partout~~ — **réglé.** Deux dates
  distinctes aujourd'hui, alignées sur les modifications réelles.
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
Un second bouton d’appel **à côté** du premier a été tenté puis retiré : avec les
vraies polices, marque + navigation + deux boutons demandent 1349 px alors que le
conteneur est plafonné à 1280 — ils ne tiennent à aucune largeur.
Le second numéro est donc **empilé sous le bouton** (`.site-header__appel`), en
petit : la largeur ne bouge pas, et il reste 29 px de libre sous un bouton de
43 px dans un bandeau de 72. Sans lui, le 06 29 n’apparaissait sur bureau que
dans le pied de page, à 93 % de la hauteur — la barre d’appel et le menu mobile
y étant masqués.
Les autres media queries à `1024px` (grilles de contenu, `footer-grid`) sont
indépendantes et restent à cette valeur.

### JavaScript

`main.js` porte **tout le comportement partagé**, et c'est le seul endroit où
en mettre.

**Une seule exception, et elle est bornée : `assets/js/identifier-nuisible.js`.**
Il ne sert qu'à `identifier-nuisible`, et n'est chargé que par elle. La raison
est le poids : ce fichier porte l'arbre de décision de l'outil
d'identification, qui ne concerne aucune autre page — le fondre dans `main.js`
le ferait télécharger par les 66 autres, à chaque première visite, pour rien.
Le contrôle `pas-de-js-en-ligne` l'autorise, puisqu'il n'interdit que les
gestionnaires `on*=` et les `<script>` sans `src` ; la CSP aussi, son
`script-src 'self'` couvrant un second fichier local.

**Ne pas généraliser cette exception.** Elle vaut pour un comportement
volumineux propre à une seule page. Un comportement partagé, même nouveau, va
dans `main.js` : c'est la règle qui a évité de recopier le gestionnaire du
formulaire et le chargeur de carte.

`identifier-nuisible.js` ne porte d'ailleurs **que** l'arbre. Les quarante
et une fiches vivent dans le HTML de la page, en `<details>` : sans JavaScript le
contenu reste lisible et indexable, il n'existe qu'une fois, et le contrôle
`doublons` n'a rien à comparer.

**Un second fichier à la racine, `sw-identifier.js`**, est le service worker
de cette même page. Il est enregistré depuis `identifier-nuisible.js` et par
elle seule. Sa portée couvre le domaine — il est à la racine —, donc il
commence par écarter tout ce qui n'est pas l'outil : pour ces requêtes il
n'appelle pas `respondWith`, et le navigateur se comporte comme si aucun
service worker n'existait. Stratégie **réseau d'abord, cache en secours** :
une page en cache ne doit jamais masquer une version plus récente.

Historiquement, donc : Le gestionnaire du formulaire de devis y a
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
  n=$(basename "$c"); h=$(md5sum "$c" | cut -c1-8)
  sed -i "s|$n?v=[a-zA-Z0-9]*|$n?v=$h|g" *.html
done

# controle : le hash reference doit egaler le md5 reel du fichier
for c in assets/css/*.css assets/css/pages/*.css assets/js/*.js; do
  n=$(basename "$c"); r=$(md5sum "$c" | cut -c1-8)
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

### Aligner les dates du sitemap avant de téléverser

```sh
node tools/sitemap-dates.js            # ce qui serait changé
node tools/sitemap-dates.js --ecrire   # applique
```

Google traite `lastmod` comme un indice pour décider quand repasser.
Annoncer une date d’il y a une semaine sur une page réécrite le jour même
retarde sa réindexation — précisément pour le travail le plus récent. Au
premier passage, **29 des 34 dates étaient obsolètes**.

`tools/build-sitemap.js` (fonction `dateGit`, partagée avec le contrôle des
fiches du lexique) ne compte pas comme modification de contenu un commit qui,
pour ce fichier, ne change que :

- des hashes `?v=` de cache-busting ;
- le `<header class="site-header">` ou le `<footer class="site-footer">`
  partagés — le fichier est comparé avant et après, ces deux blocs retirés.

Sans cette règle, une retouche du pied de page date les 67 pages du même jour
et le hook `pre-push` refuse la publication. Ne pas la contourner par
`--no-verify` : l'étendre si un autre bloc partagé apparaît.

**Ce n’est volontairement pas un contrôle de `tools/controle.js`** : la date
git d’un fichier change au moment même où on le commite, donc un contrôle
comparant les deux échouerait après chaque commit, le sitemap ayant été
écrit avant. C’est une étape à passer avant de téléverser, pas un garde-fou
permanent.

```sh
node tools/controle.js            # les quarante et un contrôles
node tools/controle.js --liste    # ce qu'ils vérifient
node tools/controle.js alpha      # un seul, par son nom
```

**C'est le passage obligé avant d'annoncer un travail fini.** Aucune dépendance,
aucun navigateur, quelques secondes. Sortie en code 1 dès qu'un contrôle échoue,
ce qui permet de l'enchaîner dans un `&&`.

Il couvre les contrôles manuels de cette section, et d'autres qui ont chacun
attrapé un défaut réel sur ce site :

| Contrôle | Ce qu'il a attrapé |
|---|---|
| `alpha` | Le WebP du logo encodé sans canal alpha : un cadre noir sur toutes les pages, depuis le commit initial |
| `taille-css` | Le logo rendant en 96×96 et débordant du bandeau, faute de dimension en CSS |
| `chemins-absolus` | Les huit `@font-face` en `/assets/fonts/…` et la redirection JS vers `/merci` |
| `dimensions` | 22 images déclarant un rapport largeur/hauteur qui n'était pas celui du fichier |
| `hashes` | Deux fois le cache-busting de `main.js` oublié après modification, et une fois celui de `global.css` |
| `casse` | Garde-fou que `cibles` ne peut pas assurer : `fs.existsSync` est insensible à la casse sous Windows, donc un lien vers `Images/logo.png` y passe et renvoie 404 sur le serveur Linux |
| `octets` | Garde-fou propre à Windows et aux scripts : `core.autocrlf` vaut `true` sur ce poste, et seul le `.gitattributes` empêche que chaque checkout produise des CRLF — y compris dans le `.htaccess`, où Apache peut compter le retour chariot dans la valeur d’une directive. Couvre aussi le BOM, les caractères mal encodés et les entités doublement échappées, dégâts typiques d’un script qui réécrit un fichier |
| `identifiants` | Garde-fou contre le défaut classique de la génération depuis un gabarit — dix pages du site ont été produites ainsi. Un identifiant en double casse `label[for]`, `aria-labelledby` et les liens de fragment, en silence : Chrome répare et affiche |
| `mobilier` | La barre d'appel mobile absente d'`actualites.html`, bâtie depuis un gabarit |
| `json-ld` | Une réponse de FAQ déclarée mais introuvable dans le texte visible |
| `sitemap` | Deux pages créées et oubliées au sitemap, signalées dès la génération |
| `doublons` | L'article de saisonnalité recopié depuis la page Costa Verde |
| `entete-pied` | Les divergences d'en-tête et de pied, dont une introduite le jour même par une insertion mal ancrée |
| `lignes-tel` | Garde-fou pose le 24 septembre 2026, le jour ou la regle du bandeau a change deux fois. Il verifie les quatre emplacements d un coup — bandeau, menu mobile, barre d appel mobile, pied — et l ordre des deux boutons du bandeau. Eprouve sur les quatre regressions possibles : numero retire de chacune des zones, et ordre inverse |
| `paires`, `nap`, `orphelins`, `liens-externes`, `h1-canonical`, `cibles`, `styles-en-ligne` | Garde-fous : aucun défaut à ce jour, mais peu coûteux |

Deux d'entre eux ont dû être repris après coup, ce qui vaut avertissement :

- `doublons` comptait d'abord les phrases partagées et déclenchait à cinq. Éprouvé
  sur le commit fautif, il ne rattrapait pas le décalque, qui n'en partageait que
  quatre — et descendre le seuil aurait fait échouer les pages nuisibles, qui
  partagent légitimement leurs blocs de navigation. Le critère porte donc sur la
  **nature** et non le nombre : on écarte les phrases présentes sur quatre pages ou
  plus, c'est du mobilier de site, puis on signale toute paire qui en partage
  encore trois.
- un contrôle du sitemap existait avant celui-ci, mais son motif contenait une
  concaténation JavaScript non évaluée : il ne pouvait rien matcher. **Du code mort
  qui se donnait l'air d'un contrôle**, le pire cas, puisqu'il rassurait.

Chacun a été éprouvé en rejouant le script sur le commit où le défaut existait :
il échoue bien là où il doit échouer. Un contrôle qui ne se déclenche jamais ne
vaut rien — le vérifier avant d'en ajouter un.

Ce qui **demande un navigateur** — largeurs de rendu, contraste, poids réel,
décalage de mise en page — n'est pas dans ce script : voir la section suivante,
et **toujours mesurer en HTTP, jamais en `file://`**.

Le détail des contrôles, si l'on veut les rejouer à la main :

```sh
# aucun chemin absolu (un chemin relatif ne peut pas casser en changeant de racine)
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

### Mesurer dans un navigateur

**Toujours en HTTP, jamais en `file://`.** Trois défauts de cette session sont
nés de cette confusion, et deux d'entre eux ont été livrés avant d'être repris :

- en `file://`, les `@font-face` ne se chargent pas — le `crossorigin` des
  `preload` déclenche un contrôle CORS qui échoue. Tout rend en police système,
  donc plus étroit, et **tout seuil de largeur mesuré ainsi est trop bas** ;
- Chrome headless a un **plancher de fenêtre à 500 px** : `--window-size=390`
  rend à 500. Pour une vraie largeur, passer par l'émulation CDP
  (`page.setViewport`) et non par la taille de fenêtre.

Servir le site avant de mesurer, avec n'importe quel serveur statique, puis
piloter Chrome. Pour éprouver la préversion GitHub Pages, servir le **dossier
parent** et charger le site par son sous-chemin : c'est ainsi qu'ont été trouvés
les chemins absolus des polices et de la redirection du formulaire.

Ce qui n'a de sens qu'ainsi : largeur de rendu et débordement, contraste sur le
fond effectif, poids réel d'une page, décalage de mise en page, taille rendue
d'une image, parcours du formulaire.

#### HSTS : ne pas remettre `includeSubDomains` a la legere

Le `.htaccess` envoie `Strict-Transport-Security: max-age=31536000`. Le
directif `includeSubDomains` a ete **volontairement retire**.

Une fois cet en-tete vu, le navigateur refuse le HTTP en clair pendant un an.
Avec `includeSubDomains`, sur **tous les sous-domaines** aussi — y compris
ceux qui n’existent pas encore. Un webmail, un outil ou un site de test créé
plus tard sans HTTPS deviendrait inatteignable pour tout visiteur déjà venu,
et l’annulation suppose de servir `max-age=0` puis d’attendre que chacun
repasse.

Le domaine principal est certainement en HTTPS ; les sous-domaines sont
l’inconnue. **À rajouter seulement quand tous les sous-domaines sont en
HTTPS**, pas avant.

#### Remplacer une image : renommer le fichier

La CSS et le JS portent une empreinte `?v=` propagée sur toutes les pages, et un
contrôle la vérifie. **Les images et les polices n’en ont pas.** Elles sont
servies avec `max-age=31536000` — un an.

Elles l’étaient aussi avec `immutable`, retiré depuis : cette directive
interdit au navigateur de revalider, y compris sur rechargement forcé, et ne
se justifie que pour des URL portant une empreinte. Le WebP du logo a déjà
été réencodé une fois sur ce projet ; si le site avait été en ligne, aucun
visiteur déjà venu n’aurait reçu le correctif pendant un an.

**La règle qui en découle : pour remplacer une image ou une police, renommer
le fichier.** Changer l’URL est le seul moyen fiable de forcer le
renouvellement. Le contrôle `orphelins` signalera l’ancien fichier resté
inutilisé, ce qui rappelle de le supprimer.

#### Zoom et reflow : conforme, et à ne pas surtester

**WCAG 1.4.10** exige l’absence de défilement horizontal à **320 px** de
large. **WCAG 1.4.4** exige un texte agrandissable à 200 % sans perte. Les
deux sont vérifiés : défilement horizontal de **0 px** à 320 px, à 640 px
(bureau à 200 %) et même à 195 px, largeur qu’aucune norme ne demande.

**Le piège** : mesurer le débordement élément par élément, en comparant
chaque `getBoundingClientRect().right` à `clientWidth`. Une première version
de la sonde le faisait et annonçait cinq pages en défaut — alors que
`scrollWidth - clientWidth` du document valait 0. Un élément dont la boîte
dépasse ne pose problème que s’il **force la page à défiler** ; sinon il est
simplement rogné ou positionné, ce qui est courant et voulu.

Mesurer `document.documentElement.scrollWidth - clientWidth`, rien d’autre.
Sonde : `scratchpad/viewport/reflow.js`.

#### Le site sans JavaScript reste navigable

Vérifié sur cinq pages, à 390 px, moteur JS coupé : **35 à 62 liens restent
atteignables**, le pied de page — qui porte le plan complet du site —
s’affiche, la barre d’appel fonctionne (elle est en HTML et CSS pur, sans
rien de scripté), et 5 à 8 liens `tel:` restent cliquables. Un visiteur dont
le JavaScript échoue garde donc l’accès à tout le site et au téléphone.

Deux pertes, l’une voulue, l’autre à connaître :

- le bouton « retour en haut » n’existe pas : il est injecté par `main.js`,
  ce qui est correct puisqu’il ne servirait à rien sans lui ;
- **le bouton du menu mobile reste visible mais n’ouvre rien.** Le masquer
  demanderait soit un `<style>` dans un `<noscript>`, que le contrôle
  `styles-en-ligne` refuse, soit une classe posée sur `<html>` par le script
  — au prix d’un clignotement du bouton au chargement. Laissé en l’état :
  la navigation reste assurée par le pied, et le remède coûte plus que le
  défaut. À ne pas « corriger » sans peser ces deux coûts.

#### Ne pas chasser la CSS morte : il n’y en a pas

Un relevé de couverture Chrome annonce **43 % de `global.css` jamais
atteint**, mesuré sur les 38 pages, à deux largeurs, menus ouverts et FAQ
dépliées. Le chiffre est exact et la conclusion qu’on en tire spontanément
est fausse.

Ce que la couverture compte comme « non utilisé » :

| | part du fichier |
|---|---|
| commentaires | 28 % |
| espaces et retours à la ligne | 12 % |
| règles `:hover`, `:focus`, `:active` | 7 % |

Soit 47 % — davantage que les 43 % annoncés. **Aucun octet de règle morte
n’est démontré.** Un outil de couverture ne marque « utilisé » ni un
commentaire, ni du formatage, ni un état qu’aucune mesure ne déclenche.

Et les commentaires ne sont pas du remplissage : ils portent la raison
d’être des règles, souvent des correctifs durement acquis. Sans étape de
build, les retirer de la source reviendrait à supprimer la documentation
pour gagner quelques kilo-octets avant compression, sur un fichier mis en
cache dès la première page.

#### Éprouver la page 404 et parcourir le site en HTTP

Deux vérifications demandent un serveur et échappent donc aux contrôles.
Le serveur de test ordinaire ne suffit pas : il répond un texte brut sur une
adresse inconnue, là où Apache sert le contenu de `404.html` **sous l'URL
demandée**. C'est ce détail qui crée le problème que `<base href="/">` corrige.

`scratchpad/viewport/serveur-404.js` rejoue ce comportement.
`scratchpad/viewport/crawl.js` s'en sert pour suivre tous les liens depuis
l'accueil et relever le statut de chaque adresse.

Ce qu'ils ont établi, et qui n'avait jamais été démontré :

- sur `/a/b/c-inexistant`, **sans** la balise `<base>`, la feuille de style est
  cherchée dans `/a/b/assets/css/` et la page d'erreur s'affiche en Times New
  Roman, sans aucun style. Avec la balise, elle est correctement rendue ;
- une adresse inconnue renvoie **404 et non 200**. Un « soft 404 » ferait
  indexer la page d'erreur par Google comme une page valide ;
- 37 pages et 76 ressources répondent 200 ; seules `404` et `merci` sont hors
  du parcours, ce qui est voulu — elles portent `noindex` et ne sont pas au
  sitemap.

Le contrôle `cibles` vérifie qu'un fichier existe ; ce parcours vérifie que le
serveur le sert. Une casse différente ou une règle de réécriture trop étroite
passe le premier et échoue au second.

#### Simuler les règles du `.htaccess`

Ce fichier décide de toute la navigation et **ne peut pas être testé en
local** : aucun serveur Apache n’est disponible avant la mise en ligne, et
le serveur de test se contente de rejouer la réécriture `page` → `page.html`.

`scratchpad/simule-htaccess.js` évalue les règles réellement écrites ici —
`RewriteCond` sur `HTTP_HOST`, `HTTPS`, `THE_REQUEST`, `REQUEST_FILENAME`,
et `RewriteRule` avec `R=301`, `L`, `NC` — et compte les redirections pour
chaque chemin d’entrée. Il n’implémente pas Apache ; il se valide d’abord
sur deux cas dont la réponse est certaine et refuse de rendre un verdict
si cette validation échoue.

À relancer après toute modification du `.htaccess`. Il a déjà servi deux
fois : `/index.html` passait par deux 301 en chaîne, et
`http://www.…/page` aussi.

#### Vérifier avant de déclarer un défaut

Sur cette base de code, **la sonde s'est trompée bien plus souvent que le
site**. Huit fausses alertes, toutes du même genre : un outil
de mesure mal écrit qui accuse un code correct. Le coût est réel — on
« corrige » alors quelque chose qui marchait.

Les huit, pour reconnaître la famille :

1. **Un tableau affiché comme une chaîne.** `"tel : " + n.telephone` sur
   `["+33…", "+33…"]` imprime `+33…,+33…` et donne l'illusion d'un numéro
   invalide. Le JSON-LD était correct.
2. **Un séparateur détruit par la normalisation.** Joindre des titres avec
   `~` puis passer la chaîne dans une fonction qui supprime la ponctuation :
   le découpage n'a plus lieu, et deux mots situés dans deux titres
   différents comptent comme voisins. Ce bug a fait annoncer une couverture
   de 8/8 là où elle était de 4/7.
3. **Un type cherché au premier niveau seulement.** Le `FAQPage` du site est
   souvent dans un tableau : `d["@type"] === "FAQPage"` ne le voit pas, et
   on conclut à des questions déclarées mais non affichées — ce qui serait
   une violation des règles de Google. Il n'y en avait aucune.
4. **Un clic programmatique sur un menu ouvert en CSS.** Voir ci-dessous.
5. **Une valeur absente prise pour une valeur différente.** `og !== twitter`
   est vrai quand `twitter` n'existe pas ; 27 pages ont été déclarées
   incohérentes alors qu'elles s'appuient sur le repli documenté de X.
6. **La première valeur d'un bloc prise pour la seule.** Une carte de la page
   services porte quatre liens — vers les fiches d'espèce *et* vers la page
   de service. Une expression qui ne retient que le premier `href` a fait
   conclure que trois cartes ignoraient les pages de service, alors qu'elles
   les citent toutes. Même famille que le point 3 : le défaut n'est pas là
   où la sonde regarde. Quand un bloc peut contenir plusieurs occurrences,
   les relever toutes avant de conclure.
7. **Un élément cherché dans la source, alors qu'il naît à l'exécution.**
   Aucun `<iframe>` dans les 38 fichiers : j'en ai conclu que le site n'avait
   pas de carte Google Maps, et j'ai proposé de réécrire la politique de
   confidentialité en conséquence — ce qui l'aurait rendue fausse. Les cartes
   existent : `main.js` crée l'iframe au clic sur le bouton `data-map-load`.
   Une page n'est pas seulement ce que son fichier contient ; avant de conclure
   qu'un élément est absent, chercher aussi dans le JavaScript ce qui le crée.
8. **Une capture prise avant l'apparition au défilement.** Les cartes portent
   `reveal-on-scroll`, en opacité nulle jusqu'à ce que l'`IntersectionObserver`
   les révèle. Une capture faite juste après le chargement rend une image
   entièrement vide, qu'on interprète comme une page cassée. Capturer avec
   JavaScript désactivé — la classe n'est alors jamais posée et le contenu est
   visible d'emblée — ou attendre la révélation.

**Règle** : avant d'annoncer un défaut, reproduire le symptôme par un second
chemin — lire le fichier à la main, ou mesurer autrement. Et se méfier
particulièrement d'un résultat qui accuse d'un coup un grand nombre de
pages : le site est homogène, une erreur qui frappe partout vient plus
probablement de l'outil que du code.

#### Éprouver les comportements au clic

Menu mobile, sous-menus de la nav, dépliage des FAQ : mesurés à l’arrêt, ils
paraissent corrects ; ils ne se vérifient qu’en interagissant.

**Le sous-menu de bureau s’ouvre en CSS**, par `:hover` et `:focus-within` —
il n’y a aucun JavaScript derrière son ouverture. Un clic programmatique ne
survole ni ne focalise rien : une sonde qui clique conclut à tort que le
sous-menu est cassé. Éprouver par `page.hover()` puis par `.focus()`, jamais
par `click()`.

Sonde : `scratchpad/viewport/interactions.js`.

#### Éprouver le formulaire sans rien envoyer

Les trois issues de l'envoi ont été vérifiées sur `contact` et `index` en
interceptant l'appel à Web3Forms et en fabriquant la réponse — échec réseau,
réponse `success: false`, et succès. Résultat : les deux pages affichent bien
le message de repli avec le numéro de téléphone et réactivent le bouton, et
toutes deux redirigent vers `/merci`.

Deux pièges, tous deux **du côté de la sonde** et pas du site. Les deux
produisent le même symptôme — le chemin d'échec se déclenche alors qu'on croit
tester le succès — donc les deux font conclure à tort à un bug :

1. **La réponse fabriquée doit porter `Access-Control-Allow-Origin`.** Sans
   lui le navigateur la bloque et le `fetch` rejette. La vraie API l'envoie.
2. **Le POST en `application/json` est pré-volé.** Le navigateur envoie
   d'abord un `OPTIONS`, à traiter à part avec `Access-Control-Allow-Methods`
   et `Access-Control-Allow-Headers`, sinon le POST n'est jamais émis.

Sonde : `scratchpad/viewport/formulaire-succes.js` et
`formulaire-chemins.js`.

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

**IndexNow est branché.** Après chaque `git push` — et une fois le déploiement
passé, jamais avant — lancer `node tools/indexnow.js`. Il compare les `lastmod`
du sitemap à ceux du dernier envoi, mémorisés dans `tools/indexnow-etat.json`,
et ne notifie que ce qui a changé. `--essai` montre sans poster, `--tout` force
les 62 adresses.

La clé n'est écrite dans aucun script : elle est **lue depuis le nom du fichier
`<clé>.txt` à la racine**, dont le contenu doit être identique au nom, sans
retour à la ligne ni BOM. Une seule source de vérité. **Ne renommez pas ce
fichier et n'y ajoutez rien** : IndexNow compare octet pour octet, et un simple
saut de ligne suffit à faire rejeter tous les envois — le script s'arrête de
lui-même dans ce cas plutôt que de poster dans le vide.

Cette clé est **publique par conception** : c'est ce qui prouve à Bing que le
domaine vous appartient. Elle n'a rien à voir avec la clé d'accès à l'API Bing
Webmaster Tools, qui est secrète et ne doit jamais entrer dans ce dépôt.

**Lisez le fichier avant de le modifier. Ne reconstruisez jamais son contenu
de mémoire.** Une ancre de remplacement doit être copiée depuis le fichier, pas
retapée d'après ce qu'on croit s'y trouver. Trois tentatives ont été perdues sur
`rat-noir.html` le 4 septembre 2026 : l'indentation était de 8 espaces et non de
10, puis le texte portait l'entité `&nbsp;` là où une espace avait été écrite.
Ces différences sont invisibles à la lecture d'un extrait de terminal. En cas de
doute, afficher les caractères non ASCII par leur code avant d'écrire l'ancre.

**Le sommaire de la page FAQ n'a besoin d'aucun JavaScript.** Ses six raccourcis
sont de vraies ancres — `href="#termites"` et le reste — et le défilement doux
comme le décalage sous l'en-tête fixe viennent du CSS :
`html { scroll-behavior: smooth; scroll-padding-top: var(--header-height) }`,
avec repli sous `prefers-reduced-motion`. **N'y réintroduisez pas d'écouteur.**
Ils étaient auparavant des `<a href="#">` pilotés par `onclick`, donc morts sans
JavaScript ; un écouteur délégué rétablirait cette dépendance pour un
comportement que le navigateur assure seul, et violerait la CSP, qui ne porte
aucun `'unsafe-inline'`.

**Tout script qui appelle `git` doit être testé sous Windows.** `execSync`
passe par `cmd.exe`, qui interprète `|`, `&`, `^` et `%` avant que git ne les
voie. Un format non protégé par des guillemets — `--format=%H|%cs` — échoue
**en silence** : la commande retourne une erreur, le script tombe sur son repli,
et le résultat paraît plausible. C'est arrivé sur `build-sitemap.js`, où le repli
donnait la date du jour pour les 47 pages, c'est-à-dire exactement le sitemap
sans signal que le script cherchait à éviter. Écrire `--format="%H|%cs"`, et
vérifier la sortie plutôt que l'absence d'exception.

**Tout script qui écrit du texte visible appelle `tools/typo.js`.** Le contrôle
« typographie » exige l'espace insécable devant les signes doubles. Il a mordu
**cinq fois** sur cinq scripts d'écriture différents — titres de section,
questions de FAQ, légendes de tableaux — parce que chaque script réécrivait la
règle sur place au lieu de la partager. `insecable(chaîne)` traite une chaîne,
`appliquer(objet)` traite un plan JSON entier. Les deux ignorent l'intérieur des
balises et sont idempotents.

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

## Prestations non proposées — ne jamais les vendre

Arbitrages du propriétaire, dont trois rendus le 24 septembre 2026. Aucun de ces
services ne doit apparaître en offre sur le site : ni page, ni section, ni ligne
de liste de services, ni valeur d'option des formulaires.

| Prestation | Statut | Ce que le site peut dire |
|---|---|---|
| **Punaises de lit** | non proposée | rien |
| **Puces** | non proposée | rien — retiré des deux formulaires et de 3 textes le 24/09 |
| **Fioul, hydrocarbures** | non proposée | rien |
| **Désinfection** | **non proposée** | rien. Ne pas rédiger de section, ne pas l'ajouter aux listes de services |
| **Traitement des odeurs** | **à venir, pas lancé** | rien tant que le propriétaire ne l'active pas |
| **Mérule et champignons lignivores** | **information seulement** | reconnaître, comprendre la cause d'humidité, dire quoi faire — jamais « notre traitement » |
| **Diagnostic réglementaire état parasitaire** | non réalisé | le traitement curatif qui suit, oui ; le diagnostic, non (voir §1) |

Trois d'entre elles demandent une vigilance particulière :

- **Traitement des odeurs.** La page `traitement-odeurs.html` **reste en ligne**
  — on ne casse pas une URL — mais elle est en `noindex`, hors `sitemap.xml`,
  hors menus, hors listes de services, et sans aucun lien entrant. Le contrôle
  `maillage` la porte pour cela dans sa liste `SANS_LIEN`, à côté de `404` et
  `merci`. **Le jour où le propriétaire lance le service**, tout se défait dans
  l'autre sens : retirer le `noindex`, remettre la page au sitemap et aux menus,
  la citer depuis les pages voisines, et la sortir de `SANS_LIEN` — sinon le
  contrôle laissera passer une page de service orpheline.
- **Désinfection.** Elle avait été inscrite au plan de travail avant que le
  propriétaire ne tranche. Ne pas la réintroduire au motif qu'elle « va de soi »
  pour une entreprise de lutte anti-nuisibles.
- **Mérule.** `merule-champignons-bois.html` a été requalifiée en page
  informative le 24 septembre 2026 : nœud JSON-LD `Service` retiré, méthode
  reformulée en étapes à suivre, et une question de la FAQ qui dit explicitement
  « Traitez-vous la mérule ? Non ». Ne pas y remettre d'offre, de `serviceType`
  ni d'appel au devis mérule.

## Zones exclues — ne jamais les lister

Ces communes et secteurs ne sont **pas desservis**. Ils ne doivent apparaître ni
dans un texte visible, ni dans un `areaServed`, ni dans `assets/data/communes.json`,
ni dans une suggestion de la recherche de commune :

Propriano, Olmeto, Sollacaro, Casalabriva, Serra-di-Ferro, Porto-Pollo,
Campomoro — **et le Sartenais, Sartène comprise**, tranché le 24 septembre 2026.

Le Valinco et le Sartenais figurent bien dans `communes.json`, mais avec `d: 0` :
c'est volontaire, et ce n'est pas une contradiction. Cette valeur sert à répondre
« hors zone » à qui tape le nom, plutôt qu'à ne rien répondre du tout. **Ne pas
les basculer en zone desservie** pour faire disparaître une apparente incohérence.

### Le secteur s'appelle « Costa Verde » — mais Cervione reste une commune

Règle tranchée le 7 octobre 2026, après qu'un audit l'eut signalée à tort comme
un écart. Elle ne porte que sur **le nom du secteur** : en texte visible, la
zone s'appelle toujours « Costa Verde », jamais « Cervione ». Les titres, les
`h1`, les intitulés de menu et les noms de zone suivent cette règle, et c'est
déjà le cas partout.

**Cervione n'est pas pour autant un mot interdit.** C'est une commune
desservie comme les autres, et elle apparaît légitimement :

- dans les listes de communes (`commune-tags`, bloc « Communes desservies ») ;
- dans `communes.json` et les `areaServed` ;
- en prose, comme repère géographique — « de Cervione à Talasani » dans la
  description de `deratisation-costa-verde`.

Au 7 octobre 2026 : 33 occurrences hors JSON-LD, sur 27 pages, toutes de ce
type. **Ne pas les retirer.** Avant de signaler une occurrence, vérifier
qu'elle sert de nom de **secteur** et non de nom de **commune** — c'est la
seule chose que la règle interdit.

## Identifiants de l'entreprise : où chacun a le droit de figurer

La SARL est immatriculée depuis le 6 octobre 2026 (greffe de Bastia). Règle
fixée par le propriétaire le 7, assouplie le 8 :

| Donnée | Où elle figure | Nulle part ailleurs |
|---|---|---|
| SIREN, RCS | `mentions-legales` seulement | ni pied, ni JSON-LD, ni meta, ni autre page |
| SIRET du siège | `mentions-legales` **et** `a-propos` | idem |
| Code APE `8129A` | `mentions-legales` et `a-propos`, **sans libellé** | — |
| Numéro de TVA intracommunautaire | **aucune page** | ne pas en ajouter |
| RC Pro (Abeille Assurances, contrat n° 79958468, couverture Corse) | `mentions-legales` et `a-propos` | ni montant de garantie, ni décennale |

**Le code APE reste sans intitulé, définitivement.** L'intitulé officiel de
8129A mentionne la désinfection, prestation que l'entreprise ne propose pas
(voir « Prestations non proposées »). L'écrire reviendrait à l'annoncer.

Le JSON-LD ne porte que `legalName` (« DEZINSECT CORSE ») : aucun identifiant.
Les trois associés y sont des `Person` en `employee`, chacun avec son
`jobTitle` exact — Hugo Renucci, gérant ; Dominique Martinetti dit « Dumé »,
technicien applicateur certifié Certibiocide ; Antoine Renucci,
technico-commercial. **Pas de `founder`** : la qualité d'associé n'est pas
celle de fondateur.

## Avis Google : tenus à la main, écrits par un script

Le site est statique : **rien ne lit les avis chez Google**. Le nombre est
**23** au 3 octobre 2026, écrit en dur à **cinq endroits** — quatre sur
l'accueil (l'`aria-label` et le texte visible du hero, la mention sous la note,
le lien « Lire les … avis ») et la pastille `.footer-pastille--avis` du pied,
sur les 67 pages.

Quand le propriétaire signale un nouveau chiffre :

```sh
node tools/maj-avis.js        # nombre actuel, emplacement par emplacement
node tools/maj-avis.js 25     # le porte à 25 partout
```

**La liste des emplacements vit dans `tools/maj-avis.js`, et nulle part
ailleurs** — pas même ici. Le contrôle `avis` l'importe : il échoue si deux
nombres coexistent, ou si un emplacement est introuvable après un remaniement
de page, et le script refuse alors d'écrire. Éprouvé sur ces deux cas, plus un
aller-retour 23 → 25 → 23 qui rend des fichiers identiques à l'octet.

Pourquoi un script plutôt qu'un `sed` : la liste tenue à la main dans ce
fichier s'est trompée deux fois — « deux endroits » puis « quatre », alors
qu'il y en avait cinq. Le texte visible du hero n'y a jamais figuré.

**Le script ne touche jamais la note** (`5,0`, dans
`<span class="reviews__score-num">` et dans les motifs du hero et du pied).
Ne pas la changer sans que le propriétaire la confirme : un avis à moins de
cinq étoiles la ferait passer à 4,9, et afficher une note fausse est pire
qu'afficher un nombre en retard.

Aucune donnée structurée ne porte la note : `aggregateRating` a été écarté.
Le détail était dans `AUDIT-SEO.md §3`, **document de travail retiré du dépôt le
24 septembre 2026** — il n'est plus livré avec le site et un clone ne l'aura
pas. La raison, en une ligne : Google n'accepte un `aggregateRating` que s'il
porte sur l'entité de la page et s'appuie sur des avis vérifiables ; le
revendiquer pour l'entreprise elle-même sur chaque page expose à une pénalité
pour balisage trompeur.

Une mise à jour automatique a été envisagée et écartée le 16 septembre 2026 :
elle demanderait une clé API Google Places liée à un compte de facturation, et
un script quotidien sur l'hébergement — une brique à maintenir sur un site qui
n'en a aucune.

## Champ « commune d'intervention » du formulaire

Ajouté le 23 septembre 2026, dans les **deux** formulaires (`index`, `contact`),
au-dessus du champ adresse, qui n'a pas été touché.

**Deux temps, et c'est tout l'intérêt :** taper une commune, ou même cliquer une
suggestion, ne vaut pas validation. Seul le clic sur « Confirmer cette commune »
remplit les quatre champs cachés — `commune_selectionnee`, `secteur`,
`commune_desservie`, `commune_validee`. « Modifier » les vide et rouvre la
recherche. Ne pas « simplifier » en validant au clic sur la suggestion : c'est
exactement ce que la demande écartait.

- **Données** : `assets/data/communes.json`, **généré par `tools/build-communes.js`**
  — ne pas l'éditer à la main, le contrôle `communes-genere` le refuse. 367
  entrées : 360 communes, plus sept lieux-dits en alias (Folelli, Porticcio,
  Solenzara…). Le Valinco et le Sartenais y sont avec `d: 0`, pour répondre
  « hors zone » au lieu de ne rien dire.
- **Comportement** : bloc « recherche de commune » de `main.js`. Le fichier est
  chargé à la première frappe, pas au chargement de la page.
- **Garde-fou à l'envoi** : `communeBloquante()` refuse l'envoi tant qu'aucune
  commune n'est confirmée. **Si le fichier ne se charge pas, elle laisse
  passer** : un incident réseau ne doit jamais empêcher une demande d'arriver.
  Ce chemin dégradé a été éprouvé en coupant la requête.
- **Recherche** : casse, accents, apostrophes typographiques et tirets ignorés ;
  le nom privé de son article répond aussi (« ile rousse » trouve L'Île-Rousse) ;
  recherche par code postal.

Vérification : ces comportements ne se voient pas dans `tools/controle.js`. Les
éprouver dans un navigateur, **en HTTP** — en `file://`, le `fetch` des données
échoue et le champ part en mode dégradé.
