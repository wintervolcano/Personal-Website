#!/usr/bin/env bash

# Lossless compression for gallery PNGs.
# Run this before committing / pushing to keep images small.
#
# Usage:
#   ./scripts/compress-gallery.sh
#
# Requirements (any ONE of these on your PATH):
#   - oxipng        (recommended, works on Apple Silicon:  brew install oxipng)
#   - or pngcrush  (also fine and widely available:       brew install pngcrush)

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GALLERY_DIR="$ROOT_DIR/public/gallery"

# Prefer oxipng if available, otherwise fall back to pngcrush.
COMPRESSOR=""
if command -v oxipng >/dev/null 2>&1; then
  COMPRESSOR="oxipng"
elif command -v pngcrush >/dev/null 2>&1; then
  COMPRESSOR="pngcrush"
else
  echo "error: no PNG optimizer found."
  echo "       Install one of:"
  echo "         brew install oxipng"
  echo "         brew install pngcrush"
  exit 1
fi

if [ ! -d "$GALLERY_DIR" ]; then
  echo "No gallery directory at: $GALLERY_DIR"
  exit 0
fi

echo "Compressing PNGs in $GALLERY_DIR using $COMPRESSOR (lossless)..."

find "$GALLERY_DIR" -type f -name "*.png" -print0 | while IFS= read -r -d '' file; do
  echo "  -> $file"
  if [ "$COMPRESSOR" = "oxipng" ]; then
    # -o 4   = good default optimization level
    # --strip safe = remove non-essential metadata, keep color profile if needed
    oxipng -o 4 --strip safe "$file"
  else
    # pngcrush: -ow = overwrite, -brute = exhaustive compression search (lossless)
    pngcrush -ow -brute "$file" >/dev/null 2>&1
  fi
done

echo "Done. Gallery PNGs have been recompressed losslessly."
