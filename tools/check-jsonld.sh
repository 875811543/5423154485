#!/bin/bash
# Valide que chaque bloc JSON-LD de chaque page est analysable par un navigateur.
# grep ne sait pas dire si un JSON est casse ; Chrome, si.
#   usage: tools/check-jsonld.sh [page.html ...]   (defaut : toutes les pages)
set -u
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
fail=0
if [ "$#" -gt 0 ]; then FILES=("$@"); else FILES=(*.html); fi
for f in "${FILES[@]}"; do
  s="${f%.html}"; tmp="__jsonld_$s.html"
  perl -0777 -e '
    my ($src,$dst,$js)=@ARGV;
    open(F,"<",$src); local $/; my $h=<F>; close F;
    open(J,"<",$js); local $/; my $j=<J>; close J;
    $h =~ s{</body>}{<script>window.addEventListener("load",function(){$j});</script></body>}i;
    open(O,">",$dst); print O $h; close O;
  ' "$f" "$tmp" "$ROOT/tools/check-jsonld.js"
  res=$("$CHROME" --headless=new --disable-gpu --virtual-time-budget=5000 --dump-dom \
        "file:///$(cygpath -m "$ROOT/$tmp" | sed 's/ /%20/g')" 2>/dev/null \
        | perl -0777 -ne 'print $1 if /<pre id="__probe__">(.*?)<\/pre>/s')
  rm -f "$tmp"
  if echo "$res" | grep -q 'INVALIDE\|aucun bloc'; then
    echo "== $f"; echo "$res" | sed 's/^/   /'; fail=1
  fi
done
[ "$fail" = 0 ] && echo "JSON-LD : tous les blocs de toutes les pages sont analysables"
