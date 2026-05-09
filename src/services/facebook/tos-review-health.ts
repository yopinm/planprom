export type FbTosReviewStatusLevel = 'missing' | 'ok' | 'expired'

export interface FbTosReviewStatus {
  level: FbTosReviewStatusLevel
  reviewedAt: string | null
  reviewedBy: string | null
  nextReviewDueAt: string | null
  daysSinceReview: number | null
  message: string
}

const REVIEW_VALID_DAYS = 90

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86_400_000)
}

export function getFbTosReviewStatus(
  reviewedAt: string | null | undefined,
  reviewedBy: string | null | undefined,
  now: Date = new Date(),
): FbTosReviewStatus {
  const reviewedAtDate = parseDate(reviewedAt)
  const reviewer = reviewedBy?.trim() || null

  if (!reviewedAtDate || !reviewer) {
    return {
      level: 'missing',
      reviewedAt: reviewedAt ?? null,
      reviewedBy: reviewer,
      nextReviewDueAt: null,
      daysSinceReview: null,
      message: 'Meta ToS checklist must be reviewed before Graph API production posting.',
    }
  }

  const daysSinceReview = Math.floor(
    Math.max(0, now.getTime() - reviewedAtDate.getTime()) / 86_400_000,
  )
  const nextReviewDueAt = addDays(reviewedAtDate, REVIEW_VALID_DAYS).toISOString()

  if (daysSinceReview > REVIEW_VALID_DAYS) {
    return {
      level: 'expired',
      reviewedAt: reviewedAtDate.toISOString(),
      reviewedBy: reviewer,
      nextReviewDueAt,
      daysSinceReview,
      message: `Meta ToS checklist was reviewed ${daysSinceReview} days ago and must be refreshed.`,
    }
  }

  return {
    level: 'ok',
    reviewedAt: reviewedAtDate.toISOString(),
    reviewedBy: reviewer,
    nextReviewDueAt,
    daysSinceReview,
    message: `Meta ToS checklist reviewed by ${reviewer}; next review due ${nextReviewDueAt.slice(0, 10)}.`,
  }
}
