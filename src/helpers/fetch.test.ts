import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { fetchWithRetry, fetchWithTimeout } from './fetch.js'

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

describe('fetchWithRetry', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('should return response on successful fetch without retry', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))

    const response = await fetchWithRetry('https://example.com', {}, 3, 0)

    expect(response.status).toBe(200)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('should not retry on 4xx client errors', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not Found', { status: 404 }))

    const response = await fetchWithRetry('https://example.com', {}, 3, 0)

    expect(response.status).toBe(404)
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('should retry on 5xx server errors', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('Error', { status: 500 }))
      .mockResolvedValueOnce(new Response('Error', { status: 503 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const response = await fetchWithRetry('https://example.com', {}, 3, 0)

    expect(response.status).toBe(200)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  test('should retry on network errors', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const response = await fetchWithRetry('https://example.com', {}, 3, 0)

    expect(response.status).toBe(200)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  test('should return last 5xx response after max retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Error', { status: 502 }))

    const response = await fetchWithRetry('https://example.com', {}, 2, 0)

    expect(response.status).toBe(502)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  test('should throw last network error after max retries', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Connection refused'))

    await expect(fetchWithRetry('https://example.com', {}, 2, 0)).rejects.toThrow(
      'Connection refused'
    )
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  test('should pass options through to fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('ok', { status: 200 }))

    const headers = { Authorization: 'Bearer token' }
    await fetchWithRetry('https://example.com', { headers }, 3, 0)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ headers })
    )
  })
})
