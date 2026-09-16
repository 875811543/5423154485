# Rapport SEO / GEO — dezinsect-corse.fr

**Chantier du 4 septembre 2026**, prolongé le 12 septembre. Dix lots planifiés,
huit exécutés, un écarté par la mesure, un fusionné — plus un onzième lot
d'après-coup déclenché par une remontée de Bing, et un douzième le 13 septembre.
**64 pages**, 60 adresses au sitemap, **38 contrôles automatiques** verts.

---

## 1. Les treize lots

| Lot | État | Ce qui a été fait |
|---|---|---|
| **1** — `@graph` unique | ✅ | 48 déclarations d'entreprise → **1**, référencée 241 fois par `@id` |
| **2** — Tableaux comparatifs | ✅ | 4 tableaux sémantiques, là où le site n'en avait **aucun** |
| **3** — Titres et descriptions | ✅ | 17 titres, 23 descriptions, 5 robots IA, 1 URL |
| **4** — Générateur de sitemap | ✅ | `tools/build-sitemap.js`, `lastmod` tiré de git |
| **5** — CSS critique | ❌ **écarté** | Voir §3 — la mesure l'invalide |
| **6** — AVIF | ✅ | 39 fichiers, **−25 % de transfert** |
| **7** — Réécriture GEO | ✅ | 9 fiches : chapeau définitionnel, H2 en question, réponse en tête |
| **8** — `Article` + `dateModified` | ✅ | 9 fiches, date git réelle, cohérente avec l'affichage |
| **9** — `aria-current`, `address`, CSP | ✅ | 35 liens, 51 blocs, CSP **en mode bloquant** |
| **10** — Rapport | ✅ | Ce document |
| **11** — Prose sous les titres | ✅ | Après-coup, déclenché par Bing : 12 sections, 15 titres muets → **3** |
| **12** — Communes desservies | ✅ | 344 communes en 16 microrégions, accordéons natifs sans JS |
| **13** — Pages guêpes locales | ✅ | Ghisonaccia et Corte créées ; 4 doublons de ville évités ; angle frelon renforcé sur 3 pages |

---

## 2. Les mesures

### Lighthouse mobile, site en ligne

| Page | Perf avant | Perf après | LCP avant | LCP après | CLS |
|---|---|---|---|---|---|
| Accueil | 94 | **98** | 2,1 s | **1,4 s** | 0 → 0 |
| `deratisation` | 96 | **99** | 1,5 s | **1,3 s** | 0 → 0 |
| `rat-noir` | 99 | 96 † | 1,5 s | 2,4 s † | 0 → 0 |

**Accessibilité, bonnes pratiques et SEO : 100/100/100 avant comme après**, sur
les trois pages.

**† Ce chiffre ne veut rien dire, et il faut le dire.** Trois passages Lighthouse
sur la même URL `rat-noir` donnent **96, 97 et 100**, avec un LCP oscillant entre
**1,3 s et 2,4 s**. La variance dépasse l'écart mesuré : il n'y a ni régression
ni progrès démontrable sur cette page. Le CLS médian y reste à 0.

**Faiblesse de méthode assumée** : les mesures « avant » sont des passages
uniques. Seules les évolutions de l'accueil et de la page service — où LCP et
TBT bougent ensemble et dans le même sens — sont crédibles.

### Poids des images

| | Avant | Après |
|---|---|---|
| Transfert, navigateur moderne | 2 080 Ko | **1 564 Ko — −25 %** |
| Dépôt `images/` | 6,06 Mo | 7,58 Mo |

Le dépôt grossit parce que les trois formats coexistent ; le visiteur télécharge
moins. Compromis assumé.

### Données structurées

| | Avant | Après |
|---|---|---|
| Déclarations d'entreprise | **48**, dont 7 valeurs contradictoires d'`areaServed` | **1** |
| Blocs JSON-LD | 241 | **49 graphes**, un par page |
| `hasCredential` (Certibiocide) | 1 déclaration sur 29 | **partout, par référence** |
| `areaServed` | 7 versions divergentes | **1, de 90 zones** |

---

## 3. Ce qui a été écarté, et pourquoi

### Lot 5 — CSS critique en ligne

Trois raisons mesurées, détaillées dans `AUDIT-SEO.md §5` :

