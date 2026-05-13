// GET|POST /api/admin/templates/[id]/unlock-code — J13 unlock code management
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'
import { randomBytes } from 'crypto'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [row] = await db<Array<{ code: string; expires_at: string; used_count: number; max_uses: number }>>`
    SELECT code, expires_at, used_count, max_uses
    FROM promo_codes
    WHERE template_id = ${id}
      AND is_active = true
      AND expires_at > NOW()
      AND used_count < max_uses
    ORDER BY created_at DESC
    LIMIT 1
  `
  if (!row) return NextResponse.json({ code: null })
  return NextResponse.json({ code: row.code, expiresAt: row.expires_at })
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [t] = await db<Array<{ id: string }>>`
    SELECT id FROM templates WHERE id = ${id} AND is_request_only = true AND status = 'published' LIMIT 1
  `
  if (!t) return NextResponse.json({ error: 'template not found or not request-only' }, { status: 404 })

  // Deactivate any existing active unlock codes for this template
  await db`
    UPDATE promo_codes SET is_active = false
    WHERE template_id = ${id} AND is_active = true
  `

  const suffix = randomBytes(3).toString('hex').toUpperCase()
  const code   = `REQ-${suffix}`

  await db`
    INSERT INTO promo_codes
      (code, label, discount_type, discount_value, min_cart_value, max_uses, starts_at, expires_at, is_active, template_id)
    VALUES (
      ${code},
      ${'Unlock Code — ' + id.slice(0, 8)},
      'fixed', 0, 0, 1,
      NOW(), NOW() + INTERVAL '30 days',
      true, ${id}
    )
  `
  return NextResponse.json({ code })
}
