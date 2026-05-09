// CROWD-COUPON-1 — pure helpers for coupon vote logic (no I/O, fully testable)

export const DOWNVOTE_HIDE_THRESHOLD = 3

export type VoteValue = 'up' | 'down'

export interface VoteCounts {
  upvotes: number
  downvotes: number
}

export interface VotePayload {
  coupon_code: string
  product_id:  string
  vote:        VoteValue
  session_id:  string
}

/** Returns true when a coupon should be hidden due to too many downvotes. */
export function shouldHideCoupon(downvotes: number): boolean {
  return downvotes >= DOWNVOTE_HIDE_THRESHOLD
}

/** Validates and normalises the POST body for /api/coupon-vote. Returns null on failure. */
export function parseVoteBody(body: unknown): VotePayload | null {
  if (!body || typeof body !== 'object') return null
  const b = body as Record<string, unknown>

  const coupon_code = typeof b.coupon_code === 'string' ? b.coupon_code.trim() : ''
  const product_id  = typeof b.product_id  === 'string' ? b.product_id.trim()  : ''
  const session_id  = typeof b.session_id  === 'string' ? b.session_id.trim()  : ''
  const vote        = b.vote

  if (!coupon_code || coupon_code.length > 50)  return null
  if (!product_id  || product_id.length  > 128) return null
  if (!session_id  || session_id.length  > 128) return null
  if (vote !== 'up' && vote !== 'down')          return null

  return { coupon_code, product_id, vote, session_id }
}
