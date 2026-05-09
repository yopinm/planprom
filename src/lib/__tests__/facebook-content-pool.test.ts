import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/campaign-detector', () => ({
  detectActiveCampaign: vi.fn(() => null),
}))

vi.mock('@/lib/campaign-context', () => ({
  getCampaignContext: vi.fn(() => ({ type: 'normal', label: 'Normal day' })),
}))

import { getDayOfYear, getDailyTip, getCampaignContent } from '../facebook-content-pool'
import { detectActiveCampaign } from '@/lib/campaign-detector'
import { getCampaignContext } from '@/lib/campaign-context'

const LINE_OA = '@couponkum'

// ── getDayOfYear ─────────────────────────────────────────────────────────────

describe('getDayOfYear', () => {
  it('returns 1 for Jan 1', () => {
    expect(getDayOfYear(new Date('2026-01-01T00:00:00+07:00'))).toBe(1)
  })

  it('returns 32 for Feb 1', () => {
    expect(getDayOfYear(new Date('2026-02-01T00:00:00+07:00'))).toBe(32)
  })

  it('uses ICT timezone (UTC+7) for the boundary', () => {
    // 2026-01-01 17:00 UTC = 2026-01-02 00:00 ICT → day 2
    expect(getDayOfYear(new Date('2026-01-01T17:00:00Z'))).toBe(2)
  })
})

// ── getDailyTip ───────────────────────────────────────────────────────────────

describe('getDailyTip', () => {
  it('returns type tip', () => {
    expect(getDailyTip(1, LINE_OA).type).toBe('tip')
  })

  it('caption contains wallet link', () => {
    expect(getDailyTip(1, LINE_OA).caption).toContain('couponkum.com/wallet')
  })

  it('caption contains LINE OA link', () => {
    expect(getDailyTip(1, LINE_OA).caption).toContain(LINE_OA)
  })

  it('different days give different tips', () => {
    expect(getDailyTip(0, LINE_OA).caption).not.toBe(getDailyTip(1, LINE_OA).caption)
  })

  it('wraps around when day exceeds pool size', () => {
    // pool has 16 tips; day 16 === day 0
    expect(getDailyTip(0, LINE_OA).caption).toBe(getDailyTip(16, LINE_OA).caption)
  })
})

// ── getCampaignContent ────────────────────────────────────────────────────────

describe('getCampaignContent', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns null on a normal day', () => {
    vi.mocked(detectActiveCampaign).mockReturnValue(null)
    vi.mocked(getCampaignContext).mockReturnValue({ type: 'normal', label: 'Normal day' } as ReturnType<typeof getCampaignContext>)
    expect(getCampaignContent(new Date(), LINE_OA)).toBeNull()
  })

  it('returns campaign content when detectActiveCampaign is active', () => {
    vi.mocked(detectActiveCampaign).mockReturnValue({ active: true, label: '11.11 Sale' } as ReturnType<typeof detectActiveCampaign>)
    const result = getCampaignContent(new Date(), LINE_OA)
    expect(result?.type).toBe('campaign')
    expect(result?.caption).toContain('11.11 Sale')
    expect(result?.caption).toContain('couponkum.com/wallet')
  })

  it('returns payday campaign content near payday', () => {
    vi.mocked(detectActiveCampaign).mockReturnValue(null)
    vi.mocked(getCampaignContext).mockReturnValue({ type: 'payday', label: 'Payday 25' } as ReturnType<typeof getCampaignContext>)
    const result = getCampaignContent(new Date(), LINE_OA)
    expect(result?.type).toBe('campaign')
    expect(result?.caption).toContain('Payday 25')
    expect(result?.caption).toContain('wishlist')
  })

  it('returns double-date campaign content on 11.11', () => {
    vi.mocked(detectActiveCampaign).mockReturnValue(null)
    vi.mocked(getCampaignContext).mockReturnValue({ type: 'double_date', label: '11.11 Mega Sale' } as ReturnType<typeof getCampaignContext>)
    const result = getCampaignContent(new Date(), LINE_OA)
    expect(result?.type).toBe('campaign')
    expect(result?.caption).toContain('11.11 Mega Sale')
    expect(result?.caption).toContain('cart')
  })
})
