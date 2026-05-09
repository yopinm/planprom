export type FacebookRateLimitScope = 'publish' | 'auto_reply'

export type FacebookRateLimitCode =
  | 'daily_post_limit'
  | 'post_gap_limit'
  | 'duplicate_product_24h'
  | 'daily_reply_limit'
  | 'post_reply_limit'

export interface FacebookRateLimitViolation {
  code: FacebookRateLimitCode
  scope: FacebookRateLimitScope
  limit: number
  actual: number
  message: string
}

export interface FacebookPublishRateInput {
  publishedTodayCount: number
  maxPerDay: number
  hoursSinceLastPublished: number | null
  minGapHours: number
  productPublished24hCount: number
}

export interface FacebookReplyRateInput {
  repliesTodayCount: number
  maxRepliesPerDay: number
  repliesOnPostTodayCount: number
  maxRepliesPerPostPerDay: number
}

export interface FacebookRateGuardResult {
  allowed: boolean
  violations: FacebookRateLimitViolation[]
}

export const DEFAULT_FACEBOOK_MAX_POSTS_PER_DAY = 3
export const DEFAULT_FACEBOOK_MIN_GAP_HOURS = 4
export const DEFAULT_FACEBOOK_MAX_REPLIES_PER_DAY = 20
export const DEFAULT_FACEBOOK_MAX_REPLIES_PER_POST_PER_DAY = 5

export const DEFAULT_FACEBOOK_MAX_POSTS_WEEKEND = 4
export const DEFAULT_FACEBOOK_MAX_POSTS_CAMPAIGN = 5
export const DEFAULT_FACEBOOK_MIN_GAP_HOURS_CAMPAIGN = 3

export const DEFAULT_PRIME_SLOTS_WEEKDAY  = ['11:00', '17:00', '21:00']
export const DEFAULT_PRIME_SLOTS_WEEKEND  = ['09:00', '13:00', '17:00', '21:00']
export const DEFAULT_PRIME_SLOTS_CAMPAIGN = ['09:00', '12:00', '15:30', '19:00', '22:00']

export type DayMode = 'weekday' | 'weekend' | 'campaign'

/** จาก Date + campaign flag → DayMode; campaign always wins */
export function resolveDayMode(date: Date, campaignEnabled: boolean): DayMode {
  if (campaignEnabled) return 'campaign'
  const dow = date.getDay() // 0=Sun, 6=Sat
  return dow === 0 || dow === 6 ? 'weekend' : 'weekday'
}

export interface FacebookSchedule {
  mode:         DayMode
  maxPerDay:    number
  minGapHours:  number
  slots:        string[]
}

/** เลือก schedule ที่ถูกตาม DayMode */
export function resolveFacebookSchedule(
  settings: {
    max_per_day?: number | null
    min_gap_hours?: number | null
    prime_time_slots?: string[] | null
    max_per_day_weekend?: number | null
    prime_time_slots_weekend?: string[] | null
    campaign_mode_enabled?: boolean | null
    max_per_day_campaign?: number | null
    min_gap_hours_campaign?: number | null
    prime_time_slots_campaign?: string[] | null
  } | null,
  date: Date = new Date(),
): FacebookSchedule {
  const campaignEnabled = settings?.campaign_mode_enabled ?? false
  const mode = resolveDayMode(date, campaignEnabled)

  if (mode === 'campaign') {
    return {
      mode,
      maxPerDay:   positiveInteger(settings?.max_per_day_campaign,   DEFAULT_FACEBOOK_MAX_POSTS_CAMPAIGN),
      minGapHours: positiveInteger(settings?.min_gap_hours_campaign, DEFAULT_FACEBOOK_MIN_GAP_HOURS_CAMPAIGN),
      slots:       settings?.prime_time_slots_campaign?.length ? settings.prime_time_slots_campaign : DEFAULT_PRIME_SLOTS_CAMPAIGN,
    }
  }

  if (mode === 'weekend') {
    return {
      mode,
      maxPerDay:   positiveInteger(settings?.max_per_day_weekend, DEFAULT_FACEBOOK_MAX_POSTS_WEEKEND),
      minGapHours: Math.max(DEFAULT_FACEBOOK_MIN_GAP_HOURS, positiveInteger(settings?.min_gap_hours, DEFAULT_FACEBOOK_MIN_GAP_HOURS)),
      slots:       settings?.prime_time_slots_weekend?.length ? settings.prime_time_slots_weekend : DEFAULT_PRIME_SLOTS_WEEKEND,
    }
  }

  return {
    mode,
    maxPerDay:   positiveInteger(settings?.max_per_day,   DEFAULT_FACEBOOK_MAX_POSTS_PER_DAY),
    minGapHours: Math.max(DEFAULT_FACEBOOK_MIN_GAP_HOURS, positiveInteger(settings?.min_gap_hours, DEFAULT_FACEBOOK_MIN_GAP_HOURS)),
    slots:       settings?.prime_time_slots?.length ? settings.prime_time_slots : DEFAULT_PRIME_SLOTS_WEEKDAY,
  }
}

