import { describe, expect, it } from 'vitest'
import {
  buildSparklinePoints,
  summarizePriceTrend,
} from '@/lib/price-trend'

const HISTORY = [
  { price: 1200, captured_at: '2026-04-01T00:00:00.000Z' },
  { price: 1100, captured_at: '2026-04-10T00:00:00.000Z' },
  { price: 1000, captured_at: '2026-04-20T00:00:00.000Z' },
]

describe('TASK 4.6 price trend', () => {
  it('summarizes downward price trend against first recorded price', () => {
    const summary = summarizePriceTrend(HISTORY, 900, new Date('2026-04-20T01:00:00.000Z'))

    expect(summary).toMatchObject({
      count:              3,
      currentPrice:       900,
      firstPrice:         1200,
      latestHistoryPrice: 1000,
      minPrice:           900,
      maxPrice:           1200,
      averagePrice:       1050,
      changeAmount:       -300,
      changePercent:      -25,
      direction:          'down',
      isCurrentLow:       true,
      generatedAt:        '2026-04-20T01:00:00.000Z',
    })
  })

  it('returns null when there is not enough history', () => {
    expect(summarizePriceTrend([HISTORY[0]], 900)).toBeNull()
  })

  it('sorts history before summarizing', () => {
    const summary = summarizePriceTrend([HISTORY[2], HISTORY[0], HISTORY[1]], 1260)

    expect(summary?.firstPrice).toBe(1200)
    expect(summary?.direction).toBe('up')
    expect(summary?.changePercent).toBe(5)
  })

  it('builds bounded sparkline coordinates', () => {
    const points = buildSparklinePoints([1200, 1100, 900], 280, 72, 6)

    expect(points).toHaveLength(3)
    expect(points[0]).toEqual({ x: 6, y: 6 })
    expect(points[2]).toEqual({ x: 274, y: 66 })
  })
})
