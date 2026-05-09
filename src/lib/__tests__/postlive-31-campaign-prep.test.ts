// POSTLIVE-31: campaign-prep utility tests

import { describe, expect, it } from 'vitest'
import { getNextDoubleDateCampaign } from '@/lib/campaign-prep'

describe('getNextDoubleDateCampaign — POSTLIVE-31', () => {
  it('returns null when no campaign is within 10 days', () => {
    // 2026-01-10: no double date in next 10 days (1/1 already passed, 2/2 is 23 days away)
    const result = getNextDoubleDateCampaign(new Date('2026-01-10'), 10)
    expect(result).toBeNull()
  })

  it('detects 5/5 within 10-day window', () => {
    // 2026-04-28: 5/5 is 7 days away
    const result = getNextDoubleDateCampaign(new Date('2026-04-28'), 10)
    expect(result).not.toBeNull()
    expect(result?.mmdd).toBe('0505')
    expect(result?.subId).toBe('campaign_prep_0505')
    expect(result?.label).toBe('05.05')
    expect(result?.daysUntil).toBe(7)
  })

  it('detects 11/11 within 10-day window', () => {
    // 2026-11-05: 11/11 is 6 days away
    const result = getNextDoubleDateCampaign(new Date('2026-11-05'), 10)
    expect(result).not.toBeNull()
    expect(result?.mmdd).toBe('1111')
    expect(result?.subId).toBe('campaign_prep_1111')
    expect(result?.daysUntil).toBe(6)
  })

  it('returns null on the day itself (diff === 0)', () => {
    // On 9/9 the campaign day has arrived — pre-drop window is closed
    const result = getNextDoubleDateCampaign(new Date('2026-09-09'), 10)
    expect(result).toBeNull()
  })

  it('detects 1/1 next year at end of December', () => {
    // 2026-12-27: 1/1/2027 is 5 days away
    const result = getNextDoubleDateCampaign(new Date('2026-12-27'), 10)
    expect(result).not.toBeNull()
    expect(result?.mmdd).toBe('0101')
    expect(result?.subId).toBe('campaign_prep_0101')
    expect(result?.daysUntil).toBe(5)
  })

  it('respects custom windowDays parameter', () => {
    // 2026-04-20: 5/5 is 15 days away — outside default 10-day window
    expect(getNextDoubleDateCampaign(new Date('2026-04-20'), 10)).toBeNull()
    // But within a 20-day window
    const result = getNextDoubleDateCampaign(new Date('2026-04-20'), 20)
    expect(result).not.toBeNull()
    expect(result?.mmdd).toBe('0505')
  })
})
