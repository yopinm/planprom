// Sub ID Attribution System — TASK 4.10
//
// Standard format: {context}_{position_or_rank}[_{platform}]
// Examples: search_top_1, compare_2_shopee, product_hero, rare_top_1
//
// All CTA links to /go/[id] must include a sub_id from this module so
// revenue attribution is traceable from click → S2S postback → commission.

export type SubIdContext =
  | 'search'    // search results page
  | 'compare'   // comparison block inside search results
  | 'product'   // product detail page
  | 'landing'   // landing / home page
  | 'rare'      // rare item cards
  | 'admin'     // admin preview (not revenue-bearing)

export interface SubIdOptions {
  rank?: number      // 1-based position in list
  platform?: string  // shopee | lazada
  slot?: string      // named slot, e.g. 'hero', 'sidebar'
}

/**
 * Build a standardized sub_id string.
 *
 * Naming rules:
 *   search   → search_top_{rank}           e.g. search_top_1
 *   compare  → compare_{rank}_{platform}   e.g. compare_2_shopee
 *   product  → product_{slot}              e.g. product_hero
 *   landing  → landing_{slot}              e.g. landing_hero
 *   rare     → rare_top_{rank}             e.g. rare_top_1
 *   admin    → admin_preview
 */
export function buildSubId(context: SubIdContext, opts: SubIdOptions = {}): string {
  const { rank, platform, slot } = opts

  switch (context) {
    case 'search':
      return `search_top_${rank ?? 1}`

    case 'compare':
      return platform
        ? `compare_${rank ?? 1}_${platform}`
        : `compare_${rank ?? 1}`

    case 'product':
      return `product_${slot ?? 'hero'}`

    case 'landing':
      return `landing_${slot ?? 'hero'}`

    case 'rare':
      return `rare_top_${rank ?? 1}`

    case 'admin':
      return 'admin_preview'
  }
}
