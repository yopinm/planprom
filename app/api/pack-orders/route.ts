// POST /api/pack-orders — create pack order + Omise PromptPay charge
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { createPromptPayCharge } from '@/lib/omise'
import { PACKS } from '@/lib/packs'

function packOrderNumber(): string {
  const d   = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `CKP-${d}-${seq}`
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'กรุณา Login ด้วย LINE ก่อน' }, { status: 401 })

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  let body: { packId?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid body' }, { status: 400 }) }

  const pack = PACKS.find(p => p.id === body.packId)
  if (!pack) return NextResponse.json({ error: 'Pack not found' }, { status: 404 })

  const num = packOrderNumber()

  // Create Omise PromptPay charge
  let charge
  try {
    charge = await createPromptPayCharge(pack.price, {
      type:         'pack',
      order_number: num,
      pack_id:      pack.id,
    })
  } catch (err) {
    return NextResponse.json({ error: `Omise error: ${(err as Error).message}` }, { status: 502 })
  }

  const qrImageUrl = charge.source?.scannable_code?.image?.download_uri ?? ''

  const [row] = await db<{ id: string }[]>`
    INSERT INTO pack_credits
      (order_number, customer_line_id, pack_id, amount_baht, total_credits, status, omise_charge_id)
    VALUES (${num}, ${lineId}, ${pack.id}, ${pack.price}, ${pack.count}, 'pending_payment', ${charge.id})
    RETURNING id
  `

  return NextResponse.json({
    packOrderId: row.id,
    orderNumber: num,
    amount:      pack.price,
    credits:     pack.count,
    label:       pack.label,
    chargeId:    charge.id,
    qrImageUrl,
  })
}
