// CROWD-COUPON-1 — unit tests for coupon vote pure helpers

import { describe, expect, it } from 'vitest'
import {
  shouldHideCoupon,
  parseVoteBody,
  DOWNVOTE_HIDE_THRESHOLD,
} from '@/lib/coupon-vote'

// ---------------------------------------------------------------------------
// shouldHideCoupon
// ---------------------------------------------------------------------------

describe('shouldHideCoupon', () => {
  it('does not hide below threshold', () => {
    expect(shouldHideCoupon(0)).toBe(false)
    expect(shouldHideCoupon(1)).toBe(false)
    expect(shouldHideCoupon(DOWNVOTE_HIDE_THRESHOLD - 1)).toBe(false)
  })

  it('hides at threshold', () => {
    expect(shouldHideCoupon(DOWNVOTE_HIDE_THRESHOLD)).toBe(true)
  })

  it('hides above threshold', () => {
    expect(shouldHideCoupon(DOWNVOTE_HIDE_THRESHOLD + 5)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// parseVoteBody — valid inputs
// ---------------------------------------------------------------------------

describe('parseVoteBody — valid', () => {
  const valid = {
    coupon_code: 'SAVE50',
    product_id:  'abc-123',
    vote:        'up',
    session_id:  'sess-xyz',
  }

  it('returns payload for a valid upvote', () => {
    const result = parseVoteBody(valid)
    expect(result).not.toBeNull()
    expect(result?.vote).toBe('up')
    expect(result?.coupon_code).toBe('SAVE50')
  })

  it('returns payload for a valid downvote', () => {
    const result = parseVoteBody({ ...valid, vote: 'down' })
    expect(result?.vote).toBe('down')
  })

  it('trims whitespace from string fields', () => {
    const result = parseVoteBody({ ...valid, coupon_code: '  SAVE50  ' })
    expect(result?.coupon_code).toBe('SAVE50')
  })
})

// ---------------------------------------------------------------------------
// parseVoteBody — invalid inputs
// ---------------------------------------------------------------------------

describe('parseVoteBody — invalid', () => {
  const valid = {
    coupon_code: 'SAVE50',
    product_id:  'abc-123',
    vote:        'up',
    session_id:  'sess-xyz',
  }

  it('returns null for non-object body', () => {
    expect(parseVoteBody(null)).toBeNull()
    expect(parseVoteBody('string')).toBeNull()
    expect(parseVoteBody(42)).toBeNull()
  })

  it('returns null for empty coupon_code', () => {
    expect(parseVoteBody({ ...valid, coupon_code: '' })).toBeNull()
  })

  it('returns null for coupon_code over 50 chars', () => {
    expect(parseVoteBody({ ...valid, coupon_code: 'A'.repeat(51) })).toBeNull()
  })

  it('returns null for empty product_id', () => {
    expect(parseVoteBody({ ...valid, product_id: '' })).toBeNull()
  })

  it('returns null for invalid vote value', () => {
    expect(parseVoteBody({ ...valid, vote: 'neutral' })).toBeNull()
    expect(parseVoteBody({ ...valid, vote: 1 })).toBeNull()
  })

  it('returns null for empty session_id', () => {
    expect(parseVoteBody({ ...valid, session_id: '' })).toBeNull()
  })

  it('returns null for session_id over 128 chars', () => {
    expect(parseVoteBody({ ...valid, session_id: 'x'.repeat(129) })).toBeNull()
  })
})
