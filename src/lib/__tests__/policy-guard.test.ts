// src/lib/__tests__/policy-guard.test.ts
// TASK 2.5.4 + 2.5.4a — Policy Guard unit tests

import { describe, it, expect } from 'vitest'
import { checkPolicy } from '@/lib/policy-guard'
import type { PolicyCheckResult } from '@/lib/policy-guard'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function captionWith(body: string, disclosure = '# โฆษณา'): string {
  return `${body}\n${disclosure}`
}

const CLEAN = captionWith('หูฟัง Sony ราคา 7,990 บาท ประหยัดไป 3,000 บาท\n👉 https://couponkum.com/product/sony')

// ---------------------------------------------------------------------------
// Clean caption
// ---------------------------------------------------------------------------

describe('checkPolicy — clean caption', () => {
  it('passes with no violations', () => {
    const result = checkPolicy(CLEAN)
    expect(result.passed).toBe(true)
    expect(result.requiresReview).toBe(false)
    expect(result.violations).toHaveLength(0)
  })

  it('returns ISO checkedAt', () => {
    const result = checkPolicy(CLEAN)
    expect(() => new Date(result.checkedAt)).not.toThrow()
    expect(new Date(result.checkedAt).toISOString()).toBe(result.checkedAt)
  })

  it('passes with # สนับสนุน disclosure', () => {
    const result = checkPolicy(captionWith('สินค้าดี ราคาพิเศษ', '# สนับสนุน'))
    expect(result.passed).toBe(true)
  })

  it('passes with trailing whitespace after disclosure', () => {
    const result = checkPolicy(CLEAN + '   ')
    expect(result.passed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Disclosure checks (TASK 2.5.4 + 2.5.4a)
// ---------------------------------------------------------------------------

describe('checkPolicy — disclosure_missing', () => {
  it('blocks when no disclosure at all', () => {
    const result = checkPolicy('หูฟัง Sony ราคา 7,990 บาท')
    expect(result.passed).toBe(false)
    const v = result.violations.find(x => x.code === 'disclosure_missing')
    expect(v).toBeDefined()
    expect(v?.severity).toBe('block')
  })

  it('blocks when disclosure is a different hash tag', () => {
    const result = checkPolicy('สินค้าดี\n# ลดราคา')
    expect(result.violations.some(v => v.code === 'disclosure_missing')).toBe(true)
  })
})

describe('checkPolicy — disclosure_not_visible (TASK 2.5.4a)', () => {
  it('blocks when # โฆษณา is embedded in the middle', () => {
    const result = checkPolicy('ข้อความ # โฆษณา ส่วนต่อ\nลิงก์')
    expect(result.passed).toBe(false)
    const v = result.violations.find(x => x.code === 'disclosure_not_visible')
    expect(v).toBeDefined()
    expect(v?.severity).toBe('block')
  })

  it('blocks when # สนับสนุน is embedded in first line', () => {
    const result = checkPolicy('# สนับสนุน โปรดีมาก\nhttps://couponkum.com/product/abc')
    const v = result.violations.find(x => x.code === 'disclosure_not_visible')
    expect(v).toBeDefined()
  })

  it('does NOT flag embedded when disclosure is also at end', () => {
    // caption has disclosure embedded AND at end — disclosure_not_visible should not fire
    // because the end check passes
    const result = checkPolicy('line1 # โฆษณา line1\n# โฆษณา')
    expect(result.violations.some(v => v.code === 'disclosure_not_visible')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Health claims (TASK 2.5.4)
// ---------------------------------------------------------------------------

describe('checkPolicy — health_claim', () => {
  it('blocks "หายขาด"', () => {
    const result = checkPolicy(captionWith('ครีมนี้ทำให้หายขาดจากสิว'))
    expect(result.passed).toBe(false)
    const v = result.violations.find(x => x.code === 'health_claim')
    expect(v?.keyword).toBe('หายขาด')
    expect(v?.severity).toBe('block')
  })

  it('blocks "รักษา"', () => {
    const result = checkPolicy(captionWith('รักษาโรคผิวหนัง'))
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.keyword === 'รักษา')).toBe(true)
  })

  it('blocks "cure" (English)', () => {
    const result = checkPolicy(captionWith('guaranteed to cure acne'))
    expect(result.violations.some(v => v.code === 'health_claim')).toBe(true)
  })

  it('blocks "treat" (English)', () => {
    const result = checkPolicy(captionWith('treats skin problems'))
    expect(result.violations.some(v => v.code === 'health_claim')).toBe(true)
  })

  it('is case-insensitive', () => {
    const result = checkPolicy(captionWith('CURE skin issues'))
    expect(result.violations.some(v => v.code === 'health_claim')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Guarantee claims (TASK 2.5.4)
// ---------------------------------------------------------------------------

describe('checkPolicy — guarantee_claim', () => {
  it('blocks "การันตี"', () => {
    const result = checkPolicy(captionWith('การันตีคุ้มค่า'))
    expect(result.passed).toBe(false)
    const v = result.violations.find(x => x.keyword === 'การันตี')
    expect(v?.code).toBe('guarantee_claim')
  })

  it('blocks "รับรอง"', () => {
    const result = checkPolicy(captionWith('รับรองว่าดีที่สุด'))
    expect(result.violations.some(v => v.keyword === 'รับรอง')).toBe(true)
  })

  it('blocks "100%"', () => {
    const result = checkPolicy(captionWith('ผล 100% ชัวร์'))
    expect(result.violations.some(v => v.keyword === '100%')).toBe(true)
  })

  it('blocks "guaranteed" (English)', () => {
    const result = checkPolicy(captionWith('guaranteed best price'))
    expect(result.violations.some(v => v.keyword === 'guaranteed')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Official claim — Meta Branded Content (TASK 2.5.4a)
// ---------------------------------------------------------------------------

describe('checkPolicy — official_claim (TASK 2.5.4a)', () => {
  it('blocks "official"', () => {
    const result = checkPolicy(captionWith('official Sony store'))
    expect(result.passed).toBe(false)
    const v = result.violations.find(x => x.code === 'official_claim')
    expect(v?.keyword).toBe('official')
    expect(v?.severity).toBe('block')
  })

  it('blocks "ตัวแทน"', () => {
    const result = checkPolicy(captionWith('ตัวแทนจำหน่าย Samsung'))
    expect(result.violations.some(v => v.keyword === 'ตัวแทน')).toBe(true)
  })

  it('blocks "แบรนด์แท้"', () => {
    const result = checkPolicy(captionWith('แบรนด์แท้ ราคาพิเศษ'))
    expect(result.violations.some(v => v.keyword === 'แบรนด์แท้')).toBe(true)
  })

  it('blocks "authorized"', () => {
    const result = checkPolicy(captionWith('authorized dealer'))
    expect(result.violations.some(v => v.keyword === 'authorized')).toBe(true)
  })

  it('is case-insensitive for Official', () => {
    const result = checkPolicy(captionWith('OFFICIAL reseller'))
    expect(result.violations.some(v => v.code === 'official_claim')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Trademark / Logo flag (TASK 2.5.4a)
// ---------------------------------------------------------------------------

describe('checkPolicy — logo_trademark_flag (TASK 2.5.4a)', () => {
  it('flags known trademark but does not block', () => {
    const result = checkPolicy(CLEAN, { knownTrademarks: ['Sony'] })
    expect(result.passed).toBe(true)
    expect(result.requiresReview).toBe(true)
    const v = result.violations.find(x => x.code === 'logo_trademark_flag')
    expect(v?.severity).toBe('flag')
    expect(v?.keyword).toBe('Sony')
  })

  it('does not require review when trademark not in caption', () => {
    const result = checkPolicy(CLEAN, { knownTrademarks: ['Samsung'] })
    expect(result.requiresReview).toBe(false)
  })

  it('can flag multiple trademarks', () => {
    const caption = captionWith('Sony และ Apple ราคาดี')
    const result = checkPolicy(caption, { knownTrademarks: ['Sony', 'Apple'] })
    const flags = result.violations.filter(v => v.code === 'logo_trademark_flag')
    expect(flags).toHaveLength(2)
  })

  it('passed=true + requiresReview=true when only flag violations', () => {
    const result = checkPolicy(CLEAN, { knownTrademarks: ['Sony'] })
    expect(result.passed).toBe(true)
    expect(result.requiresReview).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Extra blacklist from caller
// ---------------------------------------------------------------------------

describe('checkPolicy — extraBlacklist option', () => {
  it('blocks custom keyword from extraBlacklist', () => {
    const result = checkPolicy(captionWith('ราคาพิเศษสุดๆ'), { extraBlacklist: ['พิเศษสุดๆ'] })
    expect(result.passed).toBe(false)
    expect(result.violations.some(v => v.keyword === 'พิเศษสุดๆ')).toBe(true)
  })

  it('does not block when extra keyword absent', () => {
    const result = checkPolicy(CLEAN, { extraBlacklist: ['พิเศษสุดๆ'] })
    expect(result.passed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Multiple violations
// ---------------------------------------------------------------------------

describe('checkPolicy — multiple violations', () => {
  it('collects all violations in one pass', () => {
    const caption = 'official การันตี หายขาด ราคา 100%'
    // No disclosure either
    const result = checkPolicy(caption)
    expect(result.passed).toBe(false)
    const codes = result.violations.map(v => v.code)
    expect(codes).toContain('official_claim')
    expect(codes).toContain('guarantee_claim')
    expect(codes).toContain('health_claim')
    expect(codes).toContain('disclosure_missing')
    expect(result.violations.length).toBeGreaterThanOrEqual(4)
  })
})

// ---------------------------------------------------------------------------
// PolicyCheckResult shape (for facebook_post_logs.meta)
// ---------------------------------------------------------------------------

describe('PolicyCheckResult shape', () => {
  it('has all required fields for DB logging', () => {
    const result: PolicyCheckResult = checkPolicy(CLEAN)
    expect(typeof result.passed).toBe('boolean')
    expect(typeof result.requiresReview).toBe('boolean')
    expect(Array.isArray(result.violations)).toBe(true)
    expect(typeof result.checkedAt).toBe('string')
  })

  it('violation has required fields', () => {
    const result = checkPolicy('การันตีผล')
    const v = result.violations[0]
    expect(v).toHaveProperty('code')
    expect(v).toHaveProperty('severity')
    expect(v).toHaveProperty('message')
  })
})
