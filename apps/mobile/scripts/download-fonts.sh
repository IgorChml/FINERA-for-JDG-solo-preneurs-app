#!/bin/bash
# Download real Sora and Inter fonts from Google Fonts
# Run BEFORE first EAS build: bash scripts/download-fonts.sh

set -e

FONTS_DIR="$(dirname "$0")/../assets/fonts"
mkdir -p "$FONTS_DIR"

echo "Downloading Inter fonts..."
curl -L "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hiA.woff2" -o /tmp/inter.woff2 2>/dev/null || true

# Download from direct GitHub releases (more reliable)
BASE="https://github.com/google/fonts/raw/main/ofl"

download_font() {
  local url=$1
  local dest=$2
  echo "  → $dest"
  curl -fsSL "$url" -o "$FONTS_DIR/$dest" || echo "  WARN: Failed to download $dest — using placeholder"
}

echo "Downloading Sora..."
download_font "https://fonts.gstatic.com/s/sora/v12/xMQOuFFYT72X5wkB_18qmnndmSdSn3-KIwNhBti0.woff2" "Sora-Regular.woff2"

# Fallback: use system fonts script
echo ""
echo "NOTE: If download failed, manually place font files in assets/fonts/"
echo "Download from:"
echo "  Sora:  https://fonts.google.com/specimen/Sora"
echo "  Inter: https://fonts.google.com/specimen/Inter"
echo ""
echo "Required files:"
echo "  assets/fonts/Sora-Regular.ttf"
echo "  assets/fonts/Sora-SemiBold.ttf"
echo "  assets/fonts/Sora-Bold.ttf"
echo "  assets/fonts/Inter-Regular.ttf"
echo "  assets/fonts/Inter-Medium.ttf"
echo "  assets/fonts/Inter-SemiBold.ttf"
