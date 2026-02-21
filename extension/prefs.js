import Adw from "gi://Adw";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class ClaudeUsagePreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();

    // Register custom icon theme path
    const iconTheme = Gtk.IconTheme.get_for_display(Gdk.Display.get_default());
    iconTheme.add_search_path(
      GLib.build_filenamev([this.path, "icons"]),
    );

    // Main page
    const page = new Adw.PreferencesPage({
      title: _("AI Usage Monitor"),
      icon_name: "ai-usage-monitor-symbolic",
    });
    window.add(page);

    // Authentication group
    const authGroup = new Adw.PreferencesGroup({
      title: _("Authentication"),
      description: _(
        "To get your session cookie: open claude.ai → F12 → Application tab → Cookies → copy the sessionKey value.",
      ),
    });
    page.add(authGroup);

    // Session cookie entry
    const cookieRow = new Adw.PasswordEntryRow({
      title: _("Session Cookie"),
    });
    cookieRow.set_text(settings.get_string("session-cookie"));
    cookieRow.connect("changed", () => {
      settings.set_string("session-cookie", cookieRow.get_text());
    });
    authGroup.add(cookieRow);

    // Refresh settings group
    const refreshGroup = new Adw.PreferencesGroup({
      title: _("Refresh"),
    });
    page.add(refreshGroup);

    // Refresh interval
    const intervalRow = new Adw.SpinRow({
      title: _("Refresh Interval"),
      subtitle: _("How often to check usage (in minutes)"),
      adjustment: new Gtk.Adjustment({
        lower: 5,
        upper: 120,
        step_increment: 5,
        page_increment: 15,
        value: settings.get_int("refresh-interval"),
      }),
    });
    intervalRow.connect("notify::value", () => {
      settings.set_int("refresh-interval", intervalRow.get_value());
    });
    refreshGroup.add(intervalRow);
  }
}
