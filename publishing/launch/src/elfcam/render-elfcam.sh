#!/bin/zsh
# Renders the real launch stamp (Ben's overlay + Lawrence's Elf Cam styling) on an
# H&M-style page at the real hostname, fed with the live API result for www2.hm.com.
# Usage: render-elfcam.sh <git-ref> <out-dir>
# Render-only patches to a temporary copy of content.js: allow http (the harness is
# served locally) and hold the intro open. Visuals are unchanged.
set -e
REF=$1; OUT=$2; HERE=${0:a:h}; REPO=$(git -C "$HERE" rev-parse --show-toplevel)
TMP=$(mktemp -d); mkdir -p "$TMP/en_gb" "$TMP/ext"
git -C "$REPO" archive "$REF" extension | tar -x -C "$TMP" --strip-components=1 -f -
cp -R "$TMP"/shared.js "$TMP"/fonts "$TMP/ext/"
sed -e "s/location.protocol !== 'https:'/false/" -e "s/setTimeout(end, 3500)/setTimeout(end, 600000)/" "$TMP/content.js" > "$TMP/ext/content.render.js"
cp "$HERE/productpage.html" "$TMP/en_gb/productpage.html"; cp "$HERE/hm-assessment.json" "$TMP/"
(cd "$TMP" && python3 -m http.server 8765 >/dev/null 2>&1) & SRV=$!; sleep 1
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
n=0; for m in intro badge file; do n=$((n+1))
  "$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --user-data-dir="$TMP/prof" \
    --host-resolver-rules="MAP www2.hm.com 127.0.0.1:8765" --window-size=1280,800 --virtual-time-budget=3500 \
    --screenshot="$OUT/screenshot-$n-elfcam-$m-1280x800.png" "http://www2.hm.com/en_gb/productpage.html?mode=$m" >/dev/null 2>&1
done
kill $SRV; rm -rf "$TMP"
