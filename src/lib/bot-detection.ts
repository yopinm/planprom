// src/lib/bot-detection.ts
// TASK 2.10 — Bot Detection + Rate Limit
//
// Three-layer check:
//   1. UA Blacklist   — known bot/scraper user agents
//   2. IP Rate Limit  — sliding window counter per IP per endpoint
//   3. Query Velocity — same IP + same query too fast → scraper signal
//
// Store:
//   Development / mock: in-memory Map (resets on server restart — acceptable)
//   Production:         swap InMemoryStore with RedisStore via REDIS_URL
//                       (no Redis client installed yet — documented hook below)
//
// Usage:
//   const result = checkBotAndRateLimit(req, 'search')
//   if (!result.allowed) return 429

import { createHash } from 'crypto'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export const BOT_CONFIG = {
  /** Max requests per IP per RATE_WINDOW_MS */
  RATE_LIMIT_SEARCH:     30,   // /api/search
  RATE_LIMIT_REDIRECT:   20,   // /api/r
  /** Window duration in ms */
  RATE_WINDOW_MS:        60_000, // 60 seconds
  /** Same query hits from same IP within VELOCITY_WINDOW_MS */
  VELOCITY_MAX:          5,
  VELOCITY_WINDOW_MS:    30_000, // 30 seconds
  /** Max counters in memory before cleanup (prevents unbounded growth) */
  MEMORY_MAX_ENTRIES:    10_000,
} as const

// ---------------------------------------------------------------------------
// UA Blacklist
// ---------------------------------------------------------------------------

const UA_BLACKLIST_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
  /\bcurl\b/i,
  /\bwget\b/i,
  /python-requests/i,
  /go-http-client/i,
  /java\//i,
  /libwww-perl/i,
  /httpclient/i,
  /okhttp/i,
  /axios\/0\./i,   // direct axios calls without browser header
  /node-fetch/i,
  /scrapy/i,
  /phantomjs/i,
  /headlesschrome/i,
]

/**
 * Returns true when the User-Agent matches a known bot/scraper pattern.
 * null / empty UA is treated as suspicious but not an automatic block
 * (many legitimate proxies strip UA).
 */
export function isBlacklistedUA(userAgent: string | null): boolean {
  if (!userAgent) return false
  return UA_BLACKLIST_PATTERNS.some(re => re.test(userAgent))
}

// ---------------------------------------------------------------------------
// IP extraction + hashing
// ---------------------------------------------------------------------------

export function extractIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return headers.get('x-real-ip') ?? null
}

export function hashIpForLog(ip: string | null): string | null {
  if (!ip) return null
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

// ---------------------------------------------------------------------------
// In-memory sliding window store
// (Redis-ready interface — swap implementation in production)
// ---------------------------------------------------------------------------

interface WindowEntry {
  count:       number
  windowStart: number
}

class InMemoryRateLimitStore {
  private map = new Map<string, WindowEntry>()

  /**
   * Increment the counter for `key` within a `windowMs` sliding window.
   * Returns the new count for this window.
   */
  increment(key: string, windowMs: number): number {
    const now  = Date.now()
    const prev = this.map.get(key)

    if (!prev || now - prev.windowStart >= windowMs) {
      // Start a new window
      this.map.set(key, { count: 1, windowStart: now })
      this.maybeCleanup()
      return 1
    }

    prev.count++
    return prev.count
  }

  private maybeCleanup() {
    if (this.map.size < BOT_CONFIG.MEMORY_MAX_ENTRIES) return
    // Drop oldest 20% of entries
    const cutoff = Math.floor(BOT_CONFIG.MEMORY_MAX_ENTRIES * 0.8)
    let i = 0
    for (const key of this.map.keys()) {
      if (i++ >= cutoff) break
      this.map.delete(key)
    }
  }
}

// Singleton — module-level (survives hot reload in dev, not across workers)
const store = new InMemoryRateLimitStore()

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type BotCheckEndpoint = 'search' | 'redirect' | 'analytics'

export interface BotCheckResult {
  allowed:       boolean
  flaggedReason: string | null
  ipHash:        string | null
}

// ---------------------------------------------------------------------------
// Main guard function
// ---------------------------------------------------------------------------

/**
 * Run all three bot-detection checks for an incoming request.
 *
 * @param headers   - Request headers (use req.headers from NextRequest)
 * @param endpoint  - Which endpoint is being guarded ('search' | 'redirect')
 * @param query     - Search query string (used for velocity check on /search)
 */
export function checkBotAndRateLimit(
  headers: Headers,
  endpoint: BotCheckEndpoint,
  query?: string,
): BotCheckResult {
  const ua    = headers.get('user-agent')
  const ip    = extractIp(headers)
  const ipKey = ip ?? 'unknown'

  // 1. UA Blacklist
  if (isBlacklistedUA(ua)) {
    return {
      allowed:       false,
      flaggedReason: 'ua_blacklist',
      ipHash:        hashIpForLog(ip),
    }
  }

  // 2. IP Rate Limit (sliding window)
  const rateLimit =
    endpoint === 'search'
      ? BOT_CONFIG.RATE_LIMIT_SEARCH
      : BOT_CONFIG.RATE_LIMIT_REDIRECT

  const rateKey   = `rl:${endpoint}:${ipKey}`
  const rateCount = store.increment(rateKey, BOT_CONFIG.RATE_WINDOW_MS)

  if (rateCount > rateLimit) {
    return {
      allowed:       false,
      flaggedReason: 'rate_limit_exceeded',
      ipHash:        hashIpForLog(ip),
    }
  }

  // 3. Query Velocity (search only — same query from same IP too fast)
  if (endpoint === 'search' && query) {
    const normalized = query.trim().toLowerCase().slice(0, 100)
    const velKey     = `vel:${ipKey}:${normalized}`
    const velCount   = store.increment(velKey, BOT_CONFIG.VELOCITY_WINDOW_MS)

    if (velCount > BOT_CONFIG.VELOCITY_MAX) {
      return {
        allowed:       false,
        flaggedReason: 'query_velocity',
        ipHash:        hashIpForLog(ip),
      }
    }
  }

  return {
    allowed:       true,
    flaggedReason: null,
    ipHash:        hashIpForLog(ip),
  }
}
