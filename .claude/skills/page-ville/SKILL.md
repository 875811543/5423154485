---
name: page-ville
description: Crée une page « service + ville » du site (ex. termites à Corte, cafards à Calvi) en respectant les règles d'AGENTS.md — contenu propre à la ville, JSON-LD Service avec areaServed, liens croisés du secteur, sitemap. À utiliser quand le propriétaire demande une nouvelle page pour un nuisible dans une commune ou un secteur.
---

# Créer une page service + ville

Répondre en français. AGENTS.md fait foi ; relire ses sections « Prestations non
proposées », « Zones exclues », « Délais d'intervention » et la règle des
29 pages service + ville avant d'écrire.

## Avant d'écrire : la page se justifie-t-elle ?

Une page n'est créée que si son contenu peut être **réellement propre au lieu**
(bâti, activité, saison, quartiers, chantier réel). Pas de déclinaison
mécanique pour les 53 communes : Google les traite comme du remplissage.

## Règles de fond

- **Termites toujours en premier** dans les énumérations et les menus.
- Délais : **24 h** pour guêpes et frelons, **24 à 48 h** pour le reste.
- Aucun prix hors des deux autorisés (« à partir de 100 € » nid de guêpes,
  « 15 à 30 €/m² » préventif charpente).
- Jamais : curatif des bois attaqués, diagnostic état parasitaire, désinfection,
  punaises, puces, odeurs. Jamais le Valinco ni le Sartenais.
- Jamais « toute la Corse » : nommer le secteur.
- Le secteur Cervione s'appelle « Costa Verde ».

## Fabrication

1. Partir d'une page sœur du même service (gabarit, en-tête, pied, barre
   d'appel identiques). Ne jamais modifier en-tête/pied à la main.
2. Écrire le `<main>` : hero (badge, h1, `#page-lead`), trois blocs
   « pourquoi ici », la méthode, les communes (`.tag`), 3 questions de FAQ,
   `<!--VILLES-->` à la place du bloc de liens, puis la date `maj-date`.
3. Script Node (dans le scratchpad) qui : remplace title/description/OG/Twitter
   et canonical ; reconstruit le JSON-LD (`WebPage` avec `dateModified` du jour,
   `BreadcrumbList`, `FAQPage` tiré du HTML, `Service` avec `areaServed` limité
   aux communes de `tools/communes-desservies.json`) ; passe le texte visible
   par `tools/typo.js` ; pose le bloc `species-links villes-links` du secteur
   sur toutes les pages du secteur.
4. Photos : `.avif` + `.webp` + `.jpg` via `sharp` (hors dépôt,
   `C:/Users/dmart/outils-audit-seo`), sans métadonnées GPS.
5. Rattacher la page : page de secteur, menu si besoin (en lot sur `*.html`).
6. `node tools/build-sitemap.js`, puis `node tools/controle.js` jusqu'au vert.
7. Commit en français à l'impératif. Publier via `/publier` sur demande.
