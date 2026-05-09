// src/lib/__tests__/post-score.test.ts
// TASK 2.5.2 — Post Score Engine unit tests

import { describe, it, expect } from 'vitest'
import { calculatePostScore } from '@/lib/post-score'
import type { PostScoreInput } from '@/lib/post-score'
import type { CampaignContext } from '@/lib/campaign-context'

const normalCtx: CampaignContext  = { type: 'normal',      label: 'ปกติ',         month: 'เม.ย.' }
const paydayCtx: CampaignContext  = { type: 'payday',      label: 'วันเงินเดือน', month: 'เม.ย.' }
const doubleCtx: CampaignContext  = { type: 'double_date', label: '04.04 ดีลพิเศษ', month: 'เม.ย.' }
const monthCtx: CampaignContext   = { type: 'month_start', label: 'ต้นเดือน',     month: 'เม.ย.' }
const peakCtx: CampaignContext    = { type: 'peak_traffic', label: '11.11 คุ้มสุดแห่งปี', month: 'พ.ย.' }

function input(overrides: Partial<PostScoreInput> = {}): PostScoreInput {
  return {
    dealScore:        80,
    reliabilityScore: 70,
    trustworthy:      true,
    rareScore:        60,
    campaignContext:  normalCtx,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Formula correctness
// ---------------------------------------------------------------------------

describe('calculatePostScore — formula', () => {
  it('computes weighted sum correctly for normal context', () => {
    // deal=80*0.4=32, reliability=70*0.3=21, rare=60*0.2=12, boost=0 → 65
    const result = calculatePostScore(input())
    expect(result.score).toBe(65)
    expect(result.breakdown.dealComponent).toBeCloseTo(32, 1)
    expect(result.breakdown.reliabilityComponent).toBeCloseTo(21, 1)
    expect(result.breakdown.rareComponent).toBeCloseTo(12, 1)
    expect(result.breakdown.campaignBoost).toBe(0)
  })

  it('returns REVIEW for score 65 (trustworthy, normal)', () => {
    const result = calculatePostScore(input())
    expect(result.recommendation).toBe('REVIEW')
  })

  it('returns PUBLISH when score >= 70', () => {
    // deal=100*0.4=40, reliability=100*0.3=30, rare=100*0.2=20, boost=0 → 90
    const result = calculatePostScore(input({ dealScore: 100, reliabilityScore: 100, rareScore: 100 }))
    expect(result.score).toBe(90)
    expect(result.recommendation).toBe('PUBLISH')
  })

  it('returns SKIP when score < 40', () => {
    // deal=20*0.4=8, reliability=20*0.3=6, rare=20*0.2=4 → 18
    const result = calculatePostScore(input({ dealScore: 20, reliabilityScore: 20, rareScore: 20 }))
    expect(result.score).toBe(18)
    expect(result.recommendation).toBe('SKIP')
  })

  it('returns exact score=40 as REVIEW (boundary)', () => {
    // deal=50*0.4=20, reliability=50*0.3=15, rare=25*0.2=5 → 40
    const result = calculatePostScore(input({ dealScore: 50, reliabilityScore: 50, rareScore: 25 }))
    expect(result.score).toBe(40)
    expect(result.recommendation).toBe('REVIEW')
  })

  it('returns exact score=70 as PUBLISH (boundary)', () => {
    // deal=87.5*0.4=35, reliability=83.33*0.3=25, rare=50*0.2=10 → 70
    const result = calculatePostScore(input({
      dealScore: 87.5,
      reliabilityScore: 83.33,
      rareScore: 50,
    }))
    expect(result.score).toBe(70)
    expect(result.recommendation).toBe('PUBLISH')
  })
})

// ---------------------------------------------------------------------------
// Campaign boost
// ---------------------------------------------------------------------------

describe('calculatePostScore — campaign boost', () => {
  it('adds +8 for payday', () => {
    // base: deal=80*0.4+reliability=70*0.3+rare=60*0.2=65, +8=73
    const result = calculatePostScore(input({ campaignContext: paydayCtx }))
    expect(result.score).toBe(73)
    expect(result.breakdown.campaignBoost).toBe(8)
    expect(result.recommendation).toBe('PUBLISH')
  })

  it('adds +10 for double_date', () => {
    // base 65 + 10 = 75
    const result = calculatePostScore(input({ campaignContext: doubleCtx }))
    expect(result.score).toBe(75)
    expect(result.breakdown.campaignBoost).toBe(10)
    expect(result.recommendation).toBe('PUBLISH')
  })

  it('adds +5 for month_start', () => {
    // base 65 + 5 = 70
    const result = calculatePostScore(input({ campaignContext: monthCtx }))
    expect(result.score).toBe(70)
    expect(result.breakdown.campaignBoost).toBe(5)
    expect(result.recommendation).toBe('PUBLISH')
  })

  it('adds +10 for peak_traffic', () => {
    const result = calculatePostScore(input({ campaignContext: peakCtx }))
    expect(result.score).toBe(75)
    expect(result.breakdown.campaignBoost).toBe(10)
  })

  it('adds +0 for normal context', () => {
    const result = calculatePostScore(input({ campaignContext: normalCtx }))
    expect(result.breakdown.campaignBoost).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Trust filter
// ---------------------------------------------------------------------------

describe('calculatePostScore — trustworthy flag', () => {
  it('returns SKIP immediately when !trustworthy regardless of high score', () => {
    const result = calculatePostScore(input({ trustworthy: false, dealScore: 100, reliabilityScore: 100, rareScore: 100 }))
    expect(result.recommendation).toBe('SKIP')
  })

  it('reason mentions Merchant Trust Filter when !trustworthy', () => {
    const result = calculatePostScore(input({ trustworthy: false }))
    expect(result.reason).toContain('Merchant Trust Filter')
  })

  it('!trustworthy with low score is still SKIP', () => {
    const result = calculatePostScore(input({ trustworthy: false, dealScore: 10, reliabilityScore: 10, rareScore: 10 }))
    expect(result.recommendation).toBe('SKIP')
  })
})

// ---------------------------------------------------------------------------
// Score capping + clamping
// ---------------------------------------------------------------------------

describe('calculatePostScore — edge cases', () => {
  it('caps score at 100 even with maximum inputs + boost', () => {
    const result = calculatePostScore(input({
      dealScore: 100,
      reliabilityScore: 100,
      rareScore: 100,
      campaignContext: doubleCtx,
    }))
    // 40+30+20+10 = 100 — exactly at cap
    expect(result.score).toBe(100)
    expect(result.recommendation).toBe('PUBLISH')
  })

  it('clamps negative dealScore to 0', () => {
    const result = calculatePostScore(input({ dealScore: -50 }))
    expect(result.breakdown.dealComponent).toBe(0)
  })

  it('clamps dealScore > 100 to 100', () => {
    const result = calculatePostScore(input({ dealScore: 150 }))
    expect(result.breakdown.dealComponent).toBe(40)
  })

  it('handles zero scores gracefully', () => {
    const result = calculatePostScore(input({ dealScore: 0, reliabilityScore: 0, rareScore: 0 }))
    expect(result.score).toBe(0)
    expect(result.recommendation).toBe('SKIP')
  })

  it('uses getCampaignContext() when no campaignContext provided', () => {
    const inp: PostScoreInput = {
      dealScore: 80,
      reliabilityScore: 70,
      trustworthy: true,
      rareScore: 60,
    }
    const result = calculatePostScore(inp)
    // Should not throw; score is a number
    expect(typeof result.score).toBe('number')
    expect(['PUBLISH', 'REVIEW', 'SKIP']).toContain(result.recommendation)
  })
})

// ---------------------------------------------------------------------------
// Reason text
// ---------------------------------------------------------------------------

describe('calculatePostScore — reason text', () => {
  it('PUBLISH reason includes score and label for peak context', () => {
    const result = calculatePostScore(input({ dealScore: 90, reliabilityScore: 90, rareScore: 90, campaignContext: paydayCtx }))
    expect(result.recommendation).toBe('PUBLISH')
    expect(result.reason).toContain('แนะนำโพสต์ทันที')
    expect(result.reason).toContain('วันเงินเดือน')
  })

  it('REVIEW reason includes "รอ Admin"', () => {
    const result = calculatePostScore(input())
    expect(result.recommendation).toBe('REVIEW')
    expect(result.reason).toContain('รอ Admin')
  })

  it('SKIP reason includes "ไม่แนะนำ"', () => {
    const result = calculatePostScore(input({ dealScore: 10, reliabilityScore: 10, rareScore: 10 }))
    expect(result.recommendation).toBe('SKIP')
    expect(result.reason).toContain('ไม่แนะนำ')
  })
})
