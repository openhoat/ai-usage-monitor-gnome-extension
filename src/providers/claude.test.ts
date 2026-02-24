import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('../helpers/fetch.js', () => ({
  fetchWithRetry: vi.fn(),
}))

import { fetchWithRetry } from '../helpers/fetch.js'
import { claudeProvider } from './claude.js'

const mockFetch = vi.mocked(fetchWithRetry)

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function htmlResponse(html: string, status = 200): Response {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html' },
  })
}

const sampleOrgs = [{ uuid: 'org-123', name: 'My Org', capabilities: ['claude_pro'] }]

const sampleRawUsage = {
  five_hour: { utilization: 45.5, resets_at: '2026-03-01T00:00:00Z' },
  seven_day: { utilization: 20.0, resets_at: '2026-03-01T00:00:00Z' },
}

describe('claudeProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('API endpoint flow', () => {
    test('should return usage from API when both endpoints succeed', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(sampleOrgs))
        .mockResolvedValueOnce(jsonResponse(sampleRawUsage))

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result).not.toBeNull()
      expect(result?.status).toBe('ok')
      expect(result?.provider).toBe('claude')
      expect(result?.plan).toBe('pro')
      expect(result?.tiers).toHaveLength(2)
      expect(result?.tiers[0].name).toBe('Standard (5h)')
      expect(result?.tiers[0].percentage).toBe(45.5)
      expect(result?.tiers[1].name).toBe('Extended (7d)')
      expect(result?.tiers[1].percentage).toBe(20)
      expect(result?.overall_percentage).toBe(45.5)
      expect(result?.reset_date).toBe('2026-03-01T00:00:00Z')
    })

    test('should select pro org from organizations list', async () => {
      const orgs = [
        { uuid: 'org-free', name: 'Free Org', capabilities: [] },
        { uuid: 'org-pro', name: 'Pro Org', capabilities: ['claude_pro'] },
      ]
      mockFetch
        .mockResolvedValueOnce(jsonResponse(orgs))
        .mockResolvedValueOnce(jsonResponse(sampleRawUsage))

      await claudeProvider.fetchUsage('test-cookie')

      expect(mockFetch).toHaveBeenCalledTimes(2)
      const usageUrl = mockFetch.mock.calls[1][0] as string
      expect(usageUrl).toContain('org-pro')
    })

    test('should use first org when no pro org found', async () => {
      const orgs = [{ uuid: 'org-basic', name: 'Basic Org', capabilities: [] }]
      mockFetch
        .mockResolvedValueOnce(jsonResponse(orgs))
        .mockResolvedValueOnce(jsonResponse(sampleRawUsage))

      await claudeProvider.fetchUsage('test-cookie')

      const usageUrl = mockFetch.mock.calls[1][0] as string
      expect(usageUrl).toContain('org-basic')
    })

    test('should return error when organizations returns empty array', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse([]))
        .mockResolvedValueOnce(htmlResponse('<html><body>login</body></html>'))

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error_code).toBe('auth_expired')
      }
    })

    test('should return error when usage data has no buckets', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(sampleOrgs))
        .mockResolvedValueOnce(jsonResponse({}))
        .mockResolvedValueOnce(htmlResponse('<html><body>login</body></html>'))

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error_code).toBe('auth_expired')
      }
    })
  })

  describe('API error handling', () => {
    test('should fall back to scraping when organizations returns non-200', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({}, 403)).mockResolvedValueOnce(
        htmlResponse(
          `<html><script id="__NEXT_DATA__" type="application/json">
            {"props":{"pageProps":{"five_hour":{"utilization":30,"resets_at":"2026-03-01T00:00:00Z"}}}}
            </script></html>`
        )
      )

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result).not.toBeNull()
      expect(result?.tiers[0].percentage).toBe(30)
    })

    test('should fall back to scraping when organizations fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error')).mockResolvedValueOnce(
        htmlResponse(
          `<html><script id="__NEXT_DATA__" type="application/json">
            {"props":{"pageProps":{"five_hour":{"utilization":15,"resets_at":"2026-03-01T00:00:00Z"}}}}
            </script></html>`
        )
      )

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result).not.toBeNull()
      expect(result?.tiers[0].percentage).toBe(15)
    })

    test('should fall back to scraping when usage endpoint returns non-200', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(sampleOrgs))
        .mockResolvedValueOnce(jsonResponse({}, 500))
        .mockResolvedValueOnce(
          htmlResponse(
            `<html><script id="__NEXT_DATA__" type="application/json">
            {"props":{"pageProps":{"five_hour":{"utilization":10,"resets_at":"2026-03-01T00:00:00Z"}}}}
            </script></html>`
          )
        )

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result).not.toBeNull()
      expect(result?.tiers[0].percentage).toBe(10)
    })
  })

  describe('scraping fallback', () => {
    test('should parse __NEXT_DATA__ from scraped page', async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([], 200)).mockResolvedValueOnce(
        htmlResponse(
          `<html><script id="__NEXT_DATA__" type="application/json">
            {"props":{"pageProps":{"five_hour":{"utilization":50,"resets_at":"2026-03-01T00:00:00Z"},
            "seven_day":{"utilization":25,"resets_at":"2026-03-07T00:00:00Z"}}}}
            </script></html>`
        )
      )

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result).not.toBeNull()
      expect(result?.tiers).toHaveLength(2)
      expect(result?.overall_percentage).toBe(50)
    })

    test('should return error when scraping returns 401', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(htmlResponse('Unauthorized', 401))

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error_code).toBe('auth_expired')
      }
    })

    test('should return error when scraped page contains login redirect', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(htmlResponse('<html><a href="/login">Login</a></html>'))

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error_code).toBe('auth_expired')
      }
    })
  })

  describe('complete failure', () => {
    test('should return error when both API and scraping fail', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))

      const result = await claudeProvider.fetchUsage('test-cookie')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error_code).toBe('auth_expired')
      }
    })
  })

  describe('headers', () => {
    test('should send correct headers with cookie', async () => {
      mockFetch
        .mockResolvedValueOnce(jsonResponse(sampleOrgs))
        .mockResolvedValueOnce(jsonResponse(sampleRawUsage))

      await claudeProvider.fetchUsage('my-session-key')

      const callOptions = mockFetch.mock.calls[0][1] as RequestInit
      const headers = callOptions.headers as Record<string, string>
      expect(headers.Cookie).toBe('sessionKey=my-session-key')
      expect(headers['User-Agent']).toBeDefined()
      expect(headers.Accept).toContain('application/json')
    })
  })
})
