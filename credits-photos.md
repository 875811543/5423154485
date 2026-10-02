# Crédits photographiques — outil d'identification

**Ce fichier n'est pas publié.** Le `.htaccess` refuse de servir les `.md`
(vérifié : `AGENTS.md` renvoie 403 en ligne), et le `sitemap.xml` ne porte que
des `.html`. Il reste dans le dépôt comme registre de provenance.

## Règles appliquées

- **Wikimedia Commons uniquement.** Aucune image trouvée ailleurs, aucune image
  générée par IA.
- **Licences acceptées** : domaine public, CC0, CC BY, CC BY-SA. Toute autre
  licence est écartée.
- **Vérification d'espèce** : chaque fichier a été relevé depuis la catégorie
  Commons du taxon, ou depuis un nom de fichier portant le binôme. La catégorie
  par taxon est la classification faite par les contributeurs de Commons, ce qui
  est la vérification la plus solide accessible sans examen entomologique.
- **Pas de photo plutôt qu'une photo douteuse.** Pour le psoque, les fichiers
  « Psocoptera non identifié » ont été écartés : ce sont des espèces ailées
  d'extérieur, alors que la fiche décrit le pou des livres. Une image CSIRO du
  genre *Liposcelis* a été retenue à la place.

## Le lot pilote — 7 photos, 1er octobre 2026

| Fiche | Espèce montrée | Auteur | Licence | AVIF | Page Commons |
|---|---|---|---|---|---|
| Punaise de lit | *Cimex lectularius* | CDC / Harvard University — Gary Alpert, Harold Harlan, Richard Pollack | Domaine public | 37,2 Ko | [Adult bed bug, Cimex lectularius.jpg](https://commons.wikimedia.org/wiki/File:Adult_bed_bug%2C_Cimex_lectularius.jpg) |
| Anthrène des tapis | *Anthrenus verbasci* | Donald Hobern | CC BY 2.0 | 38,0 Ko | [Anthrenus verbasci (15157722859).jpg](https://commons.wikimedia.org/wiki/File:Anthrenus_verbasci_(15157722859).jpg) |
| Puce | *Ctenocephalides felis* | Katja ZSM | CC BY-SA 3.0 | 31,2 Ko | [Ctenocephalides felis female ZSM.jpg](https://commons.wikimedia.org/wiki/File:Ctenocephalides_felis_female_ZSM.jpg) |
| Tique | *Ixodes ricinus* | MicrocosmicWorld | CC BY-SA 4.0 | 28,1 Ko | [Blood-Filled Sheep Tick (Ixodes ricinus).jpg](https://commons.wikimedia.org/wiki/File:Blood-Filled_Sheep_Tick_(Ixodes_ricinus).jpg) |
| Blatte germanique | *Blattella germanica* | Salwa Farwaneh Dameh | CC0 | 6,2 Ko | [German cockroach nymph (Blattella germanica) found indoors.jpg](https://commons.wikimedia.org/wiki/File:German_cockroach_nymph_(Blattella_germanica)_found_indoors.jpg) |
| Psoque | *Liposcelis* sp. | CSIRO | CC BY 3.0 | 35,4 Ko | [CSIRO ScienceImage 2504 Booklice Liposcelis sp.jpg](https://commons.wikimedia.org/wiki/File:CSIRO_ScienceImage_2504_Booklice_Liposcelis_sp.jpg) |
| Araignée | *Parasteatoda tepidariorum* | Joseph Berger, University of Georgia, Bugwood.org | CC BY 3.0 US | 35,5 Ko | [1252048-LGPT.jpg](https://commons.wikimedia.org/wiki/File:1252048-LGPT.jpg) |

Poids AVIF cumulé : **211,6 Ko** pour sept photos, soit 30,2 Ko en moyenne.
Chacune est sous la cible de 40 Ko. Les trois formats sont produits — AVIF,
WebP et un repli JPEG — comme l'exige le contrôle `formats-images`.

## Deux choix d'espèce à connaître

- **Jeune blatte.** La fiche visée est la blatte germanique, et la photo montre
  bien une **nymphe** trouvée dans un logement — c'est le stade qu'on confond
  avec une punaise de lit, l'adulte étant trop grand pour s'y tromper.
- **Araignée.** La fiche est au rang de l'ordre, *Araneae*. La photo montre une
  espèce précise, *Parasteatoda tepidariorum*, l'araignée domestique commune :
  le crédit la nomme, pour ne pas laisser croire que la photo représente
  l'ordre entier.

## Traitement appliqué

Téléchargement par `Special:FilePath?width=800`, qui sert une version
redimensionnée : inutile de tirer 8 208 px pour en afficher 720. Recadrage carré
centré à 720 × 720, pour que les vignettes du bloc « Souvent confondu avec »
aient toutes le même rapport — sinon la ligne saute. La qualité AVIF descend par
paliers jusqu'à passer sous 40 Ko : de q58 pour la plupart à q42 pour la tique.

L'encodeur (`sharp`) est installé **hors du dépôt**, dans le répertoire de
mesure : la contrainte « aucune dépendance npm » porte sur le site livré.

## Attribution affichée

Chaque fiche porte sous sa photo une ligne « Photo : auteur, licence », dont le
texte renvoie à la page Commons du fichier. C'est obligatoire pour CC BY et
CC BY-SA ; la ligne est affichée pour toutes les photos, y compris celles du
domaine public et en CC0, par honnêteté.

**Une URL Commons porte une virgule** — celle de la punaise de lit. Elle est
écrite avec `%2C` : les contrôles `cibles` et `casse` découpent les attributs
sur la virgule, comme pour un `srcset`, et prenaient `_Cimex_lectularius.jpg`
pour un fichier manquant. L'URL encodée résout bien sur Commons, vérifié en 200.

## Reste à faire

36 fiches sur 43 sont encore sans photo. Le lot pilote sert à valider le format,
le rendu et la ligne de crédit avant de poursuivre.
