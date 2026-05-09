// DIST-03B: fb-group-templates unit tests

import { describe, expect, it } from 'vitest'
import {
  PILLARS,
  PILLAR_KEYS,
  renderGroupCaption,
  buildGroupSubId,
  computePillarBalance,
} from '@/lib/social/fb-group-templates'

const NOW_ICT = new Date('2026-05-04T11:00:00')

const VARS = {
  name: 'Samsung A55', original: '12,990', net: '9,990',
  save: '3,000', coupon: 'VIP10',
  url: 'https://couponkum.com/go/abc?sub_id=x',
}

describe('PILLARS', () => {
  it('has 7 pillars', () => {
    expect(PILLAR_KEYS).toHaveLength(7)
  })

  it('all pillars have required fields', () => {
    for (const k of PILLAR_KEYS) {
      expect(PILLARS[k].name).toBeTruthy()
      expect(PILLARS[k].emoji).toBeTruthy()
      expect(PILLARS[k].pct).toBeGreaterThan(0)
    }
  })

  it('pillar pct sums to 100', () => {
    const total = PILLAR_KEYS.reduce((s, k) => s + PILLARS[k].pct, 0)
    expect(total).toBe(100)
  })
})

describe('renderGroupCaption', () => {
  it('replaces all placeholders', () => {
    const tpl = '{name} ลด {save} บาท โค้ด {coupon} 👉 {url}'
    const out = renderGroupCaption(tpl, VARS)
    expect(out).toContain('Samsung A55')
    expect(out).toContain('3,000')
    expect(out).toContain('VIP10')
    expect(out).not.toContain('{name}')
    expect(out).not.toContain('{save}')
    expect(out).not.toContain('{coupon}')
  })

  it('preserves text without placeholders unchanged', () => {
    const tpl = 'โหวตหน่อย! 👍 ซื้อเลย 🤔 คิดอยู่'
    const out = renderGroupCaption(tpl, VARS)
    expect(out).toBe(tpl)
  })

  it('replaces multiple occurrences of same key', () => {
    const tpl = '{coupon} and again {coupon}'
    const out = renderGroupCaption(tpl, VARS)
    expect(out).toBe('VIP10 and again VIP10')
  })
})

describe('buildGroupSubId', () => {
  it('formats sub_id correctly', () => {
    expect(buildGroupSubId('early_bird', 1, NOW_ICT)).toBe('fb_group_vip_early_bird_20260504_1')
    expect(buildGroupSubId('poll', 2, NOW_ICT)).toBe('fb_group_vip_poll_20260504_2')
    expect(buildGroupSubId('giveaway', 3, NOW_ICT)).toBe('fb_group_vip_giveaway_20260504_3')
  })

  it('never contains spaces', () => {
    for (const k of PILLAR_KEYS) {
      expect(buildGroupSubId(k, 1, NOW_ICT)).not.toContain(' ')
    }
  })
})

describe('computePillarBalance', () => {
  it('returns entry for every pillar', () => {
    const result = computePillarBalance({})
    expect(result).toHaveLength(7)
  })

  it('computes 0% when no posts', () => {
    const result = computePillarBalance({})
    result.forEach(r => expect(r.actualPct).toBe(0))
  })

  it('marks pillar as over when actual > target + 10', () => {
    // early_bird target is 30%; give it 100% of posts
    const result = computePillarBalance({ early_bird: 10 })
    const eb = result.find(r => r.key === 'early_bird')!
    expect(eb.over).toBe(true)
    expect(eb.actualPct).toBe(100)
  })

  it('counts correctly with mixed pillars', () => {
    const result = computePillarBalance({ early_bird: 3, tip: 1 })
    const eb = result.find(r => r.key === 'early_bird')!
    expect(eb.count).toBe(3)
    expect(eb.actualPct).toBe(75)
  })
})
