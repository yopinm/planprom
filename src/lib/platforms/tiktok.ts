import { parseDeepLink } from '@/lib/deep-link-parser'
import { withRetry, TransientApiError } from '@/lib/api-retry'

import type { DeepLinkResult } from '@/lib/deep-link-parser'

export interface TiktokShortLinkResolution {
  inputUrl: string
  resolvedUrl: string
  parsed: DeepLinkResult | null
}

export function isTiktokShortUrl(url: string): boolean {
  return /^https?:\/\/vt\.tiktok\.com\//i.test(url) || /tiktok\.com\/t\//i.test(url)
}

export async function resolveTiktokShortLink(url: string): Promise<TiktokShortLinkResolution | null> {
  if (!isTiktokShortUrl(url)) return null

  return withRetry(async () => {
    const response = await fetch(url, { method: 'HEAD', redirect: 'follow' })

    if (response.status >= 500) throw new TransientApiError(response.status, `TikTok short-link HEAD: HTTP ${response.status}`)

    const resolvedUrl = response.url || url
    return { inputUrl: url, resolvedUrl, parsed: parseDeepLink(resolvedUrl) }
  }, { maxRetries: 2, baseDelayMs: 500, label: 'tiktok-short-link' })
}
