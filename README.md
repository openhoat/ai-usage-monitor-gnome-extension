# AI Usage Monitor - GNOME Shell Extension

A GNOME Shell extension that monitors your AI subscription usage in real-time in the top bar. Supports multiple AI providers.

## Supported Providers

| Provider | Authentication | Usage Data |
|----------|---------------|------------|
| **Claude** (Anthropic) | Session cookie | Tier usage (Standard 5h, Extended 7d) |
| **OpenAI** | API key | Monthly costs by model |

## Features

- **Multi-provider support**: Monitor Claude, OpenAI, or other AI services
- **Real-time usage display**: Shows your current usage percentage in the GNOME top bar
- **Multi-tier support**: Displays usage breakdown by tier or model
- **Visual indicators**: Color-coded usage levels (violet < 50%, orange 50-80%, red > 80%)
- **Dropdown menu**: Detailed breakdown with progress bars
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
   cp -r dist/* ~/.local/share/gnome-shell/extensions/ai-usage-monitor@openhoat.dev/
   cp -r node_modules ~/.local/share/gnome-shell/extensions/ai-usage-monitor@openhoat.dev/
   glib-compile-schemas ~/.local/share/gnome-shell/extensions/ai-usage-monitor@openhoat.dev/schemas/
   ```

3. Enable the extension:
   ```bash
   gnome-extensions enable ai-usage-monitor@openhoat.dev
   ```

4. Log out and log back in (Wayland) or restart GNOME Shell (X11: Alt+F2 → 'r')

## Configuration

Open the extension preferences to select your provider and enter credentials:

```bash
gnome-extensions prefs ai-usage-monitor@openhoat.dev
```

### Claude Setup

1. Open [claude.ai](https://claude.ai) and log in
2. Open Developer Tools (F12)
3. Go to Application → Cookies → `https://claude.ai`
4. Copy the value of `sessionKey`
5. In the extension preferences, select **Claude (Anthropic)** and paste the session key

### OpenAI Setup

1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new API key
3. In the extension preferences, select **OpenAI (ChatGPT)** and paste the API key

### Refresh Interval

By default, the extension refreshes usage data every 30 minutes. You can adjust this in the preferences (5-120 minutes).

## Architecture

The extension uses a **provider-based architecture** with two main components:

### 1. TypeScript Fetch Script (`src/`)

- **`fetch-usage.ts`**: Entry point — dispatches to the selected provider
- **`providers/claude.ts`**: Claude provider — scrapes usage via API and HTML fallback
- **`providers/openai.ts`**: OpenAI provider — fetches monthly costs via API
- **`providers/index.ts`**: Provider registry
- **`types.ts`**: Shared interfaces (`UsageResult`, `Provider`, etc.)

### 2. GNOME Shell Extension (`extension/`)

- **extension.js**: Panel indicator, dropdown menu, and polling logic (GJS)
- **prefs.js**: Adw preferences dialog with provider selector and credentials
- **stylesheet.css**: Styling for usage bars and color levels
- **icons/**: Custom gauge SVG icon
- **schemas/**: GSettings schema for persistent configuration

## API Response Format

All providers return the same JSON format:

```json
{
  "status": "ok",
  "provider": "claude",
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
│   ├── fetch-usage.ts              # Entry point (provider dispatcher)
│   ├── types.ts                    # Shared interfaces
│   └── providers/
│       ├── index.ts                # Provider registry
│       ├── claude.ts               # Claude provider
│       └── openai.ts               # OpenAI provider
├── dist/                           # Compiled output
├── extension/
│   ├── metadata.json               # Extension metadata
│   ├── extension.js                # Main extension code
│   ├── prefs.js                    # Preferences dialog
│   ├── stylesheet.css              # CSS styling
│   ├── icons/
│   │   └── ai-usage-monitor-symbolic.svg
│   └── schemas/
│       └── org.gnome.shell.extensions.ai-usage-monitor.gschema.xml
├── .claude/                        # Claude Code rules and workflows
├── .clinerules/                    # Cline rules and workflows
├── KANBAN.md                       # Task management
├── CHANGELOG.md                    # Modification history
├── package.json                    # npm configuration
├── tsconfig.json                   # TypeScript configuration
└── install.sh                      # Build and install script
```

## Adding a New Provider

1. Create `src/providers/<name>.ts` implementing the `Provider` interface
2. Register it in `src/providers/index.ts`
3. Add a GSettings key for credentials in the schema XML
4. Add UI elements in `extension/prefs.js`

## Troubleshooting

### Extension not appearing after installation

On Wayland, you need to log out and log back in for GNOME Shell to detect new extensions.

### "Node.js not found" error

Make sure Node.js is installed and accessible. The extension looks for Node.js in:
- `~/.volta/bin/node` (Volta)
- `/usr/bin/node`
- `/usr/local/bin/node`

### "Auth expired" error

Your credential has expired. Get a fresh one from your provider and update it in the extension preferences.

### Extension shows errors

Check the GNOME Shell logs:
```bash
journalctl -f /usr/bin/gnome-shell | grep -i usage
```

## Development

### Building

```bash
npm run build
```

### Testing the fetch script

```bash
node dist/fetch-usage.js claude <your-session-cookie>
node dist/fetch-usage.js openai <your-api-key>
```

## License

MIT License

## Author

Olivier Penhoat <openhoat@gmail.com>

## Acknowledgments

- Built with [Claude Code](https://claude.ai/claude-code)
- Inspired by the need for local AI usage monitoring
