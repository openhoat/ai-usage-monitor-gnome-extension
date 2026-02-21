import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import St from "gi://St";
import Clutter from "gi://Clutter";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";

const POLL_MIN_SECONDS = 60;

function getLevelClass(percentage) {
  if (percentage > 80) return "high";
  if (percentage >= 50) return "medium";
  return "low";
}

function formatResetTime(hours) {
  if (hours === null || hours === undefined) return null;
  const days = Math.floor(hours / 24);
  const h = hours % 24;
  if (days > 0) return `${days}d ${h}h`;
  return `${h}h`;
}

const UsageBarItem = GObject.registerClass(
  class UsageBarItem extends PopupMenu.PopupBaseMenuItem {
    _init(name, percentage) {
      super._init({ reactive: false, can_focus: false });

      const box = new St.BoxLayout({
        style_class: "ai-usage-bar-row",
        vertical: false,
        x_expand: true,
      });

      // Tier name
      const nameLabel = new St.Label({
        text: name,
        style_class: "ai-usage-bar-name",
        y_align: Clutter.ActorAlign.CENTER,
      });
      box.add_child(nameLabel);

      // Progress bar background
      const barBg = new St.Widget({
        style_class: "ai-usage-bar-bg",
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
      });

      // Progress bar fill
      const level = getLevelClass(percentage);
      const barFill = new St.Widget({
        style_class: `ai-usage-bar-fill ai-usage-level-${level}`,
        width: 0,
      });
      barBg.add_child(barFill);

      // Set fill width after allocation
      barBg.connect("notify::width", () => {
        const totalWidth = barBg.get_width();
        if (totalWidth > 0) {
          barFill.set_width(
            Math.round((totalWidth * Math.min(percentage, 100)) / 100),
          );
        }
      });

      box.add_child(barBg);

      // Percentage label
      const pctLabel = new St.Label({
        text: `${Math.round(percentage)}%`,
        style_class: "ai-usage-bar-percentage",
        y_align: Clutter.ActorAlign.CENTER,
      });
      box.add_child(pctLabel);

      this.add_child(box);
    }
  },
);

