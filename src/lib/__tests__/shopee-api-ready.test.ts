import { describe, it, expect } from 'vitest'
import { ShopeeAdapter } from '@/services/shopee/index'
import { ManualStrategy } from '@/services/shopee/manual-strategy'
import { LiveApiStrategy } from '@/services/shopee/live-api-strategy'

describe('SHOP-API-READY-1: ShopeeAdapter strategy swap', () => {
  it('ManualStrategy source is "manual"', () => {
    const s = new ManualStrategy()
    expect(s.source).toBe('manual')
  })

  it('LiveApiStrategy source is "live_api"', () => {
    const s = new LiveApiStrategy()
    expect(s.source).toBe('live_api')
  })

  it('ShopeeAdapter uses ManualStrategy by default', () => {
    const adapter = new ShopeeAdapter()
    expect(adapter.dataSource).toBe('manual')
  })

  it('ShopeeAdapter accepts LiveApiStrategy injection', () => {
    const adapter = new ShopeeAdapter(new LiveApiStrategy())
    expect(adapter.dataSource).toBe('live_api')
  })

  it('ManualStrategy.search returns products for "iPhone"', async () => {
    const s = new ManualStrategy()
    const result = await s.search({ query: 'iPhone' })
    expect(Array.isArray(result.products)).toBe(true)
  })

  it('ManualStrategy.search returns empty for unknown query', async () => {
    const s = new ManualStrategy()
    const result = await s.search({ query: 'zzz_no_match_xyz' })
    expect(result.products).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('ManualStrategy.getProduct returns null for unknown id', async () => {
    const s = new ManualStrategy()
    const p = await s.getProduct('nonexistent_id_000')
    expect(p).toBeNull()
  })

  it('ManualStrategy.getAffiliateLink returns the original URL until approved tracking is wired', async () => {
    const s = new ManualStrategy()
    const link = await s.getAffiliateLink('https://shopee.co.th/p/123')
    expect(link).toBe('https://shopee.co.th/p/123')
  })

  it('LiveApiStrategy source is "live_api" (wired — awaits SHOPEE_APP_ID)', () => {
    const s = new LiveApiStrategy()
    expect(s.source).toBe('live_api')
  })

  it('LiveApiStrategy.getAffiliateLink returns the original URL as-is', async () => {
    const s = new LiveApiStrategy()
    const url = 'https://shopee.co.th/product/123/456'
    await expect(s.getAffiliateLink(url)).resolves.toBe(url)
  })

  it('ShopeeAdapter platform is "shopee"', () => {
    const a = new ShopeeAdapter()
    expect(a.platform).toBe('shopee')
  })
})
