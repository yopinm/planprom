import { describe, it, expect } from 'vitest'
import { buildMythbustEntry, buildMythbustSummary } from '../tiktok-mythbust'

describe('TT-MYTHBUST-1: tiktok-mythbust', () => {
  it('cheaper: actual < viral', () => {
    const entry = buildMythbustEntry('iPhone 15', 25000, 22000, ['SHOPEE10', 'ส่งฟรี'])
    expect(entry.saving_vs_viral).toBe(3000)
    expect(entry.label).toContain('ถูกกว่า')
  })

  it('same: actual == viral', () => {
    const entry = buildMythbustEntry('Sony XM5', 8000, 8000, [])
    expect(entry.saving_vs_viral).toBe(0)
    expect(entry.label).toContain('เท่ากับ')
  })

  it('pricier: actual > viral', () => {
    const entry = buildMythbustEntry('กระเป๋า', 500, 650, [])
    expect(entry.saving_vs_viral).toBe(0)
    expect(entry.label).toContain('แพงกว่า')
  })

  it('saving_vs_viral never negative', () => {
    const entry = buildMythbustEntry('X', 100, 200, [])
    expect(entry.saving_vs_viral).toBeGreaterThanOrEqual(0)
  })

  it('buildMythbustSummary verdict cheaper', () => {
    const entry = buildMythbustEntry('A', 1000, 700, ['CODE1'])
    const s = buildMythbustSummary(entry)
    expect(s.verdict).toBe('cheaper')
    expect(s.claim).toContain('1,000')
    expect(s.reality).toContain('700')
    expect(s.reality).toContain('CODE1')
  })

  it('buildMythbustSummary verdict pricier', () => {
    const entry = buildMythbustEntry('B', 500, 600, [])
    const s = buildMythbustSummary(entry)
    expect(s.verdict).toBe('pricier')
  })

  it('buildMythbustSummary verdict same', () => {
    const entry = buildMythbustEntry('C', 999, 999, [])
    const s = buildMythbustSummary(entry)
    expect(s.verdict).toBe('same')
  })

  it('no coupons: reality does not mention coupon stacking', () => {
    const entry = buildMythbustEntry('D', 2000, 1800, [])
    const s = buildMythbustSummary(entry)
    expect(s.reality).not.toContain('ชั้น')
  })
})
