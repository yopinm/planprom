import { describe, it, expect } from 'vitest'
import {
  calculateBuyOrWait,
  detectUpcomingPromo,
} from '../buy-or-wait'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normal weekday with no special context — day 15, month 6 */
const NORMAL_DATE = new Date('2026-06-15T10:00:00Z') // day 15 (normal)

/** Date where payday starts in 2 days: day 23 → payday on day 25 */
const PRE_PAYDAY = new Date('2026-06-23T10:00:00Z')

/** Date where double date is in 3 days: June 3 → 6/6 is in 3 days */
const PRE_DOUBLE = new Date('2026-06-03T10:00:00Z')

/** Date already in payday period */
const IN_PAYDAY = new Date('2026-06-26T10:00:00Z')

// ---------------------------------------------------------------------------
// detectUpcomingPromo
// ---------------------------------------------------------------------------

describe('detectUpcomingPromo', () => {
  it('returns found=false on a normal day with no promo in window', () => {
    // June 15 — next payday is June 25, which is 10 days away (> 7)
    const result = detectUpcomingPromo(NORMAL_DATE, 7)
    expect(result.found).toBe(false)
    expect(result.daysUntil).toBeNull()
  })

  it('detects payday approaching within window', () => {
    // June 23 → June 25 is 2 days ahead
    const result = detectUpcomingPromo(PRE_PAYDAY, 7)
    expect(result.found).toBe(true)
    expect(result.daysUntil).toBe(2)
  })

  it('detects double_date approaching within window', () => {
    // June 3 → 6/6 is 3 days ahead
    const result = detectUpcomingPromo(PRE_DOUBLE, 7)
    expect(result.found).toBe(true)
    expect(result.daysUntil).toBe(3)
  })

  it('finds promo when already in payday window', () => {
    // June 26 → next day (27) is also payday
    const result = detectUpcomingPromo(IN_PAYDAY, 3)
    expect(result.found).toBe(true)
  })

  it('respects custom daysAhead', () => {
    // June 23 → payday in 2 days, but only look 1 day ahead
    const result = detectUpcomingPromo(PRE_PAYDAY, 1)
    expect(result.found).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// calculateBuyOrWait — LOW_CONFIDENCE
// ---------------------------------------------------------------------------

describe('calculateBuyOrWait — LOW_CONFIDENCE', () => {
  it('returns LOW_CONFIDENCE when no movingAvg30d', () => {
    const r = calculateBuyOrWait({ currentPrice: 1000, now: NORMAL_DATE })
    expect(r.signal).toBe('LOW_CONFIDENCE')
    expect(r.priceDrop).toBe(0)
    expect(r.upcomingPromo).toBe(false)
  })

  it('returns LOW_CONFIDENCE when movingAvg30d is 0', () => {
    const r = calculateBuyOrWait({ currentPrice: 1000, movingAvg30d: 0, now: NORMAL_DATE })
    expect(r.signal).toBe('LOW_CONFIDENCE')
  })

  it('LOW_CONFIDENCE label is "ไม่ทราบ"', () => {
    const r = calculateBuyOrWait({ currentPrice: 1000, now: NORMAL_DATE })
    expect(r.label).toBe('ไม่ทราบ')
  })
})

// ---------------------------------------------------------------------------
// calculateBuyOrWait — STRONG_BUY
// ---------------------------------------------------------------------------

describe('calculateBuyOrWait — STRONG_BUY', () => {
  it('triggers when price is 15%+ below avg and dealScore >= 75', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 840,   // 16% drop
      dealScore: 80,
      now: NORMAL_DATE,
    })
    expect(r.signal).toBe('STRONG_BUY')
  })

  it('does NOT trigger when drop is 15% but dealScore < 75', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 840,
      dealScore: 70,
      now: NORMAL_DATE,
    })
    expect(r.signal).not.toBe('STRONG_BUY')
  })

  it('does NOT trigger when dealScore >= 75 but drop < 15%', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 900,   // 10% drop
      dealScore: 80,
      now: NORMAL_DATE,
    })
    expect(r.signal).not.toBe('STRONG_BUY')
  })

  it('STRONG_BUY label is "ซื้อเลย!"', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 800,
      dealScore: 80,
      now: NORMAL_DATE,
    })
    expect(r.signal).toBe('STRONG_BUY')
    expect(r.label).toBe('ซื้อเลย!')
  })

  it('STRONG_BUY beats WAIT even when promo is upcoming (price already very low)', () => {
    // Price 20% below avg (> PROMO_WAIT_SKIP_DROP=10%) + promo in 2 days
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 800,   // 20% drop
      dealScore: 80,
      now: PRE_PAYDAY,
    })
    expect(r.signal).toBe('STRONG_BUY')
  })
})

