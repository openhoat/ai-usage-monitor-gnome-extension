import Clutter from 'gi://Clutter'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import GObject from 'gi://GObject'
import St from 'gi://St'

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js'
import * as Main from 'resource:///org/gnome/shell/ui/main.js'
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js'
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js'

const POLL_MIN_SECONDS = 60
const SUBPROCESS_TIMEOUT_SECONDS = 60
const MAX_CONCURRENT_SUBPROCESSES = 5

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

const ERROR_ICONS = {
  auth_expired: 'dialog-password-symbolic',
  timeout: 'alarm-symbolic',
  network_error: 'network-error-symbolic',
  script_missing: 'dialog-warning-symbolic',
  node_missing: 'dialog-warning-symbolic',
  parse_error: 'dialog-error-symbolic',
  no_output: 'dialog-error-symbolic',
  subprocess_error: 'dialog-error-symbolic',
  spawn_error: 'dialog-error-symbolic',
}

const ERROR_MESSAGES = {
  auth_expired: 'Credential expired or invalid',
  timeout: 'Request timed out',
  network_error: 'Network error',
  script_missing: 'Script not found',
  node_missing: 'Node.js not found',
  parse_error: 'Invalid response',
  no_output: 'No data received',
  subprocess_error: 'Process error',
  spawn_error: 'Could not start process',
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

function formatLastRefreshTime(date) {
  if (!date) return null
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
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
      super._init(0.0, extensionObj.gettext('AI Usage Monitor'))
      this._extensionObj = extensionObj
      this._settings = extensionObj.getSettings()
      this._pollSourceId = null
      this._subprocesses = []
      this._providerResults = {}
      this._lastRefreshTime = null

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
      const _ = this._extensionObj.gettext.bind(this._extensionObj)
      // Header
      const headerItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      })
      const headerLabel = new St.Label({
        text: _('AI Usage Monitor'),
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
      const name = metadata.name || _('AI Usage Monitor')

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
      let nodePath = GLib.find_program_in_path('node')

      // Fallback to common locations if not in PATH
      if (!nodePath) {
        const nodeCandidates = [
          GLib.build_filenamev([GLib.get_home_dir(), '.volta', 'bin', 'node']),
          GLib.build_filenamev([
            GLib.get_home_dir(),
            '.nvm',
            'versions',
            'node',
            '*',
            'bin',
            'node',
          ]),
          '/usr/bin/node',
          '/usr/local/bin/node',
          '/usr/bin/nodejs',
        ]
        for (const candidate of nodeCandidates) {
          // Candidates with glob patterns need expansion
          if (candidate.includes('*')) {
            // Simple expansion is complex in GJS, so we mostly rely on find_program_in_path
            continue
          }
          if (GLib.file_test(candidate, GLib.FileTest.EXISTS)) {
            nodePath = candidate
            break
          }
        }
      }

      if (!nodePath) {
        this._onProviderResult(provider, {
          status: 'error',
          error_code: 'node_missing',
          message: 'Node.js not found in PATH or common locations',
        })
        return
      }

      // Limit concurrent subprocesses
      if (this._subprocesses.length >= MAX_CONCURRENT_SUBPROCESSES) {
        this._onProviderResult(provider, {
          status: 'error',
          error_code: 'subprocess_error',
          message: 'Too many concurrent processes',
        })
        return
      }

      try {
        const proc = Gio.Subprocess.new(
          [nodePath, scriptPath, provider, credential],
          Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        )
        this._subprocesses.push(proc)

        // Add timeout to kill hung subprocesses
        let timedOut = false
        const timeoutId = GLib.timeout_add_seconds(
          GLib.PRIORITY_DEFAULT,
          SUBPROCESS_TIMEOUT_SECONDS,
          () => {
            timedOut = true
            try {
              proc.force_exit()
            } catch {
              // Process may have already exited
            }
            return GLib.SOURCE_REMOVE
          }
        )

        proc.communicate_utf8_async(null, null, (source, res) => {
          // Clear timeout since process completed
          GLib.source_remove(timeoutId)

          try {
            const [, stdout, stderr] = source.communicate_utf8_finish(res)
            this._subprocesses = this._subprocesses.filter(p => p !== source)

            if (timedOut) {
              this._onProviderResult(provider, {
                status: 'error',
                error_code: 'timeout',
                message: `Process timed out after ${SUBPROCESS_TIMEOUT_SECONDS}s`,
              })
              return
            }

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
      const _ = this._extensionObj.gettext.bind(this._extensionObj)
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

      // Store the refresh time
      this._lastRefreshTime = new Date()

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
          const errorBox = new St.BoxLayout({
            style_class: 'ai-usage-error-row',
            vertical: false,
          })
          const iconName = ERROR_ICONS[data.error_code] || 'dialog-error-symbolic'
          errorBox.add_child(
            new St.Icon({
              icon_name: iconName,
              style_class: 'ai-usage-error-icon',
              icon_size: 16,
            })
          )
          const friendlyMessage = ERROR_MESSAGES[data.error_code] || data.message || 'Unknown error'
          errorBox.add_child(
            new St.Label({
              text: friendlyMessage,
              style_class: 'ai-usage-error-label',
              y_align: Clutter.ActorAlign.CENTER,
            })
          )
          errorItem.add_child(errorBox)
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
              text: _('Resets in %s').replace('%s', resetStr),
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
        this._label.set_text(_('ERR'))
        this._label.style_class = 'ai-usage-label ai-usage-label-high'
      }

      // Add last refresh time display
      if (this._lastRefreshTime) {
        const timeStr = formatLastRefreshTime(this._lastRefreshTime)
        const lastRefreshItem = new PopupMenu.PopupBaseMenuItem({
          reactive: false,
          can_focus: false,
        })
        lastRefreshItem.add_child(
          new St.Label({
            text: _('Last updated: %s').replace('%s', timeStr),
            style_class: 'ai-usage-last-refresh',
          })
        )
        this._contentSection.addMenuItem(lastRefreshItem)
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
    // Initialize translations from extension's locale directory
    // Note: gettext is auto-configured by Extension base class using uuid as domain
    // this.initTranslations('ai-usage-monitor')
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
