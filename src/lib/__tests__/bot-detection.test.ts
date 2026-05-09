// src/lib/__tests__/bot-detection.test.ts
// TASK 2.10 — Bot Detection unit tests
//
// Tests pure functions: isBlacklistedUA, extractIp, checkBotAndRateLimit

import { describe, it, expect } from 'vitest'
import {
  isBlacklistedUA,
  extractIp,
  checkBotAndRateLimit,
  BOT_CONFIG,
} from '@/lib/bot-detection'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHeaders(overrides: Record<string, string> = {}): Headers {
  const h = new Headers()
  for (const [k, v] of Object.entries(overrides)) h.set(k, v)
  return h
}

function normalUA(): string {
  return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
}

// ---------------------------------------------------------------------------
// isBlacklistedUA
// ---------------------------------------------------------------------------

describe('isBlacklistedUA', () => {
  it('returns false for normal browser UA', () => {
    expect(isBlacklistedUA(normalUA())).toBe(false)
  })

  it('returns false for null UA', () => {
    expect(isBlacklistedUA(null)).toBe(false)
  })

  it('detects Googlebot', () => {
    expect(isBlacklistedUA('Googlebot/2.1 (+http://www.google.com/bot.html)')).toBe(true)
  })

  it('detects curl', () => {
    expect(isBlacklistedUA('curl/7.86.0')).toBe(true)
  })

  it('detects wget', () => {
    expect(isBlacklistedUA('Wget/1.21.3 (linux-gnu)')).toBe(true)
  })

  it('detects python-requests', () => {
    expect(isBlacklistedUA('python-requests/2.31.0')).toBe(true)
  })

  it('detects go-http-client', () => {
    expect(isBlacklistedUA('Go-http-client/1.1')).toBe(true)
  })

  it('detects scrapy spider', () => {
    expect(isBlacklistedUA('Scrapy/2.11.0 (+https://scrapy.org)')).toBe(true)
  })

  it('detects node-fetch', () => {
    expect(isBlacklistedUA('node-fetch/1.0')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// extractIp
// ---------------------------------------------------------------------------

describe('extractIp', () => {
  it('extracts from x-forwarded-for', () => {
    const h = makeHeaders({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(extractIp(h)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip', () => {
    const h = makeHeaders({ 'x-real-ip': '9.9.9.9' })
    expect(extractIp(h)).toBe('9.9.9.9')
  })

  it('returns null when no IP header', () => {
    expect(extractIp(makeHeaders())).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// checkBotAndRateLimit — UA blacklist
// ---------------------------------------------------------------------------

describe('checkBotAndRateLimit — UA blacklist', () => {
  it('blocks bot UA', () => {
    const h = makeHeaders({ 'user-agent': 'python-requests/2.31' })
    const result = checkBotAndRateLimit(h, 'search', 'test')
    expect(result.allowed).toBe(false)
    expect(result.flaggedReason).toBe('ua_blacklist')
  })

  it('allows normal browser UA', () => {
    const h = makeHeaders({
      'user-agent':      normalUA(),
      'x-forwarded-for': `${Math.random()}-allow-ua`,
    })
    const result = checkBotAndRateLimit(h, 'search', 'test-query')
    expect(result.allowed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// checkBotAndRateLimit — IP rate limit
// ---------------------------------------------------------------------------

describe('checkBotAndRateLimit — IP rate limit', () => {
  // Each test needs a unique IP so counts don't bleed across tests
  function uniqueIp() {
    return `rl-test-${Math.random().toString(36).slice(2)}`
  }

  it('allows requests under the rate limit', () => {
    const ip = uniqueIp()
    const h  = makeHeaders({ 'user-agent': normalUA(), 'x-forwarded-for': ip })
    const result = checkBotAndRateLimit(h, 'search', 'q')
    expect(result.allowed).toBe(true)
  })

  it('blocks after exceeding RATE_LIMIT_SEARCH requests', () => {
    const ip = uniqueIp()
    const h  = makeHeaders({ 'user-agent': normalUA(), 'x-forwarded-for': ip })

    // Exhaust the limit
    for (let i = 0; i < BOT_CONFIG.RATE_LIMIT_SEARCH; i++) {
      checkBotAndRateLimit(h, 'search', `q${i}`) // different queries to avoid velocity trigger
    }

    // Next request should be blocked
    const result = checkBotAndRateLimit(h, 'search', 'overflow')
    expect(result.allowed).toBe(false)
    expect(result.flaggedReason).toBe('rate_limit_exceeded')
  })

  it('blocks after exceeding RATE_LIMIT_REDIRECT requests on /r', () => {
    const ip = uniqueIp()
    const h  = makeHeaders({ 'user-agent': normalUA(), 'x-forwarded-for': ip })

    for (let i = 0; i < BOT_CONFIG.RATE_LIMIT_REDIRECT; i++) {
      checkBotAndRateLimit(h, 'redirect')
    }

    const result = checkBotAndRateLimit(h, 'redirect')
    expect(result.allowed).toBe(false)
    expect(result.flaggedReason).toBe('rate_limit_exceeded')
  })
})

// ---------------------------------------------------------------------------
// checkBotAndRateLimit — Query velocity
// ---------------------------------------------------------------------------

describe('checkBotAndRateLimit — query velocity', () => {
  function uniqueIp() {
    return `vel-test-${Math.random().toString(36).slice(2)}`
  }

  it('blocks same-query repeated beyond VELOCITY_MAX from same IP', () => {
    const ip    = uniqueIp()
    const h     = makeHeaders({ 'user-agent': normalUA(), 'x-forwarded-for': ip })
    const query = 'iphone15'

    for (let i = 0; i < BOT_CONFIG.VELOCITY_MAX; i++) {
      checkBotAndRateLimit(h, 'search', query)
    }

    const result = checkBotAndRateLimit(h, 'search', query)
    expect(result.allowed).toBe(false)
    expect(result.flaggedReason).toBe('query_velocity')
  })

  it('allows same query from different IPs', () => {
    const query = 'unique-query-different-ips'
    for (let i = 0; i < BOT_CONFIG.VELOCITY_MAX + 3; i++) {
      const h = makeHeaders({
        'user-agent':      normalUA(),
        'x-forwarded-for': `diff-ip-${i}`,
      })
      const result = checkBotAndRateLimit(h, 'search', query)
      expect(result.allowed).toBe(true)
    }
  })

  it('does not apply velocity check to /redirect endpoint', () => {
    const ip = uniqueIp()
    const h  = makeHeaders({ 'user-agent': normalUA(), 'x-forwarded-for': ip })
    // Redirect endpoint ignores query velocity — only rate limit applies
    for (let i = 0; i < BOT_CONFIG.VELOCITY_MAX + 2; i++) {
      const result = checkBotAndRateLimit(h, 'redirect')
      // Under redirect rate limit, should be allowed
      if (i < BOT_CONFIG.RATE_LIMIT_REDIRECT) {
        expect(result.flaggedReason).not.toBe('query_velocity')
      }
    }
  })

  it('normalises query case + leading/trailing spaces for velocity check', () => {
    const ip = uniqueIp()
    const h  = makeHeaders({ 'user-agent': normalUA(), 'x-forwarded-for': ip })

    for (let i = 0; i < BOT_CONFIG.VELOCITY_MAX; i++) {
      checkBotAndRateLimit(h, 'search', '  Samsung  ')
    }
    // Same query, different case/spaces → same velocity bucket
    const result = checkBotAndRateLimit(h, 'search', 'SAMSUNG')
    expect(result.allowed).toBe(false)
    expect(result.flaggedReason).toBe('query_velocity')
  })
})
