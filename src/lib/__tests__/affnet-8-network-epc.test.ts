// AFFNET-8: getNetworkEpcReport — network-aware EPC dashboard

import { describe, expect, it, vi, beforeEach } from 'vitest'

let mockFromImpl: (table: string) => unknown = () => ({})

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({ from: (t: string) => mockFromImpl(t) }),
}))

import { getNetworkEpcReport } from '@/lib/epc'

// revenue_tracking chain: .select.eq.neq → resolves
function revChain(data: unknown[], error: unknown = null) {
  return {
    select: () => ({
      eq: () => ({
        neq: () => Promise.resolve({ data, error }),
      }),
    }),
  }
}

// click_logs chain: .select → resolves
function clickChain(data: unknown[], error: unknown = null) {
  return {
    select: () => Promise.resolve({ data, error }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getNetworkEpcReport — AFFNET-8', () => {
  it('returns empty rows when no data exists', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') return revChain([])
      return clickChain([])
    }

    const report = await getNetworkEpcReport()

    expect(report.rows).toHaveLength(0)
    expect(report.best_by_epc).toBeNull()
    expect(report.best_by_commission).toBeNull()
  })

  it('computes EPC and CVR correctly for Shopee direct', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') {
        return revChain([
          { platform: 'shopee', commission: 100 },
          { platform: 'shopee', commission: 50 },
        ])
      }
      return clickChain([
        { platform: 'shopee' },
        { platform: 'shopee' },
        { platform: 'shopee' },
        { platform: 'shopee' },
      ])
    }

    const report = await getNetworkEpcReport()
    const shopee = report.rows.find(r => r.platform_key === 'shopee')!

    expect(shopee.conversion_count).toBe(2)
    expect(shopee.total_commission).toBeCloseTo(150)
    expect(shopee.click_count).toBe(4)
    expect(shopee.epc).toBeCloseTo(37.5)
    expect(shopee.cvr).toBeCloseTo(50)
    expect(shopee.avg_commission).toBeCloseTo(75)
  })

  it('shows involve_asia and accesstrade network labels', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') {
        return revChain([
          { platform: 'involve_asia', commission: 200 },
          { platform: 'accesstrade', commission: 120 },
        ])
      }
      return clickChain([])
    }

    const report = await getNetworkEpcReport()

    const ia = report.rows.find(r => r.platform_key === 'involve_asia')!
    const at = report.rows.find(r => r.platform_key === 'accesstrade')!

    expect(ia.network).toBe('Involve Asia')
    expect(at.network).toBe('AccessTrade')
  })

  it('identifies best_by_commission correctly', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') {
        return revChain([
          { platform: 'shopee',       commission: 300 },
          { platform: 'involve_asia', commission: 500 },
          { platform: 'accesstrade',  commission: 200 },
        ])
      }
      return clickChain([])
    }

    const report = await getNetworkEpcReport()

    expect(report.best_by_commission).toBe('Involve Asia')
  })

  it('identifies best_by_epc correctly among networks with clicks', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') {
        return revChain([
          { platform: 'shopee', commission: 100 },
          { platform: 'lazada', commission: 300 },
        ])
      }
      return clickChain([
        { platform: 'shopee' }, { platform: 'shopee' }, // 2 clicks → EPC 50
        { platform: 'lazada' },                          // 1 click  → EPC 300
      ])
    }

    const report = await getNetworkEpcReport()

    // Lazada EPC = 300/1 = 300; Shopee EPC = 100/2 = 50
    expect(report.best_by_epc).toBe('Lazada')
  })

  it('returns empty rows gracefully on DB error', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') return revChain([], new Error('DB fail'))
      return clickChain([])
    }

    const report = await getNetworkEpcReport()
    expect(report.rows).toHaveLength(0)
    expect(report.best_by_epc).toBeNull()
  })
})
