#!/usr/bin/env bash
set -euo pipefail

EXTENSION_UUID="ai-usage-monitor@openhoat.dev"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/$EXTENSION_UUID"

echo "=== Building TypeScript ==="
cd "$PROJECT_DIR"
npm run build

echo ""
echo "=== Installing extension ==="
mkdir -p "$EXTENSION_DIR"

# Copy extension files
cp "$PROJECT_DIR/extension/metadata.json" "$EXTENSION_DIR/"
cp "$PROJECT_DIR/extension/extension.js" "$EXTENSION_DIR/"
cp "$PROJECT_DIR/extension/prefs.js" "$EXTENSION_DIR/"
cp "$PROJECT_DIR/extension/stylesheet.css" "$EXTENSION_DIR/"

# Copy icons
mkdir -p "$EXTENSION_DIR/icons"
cp "$PROJECT_DIR/extension/icons/"*.svg "$EXTENSION_DIR/icons/"

# Copy fetch-usage script
cp "$PROJECT_DIR/dist/fetch-usage.js" "$EXTENSION_DIR/"

# Copy node_modules (cheerio and dependencies)
rm -rf "$EXTENSION_DIR/node_modules"
cp -r "$PROJECT_DIR/node_modules" "$EXTENSION_DIR/node_modules"

# Copy and compile schemas
mkdir -p "$EXTENSION_DIR/schemas"
cp "$PROJECT_DIR/extension/schemas/"*.xml "$EXTENSION_DIR/schemas/"
glib-compile-schemas "$EXTENSION_DIR/schemas/"

echo ""
echo "=== Installation complete ==="
echo ""
echo "To enable the extension:"
echo "  gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "To configure (set your session cookie):"
echo "  gnome-extensions prefs $EXTENSION_UUID"
echo ""
echo "If running on Wayland (GNOME 49), log out and log back in to load the extension."
echo "On X11, press Alt+F2 → type 'r' → Enter to reload GNOME Shell."
