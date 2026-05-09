// DIST-01: fb-templates unit tests

import { describe, expect, it } from 'vitest'
import {
  buildFbSubId,
  renderCaption,
  buildCouponkumUrl,
  fmtPrice,
  HOOK_FORMAT_KEYS,
  HOOK_FORMATS,
} from '@/lib/social/fb-templates'

const NOW_ICT = new Date('2026-05-04T11:00:00') // simulated ICT date

describe('buildFbSubId', () => {
  it('formats sub_id correctly for each slot', () => {
    expect(buildFbSubId(1, 'money_pain', NOW_ICT)).toBe('fb_manual_20260504_slot1_money_pain')
    expect(buildFbSubId(2, 'timing_urgency', NOW_ICT)).toBe('fb_manual_20260504_slot2_timing_urgency')
    expect(buildFbSubId(3, 'comparison', NOW_ICT)).toBe('fb_manual_20260504_slot3_comparison')
  })

  it('sub_id never contains spaces', () => {
    for (const hook of HOOK_FORMAT_KEYS) {
      const id = buildFbSubId(1, hook, NOW_ICT)
      expect(id).not.toContain(' ')
    }
  })
})

describe('renderCaption', () => {
  const vars = {
    name: 'Samsung A55', original: '12,990', net: '9,990',
    save: '3,000', coupon: 'TEST10', rating: '4.8',
    platform: 'Shopee', url: 'https://couponkum.com/go/abc?sub_id=x',
  }

  it('replaces all placeholders for each hook', () => {
    for (const hook of HOOK_FORMAT_KEYS) {
      const out = renderCaption(hook, vars)
      expect(out).toContain('Samsung A55')
      expect(out).toContain('9,990')
      expect(out).toContain('TEST10')
      expect(out).toContain('couponkum.com')
      expect(out).not.toContain('{name}')
      expect(out).not.toContain('{net}')
    }
  })

  it('money_pain includes original price emphasis', () => {
    const out = renderCaption('money_pain', vars)
    expect(out).toContain('12,990')
    expect(out).toContain('3,000')
  })

  it('social_proof includes rating', () => {
    const out = renderCaption('social_proof', vars)
    expect(out).toContain('4.8')
  })

  it('comparison includes platform', () => {
    const out = renderCaption('comparison', vars)
    expect(out).toContain('Shopee')
  })
})

describe('buildCouponkumUrl', () => {
  it('builds correct URL with sub_id', () => {
    const url = buildCouponkumUrl('prod-uuid', 'fb_manual_20260504_slot1_money_pain', 'https://couponkum.com')
    expect(url).toBe('https://couponkum.com/go/prod-uuid?sub_id=fb_manual_20260504_slot1_money_pain')
  })

  it('URL-encodes sub_id', () => {
    const url = buildCouponkumUrl('abc', 'slot 1', 'https://couponkum.com')
    expect(url).toContain('slot%201')
  })
})

describe('fmtPrice', () => {
  it('formats price with Thai locale', () => {
    expect(fmtPrice(12990)).toBe('12,990')
    expect(fmtPrice(990.5)).toBe('991')
  })
})

describe('HOOK_FORMATS', () => {
  it('all 5 hook formats are defined', () => {
    expect(HOOK_FORMAT_KEYS).toHaveLength(5)
    expect(HOOK_FORMAT_KEYS).toContain('money_pain')
    expect(HOOK_FORMAT_KEYS).toContain('comparison')
  })

  it('every format has name, desc, emoji, template', () => {
    for (const key of HOOK_FORMAT_KEYS) {
      const f = HOOK_FORMATS[key]
      expect(f.name).toBeTruthy()
      expect(f.desc).toBeTruthy()
      expect(f.emoji).toBeTruthy()
      expect(f.template).toContain('{name}')
      expect(f.template).toContain('{url}')
    }
  })
})