1. `render-blocking-resources` ne signale **rien** — 20 Ko de feuilles en Brotli
   sur une page de 216 Ko.
2. `unused-css-rules` ne signale **rien** — il n'y a pas de CSS morte à séparer.
3. Le fil principal passe **1 220 ms en « Style & Layout »** contre 38 ms
   d'exécution de script. Le coût est un calcul de mise en page, que la livraison
   du CSS ne réduit pas.

Le lot mettait en risque un CLS à 0 pour un gain non démontré.

### `aggregateRating` et `review`

Le brief les demandait. **Search Console les signalait en erreur** — Google
refuse depuis 2019 les avis qu'un site publie sur lui-même. Les sept avis
restent **affichés en HTML**, lisibles par les humains comme par les LLM ; seul
le balisage refusé a disparu.

### H2 non reformulés

Cinq H2 sont restés tels quels parce que les formuler en question aurait
doublonné la FAQ de leur propre page — deux réponses concurrentes valent moins
qu'une bonne :

- « Identification & risques » sur les **9 fiches**
- Les **deux** H2 de `capricorne-des-maisons` (sa FAQ pose déjà « Quel traitement
  contre le capricorne ? » et « Comment se déroule un traitement de charpente ? »)
- « Nos solutions pour les professionnels » sur `moustiques-corse`

---

## 3 bis. Lot 11 — la prose que Bing a réclamée

**8 et 12 septembre 2026.** Bing Webmaster Tools signale
`services-anti-nuisibles` en « contenu insuffisant ». La page fait pourtant
**1 575 mots**, et n'est pas parmi les dix plus courtes du site.

La mesure déplace le diagnostic : le défaut n'est pas la quantité, c'est la
**forme**. 44 puces pour 8 paragraphes, soit 196 mots de texte suivi, et
**6 sections sur 12 sans une seule phrase de prose** — un titre, puis une liste.
Une heuristique de contenu mince mesure la prose, pas le total ; et un moteur de
réponse n'a rien à extraire d'une grille à puces.

Le balayage des 60 pages qui a suivi montre que le site n'a pas ce défaut dans
l'ensemble — **88 % de prose en médiane** — mais qu'il portait **15 titres
muets**, presque tous sur le même motif : un H2 suivi directement de cartes.

| | avant | après |
|---|---|---|
| Titres sans texte suivi | 15 | **3** |
| Prose de `services-anti-nuisibles` | 196 mots | **611** |

Les **3 restants** sont écartés à dessein : le bandeau de liens et le bloc
d'avis de l'accueil, plus « Autres nuisibles de saison » sur `moustiques-corse`.
Ce sont des blocs de navigation ; y mettre de la prose serait exactement le
remplissage que Bing sanctionne.

**Ce lot ne contredit pas le §3.** Les H2 « Identification & risques » n'ont
toujours pas été reformulés en question — la raison tient : leur FAQ de page
poserait la même question deux fois. Le paragraphe ajouté dessous répond au
besoin réel, donner une phrase extractible, **sans** créer ce doublon.

Aucun fait nouveau n'a été écrit : chaque paragraphe est tiré des puces de sa
propre section, qu'il cadre au lieu de les répéter.

---

## 3 ter. Lot 12 — le bloc « Communes desservies »

**13 septembre 2026.** Bloc ajouté en bas de `zones-dintervention` : 16
microrégions en accordéons `<details>` natifs, sans une ligne de JavaScript,
chacune ouvrant sur une phrase de contexte puis ses communes.

**Les noms ne sont pas écrits à la main.** Ils viennent de l'API Découpage
administratif — 124 communes en Corse-du-Sud, 236 en Haute-Corse. Le
rattachement s'appuie sur l'intercommunalité, qui épouse largement le découpage
coutumier ; seules les six EPCI à cheval sur deux microrégions sont scindées
commune par commune. **344 affichées, 16 exclues, somme vérifiée à 360.**

Le Valinco n'est pas desservi, le Sartenais non plus — arbitré le 13 septembre,
en cohérence avec une consigne donnée bien plus tôt et que le brief contredisait.

### Ce qui a été refusé

Le brief demandait de porter les 344 communes en `areaServed` dans le JSON-LD.
**Le site avait déjà tranché l'inverse**, et le fichier de référence le
documente : cet `areaServed` énumérait 99 communes, « 8,2 Ko sans rien apporter
au classement », et il avait été retiré au profit des deux départements. Y
réinjecter 344 objets `City` aurait annulé cette mesure pour environ 17 Ko sur
l'accueil.

