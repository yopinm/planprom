import { beforeEach, describe, expect, it, vi } from 'vitest'
import { extractPlatform, getEpcByPlatform } from '../epc'

const supabaseMock = vi.hoisted(() => ({
  select: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: supabaseMock.select,
    })),
  })),
}))

describe('REV-EPC-1: epc', (): void => {
  beforeEach((): void => {
    supabaseMock.select.mockReset()
  })

  describe('extractPlatform', (): void => {
    it('shopee_xxx -> shopee', (): void => expect(extractPlatform('shopee_abc')).toBe('shopee'))
    it('lazada_xxx -> lazada', (): void => expect(extractPlatform('lazada_abc')).toBe('lazada'))
    it('tiktok_xxx -> tiktok', (): void => expect(extractPlatform('tiktok_abc')).toBe('tiktok'))
    it('manual_xxx -> manual', (): void => expect(extractPlatform('manual_abc')).toBe('manual'))
    it('unknown -> other', (): void => expect(extractPlatform('fb_post_20260425')).toBe('other'))
    it('no underscore -> other', (): void => expect(extractPlatform('anything')).toBe('other'))
    it('SHOPEE upper -> shopee', (): void => expect(extractPlatform('SHOPEE_abc')).toBe('shopee'))
  })

  describe('getEpcByPlatform', (): void => {
    it('returns an empty summary when the query fails', async (): Promise<void> => {
      supabaseMock.select.mockResolvedValue({ data: null, error: new Error('db down') })

      const summary = await getEpcByPlatform()

      expect(summary.rows).toEqual([])
      expect(summary.best).toBeNull()
      expect(new Date(summary.generated_at).toISOString()).toBe(summary.generated_at)
    })

    it('aggregates rows by platform prefix', async (): Promise<void> => {
      supabaseMock.select.mockResolvedValue({
        data: [
          { sub_id: 'shopee_a', click_count: 10, conversion_count: 2, total_commission: 100 },
          { sub_id: 'shopee_b', click_count: 5, conversion_count: 1, total_commission: 50 },
          { sub_id: 'lazada_a', click_count: 20, conversion_count: 1, total_commission: 40 },
        ],
        error: null,
      })

      const summary = await getEpcByPlatform()
      const shopee = summary.rows.find(row => row.platform === 'shopee')

      expect(shopee?.click_count).toBe(15)
      expect(shopee?.conversion_count).toBe(3)
      expect(shopee?.total_commission).toBe(150)
    })

    it('computes EPC and conversion rate from real rows', async (): Promise<void> => {
      supabaseMock.select.mockResolvedValue({
        data: [
          { sub_id: 'lazada_a', click_count: 25, conversion_count: 5, total_commission: 125 },
        ],
        error: null,
      })

      const summary = await getEpcByPlatform()
      const lazada = summary.rows[0]

      expect(lazada.epc).toBe(5)
      expect(lazada.conversion_rate).toBe(20)
    })

    it('selects the platform with the highest EPC as best', async (): Promise<void> => {
      supabaseMock.select.mockResolvedValue({
        data: [
          { sub_id: 'shopee_a', click_count: 10, conversion_count: 1, total_commission: 20 },
          { sub_id: 'lazada_a', click_count: 5, conversion_count: 1, total_commission: 50 },
        ],
        error: null,
      })

      const summary = await getEpcByPlatform()

      expect(summary.best).toBe('lazada')
    })

    it('filters platforms with no clicks and no commission', async (): Promise<void> => {
      supabaseMock.select.mockResolvedValue({
        data: [
          { sub_id: 'tiktok_a', click_count: 0, conversion_count: 0, total_commission: 0 },
        ],
        error: null,
      })

      const summary = await getEpcByPlatform()

      expect(summary.rows).toEqual([])
    })

    it('groups unrecognized sub_id prefixes under other', async (): Promise<void> => {
      supabaseMock.select.mockResolvedValue({
        data: [
          { sub_id: 'fb_post_1', click_count: 3, conversion_count: 1, total_commission: 15 },
        ],
        error: null,
      })

      const summary = await getEpcByPlatform()

      expect(summary.rows).toHaveLength(1)
      expect(summary.rows[0].platform).toBe('other')
    })
  })
})
