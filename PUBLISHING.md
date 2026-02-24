# Publishing on extensions.gnome.org (EGO)

This guide provides instructions for submitting the AI Usage Monitor extension to the official GNOME extensions repository.

## 1. Screenshots

GNOME requires at least one screenshot.

Available screenshots in this repository:
- `screenshots/extension-menu.jpg`: The main usage dropdown menu.
- `screenshots/preferences-window.png`: The extension settings window.

If you need to take new screenshots on Wayland:

### Step-by-step Capture:

1.  **Patch the extension**:
    ```bash
    npm run screenshots:patch
    ```
2.  **Reload the extension**: Run `npm run dev` or restart GNOME Shell.
3.  **Take captures**: 
    *   Click the extension icon.
    *   Click **📸 Take Screenshot (5s delay)**.
    *   You have 5 seconds to open the menu exactly as you want it.
    *   The screenshot will be saved in your **Home folder**.
4.  **Unpatch the extension (CRITICAL)**:
    ```bash
    npm run screenshots:unpatch
    ```
    *This ensures no development code is included in your publication.*

## 2. Prepare the package

Once you have your screenshots, generate the clean ZIP archive:

```bash
npm run pack
```

The file will be named `dist/ai-usage-monitor@openhoat.dev.zip`.

## 3. Submit to EGO

1. Go to [https://extensions.gnome.org/upload/](https://extensions.gnome.org/upload/).
2. Upload the ZIP file from `dist/ai-usage-monitor@openhoat.dev.zip`.
3. Provide a brief description (you can reuse the one from `metadata.json`).

## 4. Notes for Reviewers

When submitting, paste the following in the **"Notes for Reviewers"** field:

> **Technical Notes:**
> This extension uses a small Node.js helper script (`fetch-usage.js`) to retrieve usage data from AI providers. 
> 
> **Why Node.js?**
> Some providers (like Claude) require complex HTML parsing of their settings page to extract usage data. This is handled via the `cheerio` library.
> 
> **Security & Portability:**
> - The extension detects the `node` binary automatically in common paths (PATH, Volta, NVM).
> - Only the necessary production dependencies (from `node_modules`) are included in the package.
> - The helper script is called as an asynchronous subprocess.

## 5. Review Process

- Once submitted, your extension will be in the "Awaiting Review" state.
- Check your email for notifications from `extensions.gnome.org`.