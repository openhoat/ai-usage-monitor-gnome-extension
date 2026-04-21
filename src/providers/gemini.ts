import { fetchWithRetry } from '../helpers/fetch.js'
import type { Provider, Result, TierUsage } from '../types.js'

function logError(message: string): void {
  process.stderr.write(`${message}\n`)
}

interface GeminiModel {
  name: string
  displayName: string
  supportedGenerationMethods: string[]
}

interface GeminiModelsResponse {
  models: GeminiModel[]
}

function buildHeaders(_apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
  }
}

async function fetchModelList(apiKey: string): Promise<GeminiModel[] | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`

  const res = await fetchWithRetry(url, {
    headers: buildHeaders(apiKey),
    redirect: 'follow',
  })

  if (res.status === 400 || res.status === 401 || res.status === 403) {
    const body = await res.text().catch(() => '')
    logError(`[gemini] Auth error: ${res.status} ${res.statusText} – ${body}`)
    return null
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    logError(`[gemini] Models API error: ${res.status} ${res.statusText} – ${body}`)
    return null
  }

  const data = (await res.json()) as GeminiModelsResponse
  return data.models ?? []
}

export const geminiProvider: Provider = {
  name: 'gemini',
  async fetchUsage(apiKey: string): Promise<Result> {
    try {
      const models = await fetchModelList(apiKey)

      if (models === null) {
        return {
          status: 'error',
          error_code: 'auth_expired',
          message: 'Could not authenticate with Gemini API. API key may be invalid.',
        }
      }

      // Filter to models that support generateContent (chat/completion)
      const chatModels = models.filter(m =>
        m.supportedGenerationMethods?.includes('generateContent')
      )
      const chatModelCount = chatModels.length

      // Count models by family
      const flashModels = chatModels.filter(m => m.name.toLowerCase().includes('flash')).length
      const proModels = chatModels.filter(
        m => m.name.toLowerCase().includes('pro') && !m.name.toLowerCase().includes('prose')
      ).length

      const tiers: TierUsage[] = [
        {
          name: `API Key Valid (${chatModelCount} models) – (No usage data)`,
          percentage: 0,
        },
      ]

      if (flashModels > 0) {
        tiers.push({
          name: `Flash models (${flashModels})`,
          percentage: 0,
        })
      }

      if (proModels > 0) {
        tiers.push({
          name: `Pro models (${proModels})`,
          percentage: 0,
        })
      }

      // Gemini free tier has rate limits but no usage percentage tracking
      // Reset at end of month for free tier rate limit reset
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const resetDate = endOfMonth.toISOString()
      const resetInHours = Math.max(0, Math.round((endOfMonth.getTime() - Date.now()) / 3600000))

      return {
        status: 'ok',
        provider: 'gemini',
        plan: 'api',
        tiers,
        overall_percentage: 0,
        reset_date: resetDate,
        reset_in_hours: resetInHours,
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
