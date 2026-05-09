import { describe, it, expect } from 'vitest'
import {
  TIKTOK_HOOKS,
  HOOK_CATEGORIES,
  getHooksByCategory,
  fillHook,
} from '../tiktok-hook-templates'

describe('TT-CONTENT-1: tiktok-hook-templates', () => {
  it('has exactly 20 hooks', () => {
    expect(TIKTOK_HOOKS).toHaveLength(20)
  })

  it('every hook has unique id', () => {
    const ids = TIKTOK_HOOKS.map(h => h.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every hook has all required fields', () => {
    for (const h of TIKTOK_HOOKS) {
      expect(h.id).toBeTypeOf('number')
      expect(h.category).toBeTypeOf('string')
      expect(h.category_th).toBeTypeOf('string')
      expect(h.hook.length).toBeGreaterThan(5)
      expect(h.tip.length).toBeGreaterThan(5)
    }
  })

  it('covers all 6 categories', () => {
    const covered = new Set(TIKTOK_HOOKS.map(h => h.category))
    for (const cat of HOOK_CATEGORIES) {
      expect(covered.has(cat.value)).toBe(true)
    }
  })

  it('getHooksByCategory returns correct subset', () => {
    const shocks = getHooksByCategory('price_shock')
    expect(shocks.length).toBeGreaterThanOrEqual(1)
    expect(shocks.every(h => h.category === 'price_shock')).toBe(true)
  })

  it('fillHook replaces all placeholders', () => {
    const result = fillHook('ใครกำลังจะซื้อ {{product}} ราคา {{price}} บาท', {
      product: 'iPhone 15',
      price: '23,990',
    })
    expect(result).toBe('ใครกำลังจะซื้อ iPhone 15 ราคา 23,990 บาท')
  })

  it('fillHook leaves unknown placeholders as [key]', () => {
    const result = fillHook('ซื้อ {{product}} ที่ {{platform}}', { product: 'test' })
    expect(result).toContain('[platform]')
  })

  it('fillHook returns original if no placeholders', () => {
    const text = 'hook ที่ไม่มี placeholder'
    expect(fillHook(text, {})).toBe(text)
  })
})
