// REV-02: retry utility tests

import { describe, it, expect, vi } from 'vitest'
import { withRetry, TransientApiError } from '@/lib/api-retry'

describe('withRetry', () => {
  it('returns result immediately on success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { maxRetries: 2, baseDelayMs: 0, label: 'test' })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on TransientApiError and succeeds on second attempt', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TransientApiError(503, 'Service Unavailable'))
      .mockResolvedValue('ok')
    const result = await withRetry(fn, { maxRetries: 2, baseDelayMs: 0, label: 'test' })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries up to maxRetries times then throws', async () => {
    const err = new TransientApiError(500, 'Internal Server Error')
    const fn = vi.fn().mockRejectedValue(err)
    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 0, label: 'test' })
    ).rejects.toThrow(err)
    expect(fn).toHaveBeenCalledTimes(3) // 1 initial + 2 retries
  })

  it('does NOT retry on non-transient errors', async () => {
    const err = new Error('Bad Request — 400')
    const fn = vi.fn().mockRejectedValue(err)
    await expect(
      withRetry(fn, { maxRetries: 2, baseDelayMs: 0, label: 'test' })
    ).rejects.toThrow(err)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on TypeError (network failure)', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValue('recovered')
    const result = await withRetry(fn, { maxRetries: 2, baseDelayMs: 0, label: 'test' })
    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
