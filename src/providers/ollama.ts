import { getUserAgent } from '../config.js'
import { fetchWithRetry } from '../helpers/fetch.js'
import type { Provider, Result, TierUsage, UsageResult } from '../types.js'

function buildHeaders(sessionCookie: string): Record<string, string> {
  // Format cookie if needed (add prefix if not present)
  const cookieValue = sessionCookie.startsWith('__Secure-session=')
    ? sessionCookie
    : `__Secure-session=${sessionCookie}`

  return {
    Cookie: cookieValue,
    'User-Agent': getUserAgent(),
    Accept: 'text/html',
  }
}

export function parseOllamaPage(html: string): UsageResult | null {
  const tiers: TierUsage[] = []
  let overallPercentage = 0
  let plan = 'free'
  let resetDate: string | null = null
  let resetInHours: number | null = null

  // Extract plan from badge (look for the badge in Cloud usage section)
  // Try multiple patterns as Ollama page structure may vary
  const usageSectionMatch =
    html.match(/>Cloud usage<[\s\S]{0,500}?>(\w+)</) ||
    html.match(/Cloud usage[\s\S]{0,200}?badge[^>]*>(\w+)<\//) ||
    html.match(/data-testid="plan-badge"[^>]*>(\w+)</)
  if (usageSectionMatch) {
    plan = usageSectionMatch[1].trim().toLowerCase()
  }

  // Parse each usage section using regex
  // Looking for the patterns like: <span class="text-sm">...</span> and <span class="text-sm">...% used</span>
  // We use a more generic approach to find the usage blocks
  const blockMatches = html.matchAll(
    /class="flex justify-between[^>]*>\s*<span[^>]*>([\w][\w\s]*?)<\/span>\s*<span[^>]*>[\s\n]*(\d+(?:\.\d+)?\s*% used)/g
  )
  for (const blockMatch of blockMatches) {
    const name = blockMatch[1].trim()
    const valueText = blockMatch[2].trim()

    let percentage = 0

    // Parse percentage (e.g., "3.9% used" or "5% used")
    const pctMatch = valueText.match(/(\d+(?:\.\d+)?)\s*%\s*used/i)
    if (pctMatch) {
      percentage = parseFloat(pctMatch[1])
    }

    if (percentage > 0 || name) {
      tiers.push({ name, percentage })

      // Track overall percentage (use highest)
      if (percentage > overallPercentage) {
        overallPercentage = percentage
      }
    }
  }

  // Look for reset time (local-time can be among multiple CSS classes)
  const resetMatch = html.match(/class="[^"]*\blocal-time\b[^"]*"[^>]*?data-time="([^"]+)"/i)
  if (resetMatch) {
    const resetTimeAttr = resetMatch[1]
    const resetTime = new Date(resetTimeAttr).getTime()
    if (!Number.isNaN(resetTime)) {
      resetInHours = Math.max(0, Math.round((resetTime - Date.now()) / 3600000))
      resetDate = resetTimeAttr
    }
  }

  if (tiers.length === 0) return null

  return {
    status: 'ok',
    provider: 'ollama',
    plan,
    tiers,
    overall_percentage: Math.round(overallPercentage * 100) / 100,
    reset_date: resetDate,
    reset_in_hours: resetInHours,
  }
}

export const ollamaProvider: Provider = {
  name: 'ollama',
  async fetchUsage(sessionCookie: string): Promise<Result> {
    const headers = buildHeaders(sessionCookie)

    let html: string
    try {
      const res = await fetchWithRetry('https://ollama.com/settings', {
        headers,
        redirect: 'follow',
      })

      if (res.status === 401 || res.status === 403) {
        return {
          status: 'error',
          error_code: 'auth_expired',
          message: 'Authentication failed. Session cookie may be expired or invalid.',
        }
      }
      if (!res.ok) {
        return {
          status: 'error',
          error_code: 'network_error',
          message: `Unexpected response: HTTP ${res.status}`,
        }
      }

      html = await res.text()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { status: 'error', error_code: 'timeout', message: `Request timed out: ${message}` }
      }
      return { status: 'error', error_code: 'network_error', message: `Network error: ${message}` }
    }

    // Check if we're actually logged in (login redirect detected)
    // Ollama now uses WorkOS for auth — detect both old and new login page patterns
    if (
      html.includes('action="/signin"') ||
      html.includes('href="/login"') ||
      html.includes('href="/signin"') ||
      html.includes('href="/sign-up') ||
      html.includes('api/login?provider=') ||
      html.includes('<title>Sign in</title>')
    ) {
      return {
        status: 'error',
        error_code: 'auth_expired',
        message: 'Session expired. Please refresh your session cookie from ollama.com.',
      }
    }

    // Page loaded and authenticated — attempt to parse usage data
    const result = parseOllamaPage(html)
    if (result) return result

    // Page loaded and authenticated, but data could not be extracted
    return {
      status: 'error',
      error_code: 'parse_error',
      message: 'Could not extract usage data. The page structure may have changed.',
    }
  },
}
