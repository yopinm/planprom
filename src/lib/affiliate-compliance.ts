// src/lib/affiliate-compliance.ts
// TASK 3.14 — Affiliate Compliance Audit helpers (pure functions, no I/O)
//
// Validates affiliate links, sub_id format, and disclosure requirements
// for Shopee and Lazada affiliate programs.

// ---------------------------------------------------------------------------
// Allowed domains
// ---------------------------------------------------------------------------

const SHOPEE_DOMAINS       = ['shopee.co.th', 'shope.ee', 'shp.ee']
const LAZADA_DOMAINS       = ['lazada.co.th', 's.lazada.co.th']
const TIKTOK_DOMAINS       = ['tiktok.com', 'vt.tiktok.com']
const INVOLVE_ASIA_DOMAINS = ['invol.co', 'invol.pe', 'involve.asia']
const ACCESSTRADE_DOMAINS  = ['accesstrade.in.th', 'c.accesstrade.in.th']

const ALLOWED_AFFILIATE_DOMAINS = [
  ...SHOPEE_DOMAINS, ...LAZADA_DOMAINS, ...TIKTOK_DOMAINS,
  ...INVOLVE_ASIA_DOMAINS, ...ACCESSTRADE_DOMAINS,
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ComplianceViolation =
  | 'invalid_domain'      // URL not from an allowed affiliate domain
  | 'missing_sub_id'      // sub_id param absent from redirect URL
  | 'invalid_sub_id'      // sub_id does not match expected format
  | 'missing_disclosure'  // page content lacks disclosure text
  | 'open_redirect'       // destination is not an allowed affiliate domain

export interface ComplianceResult {
  ok: boolean
  violations: ComplianceViolation[]
}

/** Returns true if the URL is https and points to an allowed affiliate domain. */
export function isAllowedAffiliateUrl(url: string): boolean {
  let parsed: URL
  try { parsed = new URL(url) } catch { return false }
  if (parsed.protocol !== 'https:') return false
  const host = parsed.hostname.replace(/^www\./, '')
  return ALLOWED_AFFILIATE_DOMAINS.some(
    (domain) => host === domain || host.endsWith(`.${domain}`),
  )
}

// ---------------------------------------------------------------------------
// sub_id validation
// ---------------------------------------------------------------------------

// Expected format: {context}_{qualifier}_{rank_or_slot}
// e.g. search_top_1 | compare_2_shopee | product_hero | rare_top_3
const SUB_ID_PATTERN = /^[a-z]+(_[a-z0-9]+){1,3}$/

/** Returns true if sub_id matches the standardised format from sub-id.ts. */
export function isValidSubId(subId: string): boolean {
  return SUB_ID_PATTERN.test(subId)
}

// ---------------------------------------------------------------------------
// Affiliate URL audit
// ---------------------------------------------------------------------------

/**
 * Validates an affiliate URL stored in the DB or returned by the redirect worker.
 *
 * Checks:
 *   1. URL resolves to an allowed affiliate domain
 *   2. (Optional) sub_id param is present and valid if expectedSubId is given
 */
export function auditAffiliateUrl(
  url: string,
  expectedSubId?: string,
): ComplianceResult {
  const violations: ComplianceViolation[] = []

  if (!isAllowedAffiliateUrl(url)) {
    violations.push('invalid_domain')
  }

  if (expectedSubId !== undefined) {
    if (!expectedSubId) {
      violations.push('missing_sub_id')
    } else if (!isValidSubId(expectedSubId)) {
      violations.push('invalid_sub_id')
    }
  }

  return { ok: violations.length === 0, violations }
}

// ---------------------------------------------------------------------------
// Redirect destination audit (used by /r worker output checks)
// ---------------------------------------------------------------------------

/**
 * Verifies that the redirect target is an allowed affiliate domain.
 * Prevents open-redirect abuse where any URL could be injected.
 */
export function auditRedirectTarget(destinationUrl: string): ComplianceResult {
  const violations: ComplianceViolation[] = []

  if (!isAllowedAffiliateUrl(destinationUrl)) {
    violations.push('open_redirect')
  }

  return { ok: violations.length === 0, violations }
}

// ---------------------------------------------------------------------------
// Disclosure audit (for server-rendered HTML content)
// ---------------------------------------------------------------------------

const DISCLOSURE_PATTERNS = [
  /affiliate\s*link/i,
  /ลิงก์.*affiliate/i,
  /ค่าคอมมิชชัน/i,
  /สนับสนุน/i,
  /โฆษณา/i,
]

/**
 * Returns true if the page content contains at least one recognised
 * affiliate disclosure phrase.
 * Pass the rendered HTML or visible text of the page.
 */
export function hasAffiliateDisclosure(pageContent: string): boolean {
  return DISCLOSURE_PATTERNS.some((pattern) => pattern.test(pageContent))
}

/** Audit page content for disclosure compliance. */
export function auditPageDisclosure(pageContent: string): ComplianceResult {
  const violations: ComplianceViolation[] = []
  if (!hasAffiliateDisclosure(pageContent)) {
    violations.push('missing_disclosure')
  }
  return { ok: violations.length === 0, violations }
}
