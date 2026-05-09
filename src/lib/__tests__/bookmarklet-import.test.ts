import { describe, it, expect } from 'vitest'
import type { BookmarkletPayload } from '@/app/api/admin/bookmarklet-import/route'

// Validate logic mirrored from the route for unit testing
function validate(body: unknown): body is BookmarkletPayload {
  if (!body || typeof body !== 'object') return false
  const b = body as Record<string, unknown>
  if (typeof b.name !== 'string' || b.name.trim() === '') return false
  if (typeof b.price_current !== 'number' || b.price_current <= 0) return false
  if (typeof b.platform_id !== 'string' || b.platform_id.trim() === '') return false
  if (typeof b.product_url !== 'string' || !b.product_url.startsWith('https://')) return false
  return true
}

describe('ADMIN-BOOKMARKLET-1: bookmarklet-import validation', () => {
  const valid: BookmarkletPayload = {
    name: 'iPhone 15',
    price_current: 23990,
    price_original: 32900,
    platform_id: '12345_67890',
    product_url: 'https://shopee.co.th/product/12345/67890',
    image_url: 'https://cf.shopee.co.th/file/abc.jpg',
    shop_name: 'Apple Store TH',
  }

  it('accepts valid payload', () => {
    expect(validate(valid)).toBe(true)
  })

  it('rejects missing name', () => {
    expect(validate({ ...valid, name: '' })).toBe(false)
  })

  it('rejects price_current = 0', () => {
    expect(validate({ ...valid, price_current: 0 })).toBe(false)
  })

  it('rejects negative price', () => {
    expect(validate({ ...valid, price_current: -100 })).toBe(false)
  })

  it('rejects non-https product_url', () => {
    expect(validate({ ...valid, product_url: 'http://shopee.co.th/x' })).toBe(false)
  })

  it('rejects missing platform_id', () => {
    expect(validate({ ...valid, platform_id: '  ' })).toBe(false)
  })

  it('accepts null price_original (no markup shown)', () => {
    expect(validate({ ...valid, price_original: null })).toBe(true)
  })

  it('rejects non-object body', () => {
    expect(validate(null)).toBe(false)
    expect(validate('string')).toBe(false)
    expect(validate(42)).toBe(false)
  })
})
