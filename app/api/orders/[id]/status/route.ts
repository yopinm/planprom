// GET /api/orders/[id]/status — poll template order payment status
// No session auth: order ID is a UUID capability token (128-bit random, unguessable).
// Removing getUser() eliminates the token-rotation race that wiped sb-* cookies when
// concurrent poll requests all tried to refresh the same expired access token.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://couponkum.com'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const [order] = await db<{
    status: string; download_token: string | null
  }[]>`
    SELECT status, download_token
    FROM template_orders WHERE id = ${id} LIMIT 1
  `

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const downloadUrl = order.download_token ? `${SITE_URL}/d/${order.download_token}` : undefined

  return NextResponse.json({
    status:      order.status,
    downloadUrl: order.status === 'paid' ? downloadUrl : undefined,
  })
}
