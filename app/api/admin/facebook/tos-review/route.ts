// app/api/admin/facebook/tos-review — TASK 2.5.9
// PATCH /api/admin/facebook/tos-review
// Admin confirms Meta ToS checklist; records tos_reviewed_at + tos_reviewed_by
// in facebook_settings. Must be called before Phase 3-Ext (Graph API) is enabled.
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'
import { createServerClient } from '@/lib/supabase/server'

interface FacebookSettingsTosRow {
  tos_reviewed_at: string | null
  tos_reviewed_by: string | null
}

export async function PATCH(request: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const reviewed_by =
    typeof b.reviewed_by === 'string' && b.reviewed_by.trim()
      ? b.reviewed_by.trim()
      : user.email ?? user.id

  const now = new Date().toISOString()

  try {
    const [data] = await db<FacebookSettingsTosRow[]>`
      UPDATE facebook_settings
      SET tos_reviewed_at = ${now},
          tos_reviewed_by = ${reviewed_by}
      WHERE id = 1
      RETURNING tos_reviewed_at, tos_reviewed_by
    `

    if (!data) {
      return NextResponse.json({ error: 'Facebook settings not found' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      tos_reviewed_at: data.tos_reviewed_at,
      tos_reviewed_by: data.tos_reviewed_by,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
