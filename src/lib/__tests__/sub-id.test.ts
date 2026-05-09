import { describe, it, expect } from 'vitest'
import { buildSubId } from '../sub-id'

describe('buildSubId', () => {
  describe('search context', () => {
    it('uses rank in output', () => {
      expect(buildSubId('search', { rank: 1 })).toBe('search_top_1')
      expect(buildSubId('search', { rank: 5 })).toBe('search_top_5')
    })

    it('defaults rank to 1 when omitted', () => {
      expect(buildSubId('search')).toBe('search_top_1')
    })
  })

  describe('compare context', () => {
    it('includes rank and platform', () => {
      expect(buildSubId('compare', { rank: 1, platform: 'shopee' })).toBe('compare_1_shopee')
      expect(buildSubId('compare', { rank: 2, platform: 'lazada' })).toBe('compare_2_lazada')
    })

    it('omits platform suffix when not provided', () => {
      expect(buildSubId('compare', { rank: 1 })).toBe('compare_1')
    })
  })

  describe('product context', () => {
    it('returns product_hero by default', () => {
      expect(buildSubId('product')).toBe('product_hero')
    })

    it('uses custom slot', () => {
      expect(buildSubId('product', { slot: 'sidebar' })).toBe('product_sidebar')
    })
  })

  describe('landing context', () => {
    it('returns landing_hero by default', () => {
      expect(buildSubId('landing')).toBe('landing_hero')
    })

    it('uses custom slot', () => {
      expect(buildSubId('landing', { slot: 'banner' })).toBe('landing_banner')
    })
  })

  describe('rare context', () => {
    it('uses rank', () => {
      expect(buildSubId('rare', { rank: 1 })).toBe('rare_top_1')
      expect(buildSubId('rare', { rank: 3 })).toBe('rare_top_3')
    })

    it('defaults rank to 1', () => {
      expect(buildSubId('rare')).toBe('rare_top_1')
    })
  })

  describe('admin context', () => {
    it('returns fixed string', () => {
      expect(buildSubId('admin')).toBe('admin_preview')
    })
  })

  describe('output contract', () => {
    it('never returns empty string', () => {
      const contexts = ['search', 'compare', 'product', 'landing', 'rare', 'admin'] as const
      for (const ctx of contexts) {
        expect(buildSubId(ctx).length).toBeGreaterThan(0)
      }
    })

    it('never contains spaces', () => {
      expect(buildSubId('search', { rank: 2 })).not.toContain(' ')
      expect(buildSubId('compare', { rank: 1, platform: 'shopee' })).not.toContain(' ')
    })
  })
})
