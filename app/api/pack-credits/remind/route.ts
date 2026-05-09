// POST /api/pack-credits/remind — set LINE reminder for tomorrow 09:00 ICT
import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function POST() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  // Check still has credits
  const [bal] = await db<{ available: string }[]>`
    SELECT COALESCE(SUM(total_credits - used_credits), 0) AS available
    FROM pack_credits
    WHERE customer_line_id = ${lineId}
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  `
  if (Number(bal?.available ?? 0) === 0) {
    return NextResponse.json({ error: 'NO_CREDITS' }, { status: 400 })
  }

  // Tomorrow 09:00 ICT (UTC+7) = 02:00 UTC
  const now    = new Date()
  const remindAt = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    2, 0, 0, 0  // 09:00 ICT
  ))

  await db`
    INSERT INTO credit_reminders (customer_line_id, remind_at, sent_at)
    VALUES (${lineId}, ${remindAt}, NULL)
    ON CONFLICT (customer_line_id)
    DO UPDATE SET remind_at = EXCLUDED.remind_at, sent_at = NULL
  `

  return NextResponse.json({ ok: true, remind_at: remindAt.toISOString() })
}

// GET — check if reminder is already set
export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ set: false })

  const lineId: string =
    (user.user_metadata?.provider_id as string) ??
    (user.identities?.find(i => i.provider.includes('line'))?.id ?? user.id)

  const [row] = await db<{ remind_at: string; sent_at: string | null }[]>`
    SELECT remind_at, sent_at FROM credit_reminders
    WHERE customer_line_id = ${lineId} AND sent_at IS NULL
    LIMIT 1
  `

  return NextResponse.json({ set: !!row, remind_at: row?.remind_at ?? null })
}
