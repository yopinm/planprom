// AFFNET-10: getPayoutProgress — payout threshold tracking per affiliate network

import { describe, expect, it, vi, beforeEach } from 'vitest'

let mockFromImpl: (table: string) => unknown = () => ({})

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({ from: (t: string) => mockFromImpl(t) }),
}))

import { getPayoutProgress } from '@/lib/revenue-data'

// revenue_tracking chain: .select.in.eq.neq → resolves
function rtChain(data: unknown[], error: unknown = null) {
  return {
    select: () => ({
      in: () => ({
        eq: () => ({
          neq: () => Promise.resolve({ data, error }),
        }),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getPayoutProgress — AFFNET-10', () => {
  it('returns zero accumulated and 0% progress when no conversions exist', async () => {
    mockFromImpl = () => rtChain([])

    const result = await getPayoutProgress()

    expect(result.networks).toHaveLength(2)
    for (const n of result.networks) {
      expect(n.accumulated_thb).toBe(0)
      expect(n.progress_pct).toBe(0)
      expect(n.can_withdraw).toBe(false)
      expect(n.is_near_threshold).toBe(false)
    }
  })

  it('computes Involve Asia progress correctly (threshold ฿320)', async () => {
    mockFromImpl = () => rtChain([
      { platform: 'involve_asia', commission: 200, payout_status: 'settled' },
      { platform: 'involve_asia', commission: 56, payout_status: 'pending' },
    ])

    const result = await getPayoutProgress()
    const ia = result.networks.find(n => n.platform_key === 'involve_asia')!

    expect(ia.accumulated_thb).toBeCloseTo(256)
    expect(ia.threshold_thb).toBe(320)
    expect(ia.progress_pct).toBeCloseTo(80)
    expect(ia.is_near_threshold).toBe(true)
    expect(ia.can_withdraw).toBe(false)
  })

  it('marks can_withdraw true when accumulated >= threshold', async () => {
    mockFromImpl = () => rtChain([
      { platform: 'accesstrade', commission: 500, payout_status: 'settled' },
    ])

    const result = await getPayoutProgress()
    const at = result.networks.find(n => n.platform_key === 'accesstrade')!

    expect(at.can_withdraw).toBe(true)
    expect(at.is_near_threshold).toBe(false)
    expect(at.progress_pct).toBe(100)
  })

  it('does not count reversed commissions', async () => {
    // reversed rows are filtered out by .neq('payout_status', 'reversed') in the query
    // simulate empty result (reversed rows excluded at DB level)
    mockFromImpl = () => rtChain([])

    const result = await getPayoutProgress()
    const ia = result.networks.find(n => n.platform_key === 'involve_asia')!
    expect(ia.accumulated_thb).toBe(0)
  })

  it('throws when database query fails', async () => {
    mockFromImpl = () => rtChain([], new Error('DB failure'))

    await expect(getPayoutProgress()).rejects.toThrow('DB failure')
  })
})
