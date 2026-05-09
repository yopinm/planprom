import { describe, expect, it } from 'vitest'
import { computePseoFlag } from '@/components/admin/PseoRevenueMatrix'

describe('computePseoFlag', () => {
  it('returns false when views below threshold', () => {
    expect(computePseoFlag(0, 0)).toBe(false)
    expect(computePseoFlag(99, 0)).toBe(false)
  })

  it('returns true when views >= 100 and clicks = 0', () => {
    expect(computePseoFlag(100, 0)).toBe(true)
    expect(computePseoFlag(500, 0)).toBe(true)
    expect(computePseoFlag(10000, 0)).toBe(true)
  })

  it('returns false when views >= 100 but has outbound clicks', () => {
    expect(computePseoFlag(100, 1)).toBe(false)
    expect(computePseoFlag(200, 5)).toBe(false)
    expect(computePseoFlag(1000, 50)).toBe(false)
  })
})
