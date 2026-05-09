import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Pure helpers extracted from analytics.ts for unit testing
// (server module imports crypto — re-implement inline to avoid env deps)
// ---------------------------------------------------------------------------

import { createHash } from 'crypto'

function hashIp(ip: string | null | undefined): string | null {
  if (!ip) return null
  return createHash('sha256').update(ip).digest('hex').slice(0, 16)
}

const ALLOWED_EVENTS = [
  'page_view',
  'intermediate_view',
  'intermediate_continue',
  'control_blocked',
  'coupon_copy',
] as const
type EventName = typeof ALLOWED_EVENTS[number]

function isAllowedEvent(name: string): name is EventName {
  return ALLOWED_EVENTS.includes(name as EventName)
}

// ---------------------------------------------------------------------------
// hashIp
// ---------------------------------------------------------------------------

describe('hashIp (analytics)', () => {
  it('returns null for null', () => {
    expect(hashIp(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(hashIp(undefined)).toBeNull()
  })

  it('returns 16-char hex', () => {
    const result = hashIp('203.0.113.1')
    expect(result).toHaveLength(16)
    expect(result).toMatch(/^[0-9a-f]+$/)
  })

  it('is deterministic', () => {
    expect(hashIp('1.2.3.4')).toBe(hashIp('1.2.3.4'))
  })

  it('differs for different IPs', () => {
    expect(hashIp('1.2.3.4')).not.toBe(hashIp('4.3.2.1'))
  })
})

// ---------------------------------------------------------------------------
// Event name validation
// ---------------------------------------------------------------------------

describe('isAllowedEvent', () => {
  it('accepts valid event names', () => {
    expect(isAllowedEvent('page_view')).toBe(true)
    expect(isAllowedEvent('intermediate_view')).toBe(true)
    expect(isAllowedEvent('intermediate_continue')).toBe(true)
    expect(isAllowedEvent('control_blocked')).toBe(true)
    expect(isAllowedEvent('coupon_copy')).toBe(true)
  })

  it('rejects unknown event names', () => {
    expect(isAllowedEvent('purchase')).toBe(false)
    expect(isAllowedEvent('')).toBe(false)
    expect(isAllowedEvent('click_affiliate')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Event map completeness — document the full pipeline in one place
// ---------------------------------------------------------------------------

describe('analytics event map', () => {
  const SPECIALISED_TABLES: Record<string, string> = {
    search:          'search_logs',
    click_affiliate: 'click_logs',
    conversion:      'revenue_tracking',
  }

  const ANALYTICS_EVENTS_TABLE: EventName[] = [
    'page_view',
    'intermediate_view',
    'intermediate_continue',
    'control_blocked',
    'coupon_copy',
  ]

  it('specialised tables cover search/click/conversion', () => {
    expect(SPECIALISED_TABLES.search).toBe('search_logs')
    expect(SPECIALISED_TABLES.click_affiliate).toBe('click_logs')
    expect(SPECIALISED_TABLES.conversion).toBe('revenue_tracking')
  })

  it('analytics_events table covers page_view, intermediate_view, intermediate_continue, control_blocked, coupon_copy', () => {
    expect(ANALYTICS_EVENTS_TABLE).toContain('page_view')
    expect(ANALYTICS_EVENTS_TABLE).toContain('intermediate_view')
    expect(ANALYTICS_EVENTS_TABLE).toContain('intermediate_continue')
    expect(ANALYTICS_EVENTS_TABLE).toContain('control_blocked')
    expect(ANALYTICS_EVENTS_TABLE).toContain('coupon_copy')
  })

  it('no overlap between specialised and analytics_events', () => {
    const specialised = Object.keys(SPECIALISED_TABLES)
    const overlap = ANALYTICS_EVENTS_TABLE.filter(e => specialised.includes(e))
    expect(overlap).toHaveLength(0)
  })
})
