#!/usr/bin/env bash
set -euo pipefail

# Configuration
EXTENSION_UUID="ai-usage-monitor@openhoat.dev"
BUILD_DIR="build_zip"
ZIP_NAME="dist/${EXTENSION_UUID}.zip"

echo "=== Preparing EGO package ==="

# Clean up
rm -rf "$BUILD_DIR"
mkdir -p dist
rm -f "$ZIP_NAME"
mkdir -p "$BUILD_DIR"

# 1. Build TypeScript
echo "Building TypeScript..."
npm run build

# 2. Copy base extension files
echo "Copying extension files..."
cp extension/extension.js "$BUILD_DIR/"
cp extension/metadata.json "$BUILD_DIR/"
cp extension/prefs.js "$BUILD_DIR/"
cp extension/stylesheet.css "$BUILD_DIR/"

# 3. Copy icons
echo "Copying icons..."
mkdir -p "$BUILD_DIR/icons"
cp extension/icons/*.svg "$BUILD_DIR/icons/"

# 4. Copy schemas
echo "Copying schemas..."
mkdir -p "$BUILD_DIR/schemas"
cp extension/schemas/*.xml "$BUILD_DIR/schemas/"
# Pre-compile schemas for convenience (though EGO might re-compile)
glib-compile-schemas "$BUILD_DIR/schemas/"

# 5. Copy compiled logic
echo "Copying compiled scripts..."
cp -r dist/* "$BUILD_DIR/"

# 6. (DEPRECATED) Copy production node_modules
# echo "Copying production dependencies..."
# Since we removed cheerio, we no longer need production node_modules in the ZIP.
# GNOME Extensions usually run with GJS and don't bundle node_modules.
# Our logic runs as a separate Node process, but it now uses only built-in modules.

# 7. Compile translations
echo "Compiling translations..."
PO_DIR="extension/po"
if [ -d "$PO_DIR" ] && [ -f "$PO_DIR/LINGUAS" ]; then
  while IFS= read -r lang || [ -n "$lang" ]; do
    [ -z "$lang" ] && continue
    [[ "$lang" =~ ^# ]] && continue

    PO_FILE="$PO_DIR/${lang}.po"
    if [ -f "$PO_FILE" ]; then
      LOCALE_DIR="$BUILD_DIR/locale/$lang/LC_MESSAGES"
      mkdir -p "$LOCALE_DIR"
      msgfmt -o "$LOCALE_DIR/$EXTENSION_UUID.mo" "$PO_FILE"
    fi
  done < "$PO_DIR/LINGUAS"
fi

# 8. Create ZIP
echo "Creating ZIP archive..."
cd "$BUILD_DIR"

# Verify that no development patch remains in extension.js
if grep -q "TEMPORARY PATCH FOR SCREENSHOTS" "extension.js"; then
    echo "ERROR: Your extension.js still contains the screenshot patch!"
    echo "Please run 'npm run screenshots:unpatch' before packaging."
    exit 1
fi

# Use absolute path for ZIP to avoid issues with parent directory depth
ZIP_PATH="$(cd .. && pwd)/$ZIP_NAME"
# Exclude potential screenshot or git directories if they ever end up in build_zip
zip -r "$ZIP_PATH" . -x "screenshots/*" -x ".git/*"
cd ..

# Clean up build dir
rm -rf "$BUILD_DIR"

echo ""
echo "=== Success! ==="
echo "Package created: $ZIP_NAME"
echo "You can now upload this file to https://extensions.gnome.org/upload/"
