# AGENTS.md — Dezinsect Corse

Instructions de travail pour tout agent intervenant sur ce dépôt.
Objectif du chantier : **réorganiser, nettoyer et fiabiliser** le site sans jamais
dégrader le SEO ni le rendu, qui sont déjà de bon niveau.

---

## 1. Ce qu'est ce projet

Site vitrine **statique** d'une entreprise de lutte anti-nuisibles en Corse.
Aucun build, aucune dépendance npm, aucun framework. Ce qui est dans le dépôt
est exactement ce qui est servi par Apache.

- **28 pages HTML** à la racine (1 accueil, 8 services, 4 zones, 10 nuisibles,
  contact, merci, 2 pages légales, lexique, FAQ, 404).
- **6 feuilles CSS** dans `assets/css/`, `global.css` (~1030 l.) faisant socle.
- **1 fichier JS**, `assets/js/main.js` (81 l., ES5, IIFE, sans dépendance).
- **Polices auto-hébergées** en woff2 (Inter + Poppins) — aucun appel à Google.
- **Images** en doublons `.jpg` + `.webp` servis via `<picture>`.
- **`.htaccess`** : HTTPS forcé, dé-www, URLs sans `.html`, 301 de migration,
  compression, cache, en-têtes de sécurité.

**Contraintes non négociables :** pas de build step, pas de framework, pas de
dépendance externe supplémentaire. Le site doit rester déployable par simple
copie de fichiers sur un hébergement mutualisé Apache.

---

## 2. Règles absolues

1. **Ne jamais casser une URL.** Chaque page correspond à une URL indexée.
   Renommer ou supprimer un `.html` exige, dans le même changement :
   une `RewriteRule ... [R=301,L]` dans `.htaccess`, la mise à jour de
   `sitemap.xml`, et la correction de tous les liens internes.
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

### P2 — CSS dispersé

- 15 pages portent un bloc `<style>` inline ; `index.html` en a **4**.
- `footer.css` est absent de 12 pages qui affichent pourtant un footer
  (`404`, `merci`, `cafards`, `capricorne-des-maisons`, `fourmis`,
  `lexique-nuisibles`, `merule-champignons-bois`, `mouches`, `rat-brun-surmulot`,
  `rat-noir`, `souris`, `traitement-odeurs`) — soit style dégradé, soit règles
  dupliquées inline.
- `global.css` contient des `!important` et un second `:root` en milieu de
  fichier (`--accent-green`), signes de correctifs empilés.

**Cible :** chaque règle vit dans un seul fichier ; l'inline ne subsiste que pour
du vraiment spécifique à une page, et de façon documentée.

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
  (preload puis `fonts.css`) → preload image LCP → CSS → JSON-LD.
- Classes en **BEM** : `site-header`, `site-header__inner`, `site-header__brand`,
  `site-nav__submenu`, modificateurs d'état en `is-` (`is-open`, `is-visible`).
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
| `fonts.css` | `@font-face` uniquement (28 pages) |
| `global.css` | reset, tokens, header, nav, cartes, CTA, animations (28 pages) |
| `footer.css` | footer (16 pages — à porter à 28) |
| `form.css` | formulaires (`contact`, `index`) |
| `pages-nuisibles.css` | fiches nuisibles (11 pages) |
| `pages-zones.css` | pages de zones (3 pages) |

Mobile-first, breakpoint desktop à `1024px` (aligné sur le `resize` de `main.js`).

### JavaScript

`main.js` est le **seul** fichier JS et doit le rester. Style : IIFE,
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

Hashes actuellement en place : `fonts.css?v=be314626`, `global.css?v=ae27c54e`,
`footer.css?v=67e67818`, `form.css?v=46cf0f90`, `pages-nuisibles.css?v=c564fb2b`,
`pages-zones.css?v=ff401060`, `main.js?v=51bcce48`.

Un CSS modifié sans hash mis à jour = correctif invisible pour les visiteurs
existants. C'est l'erreur la plus facile à commettre sur ce projet.

---

## 6. Vérifications avant de déclarer un travail terminé

À rejouer systématiquement — aucune n'exige d'outil externe :

```sh
# liens internes cassés
grep -oh 'href="/[a-z0-9-]*"' *.html | sed 's|href="/||;s|"||' | sort -u \
  | while read p; do [ -z "$p" ] || [ -f "$p.html" ] || echo "LIEN MORT: /$p"; done

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
