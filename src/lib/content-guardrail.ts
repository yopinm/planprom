// src/lib/content-guardrail.ts — TASK 3.21
// Content Guardrail & Anti-Spam (Meta 2026)
// Extends policy-guard.ts with Meta's 2026 enforcement rules.
// Run before any auto-post to prevent page restriction.

import { checkPolicy, type PolicyCheckResult, type PolicyCheckOptions } from './policy-guard'

// ---------------------------------------------------------------------------
// New violation codes (2026 Meta enforcement)
// ---------------------------------------------------------------------------

export type GuardrailViolationCode =
  | 'engagement_bait'    // กดไลค์/แชร์เพื่อ/แท็กเพื่อน baiting — Meta's top enforcement rule
  | 'link_spam'          // > 2 external URLs in one post
  | 'excessive_emojis'   // > 10 emoji characters — spam signal
  | 'repetitive_keyword' // same word > 3× — stuffing signal
  | 'duplicate_post'     // same product posted within 24h

export type GuardrailSeverity = 'block' | 'flag'

export interface GuardrailViolation {
  code:     GuardrailViolationCode
  severity: GuardrailSeverity
  detail?:  string
  message:  string
}

export interface GuardrailResult {
  /** true when zero 'block' violations across policy + guardrail checks */
  passed:         boolean
  requiresReview: boolean
  violations:     GuardrailViolation[]
  policyResult:   PolicyCheckResult
  checkedAt:      string
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface GuardrailOptions extends PolicyCheckOptions {
  /**
   * Number of times this product was posted to the page in the last 24 h.
   * Caller queries facebook_posts before calling runFullGuardrail.
   * Pass 0 or omit if unknown.
   */
  recentPostCount?: number
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

const MAX_URLS       = 2
const MAX_EMOJIS     = 10
const MAX_WORD_REPS  = 3

// ---------------------------------------------------------------------------
// Engagement bait keywords — Meta 2026 enforcement list
// ---------------------------------------------------------------------------

const ENGAGEMENT_BAIT: readonly string[] = [
  'กดไลค์', 'กด like', 'like this', 'กดถูกใจ',
  'แชร์เพื่อ', 'share to win', 'share to get',
  'แท็กเพื่อน', 'tag a friend', 'tag your friend', 'แทกเพื่อน',
  'ติดตามเพื่อ', 'follow to win', 'ติดตามเพื่อรับ',
  'คอมเมนต์เพื่อ', 'comment to win', 'comment to get',
  'กด share', 'กด แชร์',
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countUrls(text: string): number {
  return (text.match(/https?:\/\/\S+/g) ?? []).length
}

function countEmojis(text: string): number {
  // Matches most emoji ranges
  return (text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) ?? []).length
}

function maxWordFrequency(text: string): { word: string; count: number } {
  const freq = new Map<string, number>()
  const words = text
    .toLowerCase()
    .replace(/[^ก-๙a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3)  // ignore short particles

  for (const word of words) {
    freq.set(word, (freq.get(word) ?? 0) + 1)
  }

  let top = { word: '', count: 0 }
  for (const [word, count] of freq) {
    if (count > top.count) top = { word, count }
  }
  return top
}

// ---------------------------------------------------------------------------
// 2026 Guardrail checks
// ---------------------------------------------------------------------------

function checkEngagementBait(text: string): GuardrailViolation | null {
  const lower = text.toLowerCase()
  const hit = ENGAGEMENT_BAIT.find(kw => lower.includes(kw.toLowerCase()))
  if (!hit) return null
  return {
    code:     'engagement_bait',
    severity: 'block',
    detail:   hit,
    message:  `Engagement bait keyword "${hit}" — Meta will penalise or restrict the page`,
  }
}

function checkLinkSpam(text: string): GuardrailViolation | null {
  const count = countUrls(text)
  if (count <= MAX_URLS) return null
  return {
    code:     'link_spam',
    severity: 'block',
    detail:   `${count} URLs found`,
    message:  `Post contains ${count} URLs (max ${MAX_URLS}) — Meta may classify as link spam`,
  }
}

function checkExcessiveEmojis(text: string): GuardrailViolation | null {
  const count = countEmojis(text)
  if (count <= MAX_EMOJIS) return null
  return {
    code:     'excessive_emojis',
    severity: 'flag',
    detail:   `${count} emojis`,
    message:  `${count} emojis detected (threshold ${MAX_EMOJIS}) — review for spam appearance`,
  }
}

function checkRepetitiveKeyword(text: string): GuardrailViolation | null {
  const { word, count } = maxWordFrequency(text)
  if (count <= MAX_WORD_REPS) return null
  return {
    code:     'repetitive_keyword',
    severity: 'flag',
    detail:   `"${word}" × ${count}`,
    message:  `Keyword "${word}" repeated ${count}× — may trigger spam filter`,
  }
}

function checkDuplicatePost(recentPostCount: number): GuardrailViolation | null {
  if (recentPostCount === 0) return null
  return {
    code:     'duplicate_post',
    severity: 'block',
    detail:   `${recentPostCount} post(s) in last 24h`,
    message:  `This product was already posted ${recentPostCount} time(s) in the last 24 h — duplicate posting risks restriction`,
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Run the full content guardrail: existing Policy Guard + new Meta 2026 checks.
 * Returns a combined result — if `passed` is false, do NOT publish.
 */
export function runFullGuardrail(
  caption: string,
  options: GuardrailOptions = {},
): GuardrailResult {
  // 1. Existing policy checks (TASK 2.5.4 / 2.5.4a)
  const policyResult = checkPolicy(caption, options)

  // 2. New 2026 guardrail checks
  const newViolations: GuardrailViolation[] = []

  const engagementBait = checkEngagementBait(caption)
  if (engagementBait) newViolations.push(engagementBait)

  const linkSpam = checkLinkSpam(caption)
  if (linkSpam) newViolations.push(linkSpam)

  const excessiveEmojis = checkExcessiveEmojis(caption)
  if (excessiveEmojis) newViolations.push(excessiveEmojis)

  const repetitiveKw = checkRepetitiveKeyword(caption)
  if (repetitiveKw) newViolations.push(repetitiveKw)

  const duplicatePost = checkDuplicatePost(options.recentPostCount ?? 0)
  if (duplicatePost) newViolations.push(duplicatePost)

  const hasNewBlock   = newViolations.some(v => v.severity === 'block')
  const hasNewFlag    = newViolations.some(v => v.severity === 'flag')

  return {
    passed:         policyResult.passed && !hasNewBlock,
    requiresReview: policyResult.requiresReview || hasNewFlag,
    violations:     newViolations,
    policyResult,
    checkedAt:      new Date().toISOString(),
  }
}
