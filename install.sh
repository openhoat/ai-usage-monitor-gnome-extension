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

# Copy compiled scripts (fetch-usage + providers)
cp -r "$PROJECT_DIR/dist/"* "$EXTENSION_DIR/"

# Copy node_modules (cheerio and dependencies)
rm -rf "$EXTENSION_DIR/node_modules"
cp -r "$PROJECT_DIR/node_modules" "$EXTENSION_DIR/node_modules"

# Copy and compile schemas
mkdir -p "$EXTENSION_DIR/schemas"
cp "$PROJECT_DIR/extension/schemas/"*.xml "$EXTENSION_DIR/schemas/"
glib-compile-schemas "$EXTENSION_DIR/schemas/"

# Compile and install translations
echo ""
echo "=== Installing translations ==="
PO_DIR="$PROJECT_DIR/extension/po"
if [ -d "$PO_DIR" ]; then
  # Read languages from LINGUAS file
  if [ -f "$PO_DIR/LINGUAS" ]; then
    while IFS= read -r lang || [ -n "$lang" ]; do
      # Skip empty lines and comments
      [ -z "$lang" ] && continue
      [[ "$lang" =~ ^# ]] && continue

      PO_FILE="$PO_DIR/${lang}.po"
      if [ -f "$PO_FILE" ]; then
        LOCALE_DIR="$EXTENSION_DIR/locale/$lang/LC_MESSAGES"
        mkdir -p "$LOCALE_DIR"
        # Use extension UUID as domain name (GNOME Shell requirement)
        msgfmt -o "$LOCALE_DIR/$EXTENSION_UUID.mo" "$PO_FILE"
        echo "  Installed translation: $lang"
      fi
    done < "$PO_DIR/LINGUAS"
  fi
fi

echo ""
echo "=== Installation complete ==="
echo ""
echo "To enable the extension:"
echo "  gnome-extensions enable $EXTENSION_UUID"
echo ""
echo "To configure (select provider and enter credentials):"
echo "  gnome-extensions prefs $EXTENSION_UUID"
echo ""
echo "If running on Wayland (GNOME 49), log out and log back in to load the extension."
echo "On X11, press Alt+F2 → type 'r' → Enter to reload GNOME Shell."
