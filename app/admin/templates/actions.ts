'use server'
import { db } from '@/lib/db'
import { requireAdminSession } from '@/lib/admin-auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import type { TocItem } from '@/lib/pdf-types'

const TIER_PRICE: Record<string, number> = {
  free: 0, standard: 30, premium: 50, ultra: 100,
}

function str(fd: FormData, key: string): string {
  return ((fd.get(key) as string) ?? '').trim()
}

export async function createTemplateAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const tier = str(formData, 'tier') || 'standard'
  const slug = str(formData, 'slug').toLowerCase()
  const pdfPath = str(formData, 'pdf_path') || '/uploads/templates/placeholder.pdf'
  const pageCount = str(formData, 'page_count')

  await db`
    INSERT INTO templates
      (slug, title, description, tier, price_baht, pdf_path, preview_path,
       thumbnail_path, page_count, has_form_fields, status)
    VALUES (
      ${slug},
      ${str(formData, 'title')},
      ${str(formData, 'description') || null},
      ${tier},
      ${TIER_PRICE[tier] ?? 20},
      ${pdfPath},
      ${str(formData, 'preview_path') || null},
      ${str(formData, 'thumbnail_path') || null},
      ${pageCount ? Number(pageCount) : null},
      ${formData.get('has_form_fields') === 'true'},
      'draft'
    )
  `
  revalidatePath('/admin/templates')
  redirect('/admin/templates')
}

export async function updateTemplateAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')
  const tier = str(formData, 'tier') || 'standard'
  const pdfPath = str(formData, 'pdf_path') || '/uploads/templates/placeholder.pdf'
  const pageCount = str(formData, 'page_count')
  const documentType = str(formData, 'document_type') || 'checklist'
  const isRequestOnly = formData.get('is_request_only') === 'true'
  const manualPrice = str(formData, 'price_baht')
  const pricebaht = isRequestOnly && manualPrice
    ? Number(manualPrice)
    : (TIER_PRICE[tier] ?? 20)

  await db`
    UPDATE templates SET
      title           = ${str(formData, 'title')},
      description     = ${str(formData, 'description') || null},
      tier            = ${tier},
      price_baht      = ${pricebaht},
      pdf_path        = ${pdfPath},
      preview_path    = ${str(formData, 'preview_path') || null},
      thumbnail_path  = ${str(formData, 'thumbnail_path') || null},
      page_count      = ${pageCount ? Number(pageCount) : null},
      has_form_fields  = ${formData.get('has_form_fields') === 'true'},
      is_request_only  = ${isRequestOnly},
      document_type    = ${documentType},
      updated_at       = NOW()
    WHERE id = ${id}
  `
  revalidatePath('/admin/templates')
  redirect('/admin/templates')
}

export async function deleteTemplateAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')

  // Block delete if any paid orders reference this template
  const [{ cnt }] = await db<{ cnt: string }[]>`
    SELECT (
      (SELECT COUNT(*) FROM order_items    WHERE template_id = ${id}) +
      (SELECT COUNT(*) FROM template_orders WHERE template_id = ${id})
    )::text AS cnt
  `.catch(() => [{ cnt: '0' }])

  if (Number(cnt) > 0) {
    return { error: `มีคำสั่งซื้อ ${cnt} รายการ — ใช้ปุ่ม "ซ่อน" แทนการลบถาวร` }
  }

  try {
    await db`DELETE FROM template_revisions     WHERE template_id = ${id}`
    await db`DELETE FROM cart_items             WHERE template_id = ${id}`
    await db`DELETE FROM template_category_links WHERE template_id = ${id}`
    await db`DELETE FROM template_tags          WHERE template_id = ${id}`
    await db`DELETE FROM templates              WHERE id = ${id}`
  } catch (e) {
    return { error: `ลบไม่สำเร็จ: ${String(e)}` }
  }
  revalidatePath('/admin/templates')
  return {}
}

export async function forceDeleteTemplateAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')
  try {
    await db`UPDATE promo_codes SET is_active = false, template_id = NULL WHERE template_id = ${id}`
    await db`DELETE FROM template_revisions      WHERE template_id = ${id}`
    await db`DELETE FROM order_items             WHERE template_id = ${id}`
    // ลบ orders ที่ไม่มี items เหลือ (CASCADE จะลบ promo_code_uses ตาม)
    await db`DELETE FROM orders WHERE id NOT IN (SELECT DISTINCT order_id FROM order_items)`
    await db`DELETE FROM template_orders         WHERE template_id = ${id}`
    await db`DELETE FROM cart_items              WHERE template_id = ${id}`
    await db`DELETE FROM template_category_links WHERE template_id = ${id}`
    await db`DELETE FROM template_tags           WHERE template_id = ${id}`
    await db`DELETE FROM templates               WHERE id = ${id}`
  } catch (e) {
    return { error: `Force ลบไม่สำเร็จ: ${String(e)}` }
  }
  revalidatePath('/admin/templates')
  return {}
}

export async function archiveTemplateAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')
  try {
    await db`UPDATE templates SET status = 'archived', updated_at = NOW() WHERE id = ${id}`
  } catch (e) {
    return { error: `ซ่อนไม่สำเร็จ: ${String(e)}` }
  }
  revalidatePath('/admin/templates')
  return {}
}

