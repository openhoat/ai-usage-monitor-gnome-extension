# AI Usage Monitor - GNOME Shell Extension

A GNOME Shell extension that displays your Claude.ai Pro subscription usage in real-time in the top bar.

## Features

- **Real-time usage display**: Shows your current usage percentage in the GNOME top bar
- **Multi-tier support**: Displays usage for Standard (5h) and Extended (7d) tiers
- **Visual indicators**: Color-coded usage levels (violet < 50%, orange 50-80%, red > 80%)
- **Dropdown menu**: Detailed breakdown by tier with progress bars
- **Reset countdown**: Shows when your usage will reset
- **Configurable refresh**: Set custom refresh interval (5-120 minutes)

## Installation

### Prerequisites

- GNOME Shell 49
- Node.js 22+ (for the fetch script)
- Volta (recommended) or npm

### Quick Install

```bash
git clone https://github.com/openhoat/ai-usage-monitor.git
cd ai-usage-monitor
./install.sh
```

### Manual Installation

1. Build the TypeScript fetch script:
   ```bash
   npm install
   npm run build
   ```

2. Copy extension files to the GNOME extensions directory:
   ```bash
   mkdir -p ~/.local/share/gnome-shell/extensions/ai-usage-monitor@openhoat.dev
   cp -r extension/* ~/.local/share/gnome-shell/extensions/ai-usage-monitor@openhoat.dev/
   cp dist/fetch-usage.js ~/.local/share/gnome-shell/extensions/ai-usage-monitor@openhoat.dev/
   cp -r node_modules ~/.local/share/gnome-shell/extensions/ai-usage-monitor@openhoat.dev/
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/ai-usage-monitor@openhoat.dev/schemas/
   ```

3. Enable the extension:
   ```bash
   gnome-extensions enable ai-usage-monitor@openhoat.dev
   ```

4. Log out and log back in (Wayland) or restart GNOME Shell (X11: Alt+F2 → 'r')

## Configuration

### Setting the Session Cookie

1. Open [claude.ai](https://claude.ai) and log in
2. Open Developer Tools (F12)
3. Go to Application → Cookies → `https://claude.ai`
4. Copy the value of `sessionKey`
5. Open extension preferences:
   ```bash
   gnome-extensions prefs ai-usage-monitor@openhoat.dev
   ```
6. Paste the session key in the "Session Cookie" field

### Refresh Interval

By default, the extension refreshes usage data every 30 minutes. You can adjust this in the preferences (5-120 minutes).

## Architecture

The extension consists of two main components:

### 1. TypeScript Fetch Script (`src/fetch-usage.ts`)

- Scrapes usage data from Claude.ai internal API endpoints
- Uses `fetch` (native in Node.js 24) and `cheerio` for HTML parsing
- Returns JSON with tier usage and reset information
- Can be tested independently: `node dist/fetch-usage.js <cookie>`

### 2. GNOME Shell Extension (`extension/`)

- **extension.js**: Panel indicator, dropdown menu, and polling logic (GJS)
- **prefs.js**: Adw preferences dialog for cookie and interval settings
- **stylesheet.css**: Styling for usage bars and color levels
- **schemas/**: GSettings schema for persistent configuration

## API Response Format

The extension expects JSON output from the fetch script:

```json
{
  "status": "ok",
  "plan": "pro",
  "tiers": [
    { "name": "Standard (5h)", "percentage": 42.0 },
    { "name": "Extended (7d)", "percentage": 12.0 }
  ],
  "overall_percentage": 42.0,
  "reset_date": "2026-02-28T00:00:00Z",
  "reset_in_hours": 168
}
```

## Project Structure

```
ai-usage-monitor/
├── src/
│   └── fetch-usage.ts          # TypeScript scraping script
├── dist/
│   └── fetch-usage.js          # Compiled script
├── extension/
│   ├── metadata.json           # Extension metadata
│   ├── extension.js            # Main extension code
│   ├── prefs.js                # Preferences dialog
│   ├── stylesheet.css          # CSS styling
│   └── schemas/
│       └── org.gnome.shell.extensions.ai-usage-monitor.gschema.xml
├── .claude/                    # Claude Code rules and workflows
├── .clinerules/                # Cline rules and workflows
├── KANBAN.md                   # Task management
├── CHANGELOG.md                # Modification history
├── package.json                # npm configuration
├── tsconfig.json               # TypeScript configuration
└── install.sh                  # Build and install script
```

## Troubleshooting

### Extension not appearing after installation

On Wayland, you need to log out and log back in for GNOME Shell to detect new extensions.

### "Node.js not found" error

Make sure Node.js is installed and accessible. The extension looks for Node.js in:
- `~/.volta/bin/node` (Volta)
- `/usr/bin/node`
- `/usr/local/bin/node`

### "Auth expired" error

Your session cookie has expired. Get a fresh `sessionKey` from claude.ai and update it in the extension preferences.

### Extension shows errors

Check the GNOME Shell logs:
```bash
journalctl -f /usr/bin/gnome-shell | grep -i claude
```

## Development

### Building

```bash
npm run build
```

### Testing the fetch script

```bash
node dist/fetch-usage.js <your-session-cookie>
```

## License

MIT License

## Author

Olivier Penhoat <openhoat@gmail.com>

## Acknowledgments

- Built with [Claude Code](https://claude.ai/claude-code)
- Inspired by the need for local Claude usage monitoring