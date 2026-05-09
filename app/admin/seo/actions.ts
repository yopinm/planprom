'use server'
import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'

function titleToSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^฀-๿a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function estimateReadingTime(text: string): number {
  const words = text.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function autoDescription(text: string): string {
  const clean = text.replace(/#+\s*/g, '').trim()
  const sentences = clean.split(/[.!?。\n]/).filter(s => s.trim().length > 10)
  return sentences[0]?.trim().slice(0, 160) ?? ''
}

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}

function extractTitleFromHtml(html: string): { title: string; bodyHtml: string } {
  const match = html.match(/^(<(?:h[1-6]|p)[^>]*>)([\s\S]*?)(<\/(?:h[1-6]|p)>)/)
  if (match) {
    const title = stripHtmlTags(match[0]).trim().slice(0, 200)
    const bodyHtml = html.slice(match[0].length).trim()
    return { title, bodyHtml }
  }
  return { title: 'ไม่มีชื่อ', bodyHtml: html }
}

export async function uploadDocxAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdminSession('/admin/seo')

  const file = formData.get('docx') as File | null
  if (!file || file.size === 0) return { error: 'ไม่พบไฟล์' }
  if (!file.name.endsWith('.docx')) return { error: 'รองรับเฉพาะไฟล์ .docx' }

  try {
    const { convertToHtml, extractRawText } = await import('mammoth')
    const buffer = Buffer.from(await file.arrayBuffer())

    const { value: html } = await convertToHtml({ buffer })
    const { value: rawText } = await extractRawText({ buffer })

    if (!html.trim()) return { error: 'ไฟล์ว่างเปล่า' }

    const { title, bodyHtml } = extractTitleFromHtml(html)
    const description = autoDescription(stripHtmlTags(bodyHtml))
    const readingTimeMin = estimateReadingTime(rawText)

    let slug = titleToSlug(title)
    if (!slug) slug = `post-${Date.now()}`

    const existing = await db<{ slug: string }[]>`
      SELECT slug FROM blog_posts WHERE slug LIKE ${slug + '%'}
    `
    if (existing.length > 0) slug = `${slug}-${Date.now()}`

    await db`
      INSERT INTO blog_posts (slug, title, description, content, reading_time_min)
      VALUES (${slug}, ${title}, ${description}, ${bodyHtml}, ${readingTimeMin})
    `

    revalidatePath('/admin/seo')
    revalidatePath('/blog')
    return {}
  } catch (e) {
    return { error: String(e) }
  }
}

export async function togglePinAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const id = formData.get('id') as string
  const pinned = formData.get('pinned') === 'true'

  if (!pinned) {
    const [{ max }] = await db<{ max: number }[]>`
      SELECT COALESCE(MAX(pinned_order), 0) AS max FROM blog_posts WHERE pinned = true
    `
    await db`
      UPDATE blog_posts SET pinned = true, pinned_order = ${max + 1}, updated_at = NOW()
      WHERE id = ${id}
    `
  } else {
    await db`
      UPDATE blog_posts SET pinned = false, pinned_order = 0, updated_at = NOW()
      WHERE id = ${id}
    `
  }

  revalidatePath('/admin/seo')
  revalidatePath('/blog')
  revalidatePath('/')
}

export async function togglePostPublishAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const id = formData.get('id') as string
  const status = formData.get('status') as string
  const next = status === 'published' ? 'draft' : 'published'
  const publishedAt = next === 'published' ? new Date() : null

  await db`
    UPDATE blog_posts
    SET status = ${next}, published_at = ${publishedAt}, updated_at = NOW()
    WHERE id = ${id}
  `

  revalidatePath('/admin/seo')
  revalidatePath('/blog')
}

export async function deletePostAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const id = formData.get('id') as string
  await db`DELETE FROM blog_posts WHERE id = ${id}`
  revalidatePath('/admin/seo')
  revalidatePath('/blog')
}
