// Analytics Pipeline — server-side event logger — TASK 5.2
//
// Event map:
//   page_view         → any route (path + referrer)
//   intermediate_view → /go/[id] page opened (product_id, sub_id, platform)
//   intermediate_continue → user proceeds from /go/[id] to /api/r
//   coupon_copy       → user copies a coupon code (coupon_code, product_id, platform)
//
// Specialised events use dedicated tables and are NOT logged here:
//   search activity   → search_logs  (via search pipeline)
//   affiliate clicks  → click_logs   (via /api/r)
//   S2S conversions   → revenue_tracking (via /api/postback/*)
//
// All writes are fire-and-forget — never block the response.

import { createHash } from 'crypto'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnalyticsEventName =
  | 'page_view'
  | 'intermediate_view'
  | 'intermediate_continue'
  | 'link_health_fallback'
  | 'control_blocked'
  | 'coupon_copy'
  | 'coupon_reveal'
  | 'search_fallback_click'
  | 'cta_impression'
  | 'cta_click'

export interface AnalyticsEventPayload {
  event_name:  AnalyticsEventName
  properties:  Record<string, unknown>
  session_id?: string | null
  path?:       string | null
  referrer?:   string | null
  user_agent?: string | null
  ip?:         string | null
}

type DbJsonValue = Parameters<typeof db.json>[0]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

// ---------------------------------------------------------------------------
// Server-side logger (fire-and-forget)
// ---------------------------------------------------------------------------

export function logAnalyticsEvent(payload: AnalyticsEventPayload): void {
  void (async () => {
    try {
      await db`
        INSERT INTO analytics_events (
          event_name,
          properties,
          session_id,
          path,
          referrer,
          user_agent,
          ip_hash
        )
        VALUES (
          ${payload.event_name},
          ${db.json(payload.properties as DbJsonValue)},
          ${payload.session_id ?? null},
          ${payload.path ?? null},
          ${payload.referrer ?? null},
          ${payload.user_agent ?? null},
          ${hashIp(payload.ip)}
        )
      `
    } catch {
      // Analytics must never break the page
    }
  })()
}
