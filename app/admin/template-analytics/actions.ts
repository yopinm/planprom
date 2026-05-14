'use server'
import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
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
