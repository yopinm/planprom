// WALLET-ALGO-1 — Campaign multiplier unit tests

import { describe, expect, it } from 'vitest'
import { getCampaignMultiplier } from '@/app/api/cron/daily-featured/route'

const d = (month: number, day: number) => new Date(2026, month - 1, day)

describe('getCampaignMultiplier', () => {
  it('returns 2.0 on mega-campaign active day (9.9 window day 8)', () => {
    expect(getCampaignMultiplier(d(9, 8))).toBe(2.0)
  })

  it('returns 2.0 on 11.11 window (day 10 Nov)', () => {
    expect(getCampaignMultiplier(d(11, 10))).toBe(2.0)
  })

  it('returns 2.0 on double_date when no mega-campaign (e.g. 3/3)', () => {
    // 3.3 window is dayStart=3, so this is also mega-campaign — use 7/7 instead
    expect(getCampaignMultiplier(d(7, 7))).toBe(2.0)
  })

  it('returns 2.0 on 5/5 (both double_date and 5.5 mega-campaign)', () => {
    expect(getCampaignMultiplier(d(5, 5))).toBe(2.0)
  })

  it('returns 1.5 on payday (day 25)', () => {
    expect(getCampaignMultiplier(d(4, 25))).toBe(1.5)
  })

  it('returns 1.5 on payday (day 31)', () => {
    expect(getCampaignMultiplier(d(1, 31))).toBe(1.5)
  })

  it('returns 1.05 on month_start (day 3)', () => {
    expect(getCampaignMultiplier(d(4, 3))).toBe(1.05)
  })

  it('returns 1.0 on normal day (day 15, not a campaign)', () => {
    expect(getCampaignMultiplier(d(4, 15))).toBe(1.0)
  })

  it('returns 1.0 on day 24 (not yet payday, no campaign)', () => {
    expect(getCampaignMultiplier(d(4, 24))).toBe(1.0)
  })

  it('mega-campaign takes priority over payday (day 25 of a campaign month)', () => {
    // 11.11 window: Nov 10–13 — day 25 Nov is payday but not in window → 1.5
    expect(getCampaignMultiplier(d(11, 25))).toBe(1.5)
  })
})
