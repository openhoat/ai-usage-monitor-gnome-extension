import { fetchWithRetry } from '../helpers/fetch.js'
import type { Provider, Result, TierUsage, UsageResult } from '../types.js'

function buildHeaders(credential: string): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json',
  }

  // Detect format: sk-ant-sid is a session cookie, sk-ant-oat is an OAuth token
  if (credential.startsWith('sk-ant-sid')) {
    headers.Cookie = `sessionKey=${credential}`
  } else {
    headers.Authorization = `Bearer ${credential}`
  }

  return headers
}

interface OrgInfo {
  uuid: string
  name: string
  capabilities: string[]
}

interface UsageBucket {
  utilization: number
  resets_at: string | null
}

interface RawUsageData {
  five_hour?: UsageBucket | null
  seven_day?: UsageBucket | null
  seven_day_oauth_apps?: UsageBucket | null
  seven_day_opus?: UsageBucket | null
  seven_day_sonnet?: UsageBucket | null
  seven_day_cowork?: UsageBucket | null
  seven_day_omelette?: UsageBucket | null
  iguana_necktie?: UsageBucket | null
  extra_usage?: {
    utilization: number | null
  } | null
}

const BUCKET_LABELS: Record<string, string> = {
  five_hour: 'Standard (5h)',
  seven_day: 'Extended (7d)',
  seven_day_oauth_apps: 'OAuth Apps (7d)',
  seven_day_opus: 'Opus (7d)',
  seven_day_sonnet: 'Sonnet (7d)',
  seven_day_cowork: 'Cowork (7d)',
  seven_day_omelette: 'Sonnet 3.5 (7d)',
  iguana_necktie: 'Special',
  extra_usage: 'Extra Usage',
}

function parseRawUsageData(data: RawUsageData): UsageResult | null {
  const tiers: TierUsage[] = []
  let latestResetDate: string | null = null
  let latestResetTime = 0

  for (const [key, label] of Object.entries(BUCKET_LABELS)) {
    const bucket = data[key as keyof RawUsageData]
    if (!bucket || bucket.utilization === undefined || bucket.utilization === null) continue

    tiers.push({
      name: label,
      percentage: Math.round(bucket.utilization * 100) / 100,
    })

    // Type guard for resets_at
    if (bucket && typeof bucket === 'object' && 'resets_at' in bucket && bucket.resets_at) {
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

async function tryApiEndpoints(credential: string): Promise<UsageResult | null> {
  const headers = buildHeaders(credential)

  let orgId: string | null = null
  try {
    const orgRes = await fetchWithRetry('https://claude.ai/api/organizations', {
      headers,
      redirect: 'manual',
    })
    if (orgRes.status === 200) {
      const orgs = (await orgRes.json()) as OrgInfo[]
      const proOrg = orgs.find(o => o.capabilities?.includes('claude_pro'))
      orgId = proOrg?.uuid ?? orgs[0]?.uuid ?? null
    } else if (orgRes.status === 401 || orgRes.status === 403) {
      return null // Will be handled as auth error
    }
  } catch {
    return null
  }

  if (!orgId) return null

  try {
    const usageRes = await fetchWithRetry(`https://claude.ai/api/organizations/${orgId}/usage`, {
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

export const claudeProvider: Provider = {
  name: 'claude',
  async fetchUsage(credential: string): Promise<Result> {
    try {
      const apiResult = await tryApiEndpoints(credential)
      if (apiResult) return apiResult

      // If we are here, it means either the API call failed or the credential is invalid
      const headers = buildHeaders(credential)
      const checkRes = await fetchWithRetry('https://claude.ai/api/organizations', {
        headers,
        redirect: 'manual',
      })

      if (checkRes.status === 401 || checkRes.status === 403) {
        const type = credential.startsWith('sk-ant-sid') ? 'Session cookie' : 'OAuth token'
        return {
          status: 'error',
          error_code: 'auth_expired',
          message: `Authentication failed. ${type} may be expired or invalid.`,
        }
      }

      return {
        status: 'error',
        error_code: 'network_error',
        message: 'Could not reach Claude API or parse response.',
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (err instanceof DOMException && err.name === 'AbortError') {
        return { status: 'error', error_code: 'timeout', message: `Request timed out: ${message}` }
      }
      return { status: 'error', error_code: 'network_error', message: `Network error: ${message}` }
    }
  },
}
