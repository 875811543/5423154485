#!/bin/bash
# Compare le rendu des 28 pages avant / apres une modification CSS.
#
# Pourquoi pas des captures d'ecran : elles ne sont pas reproductibles ici.
# Mesure faite sur ce depot, 14 pages sur 28 donnaient deux images differentes
# sans aucune modification (lazy-loading, polices). Ce script compare a la place
# les styles calcules, qui sont deterministes.
#
# Pour chaque page, Chrome headless releve ~50 proprietes calculees et la boite
# de chaque element (~9000 elements sur le site), puis on compare a l'etat de
# reference pris dans un worktree Git.
#
#   usage: tools/compare-rendered-styles.sh [ref] [largeur]
#          ref     : point de comparaison Git, defaut HEAD
#          largeur : largeur de viewport en px, defaut 1280
#
# Les media queries de ce site couvrent une trentaine de points de bascule.
# Rejouer au moins 390, 768, 1024 et 1280 avant de conclure : une regression
# peut n'exister qu'a une seule largeur.
#
# Deux sources de bruit connues, a ne pas confondre avec une regression :
#   - le point pulsant de guepes-et-frelons (box-shadow anime) varie toujours ;
#   - une section de l'accueil varie rarement (1 mesure sur 10 environ).
# Tout ecart isole doit etre re-mesure page par page avant d'etre traite.

set -u
REF="${1:-HEAD}"
WIDTH="${2:-1280}"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WT="$(mktemp -d)/wt"; BASE="$(mktemp -d)"; NEW="$(mktemp -d)"

probe() { # <dir> <slug> <out>
  local dir="$1" slug="$2" out="$3" tmp="$1/__probe_$2.html"
  perl -0777 -e '
    my ($src,$dst,$js)=@ARGV;
    open(F,"<",$src); local $/; my $h=<F>; close F;
    open(J,"<",$js); local $/; my $j=<J>; close J;
    $h =~ s{</body>}{<script>window.addEventListener("load",function(){$j});</script></body>}i;
    open(O,">",$dst); print O $h; close O;
  ' "$dir/$slug.html" "$tmp" "$ROOT/tools/probe.js"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size="$WIDTH",4000 \
    --virtual-time-budget=8000 --dump-dom \
    "file:///$(cygpath -m "$tmp" | sed 's/ /%20/g')" 2>/dev/null \
    | perl -0777 -ne 'print $1 if /<pre id="__probe__">(.*?)<\/pre>/s' > "$out"
  rm -f "$tmp"
}

git -C "$ROOT" worktree add -f "$WT" "$REF" >/dev/null 2>&1 || { echo "worktree impossible"; exit 1; }
cd "$ROOT"
for f in *.html; do s="${f%.html}"; probe "$WT" "$s" "$BASE/$s.txt"; probe "$ROOT" "$s" "$NEW/$s.txt"; done
git -C "$ROOT" worktree remove "$WT" --force >/dev/null 2>&1

ok=0
for f in *.html; do
  s="${f%.html}"
  if cmp -s "$BASE/$s.txt" "$NEW/$s.txt"; then ok=$((ok+1))
  else echo "ECART $s : $(diff "$BASE/$s.txt" "$NEW/$s.txt" | grep '^<' | cut -d'|' -f1-3 | tr '\n' ' ')"
  fi
done
echo "pages identiques : $ok/$(ls *.html | wc -l)  (largeur ${WIDTH}px, ref $REF)"
