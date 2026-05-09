import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '@/app/api/r/route'
import { NextRequest } from 'next/server'
import {
  getMaintenanceModeStatus,
  getRuntimeAdminControlStatus,
  logControlBlockedAttempt,
} from '@/lib/admin-control-runtime'
import type { Product } from '@/types'

// Mock dependencies
const { dbMock } = vi.hoisted(() => ({
  dbMock: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  })),
}))

vi.mock('@/lib/db', () => ({
  db: dbMock,
}))

vi.mock('@/lib/bot-detection', () => ({
  checkBotAndRateLimit: vi.fn(() => ({ allowed: true })),
}))

vi.mock('@/lib/link-health', () => ({
  getCachedHealth: vi.fn(() => null),
  refreshAsync: vi.fn(),
  assertAllowedUrl: vi.fn(),
}))

vi.mock('@/lib/analytics', () => ({
  logAnalyticsEvent: vi.fn(),
}))

vi.mock('@/lib/admin-control-runtime', () => ({
  getMaintenanceModeStatus: vi.fn(() => Promise.resolve({
    enabled: false,
    reason: 'settings_disabled',
    message: 'Maintenance Mode is disabled in admin control flags.',
  })),
  getRuntimeAdminControlStatus: vi.fn(() => Promise.resolve({
    enabled: true,
    reason: 'enabled',
    message: 'Affiliate Redirect is enabled.',
  })),
  logControlBlockedAttempt: vi.fn(() => Promise.resolve()),
}))

const mockGetMaintenanceModeStatus = vi.mocked(getMaintenanceModeStatus)
const mockGetRuntimeAdminControlStatus = vi.mocked(getRuntimeAdminControlStatus)
const mockLogControlBlockedAttempt = vi.mocked(logControlBlockedAttempt)

const tiktokProduct: Product = {
  id: '00000000-0000-0000-0000-000000000001',
  platform: 'tiktok',
  platform_id: 'tiktok-real-001',
  name: 'TikTok Real Product',
  url: 'https://www.tiktok.com/shop/p/123',
  affiliate_url: null,
  category: 'electronics',
  price_current: 100,
  price_original: null,
  price_min: null,
  price_max: null,
  shop_id: null,
  shop_name: null,
  shop_type: null,
  rating: null,
  sold_count: 0,
  image_url: null,
  is_active: true,
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
}

describe('GET /api/r (TikTok Redirect)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMock.mockReset()
    dbMock.mockResolvedValue([tiktokProduct])
    process.env.AFFILIATE_ID_TIKTOK = 'tiktok_aff_123'
    mockGetRuntimeAdminControlStatus.mockResolvedValue({
      enabled: true,
      reason: 'enabled',
      message: 'Affiliate Redirect is enabled.',
    })
    mockGetMaintenanceModeStatus.mockResolvedValue({
      enabled: false,
      reason: 'settings_disabled',
      message: 'Maintenance Mode is disabled in admin control flags.',
    })
  })

  it('redirects TikTok product with affiliate_id and sub_id', async () => {
    const url = `http://localhost/api/r?id=${tiktokProduct.id}&sub_id=fb_post_123`
    const req = new NextRequest(url)
    
    const res = await GET(req)
    
    expect(res.status).toBe(302)
    const location = res.headers.get('location')
    expect(location).toContain('tiktok.com')
    expect(location).toContain('affiliate_id=tiktok_aff_123')
    expect(location).toContain('sub_id=fb_post_123')
  })

  it('does not append affiliate_id if env is missing', async () => {
    delete process.env.AFFILIATE_ID_TIKTOK
    const url = `http://localhost/api/r?id=${tiktokProduct.id}`
    const req = new NextRequest(url)
    
    const res = await GET(req)
    
    expect(res.status).toBe(302)
    const location = res.headers.get('location')
    expect(location).not.toContain('affiliate_id=')
  })

  it('redirects to search fallback and logs when affiliate redirect is disabled', async () => {
    mockGetRuntimeAdminControlStatus.mockResolvedValue({
      enabled: false,
      reason: 'settings_disabled',
      message: 'Affiliate Redirect is disabled in admin control flags.',
    })

    const url = `http://localhost/api/r?id=${tiktokProduct.id}&sub_id=fb_post_123&q=headphones`
    const req = new NextRequest(url)

    const res = await GET(req)

    expect(res.status).toBe(302)
    const location = res.headers.get('location')
    expect(location).toContain('/search')
    expect(location).toContain('notice=affiliate_disabled')
    expect(location).toContain('q=headphones')
    expect(mockLogControlBlockedAttempt).toHaveBeenCalledWith(expect.objectContaining({
      flagKey: 'affiliate_redirect',
      route: '/api/r',
      reason: 'settings_disabled',
    }))
  })

  it('redirects to maintenance before affiliate handoff when maintenance mode is active', async () => {
    mockGetMaintenanceModeStatus.mockResolvedValue({
      enabled: true,
      reason: 'enabled',
      message: 'Maintenance Mode is enabled.',
    })

    const url = `http://localhost/api/r?id=${tiktokProduct.id}&sub_id=fb_post_123&q=headphones`
    const req = new NextRequest(url)

    const res = await GET(req)

    expect(res.status).toBe(302)
    const location = res.headers.get('location')
    expect(location).toContain('/maintenance')
    expect(location).toContain('from=api-r')
    expect(mockGetRuntimeAdminControlStatus).not.toHaveBeenCalled()
    expect(mockLogControlBlockedAttempt).toHaveBeenCalledWith(expect.objectContaining({
      flagKey: 'maintenance_mode',
      route: '/api/r',
      reason: 'enabled',
    }))
  })
})
