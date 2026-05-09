// POST /api/checkout/[orderUid]/refresh-qr — create new Omise charge when QR expires
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createPromptPayCharge } from '@/lib/omise'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ orderUid: string }> },
) {
  const { orderUid } = await params

  const [order] = await db<{ id: string; status: string; total_baht: number }[]>`
    SELECT id, status, total_baht FROM orders WHERE order_uid = ${orderUid} LIMIT 1
  `
  if (!order) return NextResponse.json({ error: 'not found' }, { status: 404 })
  if (order.status !== 'pending_payment') {
    return NextResponse.json({ error: `order status: ${order.status}` }, { status: 400 })
  }

  let charge
  try {
    charge = await createPromptPayCharge(order.total_baht, { type: 'cart', order_uid: orderUid })
  } catch (err) {
    return NextResponse.json({ error: `Omise error: ${(err as Error).message}` }, { status: 502 })
  }

  await db`UPDATE orders SET omise_charge_id = ${charge.id} WHERE id = ${order.id}`

  const qrImageUrl = charge.source?.scannable_code?.image?.download_uri ?? ''
  return NextResponse.json({ qrImageUrl })
}
