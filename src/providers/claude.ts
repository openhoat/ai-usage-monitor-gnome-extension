import * as cheerio from 'cheerio'
import type { Provider, TierUsage, UsageResult } from '../types.js'

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:137.0) Gecko/20100101 Firefox/137.0'

function buildHeaders(cookie: string): Record<string, string> {
  return {
    Cookie: `sessionKey=${cookie}`,
    'User-Agent': USER_AGENT,
    Accept: 'application/json, text/html',
  }
}

interface OrgInfo {
  uuid: string
  name: string
  capabilities: string[]
}

interface UsageBucket {
  utilization: number
  resets_at: string
}

interface RawUsageData {
  five_hour?: UsageBucket | null
  seven_day?: UsageBucket | null
  seven_day_oauth_apps?: UsageBucket | null
  seven_day_opus?: UsageBucket | null
  seven_day_sonnet?: UsageBucket | null
  seven_day_cowork?: UsageBucket | null
  iguana_necktie?: UsageBucket | null
  extra_usage?: UsageBucket | null
}

const BUCKET_LABELS: Record<string, string> = {
  five_hour: 'Standard (5h)',
  seven_day: 'Extended (7d)',
  seven_day_oauth_apps: 'OAuth Apps (7d)',
  seven_day_opus: 'Opus (7d)',
  seven_day_sonnet: 'Sonnet (7d)',
  seven_day_cowork: 'Cowork (7d)',
  iguana_necktie: 'Special',
  extra_usage: 'Extra Usage',
}

function parseRawUsageData(data: RawUsageData): UsageResult | null {
  const tiers: TierUsage[] = []
  let latestResetDate: string | null = null
  let latestResetTime = 0

  for (const [key, label] of Object.entries(BUCKET_LABELS)) {
    const bucket = data[key as keyof RawUsageData]
    if (!bucket) continue

    tiers.push({
      name: label,
      percentage: Math.round(bucket.utilization * 100) / 100,
    })

    if (bucket.resets_at) {
      const t = new Date(bucket.resets_at).getTime()
      if (t > latestResetTime) {
        latestResetTime = t
        latestResetDate = bucket.resets_at
      }
    }
  }

  if (tiers.length === 0) return null

  const overallPercentage = Math.max(...tiers.map(t => t.percentage))
  const resetInHours = latestResetDate
    ? Math.max(0, Math.round((latestResetTime - Date.now()) / 3600000))
    : null

  return {
    status: 'ok',
    provider: 'claude',
    plan: 'pro',
    tiers,
    overall_percentage: Math.round(overallPercentage * 100) / 100,
    reset_date: latestResetDate,
    reset_in_hours: resetInHours,
  }
}

async function tryApiEndpoints(cookie: string): Promise<UsageResult | null> {
  const headers = buildHeaders(cookie)

  let orgId: string | null = null
  try {
    const orgRes = await fetch('https://claude.ai/api/organizations', {
      headers,
      redirect: 'manual',
    })
    if (orgRes.status === 200) {
      const orgs = (await orgRes.json()) as OrgInfo[]
      const proOrg = orgs.find(o => o.capabilities?.includes('claude_pro'))
      orgId = proOrg?.uuid ?? orgs[0]?.uuid ?? null
    }
  } catch {
    return null
  }

  if (!orgId) return null

  try {
    const usageRes = await fetch(`https://claude.ai/api/organizations/${orgId}/usage`, {
      headers,
      redirect: 'manual',
    })
    if (usageRes.status === 200) {
      const data = (await usageRes.json()) as RawUsageData
      return parseRawUsageData(data)
    }
  } catch {
    // Fall through
  }

  return null
}

