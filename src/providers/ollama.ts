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

  // Extract plan from badge
  const planMatch = html.match(
    /<span[^>]*?class="[^"]*?bg-neutral-100[^"]*?text-neutral-600[^"]*?capitalize[^"]*?"[^>]*?>(.*?)<\/span>/i
  )
  if (planMatch) {
    plan = planMatch[1].trim().toLowerCase()
  }

  // Parse each usage section using regex
  // Looking for the patterns like: <span class="text-sm">...</span> and <span class="text-sm">...% used</span>
  // We use a more generic approach to find the usage blocks
  const blockMatches = html.matchAll(/<div[^>]*?class="flex justify-between"[^>]*?>(.*?)<\/div>/gs)
  for (const blockMatch of blockMatches) {
    const blockContent = blockMatch[1]
    const spanMatches = Array.from(
      blockContent.matchAll(/<span[^>]*?class="text-sm"[^>]*?>(.*?)<\/span>/gs)
    )

    if (spanMatches.length >= 2) {
      const name = spanMatches[0][1].replace(/<[^>]*>?/gm, '').trim()
      const valueText = spanMatches[1][1].replace(/<[^>]*>?/gm, '').trim()

      let percentage = 0

      // Parse percentage (e.g., "3.9% used")
      const pctMatch = valueText.match(/(\d+(?:\.\d+)?)\s*%\s*used/i)
      if (pctMatch) {
        percentage = parseFloat(pctMatch[1])
      } else {
        // Parse fraction (e.g., "6/20 used")
        const fracMatch = valueText.match(/(\d+)\s*\/\s*(\d+)\s*used/i)
        if (fracMatch) {
          const used = parseInt(fracMatch[1], 10)
          const total = parseInt(fracMatch[2], 10)
          if (total > 0) {
            percentage = Math.round((used / total) * 10000) / 100
          }
        }
      }

      if (percentage > 0 || name) {
        tiers.push({ name, percentage })

        // Track overall percentage (use highest)
        if (percentage > overallPercentage) {
          overallPercentage = percentage
        }
      }
    }
  }

  // Look for reset time
  const resetMatch = html.match(/class="local-time"[^>]*?data-time="([^"]+)"/i)
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

async function scrapeSettingsPage(sessionCookie: string): Promise<UsageResult | null> {
  const headers = buildHeaders(sessionCookie)

  try {
    const res = await fetchWithRetry('https://ollama.com/settings', {
      headers,
      redirect: 'follow',
    })

    if (res.status === 401 || res.status === 403) {
      return null
    }
    if (!res.ok) {
      return null
    }

    const html = await res.text()

    // Check if we're actually logged in
    // Note: "/signout" appears in settings page when logged in
    if (
      html.includes('action="/signin"') ||
      html.includes('href="/login"') ||
      html.includes('href="/signin"')
    ) {
      return null
    }

    return parseOllamaPage(html)
  } catch {
    return null
  }
}

export const ollamaProvider: Provider = {
  name: 'ollama',
  async fetchUsage(sessionCookie: string): Promise<Result> {
    try {
      const result = await scrapeSettingsPage(sessionCookie)
      if (result) return result
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { status: 'error', error_code: 'timeout', message: `Request timed out: ${message}` }
      }
      return { status: 'error', error_code: 'network_error', message: `Network error: ${message}` }
    }
    return {
      status: 'error',
      error_code: 'auth_expired',
      message: 'Could not retrieve usage data. Session cookie may be expired or invalid.',
    }
  },
}
