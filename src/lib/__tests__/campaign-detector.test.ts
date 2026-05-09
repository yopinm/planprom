import { describe, expect, it } from 'vitest'
import { detectActiveCampaign, CAMPAIGN_ADVANCE_DAYS } from '@/lib/campaign-detector'

const d = (month: number, day: number) => new Date(`2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00Z`)

describe('FB-CAMPAIGN-DETECT-1: detectActiveCampaign', () => {
  it('returns null on a plain day with no campaign near', () => {
    expect(detectActiveCampaign(d(1, 15))).toBeNull()
    expect(detectActiveCampaign(d(6, 1))).toBeNull()
  })

  it('detects 11.11 as active on November 11', () => {
    const result = detectActiveCampaign(d(11, 11))
    expect(result?.name).toBe('11.11')
    expect(result?.active).toBe(true)
    expect(result?.daysUntil).toBe(0)
  })

  it('detects 11.11 as active on last day of window (Nov 13)', () => {
    const result = detectActiveCampaign(d(11, 13))
    expect(result?.name).toBe('11.11')
    expect(result?.active).toBe(true)
  })

  it('returns null the day after a campaign window ends', () => {
    expect(detectActiveCampaign(d(11, 14))).toBeNull()
  })

  it(`alerts ${CAMPAIGN_ADVANCE_DAYS} days before campaign starts`, () => {
    // 11.11 dayStart = 10, so 3 days before = Nov 7
    const result = detectActiveCampaign(d(11, 7))
    expect(result?.name).toBe('11.11')
    expect(result?.active).toBe(false)
    expect(result?.daysUntil).toBe(3)
  })

  it('returns null 4 days before — outside advance window', () => {
    // 4 days before Nov 10 = Nov 6
    expect(detectActiveCampaign(d(11, 6))).toBeNull()
  })

  it('detects 9.9 inside its multi-day window (Sep 9)', () => {
    const result = detectActiveCampaign(d(9, 9))
    expect(result?.name).toBe('9.9')
    expect(result?.active).toBe(true)
  })

  it('detects 12.12 Year-End Sale', () => {
    const result = detectActiveCampaign(d(12, 12))
    expect(result?.name).toBe('12.12')
    expect(result?.active).toBe(true)
  })

  it('detects 6.6 Mid-Year Sale on June 6', () => {
    const result = detectActiveCampaign(d(6, 6))
    expect(result?.name).toBe('6.6')
    expect(result?.active).toBe(true)
  })
})
