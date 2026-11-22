#!/usr/bin/env bash
# Rebuild public/models/protagonist.glb from the CC0 source download.
#
#   bash scripts/optimise-model.sh [source.glb]
#
# The source asset is not committed (13 MB of 4K, 300k-triangle data). Fetch it
# first — see docs/03-assets.md — or point the script at your own copy.
set -euo pipefail

SOURCE="${1:-public/models/protagonist.glb}"
OUT="public/models/protagonist.glb"
TMP="$(mktemp -d)"

if [ ! -f "$SOURCE" ]; then
  echo "no source GLB at $SOURCE — see docs/03-assets.md" >&2
  exit 1
fi

echo "→ welding"
npx gltf-transform weld "$SOURCE" "$TMP/welded.glb"
echo "→ simplifying to 20%"
npx gltf-transform simplify "$TMP/welded.glb" "$TMP/simplified.glb" --ratio 0.2 --error 0.001
echo "→ resizing textures to 1024"
npx gltf-transform resize "$TMP/simplified.glb" "$TMP/resized.glb" --width 1024 --height 1024
echo "→ pruning"
npx gltf-transform prune "$TMP/resized.glb" "$OUT"

rm -rf "$TMP"
echo "✓ $OUT ($(du -h "$OUT" | cut -f1))"
