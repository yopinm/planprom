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

// Admin Feedback Loop: mark idea as "ไม่ใช่ template" → hide permanently
export async function rejectIdeaAction(formData: FormData) {
  await requireAdminSession('/admin/login')
  const ideaText = formData.get('idea') as string
  if (ideaText?.trim()) {
    await db`
      INSERT INTO intel_rejected (idea_text)
      VALUES (${ideaText.trim()})
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

// Restore stale: reset the 30-day clock by inserting today's snapshot
// Idea will reappear in main list for another 30 days without being fulfilled
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
