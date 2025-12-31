#!/usr/bin/env bash

# Convert gallery images to high-quality WebP for the web.
# This is visually lossless for normal viewing but not mathematically lossless.
#
# Usage (from repo root):
#   ./scripts/gallery-to-webp.sh
#   # or via npm:
#   #   npm run gallery:webp
#
# Requirements:
#   - cwebp installed and on your PATH
#     macOS (Apple Silicon OK):  brew install webp

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GALLERY_DIR="$ROOT_DIR/public/gallery"

if ! command -v cwebp >/dev/null 2>&1; then
  echo "error: cwebp (from libwebp) is not installed."
  echo "       Install it, for example: brew install webp"
  exit 1
fi

if [ ! -d "$GALLERY_DIR" ]; then
  echo "No gallery directory at: $GALLERY_DIR"
  exit 0
fi

echo "Converting gallery images to WebP in $GALLERY_DIR ..."
echo "  - quality: 90"
echo "  - originals are kept; .webp files are written alongside them."

find "$GALLERY_DIR" -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) -print0 |
  while IFS= read -r -d '' file; do
    out="${file%.*}.webp"
    if [ -f "$out" ]; then
      echo "  [skip] $out already exists"
      continue
    fi
    echo "  [webp] $file -> $out"
    # -q 90  : high quality
    # -m 6   : good compression-effort trade-off
    # -metadata icc,exif,xmp : keep useful metadata if present
    cwebp -q 90 -m 6 -metadata icc,exif,xmp "$file" -o "$out" >/dev/null 2>&1
  done

echo "Done. Update Gallery.tsx to point to .webp paths once you are happy with the result."

