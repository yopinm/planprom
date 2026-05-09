import { describe, it, expect } from 'vitest'
import { parseDeepLink, isPlatformUrl } from '../deep-link-parser'

// =============================================================
// Shopee — standard formats
// =============================================================
describe('parseDeepLink — Shopee standard URLs', () => {
  it('parses -i.shopId.itemId format', () => {
    const url = 'https://shopee.co.th/samsung-official/galaxy-a55-5g-i.12345678.99887766'
    const result = parseDeepLink(url)
    expect(result).not.toBeNull()
    expect(result!.platform).toBe('shopee')
    expect(result!.product_id).toBe('12345678.99887766')
    expect(result!.shop_id).toBe('12345678')
    expect(result!.is_short_url).toBe(false)
  })

  it('parses /product/shopId/itemId format', () => {
    const url = 'https://shopee.co.th/product/11111/22222'
    const result = parseDeepLink(url)
    expect(result!.platform).toBe('shopee')
    expect(result!.product_id).toBe('11111.22222')
    expect(result!.shop_id).toBe('11111')
    expect(result!.is_short_url).toBe(false)
  })

  it('detects category from Shopee slug — samsung → มือถือ', () => {
    const url = 'https://shopee.co.th/samsung-official/samsung-galaxy-s24-i.9999.1234'
    const result = parseDeepLink(url)
    expect(result!.category).toBe('มือถือ')
  })

  it('detects category from Shopee slug — nike → กีฬา', () => {
    const url = 'https://shopee.co.th/nike-store/nike-air-max-270-i.5555.6666'
    const result = parseDeepLink(url)
    expect(result!.category).toBe('กีฬา')
  })

  it('detects category from Shopee slug — airpods → อิเล็กทรอนิกส์', () => {
    const url = 'https://shopee.co.th/apple-store/airpods-pro-3rd-gen-i.1111.2222'
    const result = parseDeepLink(url)
    expect(result!.category).toBe('อิเล็กทรอนิกส์')
  })

  it('returns undefined category when slug has no keywords', () => {
    const url = 'https://shopee.co.th/some-shop/some-random-item-i.1234.5678'
    const result = parseDeepLink(url)
    expect(result!.platform).toBe('shopee')
    expect(result!.category).toBeUndefined()
  })

  it('raw_url preserved', () => {
    const url = 'https://shopee.co.th/product/100/200'
    const result = parseDeepLink(url)
    expect(result!.raw_url).toBe(url)
  })
})

// =============================================================
// Shopee — short URL
// =============================================================
describe('parseDeepLink — Shopee short URL', () => {
  it('recognizes shp.ee short URL', () => {
    const url = 'https://shp.ee/abc123xyz'
    const result = parseDeepLink(url)
    expect(result).not.toBeNull()
    expect(result!.platform).toBe('shopee')
    expect(result!.is_short_url).toBe(true)
    expect(result!.product_id).toBeUndefined()
    expect(result!.shop_id).toBeUndefined()
    expect(result!.category).toBeUndefined()
  })
})

// =============================================================
// Lazada — standard formats
// =============================================================
describe('parseDeepLink — Lazada standard URLs', () => {
  it('parses -i{itemId}s{skuId}.html format', () => {
    const url = 'https://www.lazada.co.th/products/nike-air-max-270-i1234567s5678901.html'
    const result = parseDeepLink(url)
    expect(result).not.toBeNull()
    expect(result!.platform).toBe('lazada')
    expect(result!.product_id).toBe('1234567')
    expect(result!.shop_id).toBeUndefined()
    expect(result!.is_short_url).toBe(false)
  })

  it('parses ?id={itemId} query param format', () => {
    const url = 'https://www.lazada.co.th/products/some-product.html?id=9999999'
    const result = parseDeepLink(url)
    expect(result!.platform).toBe('lazada')
    expect(result!.product_id).toBe('9999999')
  })

  it('parses &id= nested param format', () => {
    const url = 'https://www.lazada.co.th/products/some-product.html?ref=abc&id=8888888'
    const result = parseDeepLink(url)
    expect(result!.product_id).toBe('8888888')
  })

  it('detects category from Lazada slug — nike → กีฬา', () => {
    const url = 'https://www.lazada.co.th/products/nike-air-max-270-i1234567s5678901.html'
    const result = parseDeepLink(url)
    expect(result!.category).toBe('กีฬา')
  })

  it('detects category from Lazada slug — samsung → มือถือ', () => {
    const url = 'https://www.lazada.co.th/products/samsung-galaxy-s24-ultra-i111s222.html'
    const result = parseDeepLink(url)
    expect(result!.category).toBe('มือถือ')
  })

  it('detects category from Lazada slug — macbook → อิเล็กทรอนิกส์', () => {
    const url = 'https://www.lazada.co.th/products/apple-macbook-air-m3-i777s888.html'
    const result = parseDeepLink(url)
    expect(result!.category).toBe('อิเล็กทรอนิกส์')
  })

  it('returns undefined category when slug has no keywords', () => {
    const url = 'https://www.lazada.co.th/products/some-mystery-item-i12345s67890.html'
    const result = parseDeepLink(url)
    expect(result!.category).toBeUndefined()
  })

  it('raw_url preserved', () => {
    const url = 'https://www.lazada.co.th/products/item.html?id=123'
    const result = parseDeepLink(url)
    expect(result!.raw_url).toBe(url)
  })
})

