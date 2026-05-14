// Analytics Pipeline — browser-side helper — TASK 5.2
//
// One-liner fire-and-forget tracker for client components.
// Never throws — analytics must be silent.
//
// Usage:
//   import { track } from '@/lib/analytics-client'
//   track('coupon_copy', { coupon_code: 'SAVE50', platform: 'shopee' })

import type { AnalyticsEventName } from '@/lib/analytics'

export function track(
  event: AnalyticsEventName,
  properties: Record<string, unknown> = {},
): void {
  if (typeof window === 'undefined') return

  // generate session_id once per tab (sessionStorage clears on tab close)
  let sid = sessionStorage.getItem('ck_session')
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('ck_session', sid)
  }

  const payload = {
    event,
    properties,
    path:       window.location.pathname,
    referrer:   document.referrer || null,
    session_id: sid,
  }

  // Fire-and-forget — no await, no error surfaced
  void fetch('/api/analytics/event', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
    // keepalive allows the request to outlive the page
    keepalive: true,
  }).catch(() => undefined)
}
