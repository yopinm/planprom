// Link Health Check — TASK 4.15
//
// Problem: Dead affiliate links (404/410) send users to an error page,
//          wasting the click and losing the conversion opportunity.
//
// Solution: HEAD-request cache with 5-minute TTL.
//   - checkUrl()        — live HEAD check, updates cache (SSRF-guarded)
//   - getCachedHealth() — instant cache lookup (never blocks redirect)
//   - refreshAsync()    — fire-and-forget background refresh
//
// The /api/r redirect route uses getCachedHealth() only:
//   • Cache miss → allow redirect (optimistic), schedule background refresh
//   • Cache hit DEAD → redirect to fallback search page instead
//
// Security Fix #3 — SSRF Prevention:
//   - Only allows requests to domains in ALLOWED_DOMAINS
//   - Blocks private/loopback IP ranges

// ---------------------------------------------------------------------------
// SSRF Guard — Security Fix #3
// ---------------------------------------------------------------------------

const ALLOWED_DOMAINS = new Set([
  'shopee.co.th',
  'shopee.com',
  's.shopee.co.th',
  'shope.ee',
  'lazada.co.th',
  'lazada.com',
  'go.lazada.co.th',
  'tokopedia.com',
  'shopee.ph',
  'lazada.com.ph',
  // TikTok Shop (TASK S2)
  'tiktok.com',
  'www.tiktok.com',
  'shop.tiktok.com',
  's.tiktok.com',
  'vm.tiktok.com',
  // Involve Asia affiliate network
  'invol.co',
  'invol.pe',
  'involve.asia',
  // AccessTrade affiliate network
  'accesstrade.in.th',
  'c.accesstrade.in.th',
  'atth.me',
])

// Private / loopback ranges that must never be fetched
const PRIVATE_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^::1$/,
  /^0\./,
  /^169\.254\./,   // link-local
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,  // CGNAT
]

export class SsrfBlockedError extends Error {
  constructor(url: string) {
    super(`SSRF blocked: ${url} is not in the allowed domain list`)
    this.name = 'SsrfBlockedError'
  }
}

export function assertAllowedUrl(rawUrl: string): void {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new SsrfBlockedError(rawUrl)
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block private IP ranges
  if (PRIVATE_PATTERNS.some(p => p.test(hostname))) {
    throw new SsrfBlockedError(rawUrl)
  }

  // Only allow https
  if (parsed.protocol !== 'https:') {
    throw new SsrfBlockedError(rawUrl)
  }

  // Allow exact match or subdomain of allowed domains
  const allowed = [...ALLOWED_DOMAINS].some(
    d => hostname === d || hostname.endsWith(`.${d}`),
  )
  if (!allowed) throw new SsrfBlockedError(rawUrl)
}

export interface HealthResult {
  url:        string
  ok:         boolean   // true = 2xx or 3xx (followable)
  status:     number    // HTTP status from HEAD, or 0 on network error
  final_url?: string    // URL after following redirects (if different)
  checked_at: string
}

interface CacheEntry {
  result:  HealthResult
  expires: number       // Date.now() ms
}

// ---------------------------------------------------------------------------
// In-memory cache — process-scoped, reset on cold start
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 5 * 60 * 1000   // 5 minutes
const cache        = new Map<string, CacheEntry>()

function isAlive(status: number): boolean {
  // 2xx = OK, 3xx = redirect (followable), 405 = HEAD not allowed (treat as alive)
  return (status >= 200 && status < 400) || status === 405
}

// ---------------------------------------------------------------------------
// Live check — performs actual HEAD request
// ---------------------------------------------------------------------------

export async function checkUrl(url: string, timeoutMs = 5000): Promise<HealthResult> {
  const checked_at = new Date().toISOString()

  try {
    assertAllowedUrl(url)   // throws SsrfBlockedError if domain not allowed
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    const res = await fetch(url, {
      method:   'HEAD',
      redirect: 'follow',
      cache:    'no-store',
      signal:   controller.signal,
      headers:  { 'User-Agent': 'Couponkum-LinkChecker/1.0' },
    })

    clearTimeout(timer)

    const result: HealthResult = {
      url,
      ok:         isAlive(res.status),
      status:     res.status,
      final_url:  res.url !== url ? res.url : undefined,
      checked_at,
    }

    cache.set(url, { result, expires: Date.now() + CACHE_TTL_MS })
    return result

  } catch {
    const result: HealthResult = {
      url,
      ok:         false,
      status:     0,    // network error / timeout
      checked_at,
    }
    // Cache failures with shorter TTL (1 min) — retry sooner
    cache.set(url, { result, expires: Date.now() + 60_000 })
    return result
  }
}

// ---------------------------------------------------------------------------
// Cache-only lookup — never async, never blocks redirect path
// ---------------------------------------------------------------------------

export function getCachedHealth(url: string): HealthResult | null {
  const entry = cache.get(url)
  if (!entry) return null
  if (Date.now() > entry.expires) {
    cache.delete(url)
    return null
  }
  return entry.result
}

// ---------------------------------------------------------------------------
// Fire-and-forget refresh — call from redirect route without awaiting
// ---------------------------------------------------------------------------

export function refreshAsync(url: string): void {
  void checkUrl(url)
}

// ---------------------------------------------------------------------------
// Batch check — for admin dashboard or cron job
// ---------------------------------------------------------------------------

export async function checkUrls(urls: string[]): Promise<HealthResult[]> {
  return Promise.all(urls.map(u => checkUrl(u)))
}

// ---------------------------------------------------------------------------
// Cache stats — for admin/debug
// ---------------------------------------------------------------------------

export function getCacheStats(): { total: number; dead: number; alive: number } {
  let dead = 0, alive = 0
  const now = Date.now()
  for (const entry of cache.values()) {
    if (now > entry.expires) continue
    if (entry.result.ok) alive++; else dead++
  }
  return { total: alive + dead, dead, alive }
}
