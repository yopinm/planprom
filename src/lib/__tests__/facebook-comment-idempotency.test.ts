import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { claimFacebookComment } from '@/lib/facebook-comment-idempotency'

interface DbMock {
  <T>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T>
  json: (value: unknown) => unknown
}

const dbMock = vi.hoisted(() => ({
  query: vi.fn(),
}))

vi.mock('@/lib/db', () => {
  const db = (async <T>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> => dbMock.query(strings, values) as Promise<T>) as DbMock
  db.json = (value: unknown): unknown => value
  return { db }
})

describe('facebook comment idempotency', (): void => {
  beforeEach((): void => {
    dbMock.query.mockReset()
  })

  it('claims a new comment receipt before auto-reply', async (): Promise<void> => {
    dbMock.query.mockResolvedValueOnce([{ id: 'receipt-1' }])

    await expect(
      claimFacebookComment({
        postId: 'post-1',
        fbPostId: 'fb-post-1',
        commentId: 'comment-1',
        commenterId: 'user-1',
      }),
    ).resolves.toEqual({ claimed: true, receiptId: 'receipt-1' })
  })

  it('turns unique comment_id conflicts into duplicate skips', async (): Promise<void> => {
    dbMock.query.mockRejectedValueOnce({
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    })

    await expect(
      claimFacebookComment({
        postId: 'post-1',
        fbPostId: 'fb-post-1',
        commentId: 'comment-1',
      }),
    ).resolves.toEqual({
      claimed: false,
      receiptId: null,
      reason: 'duplicate_comment',
    })
  })

  it('adds a unique persistent receipt table for comment ids', (): void => {
    const migration = readFileSync(
      join(process.cwd(), 'supabase/migrations/20260423000002_facebook_comment_idempotency.sql'),
      'utf8',
    )

    expect(migration).toContain('CREATE TABLE IF NOT EXISTS facebook_comment_receipts')
    expect(migration).toContain('CONSTRAINT facebook_comment_receipts_comment_id_key UNIQUE (comment_id)')
    expect(migration).toContain('fb_comment_receipts_admin_only')
  })
})
