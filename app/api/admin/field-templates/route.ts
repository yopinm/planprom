// GET /api/admin/field-templates  — list all custom field templates
// POST /api/admin/field-templates — create new
import { NextRequest, NextResponse } from 'next/server'
import { getAdminUser } from '@/lib/admin-auth'
import { db } from '@/lib/db'

export async function GET() {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const rows = await db<{ id: string; label: string; type: string; icon: string; grp: string; preset: object }[]>`
    SELECT id, label, type, icon, grp, preset
    FROM field_templates
    ORDER BY grp, sort_order, created_at
  `
  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: { label: string; type?: string; icon?: string; grp?: string; preset?: object }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const label = body.label?.trim()
  if (!label) return NextResponse.json({ error: 'label required' }, { status: 400 })

  const [row] = await db<{ id: string }[]>`
    INSERT INTO field_templates (label, type, icon, grp, preset)
    VALUES (
      ${label},
      ${body.type ?? 'text'},
      ${body.icon ?? '✏️'},
      ${body.grp ?? 'Custom'},
      ${JSON.stringify(body.preset ?? {})}
    )
    RETURNING id
  `
  return NextResponse.json({ id: row.id })
}
