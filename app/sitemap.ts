// app/sitemap.ts — serves /sitemap.xml
// Static + pSEO + active products (single sitemap, no pagination)

import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { getSeoSitemapEntries } from '@/lib/seo-routes'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
  { url: `${BASE_URL}/search`,     lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
  { url: `${BASE_URL}/alerts`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.6 },
  { url: `${BASE_URL}/disclosure`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/privacy`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/terms`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
]

async function getProductEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const rows = await db<{ id: string; updated_at: string | null }[]>`
      SELECT id, updated_at FROM products WHERE is_active = true ORDER BY updated_at DESC LIMIT 5000
    `
    return rows.map(r => ({
      url:             `${BASE_URL}/product/${r.id}`,
      lastModified:    r.updated_at ? new Date(r.updated_at) : new Date(),
      changeFrequency: 'daily' as const,
      priority:        0.8,
    }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const productEntries = await getProductEntries()
  return [...STATIC_ROUTES, ...getSeoSitemapEntries(), ...productEntries]
}