function positiveInteger(value: number | null | undefined, fallback: number): number {
  if (!Number.isFinite(value) || value === null || value === undefined) return fallback
  return Math.max(1, Math.floor(value))
}

export function resolveFacebookPostLimits(settings?: {
  max_per_day?: number | null
  min_gap_hours?: number | null
} | null): { maxPerDay: number; minGapHours: number } {
  return {
    maxPerDay: positiveInteger(settings?.max_per_day, DEFAULT_FACEBOOK_MAX_POSTS_PER_DAY),
    minGapHours: Math.max(
      DEFAULT_FACEBOOK_MIN_GAP_HOURS,
      positiveInteger(settings?.min_gap_hours, DEFAULT_FACEBOOK_MIN_GAP_HOURS),
    ),
  }
}

export function resolveFacebookReplyLimits(): {
  maxRepliesPerDay: number
  maxRepliesPerPostPerDay: number
} {
  return {
    maxRepliesPerDay: positiveInteger(
      Number.parseInt(process.env.FB_MAX_AUTO_REPLIES_PER_DAY ?? '', 10),
      DEFAULT_FACEBOOK_MAX_REPLIES_PER_DAY,
    ),
    maxRepliesPerPostPerDay: positiveInteger(
      Number.parseInt(process.env.FB_MAX_AUTO_REPLIES_PER_POST_PER_DAY ?? '', 10),
      DEFAULT_FACEBOOK_MAX_REPLIES_PER_POST_PER_DAY,
    ),
  }
}

export function checkFacebookPublishRateLimit(input: FacebookPublishRateInput): FacebookRateGuardResult {
  const violations: FacebookRateLimitViolation[] = []

  if (input.publishedTodayCount >= input.maxPerDay) {
    violations.push({
      code: 'daily_post_limit',
      scope: 'publish',
      limit: input.maxPerDay,
      actual: input.publishedTodayCount,
      message: `Daily Facebook post limit reached (${input.publishedTodayCount}/${input.maxPerDay}).`,
    })
  }

  if (input.hoursSinceLastPublished !== null && input.hoursSinceLastPublished < input.minGapHours) {
    violations.push({
      code: 'post_gap_limit',
      scope: 'publish',
      limit: input.minGapHours,
      actual: Math.round(input.hoursSinceLastPublished * 100) / 100,
      message: `Last Facebook post was ${input.hoursSinceLastPublished.toFixed(1)} hours ago; minimum gap is ${input.minGapHours} hours.`,
    })
  }

  if (input.productPublished24hCount > 0) {
    violations.push({
      code: 'duplicate_product_24h',
      scope: 'publish',
      limit: 0,
      actual: input.productPublished24hCount,
      message: `This product was already posted ${input.productPublished24hCount} time(s) in the last 24 hours.`,
    })
  }

  return { allowed: violations.length === 0, violations }
}

export function checkFacebookReplyRateLimit(input: FacebookReplyRateInput): FacebookRateGuardResult {
  const violations: FacebookRateLimitViolation[] = []

  if (input.repliesTodayCount >= input.maxRepliesPerDay) {
    violations.push({
      code: 'daily_reply_limit',
      scope: 'auto_reply',
      limit: input.maxRepliesPerDay,
      actual: input.repliesTodayCount,
      message: `Daily Facebook auto-reply limit reached (${input.repliesTodayCount}/${input.maxRepliesPerDay}).`,
    })
  }

  if (input.repliesOnPostTodayCount >= input.maxRepliesPerPostPerDay) {
    violations.push({
      code: 'post_reply_limit',
      scope: 'auto_reply',
      limit: input.maxRepliesPerPostPerDay,
      actual: input.repliesOnPostTodayCount,
      message: `Facebook auto-reply limit reached for this post (${input.repliesOnPostTodayCount}/${input.maxRepliesPerPostPerDay}).`,
    })
  }

  return { allowed: violations.length === 0, violations }
}

export function hoursBetween(startIso: string, end: Date): number {
  const startMs = new Date(startIso).getTime()
  if (Number.isNaN(startMs)) return 0
  return Math.max(0, (end.getTime() - startMs) / 3_600_000)
}
