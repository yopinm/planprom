import { describe, expect, it, vi, beforeEach } from 'vitest'

import { GET } from '../route'
import { getAdminUser } from '@/lib/admin-auth'

interface DbMock {
  <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>
}

const dbMock = vi.hoisted(() => ({
  query: vi.fn(),
}))

vi.mock('@/lib/admin-auth', () => ({
  getAdminUser: vi.fn(),
}))

vi.mock('@/lib/db', () => {
  const db = (async <T>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> => dbMock.query(strings, values) as Promise<T>) as DbMock
  return { db }
})

function mockTableQueries(presentTables: Record<string, number>): void {
  dbMock.query.mockResolvedValue(
    Object.entries(presentTables).map(([relname, rows]) => ({
      relname,
      n_live_tup: rows,
    })),
  )
}

describe('GET /api/admin/db-preflight', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMock.query.mockReset()
  })

  it('returns 401 without an admin session', async () => {
    vi.mocked(getAdminUser).mockResolvedValue(null)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json).toEqual({ error: 'Unauthorized' })
  })

  it('returns ok true when all required tables exist', async () => {
    vi.mocked(getAdminUser).mockResolvedValue('admin-user')
    mockTableQueries({
      products: 10,
      coupons: 20,
      click_logs: 30,
      revenue_tracking: 40,
      user_profiles: 50,
    })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(json.missing).toEqual([])
    expect(json.tables).toContainEqual({ name: 'products', rows: 10 })
    expect(typeof json.checked_at).toBe('string')
  })

  it('returns missing tables when required tables are absent', async () => {
    vi.mocked(getAdminUser).mockResolvedValue('admin-user')
    mockTableQueries({
      products: 10,
      coupons: 20,
      user_profiles: 50,
    })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(false)
    expect(json.missing).toEqual(['click_logs', 'revenue_tracking'])
  })

  it('returns ok false with error message when the Supabase client throws', async () => {
    vi.mocked(getAdminUser).mockResolvedValue('admin-user')
    dbMock.query.mockRejectedValueOnce(new Error('connection refused'))

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.ok).toBe(false)
    expect(json.error).toBe('connection refused')
  })
})
