import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCouponsByTier, getWalletSweepData, sweepTotalCount, sweepLastVerified } from '@/lib/wallet-queries'

const dbMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/db', () => ({ db: dbMock }))

const makeRow = (overrides = {}) => ({
  id:             'c1',
  code:           'TEST10',
  title:          'ลด 10%',
  platform:       'shopee',
  discount_value: 10,
  type:           'percent',
  min_spend:      200,
  expire_at:      null,
  verified_at:    null,
  success_rate:   null,
  last_used_at:   null,
  ...overrides,
})

describe('getCouponsByTier', () => {
  beforeEach(() => vi.clearAllMocks())

  it('maps raw DB row to PublicCoupon shape', async () => {
    dbMock.mockResolvedValueOnce([makeRow({ success_rate: 92 })])
    const result = await getCouponsByTier(1)
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      id:           'c1',
      code:         'TEST10',
      discountType: 'percent',
      discountValue: 10,
      minSpend:     200,
      isFeatured:   false,
      successRate:  92,
    })
  })

  it('returns empty array on DB error', async () => {
    dbMock.mockRejectedValueOnce(new Error('DB down'))
    const result = await getCouponsByTier(2)
    expect(result).toEqual([])
  })
})

describe('getWalletSweepData', () => {
  beforeEach(() => vi.clearAllMocks())

  it('queries tiers 1, 2, 3, 4 in parallel and returns named buckets', async () => {
    dbMock
      .mockResolvedValueOnce([makeRow({ id: 'p1' })])
      .mockResolvedValueOnce([makeRow({ id: 's1' })])
      .mockResolvedValueOnce([makeRow({ id: 'b1' })])
      .mockResolvedValueOnce([makeRow({ id: 'sh1' })])

    const data = await getWalletSweepData()
    expect(data.platform).toHaveLength(1)
    expect(data.shop).toHaveLength(1)
    expect(data.bank).toHaveLength(1)
    expect(data.shipping).toHaveLength(1)
    expect(dbMock).toHaveBeenCalledTimes(4)
  })
})

const makeCoupon = (id: string) => ({
  id, code: 'X', title: 'X', platform: 'shopee' as const,
  discountValue: 10, discountType: 'percent' as const,
  minSpend: 0, expireAt: null, isFeatured: false,
  verifiedAt: null, successRate: null, lastUsedAt: null,
})

describe('sweepTotalCount', () => {
  it('sums all tier lengths including bank', () => {
    const data = {
      platform: [makeCoupon('p1'), makeCoupon('p2')],
      shop:     [makeCoupon('s1')],
      bank:     [makeCoupon('b1')],
      shipping: [],
    }
    expect(sweepTotalCount(data)).toBe(4)
  })
})

describe('sweepLastVerified', () => {
  it('returns the most recent verifiedAt across all tiers', () => {
    const data = {
      platform: [{ ...makeCoupon('p1'), verifiedAt: '2026-05-05T10:00:00Z' }],
      shop:     [{ ...makeCoupon('s1'), verifiedAt: '2026-05-05T12:00:00Z' }],
      bank:     [makeCoupon('b1')],
      shipping: [makeCoupon('sh1')],
    }
    expect(sweepLastVerified(data)).toBe('2026-05-05T12:00:00Z')
  })

  it('returns null when no coupons have verifiedAt', () => {
    const data = { platform: [], shop: [], bank: [], shipping: [] }
    expect(sweepLastVerified(data)).toBeNull()
  })
})
