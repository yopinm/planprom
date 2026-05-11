// POST /api/free-download — create a free download token for tier='free' templates
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { templateId?: string }
  const { templateId } = body

  if (!templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 })

  const [tmpl] = await db<{ id: string; tier: string; status: string }[]>`
    SELECT id, tier, status FROM templates WHERE id = ${templateId} LIMIT 1
  `
  if (!tmpl) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (tmpl.tier !== 'free') return NextResponse.json({ error: 'Not a free template' }, { status: 403 })
  if (tmpl.status !== 'published') return NextResponse.json({ error: 'Not available' }, { status: 403 })

  const token      = crypto.randomUUID()
  const orderNumber = `FREE-${Date.now()}`
  const expiresAt  = new Date(Date.now() + 72 * 60 * 60 * 1000)

  await db`
    INSERT INTO template_orders
      (template_id, order_number, amount_baht, status, payment_method,
       download_token, download_expires_at)
    VALUES
      (${templateId}, ${orderNumber}, 0, 'paid', 'free',
       ${token}, ${expiresAt})
  `

  return NextResponse.json({ token })
}
