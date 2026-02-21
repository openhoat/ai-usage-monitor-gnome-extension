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
const cheerio = __importStar(require("cheerio"));
const USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0";
function buildHeaders(cookie) {
    return {
        Cookie: `sessionKey=${cookie}`,
        "User-Agent": USER_AGENT,
        Accept: "application/json, text/html",
    };
}
const BUCKET_LABELS = {
    five_hour: "Standard (5h)",
    seven_day: "Extended (7d)",
    seven_day_oauth_apps: "OAuth Apps (7d)",
    seven_day_opus: "Opus (7d)",
    seven_day_sonnet: "Sonnet (7d)",
    seven_day_cowork: "Cowork (7d)",
    iguana_necktie: "Special",
    extra_usage: "Extra Usage",
};
async function tryApiEndpoints(cookie) {
    const headers = buildHeaders(cookie);
    // Step 1: Get organization UUID — pick the one with claude_pro capability
    let orgId = null;
    try {
        const orgRes = await fetch("https://claude.ai/api/organizations", {
            headers,
            redirect: "manual",
        });
        if (orgRes.status === 200) {
            const orgs = (await orgRes.json());
            const proOrg = orgs.find((o) => o.capabilities?.includes("claude_pro"));
            orgId = proOrg?.uuid ?? orgs[0]?.uuid ?? null;
        }
    }
    catch {
        return null;
    }
    if (!orgId)
        return null;
    // Step 2: Fetch usage data
    try {
        const usageRes = await fetch(`https://claude.ai/api/organizations/${orgId}/usage`, { headers, redirect: "manual" });
        if (usageRes.status === 200) {
            const data = (await usageRes.json());
            return parseRawUsageData(data);
        }
    }
    catch {
        // Fall through to null
    }
    return null;
}
function parseRawUsageData(data) {
    const tiers = [];
    let latestResetDate = null;
    let latestResetTime = 0;
    for (const [key, label] of Object.entries(BUCKET_LABELS)) {
        const bucket = data[key];
        if (!bucket)
            continue;
        tiers.push({
            name: label,
            percentage: Math.round(bucket.utilization * 100) / 100,
        });
        // Track the latest (furthest) reset date
        if (bucket.resets_at) {
            const t = new Date(bucket.resets_at).getTime();
            if (t > latestResetTime) {
                latestResetTime = t;
                latestResetDate = bucket.resets_at;
            }
        }
    }
    if (tiers.length === 0)
        return null;
    const overallPercentage = Math.max(...tiers.map((t) => t.percentage));
    const resetInHours = latestResetDate
        ? Math.max(0, Math.round((latestResetTime - Date.now()) / 3600000))
        : null;
    return {
        status: "ok",
        plan: "pro",
        tiers,
        overall_percentage: Math.round(overallPercentage * 100) / 100,
        reset_date: latestResetDate,
        reset_in_hours: resetInHours,
    };
}
async function scrapeUsagePage(cookie) {
    const headers = buildHeaders(cookie);
    let html;
    try {
        const res = await fetch("https://claude.ai/settings/usage", {
            headers,
            redirect: "follow",
        });
        if (res.status === 401 || res.status === 403) {
            return null;
        }
        if (!res.ok) {
            return null;
        }
        html = await res.text();
    }
    catch {
        return null;
    }
    // Check if redirected to login
    if (html.includes("/login") && !html.includes("usage")) {
        return null;
    }
    const $ = cheerio.load(html);
    const tiers = [];
    let overallPercentage = 0;
    let resetDate = null;
    let resetInHours = null;
    let plan = "pro";
    // Strategy 1: Parse __NEXT_DATA__
    const nextDataScript = $('script#__NEXT_DATA__[type="application/json"]');
    if (nextDataScript.length > 0) {
        try {
            const nextData = JSON.parse(nextDataScript.text());
            const pageProps = nextData?.props?.pageProps;
            if (pageProps) {
                const result = parseRawUsageData(pageProps);
                if (result)
                    return result;
            }
        }
        catch {
            // Continue to other strategies
        }
    }
    // Strategy 2: Look for inline script data
    $("script").each((_i, el) => {
        const text = $(el).text();
        // Look for JSON-like usage data in scripts
        const jsonPatterns = [
            /self\.__next_f\.push\(\[.*?"(.+?)"\]/g,
            /\{[^}]*"tiers"\s*:\s*\[/g,
            /\{[^}]*"usage"\s*:/g,
        ];
        for (const pattern of jsonPatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                try {
                    let jsonStr = match[1] || match[0];
                    // Unescape if needed
                    jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
                    const parsed = JSON.parse(jsonStr);
                    const result = parseRawUsageData(parsed);
                    if (result) {
                        tiers.push(...result.tiers);
                        overallPercentage = result.overall_percentage;
                        resetDate = result.reset_date;
                        resetInHours = result.reset_in_hours;
                    }
                }
                catch {
                    // Not valid JSON, continue
                }
            }
        }
    });
    // Strategy 3: Regex extraction from HTML text
    if (tiers.length === 0) {
        // Look for percentage patterns like "42% used" or "42%"
        const percentageMatches = html.matchAll(/(\w[\w\s]*?)\s*[:]\s*(\d+(?:\.\d+)?)\s*%\s*(?:used)?/gi);
        for (const match of percentageMatches) {
            const name = match[1].trim();
            const pct = parseFloat(match[2]);
            if (pct >= 0 && pct <= 100 && name.length < 30) {
                tiers.push({ name, percentage: pct });
            }
        }
        // Try simpler pattern: just "X% used"
        if (tiers.length === 0) {
            const simpleMatches = html.matchAll(/(\d+(?:\.\d+)?)\s*%\s*used/gi);
            for (const match of simpleMatches) {
                tiers.push({
                    name: `Tier ${tiers.length + 1}`,
                    percentage: parseFloat(match[1]),
                });
            }
        }
    }
    // Look for progress bar aria values
    $('[role="progressbar"]').each((_i, el) => {
        const value = $(el).attr("aria-valuenow");
        const label = $(el).attr("aria-label") || $(el).prev().text() || `Tier ${tiers.length + 1}`;
        if (value) {
            const pct = parseFloat(value);
            if (!isNaN(pct)) {
                tiers.push({ name: label.trim(), percentage: pct });
            }
        }
    });
    // Look for width-based progress bars
    if (tiers.length === 0) {
        $("[style*='width']").each((_i, el) => {
            const style = $(el).attr("style") || "";
            const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)%/);
            if (widthMatch) {
                const pct = parseFloat(widthMatch[1]);
                if (pct > 0 && pct <= 100) {
                    const parent = $(el).parent();
                    const label = parent.prev().text().trim() || `Tier ${tiers.length + 1}`;
                    tiers.push({ name: label, percentage: pct });
                }
            }
        });
    }
    // Extract reset info
    const resetMatch = html.match(/[Rr]esets?\s+(?:in\s+)?(\d+)\s*d(?:ay)?s?\s*(?:(\d+)\s*h(?:our)?s?)?/);
    if (resetMatch) {
        const days = parseInt(resetMatch[1], 10);
        const hours = parseInt(resetMatch[2] || "0", 10);
        resetInHours = days * 24 + hours;
        const resetTime = new Date(Date.now() + resetInHours * 3600000);
        resetDate = resetTime.toISOString();
    }
    // Look for date-based reset
    if (!resetDate) {
        const dateMatch = html.match(/[Rr]esets?\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})/);
        if (dateMatch) {
            const parsed = new Date(dateMatch[1]);
            if (!isNaN(parsed.getTime())) {
                resetDate = parsed.toISOString();
                resetInHours = Math.max(0, Math.round((parsed.getTime() - Date.now()) / 3600000));
            }
        }
    }
    // Look for plan info
    const planMatch = html.match(/\b(Pro|Team|Enterprise|Free)\s+(?:plan|Plan)/i);
    if (planMatch) {
        plan = planMatch[1].toLowerCase();
    }
    if (tiers.length > 0) {
        overallPercentage =
            overallPercentage || Math.max(...tiers.map((t) => t.percentage));
    }
    if (tiers.length === 0 && overallPercentage === 0)
        return null;
    return {
        status: "ok",
        plan,
        tiers,
        overall_percentage: Math.round(overallPercentage * 100) / 100,
        reset_date: resetDate,
        reset_in_hours: resetInHours,
    };
}
async function main() {
    const cookie = process.argv[2];
    if (!cookie) {
        const result = {
            status: "error",
            error_code: "missing_cookie",
            message: "Usage: node fetch-usage.js <session-cookie>",
        };
        console.log(JSON.stringify(result));
        process.exit(1);
    }
    try {
        // Try API endpoints first
        const apiResult = await tryApiEndpoints(cookie);
        if (apiResult) {
            console.log(JSON.stringify(apiResult));
            return;
        }
        // Fall back to scraping
        const scrapeResult = await scrapeUsagePage(cookie);
        if (scrapeResult) {
            console.log(JSON.stringify(scrapeResult));
            return;
        }
        // Nothing worked
        const result = {
            status: "error",
            error_code: "auth_expired",
            message: "Could not retrieve usage data. The session cookie may be expired or invalid.",
        };
        console.log(JSON.stringify(result));
        process.exit(1);
    }
    catch (err) {
        const result = {
            status: "error",
            error_code: "fetch_error",
            message: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        };
        console.log(JSON.stringify(result));
        process.exit(1);
    }
}
main();
