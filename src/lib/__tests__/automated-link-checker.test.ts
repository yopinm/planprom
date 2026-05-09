import { describe, expect, it } from 'vitest'
import {
  getProductLinkTarget,
  summarizeProductLinkChecks,
  toProductLinkCheckResult,
  type LinkCheckProduct,
} from '@/lib/automated-link-checker'

const PRODUCT: LinkCheckProduct = {
  id:            'p1',
  url:           'https://www.lazada.co.th/products/demo.html',
  affiliate_url: null,
}

describe('TASK 3.15 automated link checker', () => {
  it('prefers affiliate_url when present', () => {
    expect(getProductLinkTarget({
      ...PRODUCT,
      affiliate_url: 'https://s.shopee.co.th/demo',
    })).toBe('https://s.shopee.co.th/demo')
  })

  it('falls back to the product url', () => {
    expect(getProductLinkTarget(PRODUCT)).toBe('https://www.lazada.co.th/products/demo.html')
  })

  it('maps link health into a persistable product check row', () => {
    expect(toProductLinkCheckResult(PRODUCT, {
      url:        PRODUCT.url,
      ok:         true,
      status:     200,
      final_url:  'https://www.lazada.co.th/products/demo.html?spm=1',
      checked_at: '2026-04-20T01:00:00.000Z',
    })).toEqual({
      product_id: 'p1',
      target_url: PRODUCT.url,
      ok:         true,
      status:     200,
      final_url:  'https://www.lazada.co.th/products/demo.html?spm=1',
      checked_at: '2026-04-20T01:00:00.000Z',
    })
  })

  it('summarizes alive and dead links', () => {
    const report = summarizeProductLinkChecks([
      {
        product_id: 'p1',
        target_url: PRODUCT.url,
        ok:         true,
        status:     200,
        final_url:  null,
        checked_at: '2026-04-20T01:00:00.000Z',
      },
      {
        product_id: 'p2',
        target_url: 'https://www.lazada.co.th/products/missing.html',
        ok:         false,
        status:     404,
        final_url:  null,
        checked_at: '2026-04-20T01:01:00.000Z',
      },
    ], new Date('2026-04-20T01:02:00.000Z'))

    expect(report).toMatchObject({
      scanned:      2,
      alive:        1,
      dead:         1,
      generated_at: '2026-04-20T01:02:00.000Z',
    })
  })
})
