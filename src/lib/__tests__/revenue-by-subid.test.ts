// POSTLIVE-03: Tests for getRevenueBySubIdReport()

import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock Supabase admin client before importing revenue-data
let mockFromImpl: (table: string) => unknown = () => ({})

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({ from: (t: string) => mockFromImpl(t) }),
}))

import { getRevenueBySubIdReport } from '@/lib/revenue-data'

// Helper: builds a chain for revenue_tracking query (.select.eq.order.limit → resolves)
function rtChain(data: unknown[], error: unknown = null) {
  return {
    select: () => ({
      eq: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data, error }),
        }),
      }),
    }),
  }
}

// Helper: builds a chain for click_logs query (.select.in.order → resolves)
function clChain(data: unknown[], error: unknown = null) {
  return {
    select: () => ({
      in: () => ({
        order: () => Promise.resolve({ data, error }),
      }),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getRevenueBySubIdReport', () => {
  it('returns empty rows and null avg latency when no conversions exist', async () => {
    mockFromImpl = () => rtChain([])

    const report = await getRevenueBySubIdReport()

    expect(report.rows).toHaveLength(0)
    expect(report.platform_latency).toHaveLength(2)
    expect(report.platform_latency[0].avg_latency_seconds).toBeNull()
    expect(report.platform_latency[0].sample_count).toBe(0)
    expect(report.generated_at).toBeTruthy()
  })

  it('computes latency_seconds from click_at to received_at when converted_at is null', async () => {
    const receivedAt = '2026-04-27T12:00:00.000Z'
    const clickedAt = '2026-04-27T10:00:00.000Z' // 7200s earlier

    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') {
        return rtChain([{
          sub_id: 'test_001', platform: 'shopee', commission: 50,
          payout_status: 'settled', received_at: receivedAt, converted_at: null,
        }])
      }
      return clChain([{ sub_id: 'test_001', clicked_at: clickedAt }])
    }

    const report = await getRevenueBySubIdReport()

    expect(report.rows).toHaveLength(1)
    expect(report.rows[0].latency_seconds).toBe(7200)
    expect(report.rows[0].click_at).toBe(clickedAt)
    expect(report.rows[0].converted_at).toBeNull()
  })

  it('prefers converted_at over received_at for latency calculation', async () => {
    const convertedAt = '2026-04-27T11:00:00.000Z'
    const receivedAt = '2026-04-27T12:00:00.000Z'
    const clickedAt = '2026-04-27T10:00:00.000Z' // 3600s before convertedAt

    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') {
        return rtChain([{
          sub_id: 'test_002', platform: 'lazada', commission: 120,
          payout_status: 'pending', received_at: receivedAt, converted_at: convertedAt,
        }])
      }
      return clChain([{ sub_id: 'test_002', clicked_at: clickedAt }])
    }

    const report = await getRevenueBySubIdReport()

    expect(report.rows[0].latency_seconds).toBe(3600)
  })

  it('sets latency_seconds to null when no click_log exists for sub_id', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') {
        return rtChain([{
          sub_id: 'orphan_001', platform: 'shopee', commission: 30,
          payout_status: 'pending', received_at: '2026-04-27T10:00:00.000Z', converted_at: null,
        }])
      }
      return clChain([]) // no clicks
    }

    const report = await getRevenueBySubIdReport()

    expect(report.rows[0].latency_seconds).toBeNull()
  })

  it('computes per-platform avg latency for rows that have click data', async () => {
    mockFromImpl = (table: string) => {
      if (table === 'revenue_tracking') {
        return rtChain([
          { sub_id: 'a', platform: 'shopee', commission: 100, payout_status: 'settled', received_at: '2026-04-27T12:00:00.000Z', converted_at: null },
          { sub_id: 'b', platform: 'shopee', commission: 200, payout_status: 'settled', received_at: '2026-04-27T14:00:00.000Z', converted_at: null },
          { sub_id: 'c', platform: 'lazada', commission: 50, payout_status: 'pending', received_at: '2026-04-27T10:00:00.000Z', converted_at: null },
        ])
      }
      // 'a' click: 7200s before received; 'b' has no click; 'c' click: 7200s before received
      return clChain([
        { sub_id: 'a', clicked_at: '2026-04-27T10:00:00.000Z' },
        { sub_id: 'c', clicked_at: '2026-04-27T08:00:00.000Z' },
      ])
    }

    const report = await getRevenueBySubIdReport()

    const shopee = report.platform_latency.find(p => p.platform === 'shopee')
    const lazada = report.platform_latency.find(p => p.platform === 'lazada')

    // Only 'a' has click → shopee avg = 7200; 'b' is excluded (no click)
    expect(shopee?.avg_latency_seconds).toBe(7200)
    expect(shopee?.sample_count).toBe(1)
    // 'c' lazada → latency = 7200
    expect(lazada?.avg_latency_seconds).toBe(7200)
    expect(lazada?.sample_count).toBe(1)
  })

  it('throws when revenue_tracking query returns an error', async () => {
    mockFromImpl = () => rtChain([], new Error('DB error'))

    await expect(getRevenueBySubIdReport()).rejects.toThrow('DB error')
  })
})
