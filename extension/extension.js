import Clutter from 'gi://Clutter'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { gettext as _, Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js'

const POLL_MIN_SECONDS = 60

const PROVIDER_LABELS = {
  claude: 'Claude',
  ollama: 'Ollama',
  openai: 'OpenAI',
}

const PROVIDER_CREDENTIALS = {
  claude: 'session-cookie',
  ollama: 'ollama-session-cookie',
  openai: 'openai-api-key',
}

function getLevelClass(percentage) {
  if (percentage > 80) return 'high'
  if (percentage >= 50) return 'medium'
  return 'low'
}

function formatResetTime(hours) {
  if (hours === null || hours === undefined) return null
  const days = Math.floor(hours / 24)
  const h = hours % 24
  if (days > 0) return `${days}d ${h}h`
  return `${h}h`
}

const UsageBarItem = GObject.registerClass(
  class UsageBarItem extends PopupMenu.PopupBaseMenuItem {
    _init(name, percentage) {
      super._init({ reactive: false, can_focus: false })

      const box = new St.BoxLayout({
        style_class: 'ai-usage-bar-row',
        vertical: false,
        x_expand: true,
      })

      // Tier name
      const nameLabel = new St.Label({
        text: name,
        style_class: 'ai-usage-bar-name',
        y_align: Clutter.ActorAlign.CENTER,
      })
      box.add_child(nameLabel)

      // Progress bar background
      const barBg = new St.Widget({
        style_class: 'ai-usage-bar-bg',
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
      })

      // Progress bar fill
      const level = getLevelClass(percentage)
      const barFill = new St.Widget({
        style_class: `ai-usage-bar-fill ai-usage-level-${level}`,
        width: 0,
      })
      barBg.add_child(barFill)

      // Set fill width after allocation
      barBg.connect('notify::width', () => {
        const totalWidth = barBg.get_width()
        if (totalWidth > 0) {
          barFill.set_width(Math.round((totalWidth * Math.min(percentage, 100)) / 100))
        }
      })

      box.add_child(barBg)

      // Percentage label
      const pctLabel = new St.Label({
        text: `${Math.round(percentage)}%`,
        style_class: 'ai-usage-bar-percentage',
        y_align: Clutter.ActorAlign.CENTER,
      })
      box.add_child(pctLabel)

      this.add_child(box)
    }
  }
)

const AiUsageIndicator = GObject.registerClass(
  class AiUsageIndicator extends PanelMenu.Button {
    _init(extensionObj) {
      super._init(0.0, 'AI Usage Monitor')
      this._extensionObj = extensionObj
      this._settings = extensionObj.getSettings()
      this._pollSourceId = null
      this._subprocesses = []
      this._providerResults = {}

      // Panel box
      const panelBox = new St.BoxLayout({
        style_class: 'ai-usage-indicator panel-status-indicators-box',
      })

      // Icon
      const iconPath = GLib.build_filenamev([
        extensionObj.path,
        'icons',
        'ai-usage-monitor-symbolic.svg',
      ])
      this._icon = new St.Icon({
        style_class: 'ai-usage-icon system-status-icon',
        gicon: Gio.icon_new_for_string(iconPath),
      })
      panelBox.add_child(this._icon)

      // Label
      this._label = new St.Label({
        text: '...',
        style_class: 'ai-usage-label',
        y_align: Clutter.ActorAlign.CENTER,
      })
      panelBox.add_child(this._label)

      this.add_child(panelBox)

      // Build menu
      this._buildMenu()

      // Watch settings changes
      this._settingsChangedId = this._settings.connect('changed', () => {
        this._restartPolling()
      })

      // Start polling
      this._startPolling()

      // Fetch immediately
      this._fetchAllProviders()
    }

    _buildMenu() {
      // Header
      const headerItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      })
      const headerLabel = new St.Label({
        text: 'AI Usage Monitor',
        style_class: 'ai-usage-header',
      })
      headerItem.add_child(headerLabel)
      this.menu.addMenuItem(headerItem)

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())

      // Dynamic content area
      this._contentSection = new PopupMenu.PopupMenuSection()
      this.menu.addMenuItem(this._contentSection)

      // Status/placeholder
      this._statusItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      })
      this._statusLabel = new St.Label({
        text: _('Loading...'),
        style_class: 'ai-usage-status',
      })
      this._statusItem.add_child(this._statusLabel)
      this._contentSection.addMenuItem(this._statusItem)

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem())

      // Refresh button
      const refreshItem = new PopupMenu.PopupMenuItem(_('Refresh'))
      refreshItem.connect('activate', () => {
        this._fetchAllProviders()
      })
      this.menu.addMenuItem(refreshItem)

      // Settings button
      const settingsItem = new PopupMenu.PopupMenuItem(_('Settings'))
      settingsItem.connect('activate', () => {
        this._extensionObj.openPreferences()
      })
      this.menu.addMenuItem(settingsItem)

      // About submenu
      const aboutItem = new PopupMenu.PopupSubMenuMenuItem(_('About'))
      const metadata = this._extensionObj.metadata
      const version = metadata.version || '?'
      const name = metadata.name || 'AI Usage Monitor'

      const infoItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      })
      infoItem.add_child(
        new St.Label({
          text: `${name} v${version}`,
          style_class: 'ai-usage-status',
        })
      )
      aboutItem.menu.addMenuItem(infoItem)

      if (metadata.url) {
        const urlItem = new PopupMenu.PopupBaseMenuItem({
          reactive: false,
          can_focus: false,
        })
        urlItem.add_child(
          new St.Label({
            text: metadata.url,
            style_class: 'ai-usage-status',
          })
        )
        aboutItem.menu.addMenuItem(urlItem)
      }

      this.menu.addMenuItem(aboutItem)
    }

    _getConfiguredProviders() {
      const configured = []
      for (const [provider, settingKey] of Object.entries(PROVIDER_CREDENTIALS)) {
        const credential = this._settings.get_string(settingKey)
        if (credential) {
          configured.push({ provider, credential })
        }
      }
      return configured
    }

    _fetchAllProviders() {
      const configured = this._getConfiguredProviders()

      if (configured.length === 0) {
        this._onAllResults({})
        return
      }

      this._providerResults = {}
      this._pendingFetches = configured.length

      for (const { provider, credential } of configured) {
        this._fetchProvider(provider, credential)
      }
    }

    _fetchProvider(provider, credential) {
      const extensionDir = this._extensionObj.path
      const scriptPath = GLib.build_filenamev([extensionDir, 'fetch-usage.js'])

      if (!GLib.file_test(scriptPath, GLib.FileTest.EXISTS)) {
        this._onProviderResult(provider, {
          status: 'error',
          error_code: 'script_missing',
          message: 'fetch-usage.js not found',
        })
        return
      }

      // Find node binary
      let nodePath = null
      const nodeCandidates = [
        GLib.build_filenamev([GLib.get_home_dir(), '.volta', 'bin', 'node']),
        '/usr/bin/node',
        '/usr/local/bin/node',
      ]
      for (const candidate of nodeCandidates) {
        if (GLib.file_test(candidate, GLib.FileTest.EXISTS)) {
          nodePath = candidate
          break
        }
      }

      if (!nodePath) {
        this._onProviderResult(provider, {
          status: 'error',
          error_code: 'node_missing',
          message: 'Node.js not found',
        })
        return
      }

      try {
        const proc = Gio.Subprocess.new(
          [nodePath, scriptPath, provider, credential],
          Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        )
        this._subprocesses.push(proc)

        proc.communicate_utf8_async(null, null, (source, res) => {
          try {
            const [, stdout, stderr] = source.communicate_utf8_finish(res)
            this._subprocesses = this._subprocesses.filter(p => p !== source)

            if (stdout?.trim()) {
              try {
                const data = JSON.parse(stdout.trim())
                this._onProviderResult(provider, data)
              } catch (e) {
                this._onProviderResult(provider, {
                  status: 'error',
                  error_code: 'parse_error',
                  message: `Parse error: ${e.message}`,
                })
              }
            } else {
              this._onProviderResult(provider, {
                status: 'error',
                error_code: 'no_output',
                message: stderr ? `Error: ${stderr.trim()}` : 'No output from fetch script',
              })
            }
          } catch (e) {
            this._subprocesses = this._subprocesses.filter(p => p !== source)
            this._onProviderResult(provider, {
              status: 'error',
              error_code: 'subprocess_error',
              message: `Subprocess error: ${e.message}`,
            })
          }
        })
      } catch (e) {
        this._onProviderResult(provider, {
          status: 'error',
          error_code: 'spawn_error',
          message: `Spawn error: ${e.message}`,
        })
      }
    }

    _onProviderResult(provider, data) {
      this._providerResults[provider] = data
      this._pendingFetches--

      if (this._pendingFetches <= 0) {
        this._onAllResults(this._providerResults)
      }
    }

    _onAllResults(results) {
      this._contentSection.removeAll()

      const providers = Object.keys(results)

      if (providers.length === 0) {
        this._label.set_text('--')
        this._label.style_class = 'ai-usage-label'

        const noConfigItem = new PopupMenu.PopupBaseMenuItem({
          reactive: false,
          can_focus: false,
        })
        noConfigItem.add_child(
          new St.Label({
            text: _('No providers configured. Open Settings.'),
            style_class: 'ai-usage-status',
          })
        )
        this._contentSection.addMenuItem(noConfigItem)
        return
      }

      // Collect all successful percentages for the panel label
      let maxPercentage = 0
      let hasSuccess = false

      for (const provider of providers) {
        const data = results[provider]
        const label = PROVIDER_LABELS[provider] || provider

        // Provider header separator
        this._contentSection.addMenuItem(new PopupMenu.PopupSeparatorMenuItem(label))

        if (data.status === 'error') {
          const errorItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
          })
          errorItem.add_child(
            new St.Label({
              text: data.message || 'Unknown error',
              style_class: 'ai-usage-status',
            })
          )
          this._contentSection.addMenuItem(errorItem)
          continue
        }

        hasSuccess = true
        if (data.overall_percentage > maxPercentage) {
          maxPercentage = data.overall_percentage
        }

        // Tier bars
        if (data.tiers && data.tiers.length > 0) {
          for (const tier of data.tiers) {
            this._contentSection.addMenuItem(new UsageBarItem(tier.name, tier.percentage))
          }
        }

        // Reset info per provider
        if (data.reset_in_hours !== null && data.reset_in_hours !== undefined) {
          const resetStr = formatResetTime(data.reset_in_hours)
          const resetItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            can_focus: false,
          })
          resetItem.add_child(
            new St.Label({
              text: `Resets in ${resetStr}`,
              style_class: 'ai-usage-reset',
            })
          )
          this._contentSection.addMenuItem(resetItem)
        }
      }

      // Update panel label with max usage across all providers
      if (hasSuccess) {
        const pct = Math.round(maxPercentage)
        this._label.set_text(`${pct}%`)
        const level = getLevelClass(maxPercentage)
        this._label.style_class = `ai-usage-label ai-usage-label-${level}`
      } else {
        this._label.set_text('ERR')
        this._label.style_class = 'ai-usage-label ai-usage-label-high'
      }
    }

    _startPolling() {
      this._stopPolling()
      const interval = this._settings.get_int('refresh-interval')
      const seconds = Math.max(interval * 60, POLL_MIN_SECONDS)
      this._pollSourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, seconds, () => {
        this._fetchAllProviders()
        return GLib.SOURCE_CONTINUE
      })
    }

    _stopPolling() {
      if (this._pollSourceId) {
        GLib.source_remove(this._pollSourceId)
        this._pollSourceId = null
      }
    }

    _restartPolling() {
      this._startPolling()
      this._fetchAllProviders()
    }

    destroy() {
      this._stopPolling()

      for (const proc of this._subprocesses) {
        proc.force_exit()
      }
      this._subprocesses = []

      if (this._settingsChangedId) {
        this._settings.disconnect(this._settingsChangedId)
        this._settingsChangedId = null
      }

      super.destroy()
    }
  }
)

export default class AiUsageExtension extends Extension {
  enable() {
    this._indicator = new AiUsageIndicator(this)
    Main.panel.addToStatusArea(this.uuid, this._indicator)
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy()
      this._indicator = null
    }
  }
}
