// SEO Route Registry — TASK 3.6
//
// Canonical URL registry for all SEO landing pages.
// Derived from keyword clusters (TASK 3.5) — single source of truth.
//
// Used by:
//   sitemap.ts         — generate sitemap entries
//   TASK 3.7           — programmatic SEO generator
//   Internal links     — ensure consistent canonical URLs

import {
  KEYWORD_CLUSTERS,
  TIER1_CLUSTERS,
  type KeywordCluster,
} from '@/lib/seo-keywords'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://couponkum.com'

// ---------------------------------------------------------------------------
// Page type definitions
// ---------------------------------------------------------------------------

export type SeoPageType =
  | 'platform_coupon'    // /coupon/[platform]
  | 'category_deals'     // /deals/[platform]/[category]
  | 'comparison'         // /compare
  | 'campaign'           // /deals/payday, /deals/double-date

export interface SeoRoute {
  url:       string          // absolute canonical URL
  path:      string          // relative path (for Next.js routes)
  pageType:  SeoPageType
  cluster:   KeywordCluster
  priority:  number          // sitemap priority 0.0–1.0
  changeFreq: 'daily' | 'weekly' | 'monthly'
}

// ---------------------------------------------------------------------------
// Build routes from clusters
// ---------------------------------------------------------------------------

function clusterToRoute(cluster: KeywordCluster): SeoRoute {
  const path = cluster.targetUrlPattern.split('?')[0] // strip query params
  const isTier1 = cluster.tier === 1

  let pageType: SeoPageType
  if (path.startsWith('/coupon/')) pageType = 'platform_coupon'
  else if (path.startsWith('/compare')) pageType = 'comparison'
  else if (path.includes('payday') || path.includes('double')) pageType = 'campaign'
  else pageType = 'category_deals'

  return {
    url:        `${BASE_URL}${path}`,
    path,
    pageType,
    cluster,
    priority:   isTier1 ? 0.9 : cluster.tier === 2 ? 0.7 : 0.5,
    changeFreq: isTier1 ? 'daily' : 'weekly',
  }
}

// All routes — exclude budget search clusters (they use /search?q=... not own page)
export const SEO_ROUTES: SeoRoute[] = KEYWORD_CLUSTERS
  .filter(c => !c.targetUrlPattern.startsWith('/search'))
  .map(clusterToRoute)

// Tier-1 routes only (used for homepage internal links)
export const TIER1_ROUTES: SeoRoute[] = TIER1_CLUSTERS
  .filter(c => !c.targetUrlPattern.startsWith('/search'))
  .map(clusterToRoute)

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export function getRouteByPath(path: string): SeoRoute | undefined {
  return SEO_ROUTES.find(r => r.path === path)
}

export function getRoutesByPageType(type: SeoPageType): SeoRoute[] {
  return SEO_ROUTES.filter(r => r.pageType === type)
}

// ---------------------------------------------------------------------------
// Sitemap entries (for app/sitemap.ts)
// ---------------------------------------------------------------------------

export function getSeoSitemapEntries() {
  return SEO_ROUTES.map(r => ({
    url:             r.url,
    lastModified:    new Date(),
    changeFrequency: r.changeFreq,
    priority:        r.priority,
  }))
}
