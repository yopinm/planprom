// GET /api/pack-credits/balance — available credits for logged-in user
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ available: 0 })

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  const [row] = await db<{ available: string }[]>`
    SELECT COALESCE(SUM(total_credits - used_credits), 0) AS available
    FROM pack_credits
    WHERE customer_line_id = ${lineId}
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  `

  return NextResponse.json({ available: Number(row?.available ?? 0) })
}
