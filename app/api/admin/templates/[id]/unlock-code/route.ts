// POST /api/admin/templates/[id]/unlock-code — J13 generate 1-time unlock code
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminUser } from '@/lib/admin-auth'
import { randomBytes } from 'crypto'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser()
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const [t] = await db<Array<{ id: string }>>`
    SELECT id FROM templates WHERE id = ${id} AND is_request_only = true AND status = 'published' LIMIT 1
  `
  if (!t) return NextResponse.json({ error: 'template not found or not request-only' }, { status: 404 })

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
