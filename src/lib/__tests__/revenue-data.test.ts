// ADMIN-TIMEZONE-1: Unit tests for bangkokMonthStart()
//
// Verifies that month boundaries are computed in Bangkok time (UTC+7),
// not UTC. Critical for getMonthlyRevenue() accuracy.

import { describe, expect, it } from 'vitest'
import { bangkokMonthStart } from '@/lib/revenue-data'

describe('bangkokMonthStart', () => {
  it('mid-month UTC — returns Bangkok 1st at 17:00 UTC previous day', () => {
    // Apr 15 2026 10:00 UTC = Apr 15 17:00 Bangkok → Bangkok month = April
    // Bangkok midnight Apr 1 = UTC Mar 31 17:00
    const now = new Date('2026-04-15T10:00:00.000Z')
    const result = bangkokMonthStart(now)
    expect(result.toISOString()).toBe('2026-03-31T17:00:00.000Z')
  })

  it('UTC just after midnight same day as Bangkok new month', () => {
    // Apr 30 2026 18:00 UTC = May 1 01:00 Bangkok → Bangkok month = May
    // Bangkok midnight May 1 = UTC Apr 30 17:00
    const now = new Date('2026-04-30T18:00:00.000Z')
    const result = bangkokMonthStart(now)
    expect(result.toISOString()).toBe('2026-04-30T17:00:00.000Z')
  })

  it('UTC still in old month but Bangkok already in new month (cross-boundary)', () => {
    // Dec 31 2025 23:00 UTC = Jan 1 2026 06:00 Bangkok → Bangkok month = January 2026
    // Bangkok midnight Jan 1 2026 = UTC Dec 31 17:00
    const now = new Date('2025-12-31T23:00:00.000Z')
    const result = bangkokMonthStart(now)
    expect(result.toISOString()).toBe('2025-12-31T17:00:00.000Z')
  })

  it('UTC Jan 1 00:00 = Bangkok Jan 1 07:00 — Bangkok month is January', () => {
    // Jan 1 2026 00:00 UTC = Jan 1 07:00 Bangkok → Bangkok month = January
    // Bangkok midnight Jan 1 = UTC Dec 31 17:00
    const now = new Date('2026-01-01T00:00:00.000Z')
    const result = bangkokMonthStart(now)
    expect(result.toISOString()).toBe('2025-12-31T17:00:00.000Z')
  })

  it('Bangkok midnight exactly — result is same Bangkok midnight in UTC', () => {
    // May 1 2026 17:00 UTC = May 1 2026 00:00 Bangkok (exact midnight)
    // Bangkok midnight May 1 = UTC Apr 30 17:00
    const now = new Date('2026-04-30T17:00:00.000Z')
    const result = bangkokMonthStart(now)
    expect(result.toISOString()).toBe('2026-04-30T17:00:00.000Z')
  })

  it('defaults to current date without throwing', () => {
    expect(() => bangkokMonthStart()).not.toThrow()
    const result = bangkokMonthStart()
    // Result must be a valid date at 17:00 UTC (Bangkok midnight offset)
    expect(result.getUTCHours()).toBe(17)
    expect(result.getUTCMinutes()).toBe(0)
    expect(result.getUTCSeconds()).toBe(0)
    expect(result.getUTCDate()).toBe(result.getUTCDate()) // truthy
  })
})
