import type { Platform } from '@/types'
import { getSafePublicOrigin } from '@/lib/site-url'

export interface RedirectFallbackProduct {
  id: string
  name: string
  platform: Platform
}

export function buildLinkUnavailableFallbackUrl(params: {
  origin: string
  product: RedirectFallbackProduct
  query: string | null
  reason?: string
}): string {
  const fallback = new URL('/search', getSafePublicOrigin(params.origin))
  const searchQuery = params.query?.trim() || params.product.name.trim()

  fallback.searchParams.set('notice', 'link_unavailable')
  fallback.searchParams.set('product_id', params.product.id)
  fallback.searchParams.set('platform', params.product.platform)

  if (searchQuery) fallback.searchParams.set('q', searchQuery)
  if (params.reason) fallback.searchParams.set('reason', params.reason)

  return fallback.toString()
}
