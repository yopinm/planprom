// REV-01: sub_id injection into outgoing affiliate URLs
// AFFNET-1: multi-network support — each affiliate network uses a different
// query parameter name for tracking IDs. Using the wrong param silently
// drops attribution (commission is lost with no error).
//
// Network → param mapping:
//   Involve Asia  (invol.co / involve.asia)          → sub1
//   AccessTrade   (accesstrade.in.th / atth.me)      → aff_sub
//   Lazada direct (c.lazada.*)                        → sub_id1  (postback returns {sub_id1} as transaction_id)
//   All others    (Shopee / TikTok)                   → sub_id

type AffiliateNetwork = 'involve_asia' | 'accesstrade' | 'lazada_direct' | 'default'

function detectNetwork(hostname: string): AffiliateNetwork {
  if (hostname === 'invol.co' || hostname.endsWith('.invol.co') ||
      hostname === 'invol.pe' || hostname.endsWith('.invol.pe') ||
      hostname === 'involve.asia' || hostname.endsWith('.involve.asia')) {
    return 'involve_asia'
  }
  if (hostname === 'accesstrade.in.th' || hostname.endsWith('.accesstrade.in.th') ||
      hostname === 'accesstrade.net' || hostname.endsWith('.accesstrade.net') ||
      hostname === 'atth.me') {
    return 'accesstrade'
  }
  // Lazada direct affiliate tracking links (c.lazada.sg, c.lazada.co.th, etc.)
  if (hostname.startsWith('c.lazada.')) {
    return 'lazada_direct'
  }
  return 'default'
}

const NETWORK_PARAM: Record<AffiliateNetwork, string> = {
  involve_asia:  'sub1',
  accesstrade:   'aff_sub',
  lazada_direct: 'sub_id1',
  default:       'sub_id',
}

/**
 * Infers the expected import-time network key from an affiliate URL domain.
 * Returns 'involve_asia', 'accesstrade', 'direct', or null if the URL cannot be parsed.
 */
export function inferNetworkFromAffiliateUrl(
  affiliateUrl: string,
): 'involve_asia' | 'accesstrade' | 'direct' | null {
  try {
    const hostname = new URL(affiliateUrl).hostname.replace(/^www\./, '')
    const net = detectNetwork(hostname)
    if (net === 'involve_asia') return 'involve_asia'
    if (net === 'accesstrade')  return 'accesstrade'
    return 'direct'
  } catch {
    return null
  }
}

/**
 * Returns an error message if the declared network does not match the affiliate URL domain.
 * Returns null if the combination is consistent (AFFNET-2.1 guard).
 *
 * Prevents silent fallback to 'manual' when IA/AT is expected — e.g. submitting
 * network='direct' with an invol.co URL would lose all Involve Asia attribution.
 */
export function checkNetworkConsistency(
  declaredNetwork: string,
  affiliateUrl: string,
): string | null {
  const inferred = inferNetworkFromAffiliateUrl(affiliateUrl)
  if (inferred === null) return null // URL unparseable — let other validation handle it
  if (declaredNetwork === inferred) return null // ✅ consistent

  const LABEL: Record<string, string> = {
    involve_asia: 'involve_asia (invol.co / involve.asia)',
    accesstrade:  'accesstrade (accesstrade.in.th / atth.me)',
    direct:       'direct (Shopee / Lazada โดยตรง)',
  }

  if (inferred !== 'direct') {
    // URL belongs to IA/AT but declared network is wrong
    return `affiliate_url เป็น ${LABEL[inferred] ?? inferred} แต่ network="${declaredNetwork}" — ควรเลือก network=${inferred}`
  }
  // URL is Shopee/Lazada direct but declared as IA/AT
  return `network="${declaredNetwork}" แต่ affiliate_url ไม่ใช่ ${LABEL[declaredNetwork] ?? declaredNetwork} — ตรวจสอบ URL อีกครั้ง`
}

/**
 * Appends the network-specific tracking parameter to an affiliate redirect URL.
 * - Involve Asia → sub1=
 * - AccessTrade  → aff_sub=
 * - All others   → sub_id=
 * - Does nothing if `subId` is null/empty.
 * - Does not overwrite an existing tracking param already present in the URL.
 * - Returns the original string unchanged if the URL cannot be parsed.
 */
export function injectSubId(url: string, subId: string | null): string {
  if (!subId) return url
  try {
    const parsed = new URL(url)
    const param = NETWORK_PARAM[detectNetwork(parsed.hostname)]
    if (!parsed.searchParams.has(param)) {
      parsed.searchParams.set(param, subId)
    }
    return parsed.toString()
  } catch {
    return url
  }
}