// ---------------------------------------------------------------------------
// calculateBuyOrWait — WAIT (upcoming promo)
// ---------------------------------------------------------------------------

describe('calculateBuyOrWait — WAIT (upcoming promo)', () => {
  it('triggers WAIT when promo is upcoming and price not deeply discounted', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 970,   // only 3% drop < 10% threshold
      dealScore: 50,
      now: PRE_PAYDAY,     // payday in 2 days
    })
    expect(r.signal).toBe('WAIT')
    expect(r.upcomingPromo).toBe(true)
  })

  it('skips WAIT when price drop >= PROMO_WAIT_SKIP_DROP (10%)', () => {
    // 11% drop: price is already compelling → should not WAIT for promo
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 890,   // 11% drop
      dealScore: 60,
      now: PRE_PAYDAY,
    })
    expect(r.signal).not.toBe('WAIT')
  })

  it('daysUntilPromo is populated in WAIT result', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 990,
      now: PRE_PAYDAY,
    })
    expect(r.daysUntilPromo).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// calculateBuyOrWait — BUY_NOW
// ---------------------------------------------------------------------------

describe('calculateBuyOrWait — BUY_NOW', () => {
  it('triggers when price drop >= 5%', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 940,   // 6% drop
      now: NORMAL_DATE,
    })
    expect(r.signal).toBe('BUY_NOW')
  })

  it('triggers when hasCoupons AND dealScore >= 50 (even with small price drop)', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 990,   // only 1% drop (< 5%)
      dealScore: 55,
      hasCoupons: true,
      now: NORMAL_DATE,
    })
    expect(r.signal).toBe('BUY_NOW')
  })

  it('does NOT trigger with coupons alone if dealScore < 50', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 990,
      dealScore: 45,
      hasCoupons: true,
      now: NORMAL_DATE,
    })
    expect(r.signal).not.toBe('BUY_NOW')
  })

  it('BUY_NOW label is "ควรซื้อ"', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 900,
      now: NORMAL_DATE,
    })
    expect(r.label).toBe('ควรซื้อ')
  })
})

// ---------------------------------------------------------------------------
// calculateBuyOrWait — WAIT (default)
// ---------------------------------------------------------------------------

describe('calculateBuyOrWait — WAIT (default)', () => {
  it('returns WAIT when price is above avg and no promo triggers', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 1100,  // 10% above avg
      dealScore: 40,
      now: NORMAL_DATE,
    })
    expect(r.signal).toBe('WAIT')
    expect(r.priceDrop).toBeLessThan(0)
  })

  it('WAIT label is "รอก่อน"', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 1050,
      now: NORMAL_DATE,
    })
    expect(r.label).toBe('รอก่อน')
  })

  it('returns WAIT when price equals avg and no coupons/low score', () => {
    const r = calculateBuyOrWait({
      movingAvg30d: 1000,
      currentPrice: 1000,
      dealScore: 40,
      hasCoupons: false,
      now: NORMAL_DATE,
    })
    expect(r.signal).toBe('WAIT')
  })
})

// ---------------------------------------------------------------------------
// priceDrop accuracy
// ---------------------------------------------------------------------------

describe('priceDrop calculation', () => {
  it('positive priceDrop when current < avg', () => {
    const r = calculateBuyOrWait({ movingAvg30d: 1000, currentPrice: 900, now: NORMAL_DATE })
    expect(r.priceDrop).toBeCloseTo(10, 0)
  })

  it('negative priceDrop when current > avg', () => {
    const r = calculateBuyOrWait({ movingAvg30d: 1000, currentPrice: 1200, now: NORMAL_DATE })
    expect(r.priceDrop).toBeLessThan(0)
    expect(r.priceDrop).toBeCloseTo(-20, 0)
  })

  it('priceDrop is 0 when prices equal', () => {
    const r = calculateBuyOrWait({ movingAvg30d: 500, currentPrice: 500, now: NORMAL_DATE })
    expect(r.priceDrop).toBe(0)
  })
})
