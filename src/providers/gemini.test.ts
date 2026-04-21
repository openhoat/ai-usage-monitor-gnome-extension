import { beforeEach, describe, expect, test, vi } from 'vitest'
import { geminiProvider } from './gemini.js'

// Mock fetch for unit tests
vi.mock('../helpers/fetch.js', () => ({
  fetchWithRetry: vi.fn(),
}))

import { fetchWithRetry } from '../helpers/fetch.js'

const mockFetch = fetchWithRetry as unknown as ReturnType<typeof vi.fn>

describe('geminiProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('successful key validation', () => {
    test('should return ok status when API key is valid', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          models: [
            {
              name: 'models/gemini-2.0-flash',
              displayName: 'Gemini 2.0 Flash',
              supportedGenerationMethods: ['generateContent', 'countTokens'],
            },
            {
              name: 'models/gemini-2.0-pro',
              displayName: 'Gemini 2.0 Pro',
              supportedGenerationMethods: ['generateContent', 'countTokens'],
            },
          ],
        }),
      })

      const result = await geminiProvider.fetchUsage('AIza-test-key')

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.provider).toBe('gemini')
        expect(result.tiers).toHaveLength(3) // total + flash + pro
        expect(result.tiers[0].name).toContain('2 models')
        expect(result.tiers[1].name).toContain('Flash')
        expect(result.tiers[2].name).toContain('Pro')
      }
    })

    test('should handle empty models list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ models: [] }),
      })

      const result = await geminiProvider.fetchUsage('AIza-test-key')

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.tiers[0].name).toContain('0 models')
      }
    })

    test('should include reset_in_hours to end of month', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          models: [
            {
              name: 'models/gemini-2.0-flash',
              displayName: 'Gemini 2.0 Flash',
              supportedGenerationMethods: ['generateContent'],
            },
          ],
        }),
      })

      const result = await geminiProvider.fetchUsage('AIza-test-key')

      expect(result.status).toBe('ok')
      if (result.status === 'ok') {
        expect(result.reset_in_hours).toBeGreaterThan(0)
        expect(result.reset_date).toBeTruthy()
      }
    })
  })

  describe('error handling', () => {
    test('should return auth_expired error when API returns 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'API key not valid',
      })

      const result = await geminiProvider.fetchUsage('AIza-invalid-key')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error_code).toBe('auth_expired')
      }
    })

    test('should return auth_expired error when API returns 403', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        text: async () => 'Forbidden',
      })

      const result = await geminiProvider.fetchUsage('AIza-invalid-key')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error_code).toBe('auth_expired')
      }
    })

    test('should return network_error when fetch throws', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network failure'))

      const result = await geminiProvider.fetchUsage('AIza-test-key')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error_code).toBe('network_error')
      }
    })

    test('should return timeout error when AbortError is thrown', async () => {
      const abortError = new DOMException('The operation was aborted', 'AbortError')
      mockFetch.mockRejectedValueOnce(abortError)

      const result = await geminiProvider.fetchUsage('AIza-test-key')

      expect(result.status).toBe('error')
      if (result.status === 'error') {
        expect(result.error_code).toBe('timeout')
        expect(result.message).toContain('timed out')
      }
    })
  })

  describe('headers', () => {
    test('should call generativelanguage.googleapis.com with API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ models: [] }),
      })

      await geminiProvider.fetchUsage('AIza-test-key')

      const calledUrl = mockFetch.mock.calls[0][0] as string
      expect(calledUrl).toContain('generativelanguage.googleapis.com')
      expect(calledUrl).toContain('key=AIza-test-key')
    })
  })
})
