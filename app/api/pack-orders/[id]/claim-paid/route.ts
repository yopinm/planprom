// POST /api/pack-orders/[id]/claim-paid — activate pack credits (trust-based)
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { pushLine } from '@/lib/line-messaging'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  const [row] = await db<{
    id: string; order_number: string; customer_line_id: string
    amount_baht: number; total_credits: number; status: string
  }[]>`
    SELECT id, order_number, customer_line_id, amount_baht, total_credits, status
    FROM pack_credits WHERE id = ${id} LIMIT 1
  `

  if (!row) return NextResponse.json({ error: 'Pack order not found' }, { status: 404 })
  if (row.customer_line_id !== lineId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (row.status !== 'pending_payment') return NextResponse.json({ error: `Status: ${row.status}` }, { status: 400 })

  const expires = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

  await db`
    UPDATE pack_credits SET
      status     = 'active',
      claimed_at = NOW(),
      expires_at = ${expires}
    WHERE id = ${id}
  `

  await pushLine(lineId, [{
    type: 'text',
    text: [
      `✅ ได้รับแพ็กเครดิตแล้ว — คูปองคุ้ม!`,
      ``,
      `🎫 ${row.total_credits} credits พร้อมใช้`,
      `📌 เลข order: ${row.order_number}`,
      `⏰ หมดอายุ: ${expires.toLocaleDateString('th-TH')}`,
      ``,
      `ไปเลือก Template ได้เลย:`,
      `${SITE_URL}/templates`,
    ].join('\n'),
  }]).catch(() => null)

  const ownerLineId = process.env.OWNER_LINE_USER_ID
  if (ownerLineId) {
    await pushLine(ownerLineId, [{
      type: 'text',
      text: [
        `🛒 Pack Order ใหม่ — คูปองคุ้ม`,
        `💰 ฿${row.amount_baht} (${row.total_credits} credits)`,
        `📌 ${row.order_number}`,
        `👤 LINE: ${lineId.slice(0, 8)}…`,
      ].join('\n'),
    }]).catch(() => null)
  }

  return NextResponse.json({
    status:      'active',
    credits:     row.total_credits,
    expiresAt:   expires.toISOString(),
    orderNumber: row.order_number,
  })
}
