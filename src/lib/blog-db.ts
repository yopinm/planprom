// src/lib/blog-db.ts — DB-backed blog posts (admin-uploaded)
import { db } from '@/lib/db'
import type { BlogPost } from './blog'
import { AUTHORS } from './blog'

export type DbBlogPost = BlogPost & {
  id: string
  pinned: boolean
  pinned_order: number
  status: 'draft' | 'published'
  source: 'db'
}

type DbRow = {
  id: string
  slug: string
  title: string
  description: string
  content: string
  author_name: string
  tags: string[]
  category: string
  reading_time_min: number
  status: string
  pinned: boolean
  pinned_order: number
  published_at: string | null
  updated_at: string
  created_at: string
}

function rowToPost(r: DbRow): DbBlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    description: r.description,
    content: r.content,
    author: {
      ...AUTHORS.planprom_team,
      name: r.author_name,
    },
    publishedAt: r.published_at ?? r.created_at,
    updatedAt: r.updated_at,
    tags: r.tags ?? [],
    category: (r.category as BlogPost['category']) ?? 'guide',
    readingTimeMin: r.reading_time_min,
    pinned: r.pinned,
    pinned_order: r.pinned_order,
    status: r.status as 'draft' | 'published',
    source: 'db',
  }
}

export async function getAllDbPosts(): Promise<DbBlogPost[]> {
  try {
    const rows = await db<DbRow[]>`
      SELECT * FROM blog_posts
      ORDER BY pinned DESC, pinned_order ASC, created_at DESC
    `
    return rows.map(rowToPost)
  } catch {
    return []
  }
}

export async function getPublishedDbPosts(): Promise<DbBlogPost[]> {
  try {
    const rows = await db<DbRow[]>`
      SELECT * FROM blog_posts
      WHERE status = 'published'
      ORDER BY pinned DESC, pinned_order ASC, published_at DESC
    `
    return rows.map(rowToPost)
  } catch {
    return []
  }
}

export async function getDbPostBySlug(slug: string): Promise<DbBlogPost | null> {
  try {
    const [row] = await db<DbRow[]>`
      SELECT * FROM blog_posts WHERE slug = ${slug} LIMIT 1
    `
    return row ? rowToPost(row) : null
  } catch {
    return null
  }
}

export async function getPinnedPublishedPosts(limit = 5): Promise<DbBlogPost[]> {
  try {
    const rows = await db<DbRow[]>`
      SELECT * FROM blog_posts
      WHERE status = 'published' AND pinned = true
      ORDER BY pinned_order ASC, published_at DESC
      LIMIT ${limit}
    `
    return rows.map(rowToPost)
  } catch {
    return []
  }
}
