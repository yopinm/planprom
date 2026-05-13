// DELETE /api/admin/field-templates/[id]
// PATCH  /api/admin/field-templates/[id]
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  let body: { label?: string; type?: string; icon?: string; grp?: string; preset?: object }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  await db`
    UPDATE field_templates SET
      label      = COALESCE(${body.label ?? null}, label),
      type       = COALESCE(${body.type ?? null}, type),
      icon       = COALESCE(${body.icon ?? null}, icon),
      grp        = COALESCE(${body.grp ?? null}, grp),
      preset     = COALESCE(${body.preset ? JSON.stringify(body.preset) : null}::jsonb, preset)
    WHERE id = ${id}
  `
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { id } = await params
  await db`DELETE FROM field_templates WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}
