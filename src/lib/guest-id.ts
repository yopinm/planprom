// WALLET-GUEST-1: Guest ID (Shadow Account) infrastructure
// ck_guest_id = stable UUID cookie (90 days, not httpOnly so JS can read it).
// When user subscribes via LINE, the cookie value is mapped to line_uid
// in line_subscribers so future LINE deep-link returns can personalize content.

export const GUEST_COOKIE = 'ck_guest_id'
export const GUEST_COOKIE_MAX_AGE = 90 * 24 * 60 * 60 // 90 days in seconds

// Prefix embedded in the LINE subscribe message so the webhook can extract it.
// Format sent by user: "คูปอง gid:{uuid}"
export const GUEST_LINE_PREFIX = 'gid:'

export function generateGuestId(): string {
  return crypto.randomUUID()
}

/**
 * Reads ck_guest_id from a plain cookie string (e.g. document.cookie or
 * the Cookie header value). Returns null if not found.
 */
export function parseGuestIdFromCookieString(cookieStr: string): string | null {
  const match = cookieStr.match(new RegExp(`(?:^|;\\s*)${GUEST_COOKIE}=([^;]+)`))
  return match ? match[1] : null
}

/**
 * Builds the LINE add-friend deep-link. Uses ti/p/ format which works
 * reliably on both mobile and desktop LINE. The guestId is carried as a
 * query param (?gid=) so the follow-event webhook can map line_uid → guest_id.
 * lineOaId should include the @ prefix (e.g. "@216xobzv").
 */
export function buildLineSubscribeUrl(lineOaId: string, guestId: string): string {
  const encoded = lineOaId.startsWith('@') ? '%40' + lineOaId.slice(1) : lineOaId
  return `https://line.me/R/ti/p/${encoded}?gid=${guestId}`
}
