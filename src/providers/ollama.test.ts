import { describe, expect, test } from "vitest";

const OLLAMA_SETTINGS_URL = "https://ollama.com/settings";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0";

/**
 * Fetch settings page with session cookie
 */
async function fetchSettingsPage(sessionCookie: string): Promise<string | null> {
  try {
    const res = await fetch(OLLAMA_SETTINGS_URL, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html",
        Cookie: sessionCookie,
      },
      redirect: "follow",
    });

    if (!res.ok) {
      console.error("HTTP error:", res.status, res.statusText);
      return null;
    }

    const html = await res.text();

    // Check if we're actually logged in (not redirected to login page)
    // Note: "/signout" appears in settings page when logged in, so we check for login-specific elements
    if (html.includes('action="/signin"') || html.includes('href="/login"') || html.includes('href="/signin"')) {
      console.error("Not logged in - page contains login elements");
      return null;
    }

    return html;
  } catch (error) {
    console.error("Fetch settings error:", error);
    return null;
  }
}

describe("ollama scraper (real connection)", () => {
  // Use session cookie directly (from __Secure-session cookie)
  const sessionCookie = process.env.OLLAMA_SESSION_COOKIE;

  const hasCredentials = Boolean(sessionCookie);

  describe.skipIf(!hasCredentials)("with session cookie", () => {
    test("should fetch settings page with session cookie", async () => {
      // Format the cookie header - check if it already has the cookie name prefix
      const cookieHeader = sessionCookie!.startsWith("__Secure-session=")
        ? sessionCookie
        : `__Secure-session=${sessionCookie}`;

      // Fetch settings
      const html = await fetchSettingsPage(cookieHeader);

      console.log("Settings page length:", html?.length || 0);
      expect(html).not.toBeNull();
      expect(html).toContain("Cloud Usage");
    });

    test("should scrape usage data from real page", async () => {
      // Import the parser
      const { parseOllamaPage } = await import("./ollama.js");

      // Format the cookie header - check if it already has the cookie name prefix
      const cookieHeader = sessionCookie!.startsWith("__Secure-session=")
        ? sessionCookie
        : `__Secure-session=${sessionCookie}`;

      // Fetch and parse
      const html = await fetchSettingsPage(cookieHeader);
      expect(html).not.toBeNull();

      const result = parseOllamaPage(html!);

      console.log("\n=== Ollama Usage Data ===");
      console.log("Plan:", result?.plan);
      console.log("Overall:", result?.overall_percentage + "%");
      console.log("Tiers:");
      result?.tiers.forEach((tier) => {
        console.log(`  - ${tier.name}: ${tier.percentage}%`);
      });
      console.log("Reset in:", result?.reset_in_hours, "hours");
      console.log("=========================\n");

      expect(result).not.toBeNull();
      expect(result?.status).toBe("ok");
      expect(result?.provider).toBe("ollama");
      expect(result?.tiers.length).toBeGreaterThan(0);
    });
  });

  describe.skipIf(hasCredentials)("without session cookie", () => {
    test("should skip tests when OLLAMA_SESSION_COOKIE is not set", () => {
      console.log("\nTo run real connection tests, set environment variable:");
      console.log("  export OLLAMA_SESSION_COOKIE=your-session-cookie-value");
      console.log("\nGet the __Secure-session cookie from your browser:");
      console.log("  1. Go to ollama.com/settings");
      console.log("  2. Open DevTools (F12) → Application → Cookies");
      console.log("  3. Copy the value of __Secure-session");
      expect(true).toBe(true);
    });
  });
});