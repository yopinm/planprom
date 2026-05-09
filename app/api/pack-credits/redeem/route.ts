// POST /api/pack-credits/redeem — deduct 1 credit → create paid template_order → return download URL
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { pushLine } from '@/lib/line-messaging'
import crypto from 'crypto'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'กรุณา Login ก่อน' }, { status: 401 })

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  let body: { templateSlug?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const { templateSlug } = body
  if (!templateSlug) return NextResponse.json({ error: 'templateSlug required' }, { status: 400 })

  const [tmpl] = await db<{ id: string; title: string }[]>`
    SELECT id, title FROM templates WHERE slug = ${templateSlug} AND status = 'published' LIMIT 1
  `
  if (!tmpl) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  // Find oldest pack with available credits (FIFO)
  const [pack] = await db<{
    id: string; used_credits: number; total_credits: number; order_number: string
  }[]>`
    SELECT id, used_credits, total_credits, order_number
    FROM pack_credits
    WHERE customer_line_id = ${lineId}
      AND status = 'active'
      AND used_credits < total_credits
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at ASC
    LIMIT 1
  `

  if (!pack) return NextResponse.json({ error: 'NO_CREDITS', code: 'NO_CREDITS' }, { status: 402 })

  const remaining = pack.total_credits - pack.used_credits - 1

  await db`
    UPDATE pack_credits
    SET used_credits = used_credits + 1,
        status = CASE WHEN (used_credits + 1) >= total_credits THEN 'exhausted' ELSE status END
    WHERE id = ${pack.id}
  `

  // Create template_order as paid (reuses existing download infrastructure)
  const token      = crypto.randomBytes(32).toString('hex')
  const expires    = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const orderNum   = `CKC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(Math.floor(Math.random() * 9000) + 1000)}`

  await db`
    INSERT INTO template_orders
      (order_number, template_id, customer_line_id, amount_baht, status,
       paid_at, download_token, download_expires_at, payment_method)
    VALUES (${orderNum}, ${tmpl.id}, ${lineId}, 0, 'paid',
            NOW(), ${token}, ${expires}, 'pack_credit')
  `

  const downloadUrl = `${SITE_URL}/d/${token}`

  await pushLine(lineId, [{
    type: 'text',
    text: [
      `✅ ใช้ 1 credit ดาวน์โหลดสำเร็จ!`,
      `📄 ${tmpl.title}`,
      `🔗 ${downloadUrl}`,
      `⏰ ใช้ได้ 24 ชม. · สูงสุด 3 ครั้ง`,
      `🎫 เหลือ: ${remaining} credits`,
    ].join('\n'),
  }]).catch(() => null)

  return NextResponse.json({
    status:           'ok',
    downloadUrl,
    orderNumber:      orderNum,
    creditsRemaining: remaining,
  })
}
