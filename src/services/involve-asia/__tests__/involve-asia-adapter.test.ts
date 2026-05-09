import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/cron/involve-asia-import/route'
import { NextRequest } from 'next/server'
import { toProductFromOffer, isValidIaOffer } from '@/services/involve-asia/normalizer'
import type { Product } from '@/types'

const dbMock = vi.hoisted(() => vi.fn())
vi.mock('@/lib/db', () => ({ db: dbMock }))

vi.mock('@/services/involve-asia', () => ({
  involveAsiaAdapter: { syncOffers: vi.fn() },
}))

import { involveAsiaAdapter } from '@/services/involve-asia'

const CRON_SECRET = 'test-secret'

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'ia-1001',
    platform: 'shopee',
    platform_id: 'ia-1001',
    name: 'Sephora Thailand',
    url: 'https://www.sephora.co.th',
    affiliate_url: 'https://invol.co/track/1001',
    category: 'Beauty',
    price_current: 0,
    price_original: null,
    price_min: null,
    price_max: null,
    shop_id: '888',
    shop_name: 'Sephora Thailand',
    shop_type: null,
    rating: null,
    sold_count: 0,
    image_url: 'https://cdn.involve.asia/logo.jpg',
    is_active: true,
    price_checked_at: '2026-05-06T00:00:00.000Z',
    created_at: '2026-05-06T00:00:00.000Z',
    updated_at: '2026-05-06T00:00:00.000Z',
    ...overrides,
  }
}

// ──────────────────────────────────────────────
// normalizer tests
// ──────────────────────────────────────────────

describe('toProductFromOffer (IA normalizer)', () => {
  const sample = {
    offer_id: 1001,
    offer_name: 'Sephora Thailand',
    merchant_id: 888,
    tracking_link: 'https://invol.co/track/1001',
    preview_url: 'https://www.sephora.co.th',
    logo: 'https://cdn.involve.asia/logo.jpg',
    categories: [{ name: 'Beauty' }],
    commissions: [{ type: 'cps', value: 5 }],
  }

  it('maps all required Product fields', () => {
    const p = toProductFromOffer(sample, '2026-05-06T00:00:00.000Z')
    expect(p.platform).toBe('shopee')
    expect(p.platform_id).toBe('ia-1001')
    expect(p.name).toBe('Sephora Thailand')
    expect(p.affiliate_url).toBe('https://invol.co/track/1001')
    expect(p.url).toBe('https://www.sephora.co.th')
    expect(p.shop_id).toBe('888')
    expect(p.category).toBe('Beauty')
    expect(p.is_active).toBe(true)
    expect(p.price_current).toBe(0)
  })

  it('sets price_checked_at when provided', () => {
    const at = '2026-05-06T00:00:00.000Z'
    expect(toProductFromOffer(sample, at).price_checked_at).toBe(at)
  })

  it('returns null for optional missing fields', () => {
    const minimal = { offer_id: 1, offer_name: 'Test', tracking_link: 'https://invol.co/t' }
    const p = toProductFromOffer(minimal)
    expect(p.category).toBeNull()
    expect(p.image_url).toBeNull()
    expect(p.rating).toBeNull()
    expect(p.shop_id).toBeNull()
  })

  it('uses tracking_link as url when preview_url absent', () => {
    const minimal = { offer_id: 2, offer_name: 'Test', tracking_link: 'https://invol.co/t2' }
    const p = toProductFromOffer(minimal)
    expect(p.url).toBe('https://invol.co/t2')
  })
})

describe('isValidIaOffer', () => {
  it('accepts valid offer', () => {
    expect(isValidIaOffer({
      offer_id: 1,
      offer_name: 'Lazada TH',
      tracking_link: 'https://invol.co/track/lazada',
    })).toBe(true)
  })

  it('rejects offer with http tracking_link', () => {
    expect(isValidIaOffer({ offer_id: 1, offer_name: 'Test', tracking_link: 'http://invol.co/t' })).toBe(false)
  })

  it('rejects null', () => {
    expect(isValidIaOffer(null)).toBe(false)
  })

  it('rejects missing offer_name', () => {
    expect(isValidIaOffer({ offer_id: 1, offer_name: '', tracking_link: 'https://invol.co/t' })).toBe(false)
  })
})

// ──────────────────────────────────────────────
// cron route tests
// ──────────────────────────────────────────────

describe('GET /api/cron/involve-asia-import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = CRON_SECRET
  })

  it('returns 401 for missing or wrong secret', async () => {
    const r1 = await GET(new NextRequest('http://localhost/api/cron/involve-asia-import'))
    expect(r1.status).toBe(401)

    const r2 = await GET(new NextRequest('http://localhost/api/cron/involve-asia-import?secret=wrong'))
    expect(r2.status).toBe(401)
  })

  it('returns safe_mode=true when IA_REST_API_KEY is absent', async () => {
    const savedKey = process.env.IA_REST_API_KEY
    delete process.env.IA_REST_API_KEY

    const res = await GET(new NextRequest(`http://localhost/api/cron/involve-asia-import?secret=${CRON_SECRET}`))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.safe_mode).toBe(true)
    expect(typeof json.message).toBe('string')

    process.env.IA_REST_API_KEY = savedKey
  })

  it('imports new offers and returns stats', async () => {
    process.env.IA_REST_API_KEY = 'test-key'
    const product = makeProduct()
    vi.mocked(involveAsiaAdapter.syncOffers).mockResolvedValue({ offers: [product], total: 1, pagesLoaded: 1 })
    dbMock.mockResolvedValue([{ inserted: true }])

    const res = await GET(new NextRequest(`http://localhost/api/cron/involve-asia-import?secret=${CRON_SECRET}`))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.imported).toBeGreaterThan(0)
    expect(json.updated).toBe(0)
    expect(json.failed).toBe(0)
    expect(json.total_offers).toBe(1)
    delete process.env.IA_REST_API_KEY
  })

  it('counts existing offers as updated', async () => {
    process.env.IA_REST_API_KEY = 'test-key'
    vi.mocked(involveAsiaAdapter.syncOffers).mockResolvedValue({ offers: [makeProduct()], total: 1, pagesLoaded: 1 })
    dbMock.mockResolvedValue([{ inserted: false }])

    const res = await GET(new NextRequest(`http://localhost/api/cron/involve-asia-import?secret=${CRON_SECRET}`))
    const json = await res.json()
    expect(json.updated).toBeGreaterThan(0)
    expect(json.imported).toBe(0)
    delete process.env.IA_REST_API_KEY
  })

  it('increments failed when upsert throws', async () => {
    process.env.IA_REST_API_KEY = 'test-key'
    vi.mocked(involveAsiaAdapter.syncOffers).mockResolvedValue({ offers: [makeProduct()], total: 1, pagesLoaded: 1 })
    dbMock.mockRejectedValue(new Error('DB error'))

    const res = await GET(new NextRequest(`http://localhost/api/cron/involve-asia-import?secret=${CRON_SECRET}`))
    const json = await res.json()
    expect(json.failed).toBeGreaterThan(0)
    delete process.env.IA_REST_API_KEY
  })

  it('returns duration_ms in response', async () => {
    process.env.IA_REST_API_KEY = 'test-key'
    vi.mocked(involveAsiaAdapter.syncOffers).mockResolvedValue({ offers: [], total: 0, pagesLoaded: 0 })

    const res = await GET(new NextRequest(`http://localhost/api/cron/involve-asia-import?secret=${CRON_SECRET}`))
    const json = await res.json()
    expect(typeof json.duration_ms).toBe('number')
    delete process.env.IA_REST_API_KEY
  })
})