La liste vit donc dans `tools/communes-desservies.json`, et le **contrôle 37**
garantit l'exigence réelle du brief — que l'affiché et le déclaré soient
identiques — **dans les deux sens**, en refusant aussi le retour d'une commune
hors zone.

Écrit avant la correction et vu rouge, ce contrôle a révélé un défaut que je
n'avais pas vu : **7 entrées de la référence n'étaient pas des communes** mais
des lieux-dits — Folelli relève de Penta-di-Casinca, Porticcio de
Grosseto-Prugna, Solenzara de Sari-Solenzara. Ils ont désormais leur propre clé,
et restent déclarables.

### Arbitrages de rattachement

Les microrégions corses n'ont pas de frontière officielle. Trois choix méritent
d'être consignés, parce qu'ils s'écartent de l'intercommunalité :

- le **Rostinu** (Morosaglia et six voisines) est mis en Castagniccia et non en
  Centre Corse : l'usage du visiteur prime sur le découpage administratif ;
- **Bastelicaccia** rejoint le Grand Ajaccio, dont il est une banlieue contiguë ;
- le groupe 12 est renommé **« Gravona, Celavu, Prunelli & Cruzzini »**, le
  libellé d'origine omettant le Prunelli.

---

## 3 quater. Lot 13 — des pages locales, pas des pages de ville

**15 septembre 2026.** Proposition de départ : six pages `destruction-nid-frelons-…`
(Bastia, Moriani, Cervione, Ghisonaccia, Ajaccio, Porto-Vecchio), avec un contenu
réellement localisé et non un nom de ville remplacé.

**Quatre de ces six pages existaient déjà**, sous `destruction-nid-guepes-…`, avec
un titre « Nid de Guêpes & Frelons à … ». Une seconde page sur la même ville et
la même intervention aurait mis les deux en concurrence sur la même requête. Elles
n'ont pas été créées. Les pages existantes n'étaient pas des décalques : 8 à 18 %
de phrases communes seulement, noms de lieux neutralisés.

**Créées** : Ghisonaccia et Corte, les deux vrais manques. **Écartée** : Cervione,
dont une page dédiée exposerait le lieu du siège et concurrencerait Moriani.

### Le contrôle qui devait empêcher le décalque ne l'empêchait pas

`doublons` ne neutralisait pas les noms de lieux : une page recopiée en changeant
« Bastia » en « Ghisonaccia » passait, chaque phrase différant d'un mot. Il ne
coupait pas non plus les phrases aux titres, si bien qu'une phrase recopiée sous un
autre H2 ne correspondait plus. Les deux défauts sont corrigés.

Commité en échec, le contrôle renforcé a immédiatement trouvé **un doublon déjà en
ligne** que l'ancienne version laissait passer : Balagne et Moriani partageaient une
phrase et deux questions de FAQ. Puis il a **refusé les deux nouvelles pages** : le
texte de service — badge, tarif, réponse sur le prix, phrase de maillage — avait
été repris du modèle. Réécrit pour chaque page.

### L'angle frelon

Renforcé là où il était faible — Balagne, Moriani, Aléria —, chaque fois ancré dans
le terrain de la page. Ajaccio et Bastia, qui ont déjà une section entière sur les
trois espèces, n'ont pas été touchées.

---

## 4. Les 38 contrôles

Sept ont été ajoutés pendant ce chantier, **chacun écrit et commité en échec
avant la correction** — un contrôle écrit après coup décrit le résultat obtenu au
lieu de vérifier la règle :

| Contrôle | Ce qu'il empêche |
|---|---|
| `entite-entreprise` | Le retour des déclarations divergentes ; `areaServed` de l'entité doit couvrir celui de tous les `Service` |
| `tableaux` | Un tableau sans `caption`, sans `scope`, sans conteneur défilant ou sans nom scientifique |
| `sitemap-genere` | Un sitemap édité à la main plutôt que produit |
| `formats-images` | Une image sans ses trois formats, ou un `<picture>` sans dimensions |
| `nav-courante` | Zéro ou deux « page courante » dans un menu |
| `pas-de-js-en-ligne` | Le JavaScript qui casserait la CSP à la prochaine page |
| `articles-lexique` | Une date affichée qui diverge de la date balisée |
| `communes-affichees` | Un écart entre les communes affichées et les communes déclarées, dans les deux sens |
| `communes-genere` | Un bloc de communes édité à la main plutôt que produit par son générateur |

