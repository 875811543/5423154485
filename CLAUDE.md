# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Toujours répondre en français à l'utilisateur.**

**La référence complète est `AGENTS.md`, importée ci-dessous.** Ce fichier n'en
est que l'aide-mémoire : en cas d'écart, `AGENTS.md` fait foi. Les chiffres qu'il
cite (« 28 pages », « 38 contrôles ») datent de chantiers passés — compter sur le
dépôt plutôt que de s'y fier (au 3 octobre 2026 : 67 pages HTML, 62 URL au
sitemap, 41 contrôles).

@AGENTS.md

## L'essentiel en dix lignes

- Site **statique** servi tel quel : HTML à la racine, `assets/css`, `assets/js/main.js`
  (ES5, IIFE), aucune étape de build, aucune dépendance npm dans le site livré.
  Les scripts de `tools/` sont de l'outillage Node, sans dépendance.
- **`git push` sur `main` met le site en ligne** (Hostinger déploie automatiquement).
  Ne jamais pousser sans demande explicite, ni avec un contrôle rouge.
- En-tête, pied, barre d'appel mobile sont **recopiés à l'identique dans chaque
  page** : toute évolution se fait en lot sur `*.html`, jamais page par page, et
  jamais par injection JS.
- Liens internes **relatifs et sans `.html`** (`deratisation`, `./`) ; URLs absolues
  `https://dezinsect-corse.fr/…` réservées aux canonical, OG, JSON-LD, sitemap.
- Aucun `<style>`, `style=""`, `<script>` sans `src` ni `on*=` dans le HTML.

## Commandes

```sh
git config core.hooksPath .githooks       # une fois par clone (pre-commit + pre-push)

node tools/controle.js                    # tous les contrôles statiques — obligatoire avant de conclure
node tools/controle.js --liste            # liste des contrôles
node tools/controle.js <nom>              # un seul contrôle (ex. hashes, sitemap, entete-pied)

node tools/verifie-dates.js               # ce que lance le pre-commit : dateModified + <time class="maj-date">
node tools/build-sitemap.js [--verifier]  # régénère sitemap.xml (ne jamais l'éditer à la main)
node tools/sitemap-dates.js [--ecrire]    # aligne les <lastmod> sur git, avant de pousser
node tools/build-communes.js [--verifie]  # régénère communes.json et le bloc de zones-dintervention
node tools/indexnow.js [--essai]          # après un push déployé seulement
node tools/maj-avis.js [nombre]          # nombre d'avis Google, aux cinq emplacements
```

Après toute modification d'un fichier de `assets/css/` ou `assets/js/` : recalculer
et propager les empreintes `?v=` sur toutes les pages (boucle `md5sum` + `sed` en
§5 d'`AGENTS.md`), puis `node tools/controle.js hashes`.

Les mesures de rendu (largeurs, contraste, reflow, formulaire) se font **en HTTP,
jamais en `file://`**, avec Chrome piloté par `puppeteer-core` installé hors du
dépôt et `page.setViewport` (la fenêtre headless plafonne à 500 px minimum).
`tools/compare-rendered-styles.sh [ref] [largeur]` compare les styles calculés à
une révision git. Les sondes citées sous `scratchpad/viewport/` ne sont pas
versionnées : les réécrire au besoin dans le scratchpad de session.

## Pièges qui reviennent

- Toucher au contenu principal d'une page ⇒ mettre à jour `dateModified` (JSON-LD)
  **et** `<time class="maj-date">` dans le même commit ; le pre-commit refuse sinon.
- Une classe utilisée sur plus d'une page se style dans `global.css`, pas dans une
  feuille de `assets/css/pages/` ; attention à l'ordre de chargement (certaines
  feuilles de page chargent avant `global.css`) et aux variables absentes du
  `:root` global.
- Script qui appelle `git` sous Windows : protéger les formats par des guillemets
  (`--format="%H|%cs"`). Script qui écrit du texte visible : passer par `tools/typo.js`.
- Informations d'entreprise (téléphones, adresse, Certibiocide, tarifs, zones
  desservies, prestations vendues) : ne rien changer sans demande explicite —
  voir les listes « Prestations non proposées » et « Zones exclues ».
- Avant d'annoncer un défaut, le reproduire par un second chemin : la sonde s'est
  trompée plus souvent que le site.
- Commits en français, à l'impératif, un par nature de changement.