const ClaudeUsageIndicator = GObject.registerClass(
  class ClaudeUsageIndicator extends PanelMenu.Button {
    _init(extensionObj) {
      super._init(0.0, "AI Usage Monitor");
      this._extensionObj = extensionObj;
      this._settings = extensionObj.getSettings();
      this._pollSourceId = null;
      this._subprocess = null;

      // Panel box
      const panelBox = new St.BoxLayout({
        style_class: "ai-usage-indicator panel-status-indicators-box",
      });

      // Icon
      const iconPath = GLib.build_filenamev([
        extensionObj.path,
        "icons",
        "ai-usage-monitor-symbolic.svg",
      ]);
      this._icon = new St.Icon({
        style_class: "ai-usage-icon system-status-icon",
        gicon: Gio.icon_new_for_string(iconPath),
      });
      panelBox.add_child(this._icon);

      // Label
      this._label = new St.Label({
        text: "...",
        style_class: "ai-usage-label",
        y_align: Clutter.ActorAlign.CENTER,
      });
      panelBox.add_child(this._label);

      this.add_child(panelBox);

      // Build menu
      this._buildMenu();

      // Watch settings changes
      this._settingsChangedId = this._settings.connect("changed", () => {
        this._restartPolling();
      });

      // Start polling
      this._startPolling();

      // Fetch immediately
      this._fetchUsage();
    }

    _buildMenu() {
      // Header
      const headerItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      });
      const headerLabel = new St.Label({
        text: "AI Usage Monitor",
        style_class: "ai-usage-header",
      });
      headerItem.add_child(headerLabel);
      this.menu.addMenuItem(headerItem);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // Dynamic content area (usage bars will go here)
      this._contentSection = new PopupMenu.PopupMenuSection();
      this.menu.addMenuItem(this._contentSection);

      // Status/placeholder
      this._statusItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      });
      this._statusLabel = new St.Label({
        text: _("Loading..."),
        style_class: "ai-usage-status",
      });
      this._statusItem.add_child(this._statusLabel);
      this._contentSection.addMenuItem(this._statusItem);

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // Reset info
      this._resetItem = new PopupMenu.PopupBaseMenuItem({
        reactive: false,
        can_focus: false,
      });
      this._resetLabel = new St.Label({
        text: "",
        style_class: "ai-usage-reset",
      });
      this._resetItem.add_child(this._resetLabel);
      this.menu.addMenuItem(this._resetItem);
      this._resetItem.visible = false;

      this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

      // Refresh button
      const refreshItem = new PopupMenu.PopupMenuItem(_("Refresh"));
      refreshItem.connect("activate", () => {
        this._fetchUsage();
      });
      this.menu.addMenuItem(refreshItem);

      // Settings button
      const settingsItem = new PopupMenu.PopupMenuItem(_("Settings"));
      settingsItem.connect("activate", () => {
        this._extensionObj.openPreferences();
      });
      this.menu.addMenuItem(settingsItem);
    }

    _onUsageData(data) {
      // Clear dynamic content
      this._contentSection.removeAll();

      if (data.status === "error") {
        this._label.set_text("ERR");
        this._label.style_class = "ai-usage-label ai-usage-label-high";

        const errorItem = new PopupMenu.PopupBaseMenuItem({
          reactive: false,
          can_focus: false,
        });
        const errorLabel = new St.Label({
          text: data.message || "Unknown error",
          style_class: "ai-usage-status",
        });
        errorItem.add_child(errorLabel);
        this._contentSection.addMenuItem(errorItem);

        this._resetItem.visible = false;
        return;
      }

      // Update panel label
      const pct = Math.round(data.overall_percentage);
      this._label.set_text(`${pct}%`);
      const level = getLevelClass(data.overall_percentage);
      this._label.style_class = `ai-usage-label ai-usage-label-${level}`;

      // Add tier bars
      if (data.tiers && data.tiers.length > 0) {
        for (const tier of data.tiers) {
          this._contentSection.addMenuItem(
            new UsageBarItem(tier.name, tier.percentage),
          );
        }
      } else {
        // Show overall only
        this._contentSection.addMenuItem(
          new UsageBarItem("Usage", data.overall_percentage),
        );
      }

      // Reset info
      if (data.reset_in_hours !== null && data.reset_in_hours !== undefined) {
        const resetStr = formatResetTime(data.reset_in_hours);
        this._resetLabel.set_text(`Resets in ${resetStr}`);
        this._resetItem.visible = true;
      } else if (data.reset_date) {
        const d = new Date(data.reset_date);
        this._resetLabel.set_text(
          `Resets on ${d.toLocaleDateString()}`,
        );
        this._resetItem.visible = true;
      } else {
        this._resetItem.visible = false;
      }
    }

    _getCredential() {
      const provider = this._settings.get_string("provider");
      switch (provider) {
        case "openai":
          return {
            provider,
            credential: this._settings.get_string("openai-api-key"),
            errorMessage:
              "No OpenAI API key configured. Open Settings to configure.",
          };
        case "claude":
        default:
          return {
            provider: "claude",
            credential: this._settings.get_string("session-cookie"),
            errorMessage:
              "No session cookie configured. Open Settings to configure.",
          };
      }
    }

    _fetchUsage() {
      const { provider, credential, errorMessage } = this._getCredential();
      if (!credential) {
        this._onUsageData({
          status: "error",
          error_code: "no_credential",
          message: errorMessage,
        });
        return;
      }

      // Find node and fetch-usage.js
      const extensionDir = this._extensionObj.path;
      const scriptPath = GLib.build_filenamev([
        extensionDir,
        "fetch-usage.js",
      ]);

      // Check if script exists
      if (!GLib.file_test(scriptPath, GLib.FileTest.EXISTS)) {
        this._onUsageData({
          status: "error",
          error_code: "script_missing",
          message: `fetch-usage.js not found in extension directory`,
        });
        return;
      }

      // Find node binary — check Volta paths and common locations
      let nodePath = null;
      const nodeCandidates = [
        GLib.build_filenamev([GLib.get_home_dir(), ".volta", "bin", "node"]),
        "/usr/bin/node",
        "/usr/local/bin/node",
      ];
      for (const candidate of nodeCandidates) {
        if (GLib.file_test(candidate, GLib.FileTest.EXISTS)) {
          nodePath = candidate;
          break;
        }
      }

      if (!nodePath) {
        this._onUsageData({
          status: "error",
          error_code: "node_missing",
          message: "Node.js not found. Install Node.js to use this extension.",
        });
        return;
      }

      try {
        const proc = Gio.Subprocess.new(
          [nodePath, scriptPath, provider, credential],
          Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        );
        this._subprocess = proc;

        proc.communicate_utf8_async(null, null, (source, res) => {
          try {
            const [, stdout, stderr] = source.communicate_utf8_finish(res);
            this._subprocess = null;

            if (stdout && stdout.trim()) {
              try {
                const data = JSON.parse(stdout.trim());
                this._onUsageData(data);
              } catch (e) {
                this._onUsageData({
                  status: "error",
                  error_code: "parse_error",
                  message: `Failed to parse output: ${e.message}`,
                });
              }
            } else {
              this._onUsageData({
                status: "error",
                error_code: "no_output",
                message: stderr
                  ? `Script error: ${stderr.trim()}`
                  : "No output from fetch script",
              });
            }
          } catch (e) {
            this._subprocess = null;
            this._onUsageData({
              status: "error",
              error_code: "subprocess_error",
              message: `Subprocess error: ${e.message}`,
            });
          }
        });
      } catch (e) {
        this._onUsageData({
          status: "error",
          error_code: "spawn_error",
          message: `Failed to spawn process: ${e.message}`,
        });
      }
    }

    _startPolling() {
      this._stopPolling();
      let interval = this._settings.get_int("refresh-interval");
      const seconds = Math.max(interval * 60, POLL_MIN_SECONDS);
      this._pollSourceId = GLib.timeout_add_seconds(
        GLib.PRIORITY_DEFAULT,
        seconds,
        () => {
          this._fetchUsage();
          return GLib.SOURCE_CONTINUE;
        },
      );
    }

    _stopPolling() {
      if (this._pollSourceId) {
        GLib.source_remove(this._pollSourceId);
        this._pollSourceId = null;
      }
    }

    _restartPolling() {
      this._startPolling();
      this._fetchUsage();
    }

    destroy() {
      this._stopPolling();

      if (this._subprocess) {
        this._subprocess.force_exit();
        this._subprocess = null;
      }

      if (this._settingsChangedId) {
        this._settings.disconnect(this._settingsChangedId);
        this._settingsChangedId = null;
      }

      super.destroy();
    }
  },
);

export default class ClaudeUsageExtension extends Extension {
  enable() {
    this._indicator = new ClaudeUsageIndicator(this);
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    if (this._indicator) {
      this._indicator.destroy();
      this._indicator = null;
    }
  }
}
