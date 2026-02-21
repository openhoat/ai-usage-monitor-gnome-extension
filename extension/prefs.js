import Adw from "gi://Adw";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class AiUsageMonitorPreferences extends ExtensionPreferences {
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

    // Claude authentication group
    const claudeGroup = new Adw.PreferencesGroup({
      title: _("Claude (Anthropic)"),
      description: _(
        "To get your session cookie: open claude.ai → F12 → Application tab → Cookies → copy the sessionKey value.",
      ),
    });
    page.add(claudeGroup);

    const cookieRow = new Adw.PasswordEntryRow({
      title: _("Session Cookie"),
    });
    cookieRow.set_text(settings.get_string("session-cookie"));
    cookieRow.connect("changed", () => {
      settings.set_string("session-cookie", cookieRow.get_text());
    });
    claudeGroup.add(cookieRow);

    // OpenAI authentication group
    const openaiGroup = new Adw.PreferencesGroup({
      title: _("OpenAI (ChatGPT)"),
      description: _(
        "Enter your API key from platform.openai.com/api-keys.",
      ),
    });
    page.add(openaiGroup);

    const apiKeyRow = new Adw.PasswordEntryRow({
      title: _("API Key"),
    });
    apiKeyRow.set_text(settings.get_string("openai-api-key"));
    apiKeyRow.connect("changed", () => {
      settings.set_string("openai-api-key", apiKeyRow.get_text());
    });
    openaiGroup.add(apiKeyRow);

    // Ollama authentication group
    const ollamaGroup = new Adw.PreferencesGroup({
      title: _("Ollama"),
      description: _(
        "To get your session cookie: open ollama.com → F12 → Application → Cookies → copy the __Secure-session value.",
      ),
    });
    page.add(ollamaGroup);

    const ollamaKeyRow = new Adw.PasswordEntryRow({
      title: _("Session Cookie"),
    });
    ollamaKeyRow.set_text(settings.get_string("ollama-session-cookie"));
    ollamaKeyRow.connect("changed", () => {
      settings.set_string("ollama-session-cookie", ollamaKeyRow.get_text());
    });
    ollamaGroup.add(ollamaKeyRow);

    // Refresh settings group
    const refreshGroup = new Adw.PreferencesGroup({
      title: _("Refresh"),
    });
    page.add(refreshGroup);

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
