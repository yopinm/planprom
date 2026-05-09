// src/lib/policy-guard.ts
// TASK 2.5.4 + 2.5.4a — Policy Guard + Meta Branded Content Compliance [WS4][P2.5]
//
// Server-side only. Never import in client components.
// Caller logs result to facebook_post_logs.meta as { policy_check_result: PolicyCheckResult }

export type PolicyViolationCode =
  | 'health_claim'
  | 'guarantee_claim'
  | 'official_claim'
  | 'disclosure_missing'
  | 'disclosure_not_visible'
  | 'logo_trademark_flag'

/** block = reject post / flag = allow but require admin review */
export type PolicyViolationSeverity = 'block' | 'flag'

export interface PolicyViolation {
  code:      PolicyViolationCode
  severity:  PolicyViolationSeverity
  keyword?:  string
  message:   string
}

export interface PolicyCheckResult {
  /** true when zero 'block' violations */
  passed:         boolean
  /** true when any 'flag' violations — post needs admin review before approve */
  requiresReview: boolean
  violations:     PolicyViolation[]
  checkedAt:      string
}

export interface PolicyCheckOptions {
  /**
   * Extra keywords to flag for trademark/logo admin review.
   * Typically loaded from facebook_settings.keyword_blacklist in the API route.
   */
  knownTrademarks?: string[]
  /**
   * Additional blacklist keywords to merge with defaults (e.g. from facebook_settings).
   * These are treated as 'block' violations under 'guarantee_claim'.
   */
  extraBlacklist?: string[]
}

// ---------------------------------------------------------------------------
// Static keyword lists — match facebook_settings seed
// ---------------------------------------------------------------------------

const HEALTH_CLAIM_KEYWORDS: readonly string[] = [
  'หายขาด', 'รักษา', 'บำบัด', 'ป้องกันโรค',
  'cure', 'treat', 'heals', 'remedy',
]

const GUARANTEE_KEYWORDS: readonly string[] = [
  'รับรอง', 'การันตี', '100%', 'guaranteed',
]

// TASK 2.5.4a — Meta Branded Content Policy
const OFFICIAL_CLAIM_KEYWORDS: readonly string[] = [
  'official', 'ตัวแทน', 'แบรนด์แท้', 'authorized',
]

// TASK 2.5.4a — Disclosure must be one of these, at end of caption
const VALID_DISCLOSURES: readonly string[] = ['# โฆษณา', '# สนับสนุน']

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function checkPolicy(
  caption: string,
  options: PolicyCheckOptions = {},
): PolicyCheckResult {
  const violations: PolicyViolation[] = []
  const lower = caption.toLowerCase()

  // Health claims
  for (const kw of HEALTH_CLAIM_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      violations.push({
        code:     'health_claim',
        severity: 'block',
        keyword:  kw,
        message:  `Health claim keyword: "${kw}"`,
      })
    }
  }

  // Guarantee / 100% claims
  for (const kw of GUARANTEE_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      violations.push({
        code:     'guarantee_claim',
        severity: 'block',
        keyword:  kw,
        message:  `Guarantee claim keyword: "${kw}"`,
      })
    }
  }

  // Extra blacklist from caller (e.g. facebook_settings)
  for (const kw of options.extraBlacklist ?? []) {
    if (lower.includes(kw.toLowerCase())) {
      violations.push({
        code:     'guarantee_claim',
        severity: 'block',
        keyword:  kw,
        message:  `Blacklisted keyword: "${kw}"`,
      })
    }
  }

  // TASK 2.5.4a — Official brand page claim
  for (const kw of OFFICIAL_CLAIM_KEYWORDS) {
    if (lower.includes(kw.toLowerCase())) {
      violations.push({
        code:     'official_claim',
        severity: 'block',
        keyword:  kw,
        message:  `Official brand claim keyword: "${kw}"`,
      })
    }
  }

  // TASK 2.5.4a — Disclosure must be visible at end of caption
  const discViolation = checkDisclosure(caption)
  if (discViolation) violations.push(discViolation)

  // TASK 2.5.4a — Trademark/logo flag → admin review (does not block)
  for (const tm of options.knownTrademarks ?? []) {
    if (lower.includes(tm.toLowerCase())) {
      violations.push({
        code:     'logo_trademark_flag',
        severity: 'flag',
        keyword:  tm,
        message:  `Trademark mention requires admin review: "${tm}"`,
      })
    }
  }

  return {
    passed:         violations.filter(v => v.severity === 'block').length === 0,
    requiresReview: violations.some(v => v.severity === 'flag'),
    violations,
    checkedAt:      new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Disclosure validator
// ---------------------------------------------------------------------------

function checkDisclosure(caption: string): PolicyViolation | null {
  const trimmed = caption.trimEnd()
  const endsWithValid = VALID_DISCLOSURES.some(
    d => trimmed === d || trimmed.endsWith('\n' + d),
  )
  if (endsWithValid) return null

  const hasEmbedded = VALID_DISCLOSURES.some(d => trimmed.includes(d))
  if (hasEmbedded) {
    return {
      code:     'disclosure_not_visible',
      severity: 'block',
      message:  'Disclosure must appear at the end of caption, not embedded within text',
    }
  }

  return {
    code:     'disclosure_missing',
    severity: 'block',
    message:  'Caption must end with "# โฆษณา" or "# สนับสนุน"',
  }
}

// ---------------------------------------------------------------------------
// Re-export constants for tests + callers
// ---------------------------------------------------------------------------

export { VALID_DISCLOSURES, OFFICIAL_CLAIM_KEYWORDS, GUARANTEE_KEYWORDS, HEALTH_CLAIM_KEYWORDS }
