import { beforeEach, describe, expect, it, vi } from 'vitest'

import { discoverTikTokTrends, syncTikTokTrends } from '../tiktok-trend-discovery'

interface DbMock {
  <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>
}

const dbMock = vi.hoisted(() => ({
  query: vi.fn(),
}))

vi.mock('@/lib/db', () => {
  const db = (async <T>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> => dbMock.query(strings, values) as Promise<T>) as DbMock
  return { db }
})

describe('TikTok Trend Discovery - TASK T.5', (): void => {
  beforeEach((): void => {
    dbMock.query.mockReset()
  })

  it('stays dormant until a real trend source is wired', (): void => {
    const trends = discoverTikTokTrends()
    expect(trends).toEqual([])
  })

  it('syncs zero rows in dormant mode', async (): Promise<void> => {
    dbMock.query.mockResolvedValue([])

    const result = await syncTikTokTrends()
    expect(result.count).toBe(0)
    expect(result.error).toBeNull()
    expect(dbMock.query).not.toHaveBeenCalled()
  })
})
