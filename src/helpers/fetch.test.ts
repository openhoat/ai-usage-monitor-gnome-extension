import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fetchWithTimeout } from './fetch.js'

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  test('should return response on successful fetch', async () => {
    const mockResponse = new Response('ok', { status: 200 })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse)

    const response = await fetchWithTimeout('https://example.com')

    expect(response).toBe(mockResponse)
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  test('should pass options to fetch', async () => {
    const mockResponse = new Response('ok', { status: 200 })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse)

    const headers = { Authorization: 'Bearer token' }
    await fetchWithTimeout('https://example.com', { headers, redirect: 'follow' })

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers,
        redirect: 'follow',
        signal: expect.any(AbortSignal),
      })
    )
  })

  test('should abort request after default timeout (30s)', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        })
    )

    const promise = fetchWithTimeout('https://example.com')
    vi.advanceTimersByTime(30_000)

    await expect(promise).rejects.toThrow('The operation was aborted.')
  })

  test('should abort request after custom timeout', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('The operation was aborted.', 'AbortError'))
          })
        })
    )

    const promise = fetchWithTimeout('https://example.com', {}, 5_000)
    vi.advanceTimersByTime(5_000)

    await expect(promise).rejects.toThrow('The operation was aborted.')
  })

  test('should clear timeout after successful fetch', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok'))

    await fetchWithTimeout('https://example.com')

    expect(clearTimeoutSpy).toHaveBeenCalled()
  })

  test('should propagate fetch errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))

    await expect(fetchWithTimeout('https://example.com')).rejects.toThrow('Network error')
  })
})
