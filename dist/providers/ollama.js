"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaProvider = void 0;
exports.parseOllamaPage = parseOllamaPage;
const cheerio = __importStar(require("cheerio"));
const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0";
function buildHeaders(sessionCookie) {
    // Format cookie if needed (add prefix if not present)
    const cookieValue = sessionCookie.startsWith("__Secure-session=")
        ? sessionCookie
        : `__Secure-session=${sessionCookie}`;
    return {
        Cookie: cookieValue,
        "User-Agent": USER_AGENT,
        Accept: "text/html",
    };
}
function parseOllamaPage(html) {
    const $ = cheerio.load(html);
    const tiers = [];
    let overallPercentage = 0;
    let plan = "free";
    let resetDate = null;
    let resetInHours = null;
    // Extract plan from badge
    const planText = $("span.bg-neutral-100.text-neutral-600.capitalize").text().trim();
    if (planText) {
        plan = planText.toLowerCase();
    }
    // Parse each usage section
    $("div.space-y-6 > div > div.flex.justify-between").each((_i, el) => {
        const $parent = $(el).parent();
        const labels = $(el).find("span.text-sm");
        if (labels.length >= 2) {
            const name = $(labels[0]).text().trim();
            const valueText = $(labels[1]).text().trim();
            let percentage = 0;
            // Parse percentage (e.g., "3.9% used")
            const pctMatch = valueText.match(/(\d+(?:\.\d+)?)\s*%\s*used/i);
            if (pctMatch) {
                percentage = parseFloat(pctMatch[1]);
            }
            else {
                // Parse fraction (e.g., "6/20 used")
                const fracMatch = valueText.match(/(\d+)\s*\/\s*(\d+)\s*used/i);
                if (fracMatch) {
                    const used = parseInt(fracMatch[1], 10);
                    const total = parseInt(fracMatch[2], 10);
                    if (total > 0) {
                        percentage = Math.round((used / total) * 10000) / 100;
                    }
                }
            }
            if (percentage > 0 || name) {
                tiers.push({ name, percentage });
                // Track overall percentage (use highest)
                if (percentage > overallPercentage) {
                    overallPercentage = percentage;
                }
            }
        }
        // Look for reset time in the parent div
        const $resetEl = $parent.find(".local-time");
        if ($resetEl.length > 0) {
            const resetTimeAttr = $resetEl.attr("data-time");
            if (resetTimeAttr) {
                const resetTime = new Date(resetTimeAttr).getTime();
                if (!isNaN(resetTime)) {
                    const hoursUntilReset = Math.max(0, Math.round((resetTime - Date.now()) / 3600000));
                    // Keep the latest reset time
                    if (resetInHours === null || hoursUntilReset > resetInHours) {
                        resetInHours = hoursUntilReset;
                        resetDate = resetTimeAttr;
                    }
                }
            }
        }
    });
    if (tiers.length === 0)
        return null;
    return {
        status: "ok",
        provider: "ollama",
        plan,
        tiers,
        overall_percentage: Math.round(overallPercentage * 100) / 100,
        reset_date: resetDate,
        reset_in_hours: resetInHours,
    };
}
async function scrapeSettingsPage(sessionCookie) {
    const headers = buildHeaders(sessionCookie);
    try {
        const res = await fetch("https://ollama.com/settings", {
            headers,
            redirect: "follow",
        });
        if (res.status === 401 || res.status === 403) {
            return null;
        }
        if (!res.ok) {
            return null;
        }
        const html = await res.text();
        // Check if we're actually logged in
        // Note: "/signout" appears in settings page when logged in
        if (html.includes('action="/signin"') || html.includes('href="/login"') || html.includes('href="/signin"')) {
            return null;
        }
        return parseOllamaPage(html);
    }
    catch {
        return null;
    }
}
exports.ollamaProvider = {
    name: "ollama",
    async fetchUsage(sessionCookie) {
        return scrapeSettingsPage(sessionCookie);
    },
};
