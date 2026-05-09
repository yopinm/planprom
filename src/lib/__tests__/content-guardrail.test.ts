// src/lib/__tests__/content-guardrail.test.ts — TASK 3.21

import { describe, it, expect } from 'vitest'
import { runFullGuardrail } from '@/lib/content-guardrail'

const DISCLOSURE = '\n# โฆษณา'

function caption(body: string) { return body + DISCLOSURE }

// ---------------------------------------------------------------------------
// Clean caption
// ---------------------------------------------------------------------------

describe('clean caption passes', () => {
  it('normal deal post passes', () => {
    const result = runFullGuardrail(
      caption('Samsung Galaxy S24 เหลือแค่ 15,000 บาท\nโค้ด: SAVE5000\n👉 https://couponkum.com/product/galaxy-s24'),
    )
    expect(result.passed).toBe(true)
    expect(result.violations).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// engagement_bait
// ---------------------------------------------------------------------------

describe('engagement_bait', () => {
  it('blocks กดไลค์', () => {
    const r = runFullGuardrail(caption('กดไลค์และแชร์โพสต์นี้เลย'))
    expect(r.passed).toBe(false)
    expect(r.violations.some(v => v.code === 'engagement_bait')).toBe(true)
  })

  it('blocks แท็กเพื่อน', () => {
    const r = runFullGuardrail(caption('แท็กเพื่อนมาดูดีลนี้ด้วยกัน'))
    expect(r.passed).toBe(false)
    expect(r.violations.some(v => v.code === 'engagement_bait')).toBe(true)
  })

  it('blocks แชร์เพื่อ', () => {
    const r = runFullGuardrail(caption('แชร์เพื่อรับส่วนลดเพิ่ม'))
    expect(r.passed).toBe(false)
    expect(r.violations.some(v => v.code === 'engagement_bait')).toBe(true)
  })

  it('blocks comment to win', () => {
    const r = runFullGuardrail(caption('comment to win this prize'))
    expect(r.passed).toBe(false)
  })

  it('does NOT flag a normal share link', () => {
    const r = runFullGuardrail(caption('ดูดีลเต็มที่ https://couponkum.com/product/s24'))
    expect(r.violations.some(v => v.code === 'engagement_bait')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// link_spam
// ---------------------------------------------------------------------------

describe('link_spam', () => {
  it('blocks 3 URLs', () => {
    const text = [
      'ดีลดี https://couponkum.com/1',
      'และที่นี่ https://couponkum.com/2',
      'อีกที่ https://couponkum.com/3',
    ].join('\n')
    const r = runFullGuardrail(caption(text))
    expect(r.passed).toBe(false)
    expect(r.violations.some(v => v.code === 'link_spam')).toBe(true)
  })

  it('allows 1 URL', () => {
    const r = runFullGuardrail(caption('ดูดีลที่ https://couponkum.com/product/s24'))
    expect(r.violations.some(v => v.code === 'link_spam')).toBe(false)
  })

  it('allows exactly 2 URLs', () => {
    const r = runFullGuardrail(caption('link1 https://a.com link2 https://b.com'))
    expect(r.violations.some(v => v.code === 'link_spam')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// excessive_emojis
// ---------------------------------------------------------------------------

describe('excessive_emojis', () => {
  it('flags > 10 emojis', () => {
    const r = runFullGuardrail(caption('🔥🎉💸🛒✅⚡🎯🏷️💰👉😍 ดีลดี'))
    expect(r.violations.some(v => v.code === 'excessive_emojis')).toBe(true)
    expect(r.violations.find(v => v.code === 'excessive_emojis')?.severity).toBe('flag')
  })

  it('allows <= 10 emojis', () => {
    const r = runFullGuardrail(caption('🔥🎉💸🛒✅ ดีลดี'))
    expect(r.violations.some(v => v.code === 'excessive_emojis')).toBe(false)
  })

  it('flag does not block', () => {
    const r = runFullGuardrail(caption('🔥🎉💸🛒✅⚡🎯🏷️💰👉😍 ดีลดี'))
    expect(r.passed).toBe(true)  // flag = review, not block
  })
})

// ---------------------------------------------------------------------------
// repetitive_keyword
// ---------------------------------------------------------------------------

describe('repetitive_keyword', () => {
  it('flags word repeated > 3 times', () => {
    const r = runFullGuardrail(caption('ราคาถูก ราคาถูก ราคาถูก ราคาถูก ราคาถูก'))
    expect(r.violations.some(v => v.code === 'repetitive_keyword')).toBe(true)
  })

  it('does not flag word repeated 3 times', () => {
    const r = runFullGuardrail(caption('ราคาถูก ราคาถูก ราคาถูก'))
    expect(r.violations.some(v => v.code === 'repetitive_keyword')).toBe(false)
  })

  it('repetitive_keyword is flag not block', () => {
    const r = runFullGuardrail(caption('ราคาถูก ราคาถูก ราคาถูก ราคาถูก'))
    const v = r.violations.find(v => v.code === 'repetitive_keyword')
    expect(v?.severity).toBe('flag')
    expect(r.passed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// duplicate_post
// ---------------------------------------------------------------------------

describe('duplicate_post', () => {
  it('blocks when recentPostCount >= 1', () => {
    const r = runFullGuardrail(caption('ดีลดี'), { recentPostCount: 1 })
    expect(r.passed).toBe(false)
    expect(r.violations.some(v => v.code === 'duplicate_post')).toBe(true)
  })

  it('passes when recentPostCount = 0', () => {
    const r = runFullGuardrail(caption('ดีลดี'), { recentPostCount: 0 })
    expect(r.violations.some(v => v.code === 'duplicate_post')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Interaction with existing policy-guard
// ---------------------------------------------------------------------------

describe('policy-guard integration', () => {
  it('blocks health claim via policyResult', () => {
    const r = runFullGuardrail(caption('สินค้านี้หายขาดได้เลย'))
    expect(r.passed).toBe(false)
    expect(r.policyResult.passed).toBe(false)
  })

  it('blocks disclosure_missing', () => {
    const r = runFullGuardrail('ดีลดีไม่มี disclosure')  // no # โฆษณา
    expect(r.passed).toBe(false)
    expect(r.policyResult.violations.some(v => v.code === 'disclosure_missing')).toBe(true)
  })

  it('requiresReview true when only flags exist', () => {
    const r = runFullGuardrail(caption('🔥🎉💸🛒✅⚡🎯🏷️💰👉😍 ดีลดี'))
    expect(r.requiresReview).toBe(true)
    expect(r.passed).toBe(true)
  })
})
