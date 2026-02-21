import Adw from "gi://Adw";
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

const PROVIDERS = [
  { id: "claude", name: "Claude (Anthropic)" },
  { id: "openai", name: "OpenAI (ChatGPT)" },
];

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

    // Provider selection group
    const providerGroup = new Adw.PreferencesGroup({
      title: _("Provider"),
      description: _("Select the AI provider to monitor."),
    });
    page.add(providerGroup);

    // Provider dropdown
    const providerModel = new Gtk.StringList();
    for (const p of PROVIDERS) {
      providerModel.append(p.name);
    }

    const providerRow = new Adw.ComboRow({
      title: _("AI Provider"),
      subtitle: _("The AI service to monitor usage for"),
      model: providerModel,
    });

    // Set initial selection
    const currentProvider = settings.get_string("provider");
    const currentIndex = PROVIDERS.findIndex((p) => p.id === currentProvider);
    if (currentIndex >= 0) {
      providerRow.set_selected(currentIndex);
    }

    providerGroup.add(providerRow);

    // Claude authentication group
    const claudeGroup = new Adw.PreferencesGroup({
      title: _("Claude Authentication"),
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
      title: _("OpenAI Authentication"),
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

    // Show/hide credential groups based on provider
    function updateVisibility() {
      const selectedIndex = providerRow.get_selected();
      const providerId = PROVIDERS[selectedIndex]?.id ?? "claude";
      claudeGroup.visible = providerId === "claude";
      openaiGroup.visible = providerId === "openai";
    }

    providerRow.connect("notify::selected", () => {
      const selectedIndex = providerRow.get_selected();
      const providerId = PROVIDERS[selectedIndex]?.id ?? "claude";
      settings.set_string("provider", providerId);
      updateVisibility();
    });

    updateVisibility();

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
