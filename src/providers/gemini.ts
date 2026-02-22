import * as cheerio from 'cheerio'
import type { Provider, TierUsage, UsageResult } from '../types.js'

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0'

const AI_STUDIO_RATE_LIMIT_URL = 'https://aistudio.google.com/rate-limit'

function buildHeaders(sessionCookie: string): Record<string, string> {
  const cookieValue = sessionCookie.startsWith('__Secure-1PSID=')
    ? sessionCookie
    : `__Secure-1PSID=${sessionCookie}`

  return {
    Cookie: cookieValue,
    'User-Agent': USER_AGENT,
    Accept: 'text/html',
  }
}

function computeNextMidnightPacific(): { resetDate: string; resetInHours: number } {
  const now = new Date()
  const pacificStr = now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })
  const pacific = new Date(pacificStr)
  const nextMidnight = new Date(pacific)
  nextMidnight.setDate(nextMidnight.getDate() + 1)
  nextMidnight.setHours(0, 0, 0, 0)

  const diff = nextMidnight.getTime() - pacific.getTime()
  const resetTime = new Date(now.getTime() + diff)

  return {
    resetDate: resetTime.toISOString(),
    resetInHours: Math.max(0, Math.round(diff / 3600000)),
  }
}

export function parseGeminiPage(html: string): UsageResult | null {
  const $ = cheerio.load(html)
  const tiers: TierUsage[] = []
  let overallPercentage = 0
  let plan = 'free'

  // Detect quota tier
  const tierMatch = html.match(/(?:Tier|tier)\s+(\d+)/i)
  if (tierMatch) {
    plan = `tier-${tierMatch[1]}`
  } else if (/pay.as.you.go/i.test(html)) {
    plan = 'paid'
  }

  // Strategy 1: Parse fraction patterns (e.g., "150/1,500 RPD" or "150 of 1500 requests")
  const fractionPatterns = [
    /(\d+(?:,\d+)*)\s*\/\s*(\d+(?:,\d+)*)\s*(RPD|RPM|TPM)/gi,
    /(\d+(?:,\d+)*)\s*of\s*(\d+(?:,\d+)*)\s*(requests?|tokens?)/gi,
  ]

  for (const pattern of fractionPatterns) {
    for (const match of html.matchAll(pattern)) {
      const used = Number.parseInt(match[1].replace(/,/g, ''), 10)
      const total = Number.parseInt(match[2].replace(/,/g, ''), 10)
      const name = match[3].trim()
      if (total > 0) {
        const percentage = Math.round((used / total) * 10000) / 100
        tiers.push({ name, percentage })
        if (percentage > overallPercentage) {
          overallPercentage = percentage
        }
      }
    }
  }

  // Strategy 2: Parse percentage patterns (e.g., "75% used")
  if (tiers.length === 0) {
    for (const match of html.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:used|consumed|of\s+quota)/gi)) {
      const percentage = Number.parseFloat(match[1])
      tiers.push({ name: `Quota ${tiers.length + 1}`, percentage })
      if (percentage > overallPercentage) {
        overallPercentage = percentage
      }
    }
  }

  // Strategy 3: Parse progress bars
  if (tiers.length === 0) {
    $('[role="progressbar"]').each((_i, el) => {
      const value = $(el).attr('aria-valuenow')
      const max = $(el).attr('aria-valuemax') || '100'
      const label = $(el).attr('aria-label') || `Quota ${tiers.length + 1}`
      if (value) {
        const current = Number.parseFloat(value)
        const maxVal = Number.parseFloat(max)
        if (!Number.isNaN(current) && maxVal > 0) {
          const percentage = Math.round((current / maxVal) * 10000) / 100
          tiers.push({ name: label.trim(), percentage })
          if (percentage > overallPercentage) {
            overallPercentage = percentage
          }
        }
      }
    })
  }

  // Strategy 4: Parse width-based progress bars
  if (tiers.length === 0) {
    $("[style*='width']").each((_i, el) => {
      const style = $(el).attr('style') || ''
      const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)%/)
      if (widthMatch) {
        const pct = Number.parseFloat(widthMatch[1])
        if (pct > 0 && pct <= 100) {
          const parent = $(el).parent()
          const label = parent.prev().text().trim() || `Quota ${tiers.length + 1}`
          tiers.push({ name: label, percentage: pct })
          if (pct > overallPercentage) {
            overallPercentage = pct
          }
        }
      }
    })
  }

  if (tiers.length === 0) return null

  // RPD resets at midnight Pacific Time
  const { resetDate, resetInHours } = computeNextMidnightPacific()

  return {
    status: 'ok',
    provider: 'gemini',
    plan,
    tiers,
    overall_percentage: Math.round(overallPercentage * 100) / 100,
    reset_date: resetDate,
    reset_in_hours: resetInHours,
  }
}

async function scrapeRateLimitPage(sessionCookie: string): Promise<UsageResult | null> {
  const headers = buildHeaders(sessionCookie)

  try {
    const res = await fetch(AI_STUDIO_RATE_LIMIT_URL, {
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

    // Check if redirected to Google login
    if (
      html.includes('accounts.google.com/signin') ||
      html.includes('accounts.google.com/ServiceLogin') ||
      html.includes('identifier-shown')
    ) {
      return null
    }

    return parseGeminiPage(html)
  } catch {
    return null
  }
}

export const geminiProvider: Provider = {
  name: 'gemini',
  async fetchUsage(sessionCookie: string): Promise<UsageResult | null> {
    return scrapeRateLimitPage(sessionCookie)
  },
}
