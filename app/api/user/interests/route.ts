// app/api/user/interests/route.ts
// TASK 2.3: Save a search interest to the logged-in user's profile
//
// POST /api/user/interests
// Body: { interest: string }
// Auth: session cookie (Supabase SSR)

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { upsertUserInterest } from '@/lib/user-profile'

export async function POST(request: NextRequest) {
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

  const interest =
    body !== null && typeof body === 'object' && 'interest' in body
      ? (body as { interest: unknown }).interest
      : undefined

  if (typeof interest !== 'string' || interest.trim().length === 0) {
    return NextResponse.json({ error: 'interest must be a non-empty string' }, { status: 400 })
  }

  await upsertUserInterest(user.id, interest)
  return NextResponse.json({ ok: true })
}
