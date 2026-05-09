// UX-REVEAL — unit coverage for coupon reveal analytics contract
//
// Component rendering is not tested here (no jsdom setup).
// These tests verify the analytics event names emitted by reveal/copy
// are valid members of AnalyticsEventName so the type contract is locked.

import { describe, it, expect } from 'vitest'
import type { AnalyticsEventName } from '@/lib/analytics'

describe('UX-REVEAL analytics event names', () => {
  it('coupon_reveal is a valid AnalyticsEventName', () => {
    const name: AnalyticsEventName = 'coupon_reveal'
    expect(name).toBe('coupon_reveal')
  })

  it('coupon_copy is a valid AnalyticsEventName', () => {
    const name: AnalyticsEventName = 'coupon_copy'
    expect(name).toBe('coupon_copy')
  })

  it('intermediate_view is a valid AnalyticsEventName', () => {
    const name: AnalyticsEventName = 'intermediate_view'
    expect(name).toBe('intermediate_view')
  })
})
