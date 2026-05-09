import { describe, expect, it } from 'vitest'
import { getFbTosReviewStatus } from '@/services/facebook/tos-review-health'

const NOW = new Date('2026-04-23T12:00:00.000Z')

describe('facebook tos review health', (): void => {
  it('requires both reviewed timestamp and reviewer', (): void => {
    expect(getFbTosReviewStatus(null, 'owner', NOW).level).toBe('missing')
    expect(getFbTosReviewStatus('2026-04-23T00:00:00.000Z', null, NOW).level).toBe('missing')
  })

  it('reports ok within the 90 day review window', (): void => {
    const status = getFbTosReviewStatus('2026-04-23T00:00:00.000Z', 'owner', NOW)

    expect(status.level).toBe('ok')
    expect(status.daysSinceReview).toBe(0)
    expect(status.nextReviewDueAt).toBe('2026-07-22T00:00:00.000Z')
  })

  it('expires after the 90 day review window', (): void => {
    const status = getFbTosReviewStatus('2026-01-01T00:00:00.000Z', 'owner', NOW)

    expect(status.level).toBe('expired')
    expect(status.daysSinceReview).toBeGreaterThan(90)
  })
})