// =============================================================
// Lazada — short URL
// =============================================================
describe('parseDeepLink — Lazada short URL', () => {
  it('recognizes s.lazada.co.th short URL', () => {
    const url = 'https://s.lazada.co.th/s.abc123'
    const result = parseDeepLink(url)
    expect(result).not.toBeNull()
    expect(result!.platform).toBe('lazada')
    expect(result!.is_short_url).toBe(true)
    expect(result!.product_id).toBeUndefined()
    expect(result!.category).toBeUndefined()
  })
})

// =============================================================
// Unknown / non-platform URLs
// =============================================================
describe('parseDeepLink — non-platform URLs', () => {
  it('returns null for unknown platform', () => {
    expect(parseDeepLink('https://www.amazon.com/dp/B09HJCNZ9D')).toBeNull()
  })

  it('returns null for non-URL string', () => {
    expect(parseDeepLink('Samsung Galaxy A55')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseDeepLink('')).toBeNull()
  })
})

// =============================================================
// isPlatformUrl helper
// =============================================================
describe('isPlatformUrl', () => {
  it('returns true for shopee.co.th', () => {
    expect(isPlatformUrl('https://shopee.co.th/product/1/2')).toBe(true)
  })

  it('returns true for lazada.co.th', () => {
    expect(isPlatformUrl('https://www.lazada.co.th/products/item-i1s2.html')).toBe(true)
  })

  it('returns true for shp.ee', () => {
    expect(isPlatformUrl('https://shp.ee/abc')).toBe(true)
  })

  it('returns true for s.lazada.co.th', () => {
    expect(isPlatformUrl('https://s.lazada.co.th/s.xyz')).toBe(true)
  })

  it('returns false for non-platform URL', () => {
    expect(isPlatformUrl('https://www.google.com')).toBe(false)
  })

  it('returns false for plain text', () => {
    expect(isPlatformUrl('Samsung Galaxy A55')).toBe(false)
  })
})

// =============================================================
// Integration: intent-parser delegates to deep-link-parser
// =============================================================
describe('parseDeepLink — integration with intent-parser behavior', () => {
  it('Shopee URL returns category + product_id (no longer lost)', () => {
    const url = 'https://shopee.co.th/apple-store/iphone-15-pro-max-i.1111.2222'
    const result = parseDeepLink(url)
    expect(result!.product_id).toBe('1111.2222')
    expect(result!.category).toBe('มือถือ')
  })

  it('Lazada URL returns category + product_id', () => {
    const url = 'https://www.lazada.co.th/products/sony-wh1000xm5-i99s88.html'
    const result = parseDeepLink(url)
    expect(result!.product_id).toBe('99')
    expect(result!.category).toBe('อิเล็กทรอนิกส์')
  })
})

// =============================================================
// TikTok — standard formats
// =============================================================
describe('parseDeepLink — TikTok standard URLs', () => {
  it('parses /@user/video/{videoId} format', () => {
    const url = 'https://www.tiktok.com/@someuser/video/7356234123456789012'
    const result = parseDeepLink(url)
    expect(result).not.toBeNull()
    expect(result!.platform).toBe('tiktok')
    expect(result!.product_id).toBe('7356234123456789012')
    expect(result!.is_short_url).toBe(false)
  })

  it('parses /view/product/{productId} format', () => {
    const url = 'https://www.tiktok.com/view/product/1729384756283746562'
    const result = parseDeepLink(url)
    expect(result!.platform).toBe('tiktok')
    expect(result!.product_id).toBe('1729384756283746562')
    expect(result!.is_short_url).toBe(false)
  })

  it('detects category from TikTok video URL — iphone → มือถือ', () => {
    const url = 'https://www.tiktok.com/@reviewer/video/12345?q=iphone-15-review'
    const result = parseDeepLink(url)
    expect(result!.category).toBe('มือถือ')
  })

  it('detects category from TikTok shop URL — samsung → มือถือ', () => {
    const url = 'https://www.tiktok.com/view/product/12345?name=samsung-galaxy-s24'
    const result = parseDeepLink(url)
    expect(result!.category).toBe('มือถือ')
  })
})

// =============================================================
// TikTok — short URL
// =============================================================
describe('parseDeepLink — TikTok short URL', () => {
  it('recognizes vt.tiktok.com short URL', () => {
    const url = 'https://vt.tiktok.com/ZSabc123/'
    const result = parseDeepLink(url)
    expect(result).not.toBeNull()
    expect(result!.platform).toBe('tiktok')
    expect(result!.is_short_url).toBe(true)
  })

  it('recognizes tiktok.com/t/ short URL', () => {
    const url = 'https://www.tiktok.com/t/ZSxyz789/'
    const result = parseDeepLink(url)
    expect(result!.platform).toBe('tiktok')
    expect(result!.is_short_url).toBe(true)
  })
})

// =============================================================
// isPlatformUrl helper — TikTok
// =============================================================
describe('isPlatformUrl — TikTok', () => {
  it('returns true for tiktok.com', () => {
    expect(isPlatformUrl('https://www.tiktok.com/@user/video/1')).toBe(true)
  })

  it('returns true for vt.tiktok.com', () => {
    expect(isPlatformUrl('https://vt.tiktok.com/abc/')).toBe(true)
  })
})
