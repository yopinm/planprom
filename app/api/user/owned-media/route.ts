import { NextRequest, NextResponse } from 'next/server'

import { createServerClient } from '@/lib/supabase/server'
import { getUserProfile, markOwnedMediaConsent } from '@/lib/user-profile'
import type { OwnedMediaChannel } from '@/lib/owned-media-consent'

function isOwnedMediaChannel(value: unknown): value is OwnedMediaChannel {
  return value === 'email' || value === 'line'
}

function parseSource(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 120) return null
  return trimmed
}

export async function GET(): Promise<NextResponse> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const profile = await getUserProfile(user.id)

  return NextResponse.json({
    email: user.email ?? null,
    email_opt_in: profile?.owned_media_email_opt_in ?? false,
    email_consented_at: profile?.owned_media_email_consented_at ?? null,
    email_source: profile?.owned_media_email_source ?? null,
    line_opt_in: profile?.owned_media_line_opt_in ?? false,
    line_consented_at: profile?.owned_media_line_consented_at ?? null,
    line_source: profile?.owned_media_line_source ?? null,
  })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
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

  const channel = (body as Record<string, unknown>).channel
  const source = parseSource((body as Record<string, unknown>).source)

  if (!isOwnedMediaChannel(channel)) {
    return NextResponse.json({ error: 'channel must be email or line' }, { status: 400 })
  }

  if (!source) {
    return NextResponse.json({ error: 'source must be a non-empty string up to 120 chars' }, { status: 400 })
  }

  await markOwnedMediaConsent(user.id, channel, source)

  return NextResponse.json({
    ok: true,
    channel,
    email: user.email ?? null,
  })
}
