import { describe, it, expect, vi, afterEach } from 'vitest'
import { resolveTiktokShortLink, isTiktokShortUrl } from '../platforms/tiktok'

describe('TikTok platform helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('detects TikTok short URLs', () => {
    expect(isTiktokShortUrl('https://vt.tiktok.com/ZSabc123/')).toBe(true)
    expect(isTiktokShortUrl('https://www.tiktok.com/t/ZSxyz789/')).toBe(true)
    expect(isTiktokShortUrl('https://www.tiktok.com/view/product/7356234123456789012')).toBe(false)
  })

  it('resolves a short URL with HEAD and parses the final product URL', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue({
      url: 'https://www.tiktok.com/view/product/7356234123456789012',
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveTiktokShortLink('https://vt.tiktok.com/ZSabc123/')

    expect(fetchMock).toHaveBeenCalledWith('https://vt.tiktok.com/ZSabc123/', {
      method: 'HEAD',
      redirect: 'follow',
    })
    expect(result?.resolvedUrl).toBe('https://www.tiktok.com/view/product/7356234123456789012')
    expect(result?.parsed?.product_id).toBe('7356234123456789012')
    expect(result?.parsed?.platform).toBe('tiktok')
  })

  it('skips non-short URLs', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    vi.stubGlobal('fetch', fetchMock)

    const result = await resolveTiktokShortLink('https://www.tiktok.com/view/product/7356234123456789012')

    expect(result).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
