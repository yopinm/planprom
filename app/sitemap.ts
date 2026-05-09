// app/sitemap.ts — serves /sitemap.xml
// Static + pSEO + active products (single sitemap, no pagination)

import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { getAllPosts } from '@/lib/blog'
import { getPublishedDbPosts } from '@/lib/blog-db'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.planprom.com'

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/`,           lastModified: new Date(), changeFrequency: 'daily',   priority: 1.0 },
  { url: `${BASE_URL}/templates`,  lastModified: new Date(), changeFrequency: 'daily',   priority: 0.9 },
  { url: `${BASE_URL}/blog`,       lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.8 },
  { url: `${BASE_URL}/disclosure`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/privacy`,    lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/terms`,      lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
]

async function getBlogEntries(): Promise<MetadataRoute.Sitemap> {
  const [staticPosts, dbPosts] = await Promise.all([
    Promise.resolve(getAllPosts()),
    getPublishedDbPosts(),
  ])
  const dbSlugs = new Set(dbPosts.map(p => p.slug))
  const all = [...dbPosts, ...staticPosts.filter(p => !dbSlugs.has(p.slug))]
  return all.map(p => ({
    url:             `${BASE_URL}/blog/${p.slug}`,
    lastModified:    p.updatedAt ? new Date(p.updatedAt) : new Date(p.publishedAt),
    changeFrequency: 'monthly' as const,
    priority:        0.7,
  }))
}

async function getTemplateEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const rows = await db<{ slug: string; updated_at: string | null }[]>`
      SELECT slug, updated_at FROM templates WHERE status = 'published' ORDER BY updated_at DESC
    `
    return rows.map(r => ({
      url:             `${BASE_URL}/templates/${r.slug}`,
      lastModified:    r.updated_at ? new Date(r.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority:        0.8,
    }))
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogEntries, templateEntries] = await Promise.all([
    getBlogEntries(),
    getTemplateEntries(),
  ])
  return [...STATIC_ROUTES, ...blogEntries, ...templateEntries]
}
