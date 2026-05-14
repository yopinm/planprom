import { type NextRequest, NextResponse } from 'next/server'
import { logAnalyticsEvent } from '@/lib/analytics'
import type { AnalyticsEventName } from '@/lib/analytics'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      event:       AnalyticsEventName
      properties?: Record<string, unknown>
      path?:       string | null
      referrer?:   string | null
      session_id?: string | null
    }

    if (!body.event) return NextResponse.json({ ok: false }, { status: 400 })

    logAnalyticsEvent({
      event_name: body.event,
      properties: body.properties ?? {},
      session_id: body.session_id ?? null,
      path:       body.path ?? null,
      referrer:   body.referrer ?? null,
      user_agent: req.headers.get('user-agent'),
      ip:         req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
                  ?? req.headers.get('x-real-ip'),
    })
  } catch {
    // silent — analytics must never break the page
  }

  return NextResponse.json({ ok: true })
}
