// app/api/user/line-notify/route.ts
// TASK 2.8.1 — Save per-user LINE Notify token.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getUserProfile, updateLineNotifyToken } from '@/lib/user-profile'

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile(user.id)
  return NextResponse.json({
    configured: Boolean(profile?.line_notify_token),
    status: profile?.line_notify_status ?? null,
    error: profile?.line_notify_error ?? null,
    checked_at: profile?.line_notify_checked_at ?? null,
  })
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (body === null || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const token = (body as Record<string, unknown>).token
  if (token !== null && typeof token !== 'string') {
    return NextResponse.json({ error: 'token must be a string or null' }, { status: 400 })
  }

  await updateLineNotifyToken(user.id, token)
  return NextResponse.json({ ok: true })
}
