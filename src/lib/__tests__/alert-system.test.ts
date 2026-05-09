// src/lib/__tests__/alert-system.test.ts
// TASK 2.8 — Alert System unit tests
//
// Tests pure logic functions only (no Supabase):
//   isInCooldown, shouldTriggerByPrice, checkAlertShouldFire

import { describe, it, expect } from 'vitest'
import {
  isInCooldown,
  shouldTriggerByPrice,
  checkAlertShouldFire,
  checkRareItemAlertShouldFire,
  canSendLineNotify,
  LINE_NOTIFY_LIMIT_PER_HOUR,
} from '@/lib/alert-system'
import type { Alert } from '@/types'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id:                 'alert-1',
    user_ref:           'user-1',
    product_id:         'product-1',
    target_price:       100,
    rare_score_threshold: null,
    alert_type:         'target_deal',
    channel:            'email',
    is_active:          true,
    last_triggered_at:  null,
    cooldown_minutes:   60,
    created_at:         new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// isInCooldown
// ---------------------------------------------------------------------------

describe('isInCooldown', () => {
  it('returns false when last_triggered_at is null (never triggered)', () => {
    const alert = makeAlert({ last_triggered_at: null })
    expect(isInCooldown(alert)).toBe(false)
  })

  it('returns true when triggered 10 min ago with 60 min cooldown', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString()
    const alert = makeAlert({ last_triggered_at: tenMinAgo, cooldown_minutes: 60 })
    expect(isInCooldown(alert)).toBe(true)
  })

  it('returns false when triggered 90 min ago with 60 min cooldown', () => {
    const ninetyMinAgo = new Date(Date.now() - 90 * 60_000).toISOString()
    const alert = makeAlert({ last_triggered_at: ninetyMinAgo, cooldown_minutes: 60 })
    expect(isInCooldown(alert)).toBe(false)
  })

  it('returns true exactly at the cooldown boundary (1 ms before expiry)', () => {
    const justNow = new Date(Date.now() - 59 * 60_000 - 59_000).toISOString()
    const alert = makeAlert({ last_triggered_at: justNow, cooldown_minutes: 60 })
    expect(isInCooldown(alert)).toBe(true)
  })

  it('returns false when cooldown_minutes is 0', () => {
    const justNow = new Date().toISOString()
    const alert = makeAlert({ last_triggered_at: justNow, cooldown_minutes: 0 })
    expect(isInCooldown(alert)).toBe(false)
  })
})

describe('checkRareItemAlertShouldFire', () => {
  it('fires when candidate is rare and meets threshold', () => {
    const alert = makeAlert({
      alert_type: 'rare_item',
      channel: 'line_notify',
      rare_score_threshold: 75,
    })
    const result = checkRareItemAlertShouldFire({
      alert,
      candidate: { product_id: 'product-1', final_score: 82, badge: 'rare' },
    })
    expect(result.fire).toBe(true)
  })

  it('skips when candidate is below threshold', () => {
    const alert = makeAlert({
      alert_type: 'rare_item',
      channel: 'line_notify',
      rare_score_threshold: 90,
    })
    const result = checkRareItemAlertShouldFire({
      alert,
      candidate: { product_id: 'product-1', final_score: 82, badge: 'rare' },
    })
    expect(result.fire).toBe(false)
    if (!result.fire) expect(result.reason).toBe('skipped_not_rare')
  })

  it('skips non-rare candidates', () => {
    const alert = makeAlert({
      alert_type: 'rare_item',
      channel: 'line_notify',
      rare_score_threshold: 50,
    })
    const result = checkRareItemAlertShouldFire({
      alert,
      candidate: { product_id: 'product-1', final_score: 88, badge: 'low_stock' },
    })
    expect(result.fire).toBe(false)
    if (!result.fire) expect(result.reason).toBe('skipped_not_rare')
  })
})

