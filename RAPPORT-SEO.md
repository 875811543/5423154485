# Rapport SEO / GEO — dezinsect-corse.fr

**Chantier du 4 septembre 2026.** Dix lots planifiés, huit exécutés, un écarté par
la mesure, un fusionné. 51 pages, 47 adresses au sitemap, **36 contrôles
automatiques** verts.

---

## 1. Les dix lots

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

## 4. Les 36 contrôles

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

Chacun a été **vérifié en cassant volontairement le site**, puis restauré.

---

## 5. Ce qui reste à faire — et que je ne peux pas faire

| Action | Pourquoi elle vous revient |
|---|---|
| **1. SIREN / RCS aux mentions légales** | Obligation légale. Société en cours d'immatriculation — aucune donnée ne sera inventée |
| **2. Search Console : resoumettre le sitemap** | 47 adresses. Puis demander l'indexation des pages neuves les plus rentables |
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
