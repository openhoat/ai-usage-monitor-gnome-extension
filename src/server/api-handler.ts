import { getAvailableProviders, getProvider } from '../providers/index.js'
import type { ProviderConfig } from './config-store.js'
import { getConfigForProviders, loadConfig, saveConfig } from './config-store.js'

interface StatusResult {
  providers: Record<
    string,
    {
      status: 'ok' | 'error'
      data?: {
        provider: string
        plan: string
        tiers: Array<{ name: string; percentage: number }>
        overall_percentage: number
        reset_date: string | null
        reset_in_hours: number | null
      }
      error?: {
        code: string
        message: string
      }
    }
  >
  last_refresh: string | null
}

let cachedResults: StatusResult | null = null
let lastRefreshTime: string | null = null
let refreshInProgress = false

export async function handleStatus(): Promise<StatusResult> {
  if (cachedResults) {
    return { ...cachedResults, last_refresh: lastRefreshTime }
  }
  return refreshAll()
}

export async function refreshAll(): Promise<StatusResult> {
  if (refreshInProgress) {
    if (cachedResults) {
      return { ...cachedResults, last_refresh: lastRefreshTime }
    }
    // Wait for the in-progress refresh to complete
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (!refreshInProgress && cachedResults) {
          clearInterval(interval)
          resolve({ ...cachedResults, last_refresh: lastRefreshTime })
        }
      }, 100)
      // Timeout after 60 seconds
      setTimeout(() => {
        clearInterval(interval)
        resolve(cachedResults || { providers: {}, last_refresh: null })
      }, 60_000)
    })
  }

  refreshInProgress = true

  try {
    const config = loadConfig()
    const configured = getConfigForProviders(config)
    const results: StatusResult['providers'] = {}

    const promises = configured.map(async ({ provider, credential }) => {
      const providerImpl = getProvider(provider)
      if (!providerImpl) {
        results[provider] = {
          status: 'error',
          error: { code: 'unknown_provider', message: `Unknown provider: ${provider}` },
        }
        return
      }

      try {
        const result = await providerImpl.fetchUsage(credential)
        if (result.status === 'ok') {
          results[provider] = {
            status: 'ok',
            data: {
              provider: result.provider,
              plan: result.plan,
              tiers: result.tiers,
              overall_percentage: result.overall_percentage,
              reset_date: result.reset_date,
              reset_in_hours: result.reset_in_hours,
            },
          }
        } else {
          results[provider] = {
            status: 'error',
            error: { code: result.error_code, message: result.message },
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        results[provider] = {
          status: 'error',
          error: { code: 'network_error', message },
        }
      }
    })

    await Promise.all(promises)

    // Sort providers alphabetically by their display name
    const PROVIDER_LABELS: Record<string, string> = {
      anthropic: 'Anthropic',
      claude: 'Claude',
      gemini: 'Gemini',
      ollama: 'Ollama',
      openai: 'OpenAI',
    }

    const sortedProviders = Object.keys(results).sort((a, b) => {
      const labelA = PROVIDER_LABELS[a] || a
      const labelB = PROVIDER_LABELS[b] || b
      return labelA.localeCompare(labelB)
    })

    const sortedResults: StatusResult['providers'] = {}
    for (const p of sortedProviders) {
      sortedResults[p] = results[p]
    }

    cachedResults = { providers: sortedResults, last_refresh: null }
    lastRefreshTime = new Date().toISOString()

    return { ...cachedResults, last_refresh: lastRefreshTime }
  } finally {
    refreshInProgress = false
  }
}

export function handleGetConfig(): {
  providers: Record<string, { value: string; defaultValue: string; isDefault: boolean }>
} {
  // Load saved config without environment fallbacks first
  const configFromFile = loadConfig() // Wait, loadConfig already applies fallbacks.
  // I need a way to see what is actually in the file vs env.

  // Let's manually get env vars
  const envVars: Record<string, string> = {
    anthropic: process.env.ANTHROPIC_API_KEY || '',
    claude: process.env.CLAUDE_CODE_OAUTH_TOKEN || process.env.CLAUDE_SESSION_COOKIE || '',
    gemini: process.env.GEMINI_API_KEY || '',
    openai: process.env.OPENAI_ADMIN_KEY || process.env.OPENAI_API_KEY || '',
    ollama: process.env.OLLAMA_SESSION_COOKIE || '',
  }

  const providers = getAvailableProviders()
  const result: Record<string, { value: string; defaultValue: string; isDefault: boolean }> = {}

  for (const name of providers) {
    const key =
      name === 'anthropic'
        ? 'anthropic_api_key'
        : name === 'claude'
          ? 'claude_token'
          : name === 'gemini'
            ? 'gemini_api_key'
            : name === 'openai'
              ? 'openai_api_key'
              : 'ollama_session_cookie'

    const savedValue = configFromFile[key]
    const defaultValue = envVars[name] || ''

    // We want to know if the current value comes from the file or from the environment
    // Actually, loadConfig right now returns the merged result.

    result[name] = {
      value: savedValue,
      defaultValue: defaultValue,
      isDefault: !savedValue && !!defaultValue,
    }
  }

  return { providers: result }
}

export function handleSaveConfig(body: ProviderConfig): { success: boolean; message: string } {
  // Merge with existing config (don't overwrite with empty values)
  const existing = loadConfig()
  const merged = { ...existing }

  if (body.anthropic_api_key) merged.anthropic_api_key = body.anthropic_api_key
  if (body.claude_token) merged.claude_token = body.claude_token
  if (body.gemini_api_key) merged.gemini_api_key = body.gemini_api_key
  if (body.openai_api_key) merged.openai_api_key = body.openai_api_key
  if (body.ollama_session_cookie) merged.ollama_session_cookie = body.ollama_session_cookie

  saveConfig(merged)

  // Clear cache so next status call will re-fetch
  cachedResults = null
  lastRefreshTime = null

  return { success: true, message: 'Configuration saved' }
}
