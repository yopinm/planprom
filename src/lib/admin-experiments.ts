import type { Platform } from '@/types'

export type ExperimentCategory = 'headline' | 'cta' | 'layout'

export interface ExperimentSignalRow {
  key: string
  click_count: number
  conversion_count: number
  commission: number
  conversion_rate_pct: number
  last_activity_at: string | null
}

export interface ExperimentAnalyticsSignal {
  sub_id: string
  coupon_copy_count: number
  continue_count: number
}

export interface ExperimentDefinition {
  key: string
  category: ExperimentCategory
  label: string
  description: string
  signal_kind: 'sub_id' | 'source'
  signal_value: string
  platform?: Platform | 'all'
  slot: string
}

export interface ExperimentVariantSummary {
  key: string
  label: string
  description: string
  slot: string
  platform: Platform | 'all'
  click_count: number
  conversion_count: number
  commission: number
  conversion_rate_pct: number
  continue_count: number
  coupon_copy_count: number
  last_activity_at: string | null
  signal_kind: 'sub_id' | 'source'
}

export interface ExperimentGroupSummary {
  category: ExperimentCategory
  label: string
  description: string
  leaderKey: string | null
  variants: ExperimentVariantSummary[]
}

interface ExperimentGroupDraft {
  category: ExperimentCategory
  label: string
  description: string
  leaderKey: string | null
  variants: ExperimentVariantSummary[]
}

export const EXPERIMENT_DEFINITIONS: readonly ExperimentDefinition[] = [
  {
    key: 'headline_home_hero',
    category: 'headline',
    label: 'Homepage Hero Headline',
    description: 'Review whether the homepage hero framing keeps the best conversion quality.',
    signal_kind: 'sub_id',
    signal_value: 'landing_hero',
    platform: 'shopee',
    slot: 'Hero headline',
  },
  {
    key: 'headline_search_card',
    category: 'headline',
    label: 'Search Card Headline',
    description: 'Review high-intent search result framing at the top card slot.',
    signal_kind: 'sub_id',
    signal_value: 'search_top_1',
    platform: 'shopee',
    slot: 'Search result headline',
  },
  {
    key: 'headline_rare_spotlight',
    category: 'headline',
    label: 'Rare Spotlight Headline',
    description: 'Review urgency-led rare item messaging versus normal hero copy.',
    signal_kind: 'sub_id',
    signal_value: 'rare_top_1',
    platform: 'shopee',
    slot: 'Rare headline',
  },
  {
    key: 'cta_product_primary',
    category: 'cta',
    label: 'Product Primary CTA',
    description: 'Review the product page primary CTA slot before changing copy or emphasis.',
    signal_kind: 'sub_id',
    signal_value: 'product_hero',
    platform: 'shopee',
    slot: 'Product CTA',
  },
  {
    key: 'cta_search_primary',
    category: 'cta',
    label: 'Search Primary CTA',
    description: 'Review the highest-volume search CTA slot.',
    signal_kind: 'sub_id',
    signal_value: 'search_top_2',
    platform: 'shopee',
    slot: 'Search CTA',
  },
  {
    key: 'cta_compare_primary',
    category: 'cta',
    label: 'Comparison CTA',
    description: 'Review comparison-slot CTA performance before changing layout weight.',
    signal_kind: 'sub_id',
    signal_value: 'compare_1_shopee',
    platform: 'shopee',
    slot: 'Comparison CTA',
  },
  {
    key: 'layout_search_flow',
    category: 'layout',
    label: 'Search Layout',
    description: 'Review the search-driven layout as a reusable conversion baseline.',
    signal_kind: 'source',
    signal_value: 'search',
    platform: 'all',
    slot: 'Search layout',
  },
  {
    key: 'layout_landing_flow',
    category: 'layout',
    label: 'Landing Layout',
    description: 'Review the landing-page layout before promoting it to a stronger default.',
    signal_kind: 'source',
    signal_value: 'landing',
    platform: 'all',
    slot: 'Landing layout',
  },
  {
    key: 'layout_compare_flow',
    category: 'layout',
    label: 'Comparison Layout',
    description: 'Review comparison-page layout and supporting CTA balance.',
    signal_kind: 'source',
    signal_value: 'compare',
    platform: 'all',
    slot: 'Comparison layout',
  },
]

function zeroSummary(definition: ExperimentDefinition): ExperimentVariantSummary {
  return {
    key: definition.key,
    label: definition.label,
    description: definition.description,
    slot: definition.slot,
    platform: definition.platform ?? 'all',
    click_count: 0,
    conversion_count: 0,
    commission: 0,
    conversion_rate_pct: 0,
    continue_count: 0,
    coupon_copy_count: 0,
    last_activity_at: null,
    signal_kind: definition.signal_kind,
  }
}

function scoreVariant(variant: ExperimentVariantSummary): number {
  return (
    variant.commission * 100 +
    variant.conversion_count * 10 +
    variant.continue_count * 3 +
    variant.coupon_copy_count * 2 +
    variant.conversion_rate_pct
  )
}

export function buildExperimentGroups(
  signalRows: readonly ExperimentSignalRow[],
  analyticsRows: readonly ExperimentAnalyticsSignal[],
): ExperimentGroupSummary[] {
  const signalByKey = new Map(signalRows.map(row => [row.key, row]))
  const analyticsByKey = new Map(analyticsRows.map(row => [row.sub_id, row]))

  const variants = EXPERIMENT_DEFINITIONS.map((definition): ExperimentVariantSummary => {
    const base = zeroSummary(definition)
    const signal = signalByKey.get(definition.signal_value)

    if (signal) {
      base.click_count = signal.click_count
      base.conversion_count = signal.conversion_count
      base.commission = signal.commission
      base.conversion_rate_pct = signal.conversion_rate_pct
      base.last_activity_at = signal.last_activity_at
    }

    if (definition.signal_kind === 'sub_id') {
      const analytics = analyticsByKey.get(definition.signal_value)
      if (analytics) {
        base.coupon_copy_count = analytics.coupon_copy_count
        base.continue_count = analytics.continue_count
      }
    }

    return base
  })

  const drafts: ExperimentGroupDraft[] = [
    {
      category: 'headline',
      label: 'Headline Experiments',
      description: 'Review top messaging slots before changing the current production headline mix.',
      leaderKey: null,
      variants: variants.filter(variant => variant.key.startsWith('headline_')),
    },
    {
      category: 'cta',
      label: 'CTA Experiments',
      description: 'Review CTA candidates using click, continue, coupon-copy, and conversion signals.',
      leaderKey: null,
      variants: variants.filter(variant => variant.key.startsWith('cta_')),
    },
    {
      category: 'layout',
      label: 'Layout Experiments',
      description: 'Review page-layout level variants without auto-promoting the winner.',
      leaderKey: null,
      variants: variants.filter(variant => variant.key.startsWith('layout_')),
    },
  ]

  return drafts.map((group): ExperimentGroupSummary => {
    const sorted = [...group.variants].sort((left, right) => scoreVariant(right) - scoreVariant(left))
    return {
      ...group,
      leaderKey: sorted[0]?.key ?? null,
      variants: sorted,
    }
  })
}