Chacun a été **vérifié en cassant volontairement le site**, puis restauré.

---

## 4 bis. Relevé Search Console du 16 septembre 2026

Données au 14 septembre : **53 pages indexées** (4 le 5 juillet), **33 non
indexées** pour 5 motifs. Chaque adresse signalée a été testée en ligne.

| Motif | Pages | Constat | Suite |
|---|---|---|---|
| Page avec redirection | 3 | Anciennes adresses, 301 en un seul saut vers une page en 200 | Aucune : c'est le résultat voulu |
| Exclue par « noindex » | 1 | Page de remerciement du formulaire | Aucune |
| Introuvable (404) | 11 | **Déjà redirigées depuis le 7 septembre** ; dernières explorations entre le 28 mars et le 10 juin | « Valider la correction » côté propriétaire |
| Explorée, non indexée | 6 | 2 anciennes adresses réellement en 404 sans redirection | **Deux 301 ajoutées** le 16 septembre |
| Détectée, non indexée | 12 | Pages récentes, pas encore explorées | Attendre ; demandes d'indexation ciblées |

Sur les 6 « explorées, non indexées » : `sitemap.xml` n'est pas une page, sans
conséquence. `destruction-nid-guepes-corte` et `-ghisonaccia` ont été explorées
le jour même de leur création. `/souris` est la seule page établie écartée :
c'est la fiche la plus courte du lexique (662 mots), sur une requête que la page
dératisation (2 841 mots) couvre aussi.

**À revérifier début octobre 2026** : si Corte, Ghisonaccia ou `/souris` sont
encore « explorées, non indexées », le délai ne suffit plus. Pour `/souris`, la
piste est de la matière de terrain propre au propriétaire — secteurs, saisons,
types de logement —, jamais un rallongement sans fait nouveau.

---

## 5. Ce qui reste à faire — et que je ne peux pas faire

| Action | Pourquoi elle vous revient |
|---|---|
| **1. SIREN / RCS aux mentions légales** | Obligation légale. Société en cours d'immatriculation — aucune donnée ne sera inventée |
| **2. Search Console : resoumettre le sitemap** | 60 adresses. Puis demander l'indexation des pages neuves les plus rentables |
| **3. Racheter `dezinsect20.fr`** | **Libre à la vente**, vérifié à l'AFNIC. Premier résultat Google sur votre marque, et lien mort. Une dizaine d'euros par an |
| **4. Fiche Google Business** | Renseigner les zones desservies commune par commune. Pour les petites communes, ça rapporte plus que des pages |
| **5. Demander des avis** | Trois en août 2026 : bon rythme. C'est le geste le plus rentable de la liste |

### `TODO(dumé)` — informations manquantes

- **SIREN / RCS** — bloquant légal.
- **`cid` Google** — vérifier que `https://www.google.com/maps/place/?cid=6330082989377733098`
  ouvre bien votre fiche. S'il est faux, le défaut touche **44 pages**, pas
  seulement le `sameAs`.
- **Chenilles processionnaires** — service vendu sur l'ancien site, absent
  d'ici. Méthode et saison inconnues.
- **Marque MABI** — nommée six fois sur l'ancien site, jamais ici.
- **Alta Rocca ouest** — Aullène, Sainte-Lucie-de-Tallano et Serra-di-Scopamène
  sont dans le bassin de Sartène, que vous aviez écarté. Conservées sur votre
  décision du 4 septembre.

---

## 6. Ce que ce rapport ne prétend pas

- **Aucun volume de recherche n'a été mesuré.** Semrush est resté sans unités
  API pendant tout le chantier. Les arbitrages de priorité reposent sur la
  population, la densité d'activité et la distance — des proxys, pas des données.
- **Aucun classement n'est promis.** Le site est passé d'un état où son contenu
  n'était pas indexable — 164 mots derrière une `iframe` — à un état techniquement
  sain. C'est ce qui rend le référencement *possible*, pas ce qui le garantit.
- **Les scores Lighthouse varient.** Voir §2.
