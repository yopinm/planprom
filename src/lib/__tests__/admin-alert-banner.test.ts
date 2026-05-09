import { describe, it, expect } from 'vitest'
import { computePostbackFailRate } from '../postback-fail-rate'

describe('ADMIN-ALERT-BANNER-1: computePostbackFailRate', () => {
  it('returns 0 when no data', () => {
    expect(computePostbackFailRate(0, 0)).toBe(0)
  })

  it('returns 0 when all success', () => {
    expect(computePostbackFailRate(100, 0)).toBe(0)
  })

  it('returns 100 when all blocked', () => {
    expect(computePostbackFailRate(0, 50)).toBe(100)
  })

  it('calculates rate correctly', () => {
    expect(computePostbackFailRate(9, 1)).toBeCloseTo(10)
  })

  it('does not trigger at exactly 5%', () => {
    const rate = computePostbackFailRate(95, 5)
    expect(rate).toBeCloseTo(5)
    expect(rate > 5).toBe(false)
  })

  it('triggers above 5%', () => {
    expect(computePostbackFailRate(94, 6)).toBeGreaterThan(5)
  })

  it('banner shown: brokenLinks > 10 triggers regardless of postback rate', () => {
    const brokenLinks = 11
    const postbackFailRate = 0
    expect(brokenLinks > 10 || postbackFailRate > 5).toBe(true)
  })

  it('banner shown: postback fail rate > 5% triggers regardless of broken links', () => {
    const brokenLinks = 0
    const postbackFailRate = computePostbackFailRate(94, 6)
    expect(brokenLinks > 10 || postbackFailRate > 5).toBe(true)
  })

  it('banner hidden when both conditions clear', () => {
    const brokenLinks = 10
    const postbackFailRate = computePostbackFailRate(95, 5)
    expect(brokenLinks > 10 || postbackFailRate > 5).toBe(false)
  })
})
