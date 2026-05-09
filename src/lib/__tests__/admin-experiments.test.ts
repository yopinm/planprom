import { describe, expect, it } from 'vitest'
import { buildExperimentGroups, EXPERIMENT_DEFINITIONS } from '@/lib/admin-experiments'

describe('admin experiments', (): void => {
  it('keeps headline, CTA, and layout definitions available for review', (): void => {
    const categories = new Set(EXPERIMENT_DEFINITIONS.map(item => item.category))

    expect(categories).toEqual(new Set(['headline', 'cta', 'layout']))
  })

  it('ranks the strongest variant first inside each group', (): void => {
    const groups = buildExperimentGroups(
      [
        {
          key: 'landing_hero',
          click_count: 200,
          conversion_count: 10,
          commission: 320,
          conversion_rate_pct: 5,
          last_activity_at: '2026-04-23T10:00:00.000Z',
        },
        {
          key: 'search_top_1',
          click_count: 400,
          conversion_count: 25,
          commission: 900,
          conversion_rate_pct: 8,
          last_activity_at: '2026-04-23T11:00:00.000Z',
        },
      ],
      [
        { sub_id: 'landing_hero', coupon_copy_count: 2, continue_count: 4 },
        { sub_id: 'search_top_1', coupon_copy_count: 10, continue_count: 12 },
      ],
    )

    const headlineGroup = groups.find(group => group.category === 'headline')

    expect(headlineGroup?.leaderKey).toBe('headline_search_card')
    expect(headlineGroup?.variants[0].key).toBe('headline_search_card')
  })

  it('falls back to zeroed metrics when no tracked signal exists', (): void => {
    const groups = buildExperimentGroups([], [])
    const ctaGroup = groups.find(group => group.category === 'cta')

    expect(ctaGroup?.variants[0].click_count).toBe(0)
    expect(ctaGroup?.variants[0].coupon_copy_count).toBe(0)
  })
})
