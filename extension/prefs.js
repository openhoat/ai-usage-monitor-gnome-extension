import Adw from 'gi://Adw'
import Gdk from 'gi://Gdk'
import Gio from 'gi://Gio'
import GLib from 'gi://GLib'
import Gtk from 'gi://Gtk'

import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

const SUBPROCESS_TIMEOUT_SECONDS = 30

const PROVIDER_CONFIG = {
  claude: {
    settingKey: 'session-cookie',
    label: 'Claude (Anthropic)',
    description:
      'To get your session cookie: open claude.ai → F12 → Application tab → Cookies → copy the sessionKey value.',
  },
  openai: {
    settingKey: 'openai-api-key',
    label: 'OpenAI (ChatGPT)',
    description:
      'Requires an Admin API key (not a regular key). Go to platform.openai.com → Settings → Organization → API keys → Create admin key.',
  },
  ollama: {
    settingKey: 'ollama-session-cookie',
    label: 'Ollama',
    description:
      'To get your session cookie: open ollama.com → F12 → Application → Cookies → copy the __Secure-session value.',
  },
}

export default class AiUsageMonitorPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const _ = this.gettext.bind(this)
    const settings = this.getSettings()

    // Register custom icon theme path
    const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default())
    iconTheme.add_search_path(GLib.build_filenamev([this.path, 'icons']))

    // Main page
    const page = new Adw.PreferencesPage({
      title: _('AI Usage Monitor'),
      icon_name: 'ai-usage-monitor-symbolic',
    })
    window.add(page)

    // Provider groups
    for (const [providerId, config] of Object.entries(PROVIDER_CONFIG)) {
      const group = this._createProviderGroup(settings, providerId, config)
      page.add(group)
    }

    // Refresh settings group
    const refreshGroup = new Adw.PreferencesGroup({
      title: _('Refresh'),
    })
    page.add(refreshGroup)

    const intervalRow = new Adw.SpinRow({
      title: _('Refresh Interval'),
      subtitle: _('How often to check usage (in minutes)'),
      adjustment: new Gtk.Adjustment({
        lower: 5,
        upper: 120,
        step_increment: 5,
        page_increment: 15,
        value: settings.get_int('refresh-interval'),
      }),
    })
    intervalRow.connect('notify::value', () => {
      settings.set_int('refresh-interval', intervalRow.get_value())
    })
    refreshGroup.add(intervalRow)
  }

  _createProviderGroup(settings, providerId, config) {
    const _ = this.gettext.bind(this)
    const group = new Adw.PreferencesGroup({
      title: _(config.label),
      description: _(config.description),
    })

    // Credential row with test button
    const credentialRow = new Adw.PasswordEntryRow({
      title: _('Credential'),
    })
    credentialRow.set_text(settings.get_string(config.settingKey))
    credentialRow.connect('changed', () => {
      settings.set_string(config.settingKey, credentialRow.get_text())
    })

    // Test button
    const testButton = new Gtk.Button({
      label: _('Test'),
      valign: Gtk.Align.CENTER,
      css_classes: ['pill'],
    })

    // Status indicator
    const statusIcon = new Gtk.Image({
      icon_name: '',
      valign: Gtk.Align.CENTER,
      visible: false,
    })

    // Add test button and status to the row
    credentialRow.add_suffix(testButton)
    credentialRow.add_suffix(statusIcon)

    // Test button click handler
    testButton.connect('clicked', () => {
      const credential = credentialRow.get_text()
      if (!credential) {
        this._showStatus(statusIcon, 'error', _('Enter a credential first'))
        return
      }

      testButton.set_sensitive(false)
      testButton.set_label(_('Testing...'))
      this._showStatus(statusIcon, 'loading', null)

      this._testCredential(providerId, credential, result => {
        testButton.set_sensitive(true)
        testButton.set_label(_('Test'))

        if (result.success) {
          this._showStatus(statusIcon, 'success', _('Valid'))
        } else {
          this._showStatus(statusIcon, 'error', result.message || _('Invalid'))
        }
      })
    })

    group.add(credentialRow)
    return group
  }

  _showStatus(icon, type, text) {
    const _ = this.gettext.bind(this)
    icon.visible = true

    switch (type) {
      case 'success':
        icon.icon_name = 'object-select-symbolic'
        icon.remove_css_class('error')
        icon.add_css_class('success')
        icon.set_tooltip_text(text || '')
        break
      case 'error':
        icon.icon_name = 'dialog-error-symbolic'
        icon.remove_css_class('success')
        icon.add_css_class('error')
        icon.set_tooltip_text(text || '')
        break
      case 'loading':
        icon.icon_name = 'content-loading-symbolic'
        icon.remove_css_class('success')
        icon.remove_css_class('error')
        icon.set_tooltip_text(_('Testing...'))
        break
      default:
        icon.visible = false
    }
  }

  _testCredential(providerId, credential, callback) {
    const _ = this.gettext.bind(this)
    const scriptPath = GLib.build_filenamev([this.path, 'fetch-usage.js'])

    if (!GLib.file_test(scriptPath, GLib.FileTest.EXISTS)) {
      callback({ success: false, message: _('Script not found') })
      return
    }

    // Find node binary
    let nodePath = GLib.find_program_in_path('node')

    // Fallback to common locations if not in PATH
    if (!nodePath) {
      const nodeCandidates = [
        GLib.build_filenamev([GLib.get_home_dir(), '.volta', 'bin', 'node']),
        GLib.build_filenamev([GLib.get_home_dir(), '.nvm', 'versions', 'node', '*', 'bin', 'node']),
        '/usr/bin/node',
        '/usr/local/bin/node',
        '/usr/bin/nodejs',
      ]
      for (const candidate of nodeCandidates) {
        if (candidate.includes('*')) continue
        if (GLib.file_test(candidate, GLib.FileTest.EXISTS)) {
          nodePath = candidate
          break
        }
      }
    }

    if (!nodePath) {
      callback({
        success: false,
        message: _('Node.js not found in PATH or common locations'),
      })
      return
    }

    try {
      const proc = Gio.Subprocess.new(
        [nodePath, scriptPath, providerId, credential],
        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
      )

      // Add timeout
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
        GLib.source_remove(timeoutId)

        try {
          const [, stdout, stderr] = source.communicate_utf8_finish(res)

          if (timedOut) {
            callback({ success: false, message: _('Request timed out') })
            return
          }

          if (stdout?.trim()) {
            try {
              const data = JSON.parse(stdout.trim())
              if (data.status === 'ok') {
                callback({ success: true, message: null })
              } else {
                // Map error codes to user-friendly messages
                const errorMessages = {
                  auth_expired: _('Credential expired or invalid'),
                  timeout: _('Request timed out'),
                  network_error: _('Network error'),
                }
                const message =
                  errorMessages[data.error_code] || data.message || _('Invalid credential')
                callback({ success: false, message })
              }
            } catch {
              callback({ success: false, message: _('Invalid response from server') })
            }
          } else {
            callback({
              success: false,
              message: stderr?.trim() || _('No response from server'),
            })
          }
        } catch {
          callback({ success: false, message: _('Could not run validation') })
        }
      })
    } catch {
      callback({ success: false, message: _('Could not start validation process') })
    }
  }
}
