// Round-robin proxy pool — TASK 4.8
//
// Reads PROXY_URLS env var (comma-separated list):
//   PROXY_URLS="http://user:pass@host1:port,http://user:pass@host2:port"
//
// Returns undefined when no proxies are configured; callers fall back to
// a direct fetch. Wire into scraping adapters when price-check scale requires
// rotating IPs (Target: Top-500 products, Month 7-9).
//
// Usage with undici (for scraping adapters, not official-API callers):
//   import { ProxyAgent } from 'undici'
//   const proxyUrl = getNextProxy()
//   const res = await fetch(url, proxyUrl
//     ? { dispatcher: new ProxyAgent(proxyUrl) } as RequestInit
//     : {}
//   )

export function buildPool(raw = process.env.PROXY_URLS): string[] {
  return (raw ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

const POOL = buildPool()
let idx  = 0

export function getNextProxy(): string | undefined {
  if (POOL.length === 0) return undefined
  const proxy = POOL[idx]
  idx = (idx + 1) % POOL.length
  return proxy
}

export function getProxyCount(): number {
  return POOL.length
}

export function hasProxies(): boolean {
  return POOL.length > 0
}
