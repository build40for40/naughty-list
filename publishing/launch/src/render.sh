#!/bin/zsh
# Render an HTML/SVG file to PNG with headless Chrome. Usage: render.sh in out width height [transparent]
CH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
bg=()
[[ "$5" == "transparent" ]] && bg=(--default-background-color=00000000)
"$CH" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --user-data-dir=/private/tmp/claude-501/-Users-samira-40-for-40/a925fd01-6369-4d0d-8a3a-68788424244f/scratchpad/chrome-prof --window-size=$3,$4 --virtual-time-budget=6000 $bg --screenshot="$2" "file://$1" >/dev/null 2>&1
sips -g pixelWidth -g pixelHeight "$2" | tail -2 | tr '\n' ' '; echo " $2"
