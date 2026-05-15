'use server'
import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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

export async function approveDraftAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const id = formData.get('id') as string
  await db`
    UPDATE blog_posts SET status = 'published', published_at = NOW(), updated_at = NOW()
    WHERE id = ${id} AND status = 'pending_review'
  `
  revalidatePath('/admin/seo')
  revalidatePath('/blog')
  revalidatePath('/')
}

export async function importStaticPostAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const slug = formData.get('slug') as string

  const existing = await db<{ id: string }[]>`SELECT id FROM blog_posts WHERE slug = ${slug} LIMIT 1`
  if (existing.length > 0) {
    redirect(`/admin/seo/${existing[0].id}/edit`)
  }

  const { getPostBySlug } = await import('@/lib/blog')
  const post = getPostBySlug(slug)
  if (!post) return

  const [{ id }] = await db<{ id: string }[]>`
    INSERT INTO blog_posts (slug, title, description, content, reading_time_min, status, published_at)
    VALUES (${post.slug}, ${post.title}, ${post.description}, ${post.content}, ${post.readingTimeMin}, 'published', NOW())
    RETURNING id
  `

  revalidatePath('/admin/seo')
  revalidatePath('/blog')
  redirect(`/admin/seo/${id}/edit`)
}

export async function createBlogTemplateAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const emoji = (formData.get('emoji') as string).trim() || '📝'
  const label = (formData.get('label') as string).trim()
  const keyword = (formData.get('keyword') as string).trim()
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const outline = formData.get('outline') as string

  await db`
    INSERT INTO blog_templates (emoji, label, keyword, title, description, outline)
    VALUES (${emoji}, ${label}, ${keyword}, ${title}, ${description}, ${outline})
  `
  revalidatePath('/admin/seo/new')
  redirect('/admin/seo/new')
}

export async function updateBlogTemplateAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const id = formData.get('id') as string
  const emoji = (formData.get('emoji') as string).trim() || '📝'
  const label = (formData.get('label') as string).trim()
  const keyword = (formData.get('keyword') as string).trim()
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const outline = formData.get('outline') as string

  await db`
    UPDATE blog_templates
    SET emoji = ${emoji}, label = ${label}, keyword = ${keyword},
        title = ${title}, description = ${description}, outline = ${outline},
        updated_at = NOW()
    WHERE id = ${id}
  `
  revalidatePath('/admin/seo/new')
  redirect('/admin/seo/new')
}

export async function deleteBlogTemplateAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const id = formData.get('id') as string
  await db`DELETE FROM blog_templates WHERE id = ${id}`
  revalidatePath('/admin/seo/new')
  redirect('/admin/seo/new')
}

export async function createPostAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const content = (formData.get('content') as string)
  const submitType = formData.get('submit_type') as string

  const readingTimeMin = estimateReadingTime(content || title)
  let slug = titleToSlug(title)
  if (!slug) slug = `post-${Date.now()}`

  const existing = await db<{ slug: string }[]>`SELECT slug FROM blog_posts WHERE slug LIKE ${slug + '%'}`
  if (existing.length > 0) slug = `${slug}-${Date.now()}`

  const status = submitType === 'publish' ? 'published' : 'draft'
  const publishedAt = status === 'published' ? new Date() : null

  const [{ id }] = await db<{ id: string }[]>`
    INSERT INTO blog_posts (slug, title, description, content, reading_time_min, status, published_at)
    VALUES (${slug}, ${title}, ${description}, ${content}, ${readingTimeMin}, ${status}, ${publishedAt})
    RETURNING id
  `

  revalidatePath('/admin/seo')
  revalidatePath('/blog')
  redirect(`/admin/seo/${id}/edit`)
}

function plainToHtml(text: string): string {
  return text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

export async function updatePostAction(formData: FormData) {
  await requireAdminSession('/admin/seo')
  const id = formData.get('id') as string
  const title = (formData.get('title') as string).trim()
  const description = (formData.get('description') as string).trim()
  const content = plainToHtml((formData.get('content') as string))
  const readingTimeMin = Math.max(1, parseInt(formData.get('reading_time_min') as string) || 1)

  await db`
    UPDATE blog_posts
    SET title = ${title}, description = ${description}, content = ${content},
        reading_time_min = ${readingTimeMin}, updated_at = NOW()
    WHERE id = ${id}
  `

  revalidatePath('/admin/seo')
  revalidatePath('/blog')
  redirect('/admin/seo')
}
