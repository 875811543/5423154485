---
name: publier
description: Met le site dezinsect-corse.fr en ligne dans le bon ordre — sitemap, contrôles, commit, push, vérification en ligne après le déploiement Hostinger, IndexNow. À lancer quand le propriétaire dit « pousse », « publie » ou « mets en ligne ».
disable-model-invocation: true
---

# Publier le site

`git push` sur `main` met le site en ligne. Ne lancer cette procédure que sur
demande explicite du propriétaire. Répondre en français.

## 1. Préparer

```sh
node tools/build-sitemap.js          # régénère sitemap.xml (jamais à la main)
node tools/sitemap-dates.js --ecrire # aligne les <lastmod> sur git
git status --short
```

Si `sitemap.xml` a changé, le commiter seul : « Régénère le sitemap ».

## 2. Contrôler

```sh
node tools/controle.js
```

Tout doit être vert. Sinon : corriger, ne jamais pousser un rouge, jamais
`--no-verify` (le hook `tools/hooks/garde.js` le refuse de toute façon).

## 3. Pousser

```sh
git push
```

Le `pre-push` relance les contrôles. Lancer en arrière-plan si c'est long.

## 4. Attendre le déploiement

Hostinger déploie souvent seul, mais pas toujours : dire au propriétaire de
cliquer « Déployer » dans hPanel (Sites web → dezinsect-corse.fr → Avancé → Git)
si la vérification suivante montre l'ancienne version.

Vérifier en ligne chaque page modifiée, par un extrait qui a changé :

```sh
curl -s https://dezinsect-corse.fr/<page> | grep -o '<extrait attendu>'
```

## 5. IndexNow, puis enregistrer l'envoi

Seulement une fois la vérification en ligne réussie :

```sh
node tools/indexnow.js
git add tools/indexnow-etat.json
git commit -m "Enregistre l'envoi IndexNow de <pages>"
git push
```

## 6. Rendre compte

En deux ou trois lignes : ce qui est en ligne (vérifié), ce qui attend le
déploiement, les adresses envoyées à IndexNow.
