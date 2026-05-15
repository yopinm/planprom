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
