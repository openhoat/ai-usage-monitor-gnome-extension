import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export interface ProviderConfig {
  anthropic_api_key: string
  claude_token: string
  gemini_api_key: string
  openai_api_key: string
  ollama_session_cookie: string
}

const CONFIG_DIR = join(homedir(), '.config', 'ai-usage-monitor')
const CONFIG_FILE = join(CONFIG_DIR, 'config.json')

function getDefaultConfig(): ProviderConfig {
  return {
    anthropic_api_key: '',
    claude_token: '',
    gemini_api_key: '',
    openai_api_key: '',
    ollama_session_cookie: '',
  }
}

function loadFromFile(): ProviderConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const content = readFileSync(CONFIG_FILE, 'utf-8')
      const parsed = JSON.parse(content) as Partial<ProviderConfig> & {
        claude_session_cookie?: string
      }
      // Handle migration from old key name if exists
      if (parsed.claude_session_cookie && !parsed.claude_token) {
        parsed.claude_token = parsed.claude_session_cookie
        delete parsed.claude_session_cookie
      }
      return { ...getDefaultConfig(), ...parsed }
    }
  } catch {
    // Fall through to defaults
  }
  return getDefaultConfig()
}

function saveToFile(config: ProviderConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true })
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8')
}

export function loadConfig(): ProviderConfig {
  const config = loadFromFile()

  // Use environment variables ONLY as fallback if the field is empty

  // OpenAI: Priority UI > OPENAI_ADMIN_KEY > OPENAI_API_KEY
  if (!config.openai_api_key) {
    if (process.env.OPENAI_ADMIN_KEY) {
      config.openai_api_key = process.env.OPENAI_ADMIN_KEY
    } else if (process.env.OPENAI_API_KEY) {
      config.openai_api_key = process.env.OPENAI_API_KEY
    }
  }

  // Anthropic
  if (!config.anthropic_api_key && process.env.ANTHROPIC_API_KEY) {
    config.anthropic_api_key = process.env.ANTHROPIC_API_KEY
  }

  // Claude: Priority UI > CLAUDE_CODE_OAUTH_TOKEN > CLAUDE_SESSION_COOKIE
  if (!config.claude_token) {
    if (process.env.CLAUDE_CODE_OAUTH_TOKEN) {
      config.claude_token = process.env.CLAUDE_CODE_OAUTH_TOKEN
    } else if (process.env.CLAUDE_SESSION_COOKIE) {
      config.claude_token = process.env.CLAUDE_SESSION_COOKIE
    }
  }

  // Gemini
  if (!config.gemini_api_key && process.env.GEMINI_API_KEY) {
    config.gemini_api_key = process.env.GEMINI_API_KEY
  }

  // Ollama
  if (!config.ollama_session_cookie && process.env.OLLAMA_SESSION_COOKIE) {
    config.ollama_session_cookie = process.env.OLLAMA_SESSION_COOKIE
  }

  return config
}

export function saveConfig(config: ProviderConfig): void {
  saveToFile(config)
}

export function maskCredential(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '****'
  return `${value.slice(0, 4)}****${value.slice(-4)}`
}

export function getConfigForProviders(config: ProviderConfig): Array<{
  provider: string
  credential: string
}> {
  const configured: Array<{ provider: string; credential: string }> = []

  if (config.anthropic_api_key) {
    configured.push({ provider: 'anthropic', credential: config.anthropic_api_key })
  }
  if (config.claude_token) {
    configured.push({ provider: 'claude', credential: config.claude_token })
  }
  if (config.gemini_api_key) {
    configured.push({ provider: 'gemini', credential: config.gemini_api_key })
  }
  if (config.openai_api_key) {
    configured.push({ provider: 'openai', credential: config.openai_api_key })
  }
  if (config.ollama_session_cookie) {
    configured.push({ provider: 'ollama', credential: config.ollama_session_cookie })
  }

  return configured
}
