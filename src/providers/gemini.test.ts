import { describe, expect, test } from 'vitest'
import { parseGeminiPage } from './gemini.js'

describe('gemini provider', () => {
  describe('parseGeminiPage', () => {
    test('should return null for empty HTML', () => {
      const result = parseGeminiPage('<html><body></body></html>')
      expect(result).toBeNull()
    })

    test('should parse fraction usage patterns (RPD)', () => {
      const html = `
        <html><body>
          <div>150/1,500 RPD</div>
          <div>50/100 RPM</div>
        </body></html>
      `
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.status).toBe('ok')
      expect(result?.provider).toBe('gemini')
      expect(result?.tiers).toHaveLength(2)
      expect(result?.tiers[0]).toEqual({ name: 'RPD', percentage: 10 })
      expect(result?.tiers[1]).toEqual({ name: 'RPM', percentage: 50 })
      expect(result?.overall_percentage).toBe(50)
    })

    test('should parse TPM fraction patterns', () => {
      const html = '<html><body><span>500,000/1,000,000 TPM</span></body></html>'
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.tiers[0]).toEqual({ name: 'TPM', percentage: 50 })
    })

    test('should parse percentage patterns', () => {
      const html = '<html><body><div>75.5% used</div></body></html>'
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.tiers[0].percentage).toBe(75.5)
    })

    test('should parse progress bar elements', () => {
      const html = `
        <html><body>
          <div role="progressbar" aria-valuenow="250" aria-valuemax="1000" aria-label="Daily requests"></div>
        </body></html>
      `
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.tiers[0]).toEqual({ name: 'Daily requests', percentage: 25 })
    })

    test('should parse width-based progress bars', () => {
      const html = `
        <html><body>
          <div>
            <span>API Usage</span>
            <div><div style="width: 60%"></div></div>
          </div>
        </body></html>
      `
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.tiers[0].percentage).toBe(60)
    })

    test('should detect quota tier from text', () => {
      const html = `
        <html><body>
          <span>Tier 2</span>
          <div>100/10,000 RPD</div>
        </body></html>
      `
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.plan).toBe('tier-2')
    })

    test('should detect free tier plan', () => {
      const html = `
        <html><body>
          <span>Free tier</span>
          <div>50/250 RPD</div>
        </body></html>
      `
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.plan).toBe('free')
    })

    test('should detect pay-as-you-go plan', () => {
      const html = `
        <html><body>
          <span>Pay-as-you-go</span>
          <div>500/10,000 RPD</div>
        </body></html>
      `
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.plan).toBe('paid')
    })

    test('should compute reset date as next midnight Pacific', () => {
      const html = '<html><body><div>100/1,000 RPD</div></body></html>'
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.reset_date).not.toBeNull()
      expect(result?.reset_in_hours).not.toBeNull()
      expect(result?.reset_in_hours).toBeGreaterThanOrEqual(0)
      expect(result?.reset_in_hours).toBeLessThanOrEqual(24)
    })

    test('should use highest percentage as overall', () => {
      const html = `
        <html><body>
          <div>10/100 RPD</div>
          <div>80/100 RPM</div>
          <div>5/100 TPM</div>
        </body></html>
      `
      const result = parseGeminiPage(html)
      expect(result).not.toBeNull()
      expect(result?.overall_percentage).toBe(80)
    })

    test('should return null when no usage data is found', () => {
      const html = '<html><body><h1>Welcome to AI Studio</h1></body></html>'
      const result = parseGeminiPage(html)
      expect(result).toBeNull()
    })
  })

  describe('real connection', () => {
    const sessionCookie = process.env.GEMINI_SESSION_COOKIE
    const hasCredentials = Boolean(sessionCookie)

    describe.skipIf(!hasCredentials)('with session cookie', () => {
      test('should fetch and parse usage data', async () => {
        const { geminiProvider } = await import('./gemini.js')
        const result = await geminiProvider.fetchUsage(sessionCookie!)

        console.log('\n=== Gemini Usage Data ===')
        console.log('Plan:', result?.plan)
        console.log('Overall:', `${result?.overall_percentage}%`)
        console.log('Tiers:')
        result?.tiers.forEach(tier => {
          console.log(`  - ${tier.name}: ${tier.percentage}%`)
        })
        console.log('Reset in:', result?.reset_in_hours, 'hours')
        console.log('=========================\n')

        expect(result).not.toBeNull()
        expect(result?.status).toBe('ok')
        expect(result?.provider).toBe('gemini')
      })
    })

    describe.skipIf(hasCredentials)('without session cookie', () => {
      test('should skip tests when GEMINI_SESSION_COOKIE is not set', () => {
        console.log('\nTo run real connection tests, set environment variable:')
        console.log('  export GEMINI_SESSION_COOKIE=your-session-cookie-value')
        console.log('\nGet the __Secure-1PSID cookie from your browser:')
        console.log('  1. Go to aistudio.google.com')
        console.log('  2. Open DevTools (F12) → Application → Cookies')
        console.log('  3. Copy the value of __Secure-1PSID')
        expect(true).toBe(true)
      })
    })
  })
})