describe('canSendLineNotify', () => {
  it('allows up to LINE_NOTIFY_LIMIT_PER_HOUR sends in the same window', () => {
    const token = `test-token-${Date.now()}`
    const now = Date.now()
    for (let i = 0; i < LINE_NOTIFY_LIMIT_PER_HOUR; i++) {
      expect(canSendLineNotify(token, now)).toBe(true)
    }
    expect(canSendLineNotify(token, now)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// shouldTriggerByPrice
// ---------------------------------------------------------------------------

describe('shouldTriggerByPrice — target_deal', () => {
  it('triggers when current price equals target_price', () => {
    const alert = makeAlert({ alert_type: 'target_deal', target_price: 100 })
    expect(shouldTriggerByPrice(alert, 100)).toBe(true)
  })

  it('triggers when current price is below target_price', () => {
    const alert = makeAlert({ alert_type: 'target_deal', target_price: 100 })
    expect(shouldTriggerByPrice(alert, 89.99)).toBe(true)
  })

  it('does not trigger when current price is above target_price', () => {
    const alert = makeAlert({ alert_type: 'target_deal', target_price: 100 })
    expect(shouldTriggerByPrice(alert, 101)).toBe(false)
  })

  it('does not trigger when target_price is null', () => {
    const alert = makeAlert({ alert_type: 'target_deal', target_price: null })
    expect(shouldTriggerByPrice(alert, 50)).toBe(false)
  })
})

describe('shouldTriggerByPrice — price_drop', () => {
  it('always returns true (caller checks vs moving avg)', () => {
    const alert = makeAlert({ alert_type: 'price_drop', target_price: null })
    expect(shouldTriggerByPrice(alert, 999)).toBe(true)
  })
})

describe('shouldTriggerByPrice — coupon_expiry', () => {
  it('always returns true (not price-based)', () => {
    const alert = makeAlert({ alert_type: 'coupon_expiry', target_price: null })
    expect(shouldTriggerByPrice(alert, 0)).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// checkAlertShouldFire — combined logic
// ---------------------------------------------------------------------------

describe('checkAlertShouldFire', () => {
  it('fires when alert is active, not in cooldown, and price is at target', () => {
    const alert = makeAlert({
      is_active:        true,
      last_triggered_at: null,
      alert_type:       'target_deal',
      target_price:     100,
    })
    const result = checkAlertShouldFire(alert, 99)
    expect(result.fire).toBe(true)
  })

  it('skips with skipped_disabled when is_active is false', () => {
    const alert = makeAlert({ is_active: false })
    const result = checkAlertShouldFire(alert, 50)
    expect(result.fire).toBe(false)
    if (!result.fire) expect(result.reason).toBe('skipped_disabled')
  })

  it('skips with skipped_cooldown when in cooldown', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const alert = makeAlert({
      is_active:         true,
      last_triggered_at: fiveMinAgo,
      cooldown_minutes:  60,
    })
    const result = checkAlertShouldFire(alert, 50)
    expect(result.fire).toBe(false)
    if (!result.fire) expect(result.reason).toBe('skipped_cooldown')
  })

  it('skips when price is not at target (target_deal)', () => {
    const alert = makeAlert({
      is_active:        true,
      last_triggered_at: null,
      alert_type:       'target_deal',
      target_price:     100,
    })
    const result = checkAlertShouldFire(alert, 150)
    expect(result.fire).toBe(false)
  })

  it('disabled alert takes priority over cooldown check', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60_000).toISOString()
    const alert = makeAlert({
      is_active:         false,
      last_triggered_at: fiveMinAgo,
      cooldown_minutes:  60,
    })
    const result = checkAlertShouldFire(alert, 50)
    expect(result.fire).toBe(false)
    if (!result.fire) expect(result.reason).toBe('skipped_disabled')
  })

  it('fires for price_drop when active and no cooldown', () => {
    const alert = makeAlert({
      is_active:         true,
      last_triggered_at: null,
      alert_type:        'price_drop',
      target_price:      null,
    })
    const result = checkAlertShouldFire(alert, 200)
    expect(result.fire).toBe(true)
  })

  it('fires after cooldown expires', () => {
    const twoHoursAgo = new Date(Date.now() - 120 * 60_000).toISOString()
    const alert = makeAlert({
      is_active:         true,
      last_triggered_at: twoHoursAgo,
      cooldown_minutes:  60,
      alert_type:        'target_deal',
      target_price:      100,
    })
    const result = checkAlertShouldFire(alert, 90)
    expect(result.fire).toBe(true)
  })
})