export async function unarchiveTemplateAction(formData: FormData): Promise<{ error?: string }> {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')
  try {
    await db`UPDATE templates SET status = 'draft', updated_at = NOW() WHERE id = ${id}`
  } catch (e) {
    return { error: `เลิกซ่อนไม่สำเร็จ: ${String(e)}` }
  }
  revalidatePath('/admin/templates')
  return {}
}

// ─── Wizard create (called from Client Component) ────────────────────────────

export async function approveTemplateAction(formData: FormData): Promise<void> {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')
  await db`
    UPDATE templates SET
      status       = 'published',
      published_at = NOW(),
      updated_at   = NOW()
    WHERE id = ${id} AND status = 'draft_preview'
  `
  revalidatePath('/admin/templates')
  redirect('/admin/templates')
}

export async function checkSlugExists(slug: string): Promise<boolean> {
  await requireAdminSession('/admin/login')
  const [row] = await db<{ exists: boolean }[]>`
    SELECT EXISTS(SELECT 1 FROM templates WHERE slug = ${slug.toLowerCase().trim()}) AS exists
  `
  return row?.exists ?? false
}

export async function createTemplateWizardAction(data: {
  title: string
  slug: string
  description: string
  tier: string
  pdfPath: string
  pageCount: number | null
  hasFormFields: boolean
  categorySlug: string
  tags: string[]
  status: 'draft' | 'published' | 'draft_preview'
  documentType: string
  tocSections?: TocItem[]
  watermarkText?: string
  previewPath?: string
  previewPages?: string[]
  engineType?: string
  engineData?: Record<string, unknown>
}): Promise<{ error?: string; id?: string }> {
  try {
    await requireAdminSession('/admin/login')
    const price = TIER_PRICE[data.tier] ?? 20
    const now = data.status === 'published' ? new Date() : null
    const docType = data.documentType || 'checklist'

    const [row] = await db<{ id: string }[]>`
      INSERT INTO templates
        (slug, title, description, tier, price_baht, pdf_path, preview_path,
         thumbnail_path, preview_pages, page_count, has_form_fields, status, published_at, document_type,
         toc_sections, watermark_text, engine_type, engine_data)
      VALUES (
        ${data.slug}, ${data.title}, ${data.description || null},
        ${data.tier}, ${price}, ${data.pdfPath || '/uploads/templates/placeholder.pdf'},
        ${data.previewPath ?? null},
        ${data.previewPath ?? null},
        ${JSON.stringify(data.previewPages ?? [])}::jsonb,
        ${data.pageCount}, ${data.hasFormFields}, ${data.status}, ${now}, ${docType},
        ${data.tocSections ? JSON.stringify(data.tocSections) : null},
        ${data.watermarkText ?? null},
        ${data.engineType ?? null},
        ${(data.engineData ?? null) as unknown as string}
      )
      RETURNING id
    `
    if (!row?.id) return { error: 'Insert failed' }

    if (data.categorySlug) {
      const [cat] = await db<{ id: string }[]>`
        SELECT id FROM template_categories WHERE slug = ${data.categorySlug} LIMIT 1
      `
      if (cat?.id) {
        await db`
          INSERT INTO template_category_links (template_id, category_id)
          VALUES (${row.id}, ${cat.id})
          ON CONFLICT DO NOTHING
        `
      }
    }

    if (data.tags.length > 0) {
      for (const tag of data.tags) {
        await db`
          INSERT INTO template_tags (template_id, tag) VALUES (${row.id}, ${tag})
          ON CONFLICT DO NOTHING
        `
      }
    }

    revalidatePath('/admin/templates')
    return { id: row.id }
  } catch (e) {
    const msg = String(e)
    if (msg.includes('templates_slug_key')) {
      return { error: `Slug "${data.slug}" มีอยู่แล้ว — กรุณาเปลี่ยน Slug หรือไปที่ Template Manager เพื่อแก้ไข template เดิม` }
    }
    return { error: msg }
  }
}

export async function setFeaturedWeeklyAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')
  const [{ cnt }] = await db<{ cnt: string }[]>`
    SELECT COUNT(*)::text AS cnt FROM templates WHERE is_featured_weekly = true AND id != ${id}
  `
  if (Number(cnt) < 3) {
    await db`UPDATE templates SET is_featured_weekly = true, updated_at = NOW() WHERE id = ${id}`
  }
  revalidatePath('/')
  revalidatePath('/admin/templates')
}

export async function clearFeaturedWeeklyAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')
  await db`UPDATE templates SET is_featured_weekly = false, updated_at = NOW() WHERE id = ${id}`
  revalidatePath('/')
  revalidatePath('/admin/templates')
}

export async function togglePublishAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = str(formData, 'id')
  const current = str(formData, 'status')
  const next = current === 'published' ? 'draft' : 'published'
  const publishedAt = next === 'published' ? new Date() : null

  await db`
    UPDATE templates SET
      status       = ${next},
      published_at = ${publishedAt},
      updated_at   = NOW()
    WHERE id = ${id}
  `
  revalidatePath('/admin/templates')
}
