'use server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireAdminSession } from '@/lib/admin-auth'

export async function recordFulfilledAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const ideaText    = formData.get('idea_text')    as string
  const catalogSlug = formData.get('catalog_slug') as string | null
  const engineType  = formData.get('engine_type')  as string | null
  const redirectUrl = formData.get('redirect_url') as string

  if (ideaText?.trim()) {
    await db`
      INSERT INTO intel_fulfilled (idea_text, catalog_slug, engine_type)
      VALUES (${ideaText.trim()}, ${catalogSlug || null}, ${engineType || null})
    `.catch(() => null)
  }
  redirect(redirectUrl || '/admin/templates/new')
}

// Admin Feedback Loop: mark idea as "ไม่ใช่ template" → hide (recoverable)
export async function rejectIdeaAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const ideaText = formData.get('idea') as string
  if (ideaText?.trim()) {
    await db`
      INSERT INTO intel_rejected (idea_text, is_permanent)
      VALUES (${ideaText.trim()}, false)
      ON CONFLICT (idea_text) DO NOTHING
    `.catch(() => null)
  }
  revalidatePath('/admin/template-analytics')
}

// Revert reject: admin restores a previously rejected idea
export async function revertRejectedAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const ideaText = formData.get('idea') as string
  if (ideaText?.trim()) {
    await db`DELETE FROM intel_rejected WHERE idea_text = ${ideaText.trim()}`.catch(() => null)
  }
  revalidatePath('/admin/template-analytics')
}

// Permanent reject: ไม่แสดงใน recovery list อีก แต่ยังถูก filter ออกจากทุก card ตลอดไป
export async function permanentRejectAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const ideaText = formData.get('idea') as string
  if (ideaText?.trim()) {
    await db`
      INSERT INTO intel_rejected (idea_text, is_permanent)
      VALUES (${ideaText.trim()}, true)
      ON CONFLICT (idea_text) DO UPDATE SET is_permanent = true
    `.catch(() => null)
  }
  revalidatePath('/admin/template-analytics')
}

// Bulk permanent reject: ล้าง rejected list ทั้งหมดในครั้งเดียว
export async function bulkPermanentRejectAction() {
  await requireAdminSession('/admin/login')
  await db`
    UPDATE intel_rejected SET is_permanent = true WHERE is_permanent = false
  `.catch(() => null)
  revalidatePath('/admin/template-analytics')
}

// Restore stale: reset the 30-day clock by inserting today's snapshot
export async function restoreStaleAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const ideaText   = formData.get('idea')        as string
  const engineType = formData.get('engine_type') as string
  if (ideaText?.trim()) {
    await db`
      INSERT INTO intel_snapshots (idea_text, engine_type, catalog_slug, score, demand_count, snapshot_date)
      VALUES (${ideaText.trim()}, ${engineType || null}, NULL, 0, 1, CURRENT_DATE)
      ON CONFLICT (idea_text, engine_type, snapshot_date) DO NOTHING
    `.catch(() => null)
  }
  revalidatePath('/admin/template-analytics')
}

export async function deleteExcelIdeaAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const id = Number(formData.get('id'))
  if (id > 0) await db`DELETE FROM intel_excel_ideas WHERE id = ${id}`.catch(() => null)
  revalidatePath('/admin/template-analytics')
}
