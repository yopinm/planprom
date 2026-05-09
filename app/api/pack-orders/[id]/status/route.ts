// GET /api/pack-orders/[id]/status — poll pack order payment status
// No session auth: pack credit ID is a UUID capability token (128-bit random, unguessable).
// Removing getUser() eliminates the token-rotation race that wiped sb-* cookies when
// concurrent poll requests all tried to refresh the same expired access token.
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const [row] = await db<{
    status: string; total_credits: number; used_credits: number
  }[]>`
    SELECT status, total_credits, used_credits
    FROM pack_credits WHERE id = ${id} LIMIT 1
  `

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    status:    row.status,
    available: row.status === 'active' ? (row.total_credits - row.used_credits) : 0,
  })
}