async function scrapeUsagePage(cookie: string): Promise<UsageResult | null> {
  const headers = buildHeaders(cookie)

  let html: string
  try {
    const res = await fetch('https://claude.ai/settings/usage', {
      headers,
      redirect: 'follow',
    })

    if (res.status === 401 || res.status === 403) {
      return null
    }
    if (!res.ok) {
      return null
    }

    html = await res.text()
  } catch {
    return null
  }

  if (html.includes('/login') && !html.includes('usage')) {
    return null
  }

  const $ = cheerio.load(html)
  const tiers: TierUsage[] = []
  let overallPercentage = 0
  let resetDate: string | null = null
  let resetInHours: number | null = null
  let plan = 'pro'

  // Strategy 1: Parse __NEXT_DATA__
  const nextDataScript = $('script#__NEXT_DATA__[type="application/json"]')
  if (nextDataScript.length > 0) {
    try {
      const nextData = JSON.parse(nextDataScript.text())
      const pageProps = nextData?.props?.pageProps
      if (pageProps) {
        const result = parseRawUsageData(pageProps as RawUsageData)
        if (result) return result
      }
    } catch {
      // Continue to other strategies
    }
  }

  // Strategy 2: Look for inline script data
  $('script').each((_i, el) => {
    const text = $(el).text()
    const jsonPatterns = [
      /self\.__next_f\.push\(\[.*?"(.+?)"\]/g,
      /\{[^}]*"tiers"\s*:\s*\[/g,
      /\{[^}]*"usage"\s*:/g,
    ]

    for (const pattern of jsonPatterns) {
      const matches = text.matchAll(pattern)
      for (const match of matches) {
        try {
          let jsonStr = match[1] || match[0]
          jsonStr = jsonStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\')
          const parsed = JSON.parse(jsonStr)
          const result = parseRawUsageData(parsed as RawUsageData)
          if (result) {
            tiers.push(...result.tiers)
            overallPercentage = result.overall_percentage
            resetDate = result.reset_date
            resetInHours = result.reset_in_hours
          }
        } catch {
          // Not valid JSON, continue
        }
      }
    }
  })

  // Strategy 3: Regex extraction from HTML text
  if (tiers.length === 0) {
    const percentageMatches = html.matchAll(
      /(\w[\w\s]*?)\s*[:]\s*(\d+(?:\.\d+)?)\s*%\s*(?:used)?/gi
    )
    for (const match of percentageMatches) {
      const name = match[1].trim()
      const pct = parseFloat(match[2])
      if (pct >= 0 && pct <= 100 && name.length < 30) {
        tiers.push({ name, percentage: pct })
      }
    }

    if (tiers.length === 0) {
      const simpleMatches = html.matchAll(/(\d+(?:\.\d+)?)\s*%\s*used/gi)
      for (const match of simpleMatches) {
        tiers.push({
          name: `Tier ${tiers.length + 1}`,
          percentage: parseFloat(match[1]),
        })
      }
    }
  }

  // Look for progress bar aria values
  $('[role="progressbar"]').each((_i, el) => {
    const value = $(el).attr('aria-valuenow')
    const label = $(el).attr('aria-label') || $(el).prev().text() || `Tier ${tiers.length + 1}`
    if (value) {
      const pct = parseFloat(value)
      if (!Number.isNaN(pct)) {
        tiers.push({ name: label.trim(), percentage: pct })
      }
    }
  })

  // Look for width-based progress bars
  if (tiers.length === 0) {
    $("[style*='width']").each((_i, el) => {
      const style = $(el).attr('style') || ''
      const widthMatch = style.match(/width:\s*(\d+(?:\.\d+)?)%/)
      if (widthMatch) {
        const pct = parseFloat(widthMatch[1])
        if (pct > 0 && pct <= 100) {
          const parent = $(el).parent()
          const label = parent.prev().text().trim() || `Tier ${tiers.length + 1}`
          tiers.push({ name: label, percentage: pct })
        }
      }
    })
  }

  // Extract reset info
  const resetMatch = html.match(
    /[Rr]esets?\s+(?:in\s+)?(\d+)\s*d(?:ay)?s?\s*(?:(\d+)\s*h(?:our)?s?)?/
  )
  if (resetMatch) {
    const days = parseInt(resetMatch[1], 10)
    const hours = parseInt(resetMatch[2] || '0', 10)
    resetInHours = days * 24 + hours
    const resetTime = new Date(Date.now() + resetInHours * 3600000)
    resetDate = resetTime.toISOString()
  }

  if (!resetDate) {
    const dateMatch = html.match(/[Rr]esets?\s+(?:on\s+)?(\w+\s+\d{1,2},?\s+\d{4})/)
    if (dateMatch) {
      const parsed = new Date(dateMatch[1])
      if (!Number.isNaN(parsed.getTime())) {
        resetDate = parsed.toISOString()
        resetInHours = Math.max(0, Math.round((parsed.getTime() - Date.now()) / 3600000))
      }
    }
  }

  const planMatch = html.match(/\b(Pro|Team|Enterprise|Free)\s+(?:plan|Plan)/i)
  if (planMatch) {
    plan = planMatch[1].toLowerCase()
  }

  if (tiers.length > 0) {
    overallPercentage = overallPercentage || Math.max(...tiers.map(t => t.percentage))
  }

  if (tiers.length === 0 && overallPercentage === 0) return null

  return {
    status: 'ok',
    provider: 'claude',
    plan,
    tiers,
    overall_percentage: Math.round(overallPercentage * 100) / 100,
    reset_date: resetDate,
    reset_in_hours: resetInHours,
  }
}

export const claudeProvider: Provider = {
  name: 'claude',
  async fetchUsage(credential: string): Promise<UsageResult | null> {
    const apiResult = await tryApiEndpoints(credential)
    if (apiResult) return apiResult

    const scrapeResult = await scrapeUsagePage(credential)
    if (scrapeResult) return scrapeResult

    return null
  },
}
