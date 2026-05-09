// AFFNET-7: traceSubIdLifecycle — network + outgoing_param enrichment
// Verifies that:
//   1. networkParamInfo maps platform → correct network label + param
//   2. clicks use click_logs (not click_tracking)
//   3. network_summary aggregates click + conversion counts
//   4. conversions carry correct network info (accesstrade, involve_asia, etc.)

import { describe, expect, it, vi, beforeEach } from 'vitest'

let mockFromImpl: (table: string) => unknown = () => ({})

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({ from: (t: string) => mockFromImpl(t) }),
}))

import { traceSubIdLifecycle } from '@/lib/revenue-data'

// click_logs chain: .select.eq.order
function clickChain(data: unknown[], error: unknown = null) {
  return {
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data, error }),
      }),
    }),
  }
}

// revenue_tracking chain: .select.eq.order
function rtChain(data: unknown[], error: unknown = null) {
  return {
    select: () => ({
      eq: () => ({
        order: () => Promise.resolve({ data, error }),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('traceSubIdLifecycle — AFFNET-7', () => {
  it('returns WAITING_POSTBACK with correct Shopee network info when only click exists', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'click_logs') {
        return clickChain([{ clicked_at: '2026-05-04T10:00:00.000Z', platform: 'shopee' }])
      }
      return rtChain([])
    }

    const result = await traceSubIdLifecycle('test_shopee_001')

    expect(result.status).toBe('WAITING_POSTBACK')
    expect(result.click_found).toBe(true)
    expect(result.clicks[0].network).toBe('Shopee')
    expect(result.clicks[0].outgoing_param).toBe('sub_id')
    expect(result.postback_found).toBe(false)
  })

  it('maps involve_asia postback to correct network + param', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'click_logs') return clickChain([])
      return rtChain([{
        received_at: '2026-05-04T11:00:00.000Z',
        event_type: 'conversion',
        commission: 80,
        payout_status: 'pending',
        order_id: 'IA-9999',
        platform: 'involve_asia',
      }])
    }

    const result = await traceSubIdLifecycle('test_ia_001')

    expect(result.status).toBe('SUCCESS_LOOP')
    expect(result.conversions[0].network).toBe('Involve Asia')
    expect(result.conversions[0].outgoing_param).toBe('sub1')
  })

  it('maps accesstrade postback to correct network + param', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'click_logs') return clickChain([])
      return rtChain([{
        received_at: '2026-05-04T11:00:00.000Z',
        event_type: 'conversion',
        commission: 120,
        payout_status: 'pending',
        order_id: 'AT-1234',
        platform: 'accesstrade',
      }])
    }

    const result = await traceSubIdLifecycle('sephora_test')

    expect(result.conversions[0].network).toBe('AccessTrade')
    expect(result.conversions[0].outgoing_param).toBe('aff_sub')
  })

  it('builds network_summary with correct counts across click + conversion', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'click_logs') {
        return clickChain([
          { clicked_at: '2026-05-04T09:00:00.000Z', platform: 'shopee' },
          { clicked_at: '2026-05-04T09:30:00.000Z', platform: 'shopee' },
        ])
      }
      return rtChain([{
        received_at: '2026-05-04T11:00:00.000Z',
        event_type: 'conversion',
        commission: 50,
        payout_status: 'settled',
        order_id: 'SP-5555',
        platform: 'shopee',
      }])
    }

    const result = await traceSubIdLifecycle('sub_multi_shopee')

    const shopee = result.network_summary.find(n => n.network === 'Shopee')
    expect(shopee?.click_count).toBe(2)
    expect(shopee?.conversion_count).toBe(1)
    expect(shopee?.outgoing_param).toBe('sub_id')
  })

  it('returns empty arrays and WAITING_POSTBACK when no data exists', async () => {
    mockFromImpl = () => clickChain([])

    const result = await traceSubIdLifecycle('ghost_sub_id')

    expect(result.click_found).toBe(false)
    expect(result.postback_found).toBe(false)
    expect(result.clicks).toHaveLength(0)
    expect(result.conversions).toHaveLength(0)
    expect(result.network_summary).toHaveLength(0)
    expect(result.status).toBe('WAITING_POSTBACK')
  })

  it('throws when click_logs query fails', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'click_logs') return clickChain([], new Error('DB error'))
      return rtChain([])
    }

    await expect(traceSubIdLifecycle('err_sub')).rejects.toThrow('DB error')
  })
})
