// src/lib/post-score.ts
// TASK 2.5.2 — Post Score Engine [WS4][P2.5]
//
// Combines deal quality, reliability, rarity, and campaign timing into
// a single 0-100 post score used to decide whether to publish a Facebook post.
//
// Formula (weights sum to 100):
//   deal_score      × 0.40
//   reliability     × 0.30
//   rare_score      × 0.20
//   campaign_boost  (flat addition, max 10) → total capped at 100
//
// Recommendation:
//   PUBLISH : score ≥ 70 AND trustworthy
//   REVIEW  : score 40–69 AND trustworthy  (admin decides)
//   SKIP    : score < 40 OR !trustworthy

import { getCampaignContext } from './campaign-context'
import type { CampaignContext } from './campaign-context'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PostRecommendation = 'PUBLISH' | 'REVIEW' | 'SKIP'

export interface PostScoreInput {
  /** 0-100 from AIDealScore / rare_item_scores.deal_score */
  dealScore: number
  /** 0-100 from ReliabilityResult.score */
  reliabilityScore: number
  /** From ReliabilityResult.trustworthy — false → SKIP regardless of score */
  trustworthy: boolean
  /** 0-100 from RareItemResult.final_score; pass 0 if product has no rare score */
  rareScore: number
  /** Provide to enable campaign-timing boost; defaults to getCampaignContext(now) */
  campaignContext?: CampaignContext
}

export interface PostScoreBreakdown {
  dealComponent: number
  reliabilityComponent: number
  rareComponent: number
  campaignBoost: number
}

export interface PostScoreResult {
  /** Final composite score 0-100 */
  score: number
  recommendation: PostRecommendation
  breakdown: PostScoreBreakdown
  /** Thai-language reason for admin review queue */
  reason: string
}

// ---------------------------------------------------------------------------
// Campaign boost map
// ---------------------------------------------------------------------------

// peak_traffic added here ahead of TASK 2.13 which will extend CampaignType
const CAMPAIGN_BOOST: Record<string, number> = {
  double_date:  10,
  payday:        8,
  month_start:   5,
  peak_traffic: 10,
  normal:        0,
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const PUBLISH_THRESHOLD = 70
const REVIEW_THRESHOLD  = 40

// ---------------------------------------------------------------------------
// Core function
// ---------------------------------------------------------------------------

export function calculatePostScore(input: PostScoreInput): PostScoreResult {
  const {
    dealScore,
    reliabilityScore,
    trustworthy,
    rareScore,
    campaignContext = getCampaignContext(),
  } = input

  // Clamp all inputs to [0, 100]
  const deal        = Math.min(100, Math.max(0, dealScore))
  const reliability = Math.min(100, Math.max(0, reliabilityScore))
  const rare        = Math.min(100, Math.max(0, rareScore))

  const dealComponent        = deal        * 0.40
  const reliabilityComponent = reliability * 0.30
  const rareComponent        = rare        * 0.20
  const campaignBoost        = CAMPAIGN_BOOST[campaignContext.type] ?? 0

  const raw   = dealComponent + reliabilityComponent + rareComponent + campaignBoost
  const score = Math.min(100, Math.round(raw))

  const breakdown: PostScoreBreakdown = {
    dealComponent:        Math.round(dealComponent * 10) / 10,
    reliabilityComponent: Math.round(reliabilityComponent * 10) / 10,
    rareComponent:        Math.round(rareComponent * 10) / 10,
    campaignBoost,
  }

  const recommendation = resolveRecommendation(score, trustworthy)
  const reason         = buildReason(recommendation, score, trustworthy, campaignContext)

  return { score, recommendation, breakdown, reason }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveRecommendation(
  score: number,
  trustworthy: boolean,
): PostRecommendation {
  if (!trustworthy)             return 'SKIP'
  if (score >= PUBLISH_THRESHOLD) return 'PUBLISH'
  if (score >= REVIEW_THRESHOLD)  return 'REVIEW'
  return 'SKIP'
}

function buildReason(
  rec: PostRecommendation,
  score: number,
  trustworthy: boolean,
  ctx: CampaignContext,
): string {
  if (!trustworthy) return 'ร้านค้าไม่ผ่าน Merchant Trust Filter — ไม่แนะนำโพสต์'

  const boost = CAMPAIGN_BOOST[ctx.type]
  const boostNote = boost > 0 ? ` (บวก ${boost} จาก ${ctx.label})` : ''

  if (rec === 'PUBLISH') return `คะแนน ${score}/100${boostNote} — แนะนำโพสต์ทันที`
  if (rec === 'REVIEW')  return `คะแนน ${score}/100${boostNote} — รอ Admin ตรวจสอบก่อนโพสต์`
  return `คะแนน ${score}/100 — ไม่แนะนำโพสต์ดีลนี้`
}
