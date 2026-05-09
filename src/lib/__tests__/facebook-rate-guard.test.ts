import { afterEach, describe, expect, it } from 'vitest'
import {
  checkFacebookPublishRateLimit,
  checkFacebookReplyRateLimit,
  hoursBetween,
  resolveFacebookPostLimits,
  resolveFacebookReplyLimits,
  resolveDayMode,
  resolveFacebookSchedule,
  DEFAULT_PRIME_SLOTS_WEEKDAY,
  DEFAULT_PRIME_SLOTS_WEEKEND,
  DEFAULT_PRIME_SLOTS_CAMPAIGN,
} from '@/lib/facebook-rate-guard'

const ORIGINAL_ENV = { ...process.env }

afterEach((): void => {
  process.env = { ...ORIGINAL_ENV }
})

describe('facebook rate guard', (): void => {
  it('enforces daily post, gap, and duplicate product limits', (): void => {
    const result = checkFacebookPublishRateLimit({
      publishedTodayCount: 3,
      maxPerDay: 3,
      hoursSinceLastPublished: 2,
      minGapHours: 4,
      productPublished24hCount: 1,
    })

    expect(result.allowed).toBe(false)
    expect(result.violations.map(v => v.code)).toEqual([
      'daily_post_limit',
      'post_gap_limit',
      'duplicate_product_24h',
    ])
  })

  it('allows publish when under all limits', (): void => {
    const result = checkFacebookPublishRateLimit({
      publishedTodayCount: 2,
      maxPerDay: 3,
      hoursSinceLastPublished: 5,
      minGapHours: 4,
      productPublished24hCount: 0,
    })

    expect(result.allowed).toBe(true)
    expect(result.violations).toEqual([])
  })

  it('enforces daily and per-post auto-reply limits', (): void => {
    const result = checkFacebookReplyRateLimit({
      repliesTodayCount: 20,
      maxRepliesPerDay: 20,
      repliesOnPostTodayCount: 5,
      maxRepliesPerPostPerDay: 5,
    })

    expect(result.allowed).toBe(false)
    expect(result.violations.map(v => v.code)).toEqual(['daily_reply_limit', 'post_reply_limit'])
  })

  it('normalizes settings to conservative defaults', (): void => {
    expect(resolveFacebookPostLimits({ max_per_day: 8, min_gap_hours: 1 })).toEqual({
      maxPerDay: 8,
      minGapHours: 4,
    })
    expect(resolveFacebookPostLimits(null)).toEqual({
      maxPerDay: 3,
      minGapHours: 4,
    })
  })

  it('reads auto-reply caps from env with defaults', (): void => {
    process.env.FB_MAX_AUTO_REPLIES_PER_DAY = '12'
    process.env.FB_MAX_AUTO_REPLIES_PER_POST_PER_DAY = '3'

    expect(resolveFacebookReplyLimits()).toEqual({
      maxRepliesPerDay: 12,
      maxRepliesPerPostPerDay: 3,
    })
  })

  it('calculates elapsed hours', (): void => {
    expect(hoursBetween('2026-04-23T00:00:00.000Z', new Date('2026-04-23T04:30:00.000Z'))).toBe(4.5)
  })
})

describe('FB-SCHEDULE-WEEKEND-1: resolveDayMode', () => {
  const mkDate = (dow: number) => {
    // Create a date with specific day of week
    const d = new Date('2026-04-27T10:00:00Z') // Monday
    d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7))
    return d
  }

  it('Mon–Fri → weekday', () => {
    expect(resolveDayMode(mkDate(1), false)).toBe('weekday') // Mon
    expect(resolveDayMode(mkDate(5), false)).toBe('weekday') // Fri
  })

  it('Sat/Sun → weekend', () => {
    expect(resolveDayMode(mkDate(6), false)).toBe('weekend') // Sat
    expect(resolveDayMode(mkDate(0), false)).toBe('weekend') // Sun
  })

  it('campaign flag → campaign always wins', () => {
    expect(resolveDayMode(mkDate(1), true)).toBe('campaign') // weekday + campaign
    expect(resolveDayMode(mkDate(6), true)).toBe('campaign') // weekend + campaign
  })
})

describe('FB-SCHEDULE-WEEKEND-1: resolveFacebookSchedule', () => {
  const mkDate = (dow: number) => {
    const d = new Date('2026-04-27T10:00:00Z')
    d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7))
    return d
  }
  const monday   = mkDate(1)
  const saturday = mkDate(6)

  it('weekday defaults: 3 posts, 4h gap, weekday slots', () => {
    const s = resolveFacebookSchedule(null, monday)
    expect(s.mode).toBe('weekday')
    expect(s.maxPerDay).toBe(3)
    expect(s.minGapHours).toBe(4)
    expect(s.slots).toEqual(DEFAULT_PRIME_SLOTS_WEEKDAY)
  })

  it('weekend defaults: 4 posts, 4h gap, weekend slots', () => {
    const s = resolveFacebookSchedule(null, saturday)
    expect(s.mode).toBe('weekend')
    expect(s.maxPerDay).toBe(4)
    expect(s.minGapHours).toBe(4)
    expect(s.slots).toEqual(DEFAULT_PRIME_SLOTS_WEEKEND)
  })

  it('campaign mode: 5 posts, 3h gap, campaign slots', () => {
    const s = resolveFacebookSchedule({ campaign_mode_enabled: true }, monday)
    expect(s.mode).toBe('campaign')
    expect(s.maxPerDay).toBe(5)
    expect(s.minGapHours).toBe(3)
    expect(s.slots).toEqual(DEFAULT_PRIME_SLOTS_CAMPAIGN)
  })

  it('respects custom weekend max_per_day from settings', () => {
    const s = resolveFacebookSchedule({ max_per_day_weekend: 3 }, saturday)
    expect(s.maxPerDay).toBe(3)
  })

  it('respects custom campaign slots from settings', () => {
    const custom = ['08:00', '14:00', '20:00']
    const s = resolveFacebookSchedule({
      campaign_mode_enabled: true,
      prime_time_slots_campaign: custom,
    }, monday)
    expect(s.slots).toEqual(custom)
  })

  it('weekend min_gap enforces 4h minimum', () => {
    const s = resolveFacebookSchedule({ min_gap_hours: 1 }, saturday)
    expect(s.minGapHours).toBe(4)
  })

  it('campaign min_gap allows 3h', () => {
    const s = resolveFacebookSchedule({ campaign_mode_enabled: true, min_gap_hours_campaign: 3 }, monday)
    expect(s.minGapHours).toBe(3)
  })
})
