// TT-MYTHBUST-1: TikTok viral price vs actual net price after coupon stacking

export interface MythbustEntry {
  product_name:    string
  viral_price:     number  // price circulating on TikTok
  actual_net:      number  // real price after all coupons
  coupons_applied: string[]
  saving_vs_viral: number
  label:           string
}

/**
 * Calculate the mythbust comparison.
 * saving_vs_viral is how much cheaper than the viral TikTok price.
 */
export function buildMythbustEntry(
  product_name: string,
  viral_price: number,
  actual_net: number,
  coupons_applied: string[],
): MythbustEntry {
  const saving = Math.max(0, viral_price - actual_net)
  const label =
    saving > 0
      ? `ถูกกว่าที่ TikTok บอก ${saving.toLocaleString('th-TH')} บาท!`
      : actual_net > viral_price
      ? `แพงกว่าที่ TikTok บอก ${(actual_net - viral_price).toLocaleString('th-TH')} บาท`
      : 'ราคาเท่ากับที่ TikTok บอก'

  return { product_name, viral_price, actual_net, coupons_applied, saving_vs_viral: saving, label }
}

export interface MythbustSummary {
  claim:   string  // "TikTok บอก X฿"
  reality: string  // "จริงๆ ต้องกดคูปอง Y ชั้น → เหลือ Z฿"
  verdict: 'cheaper' | 'same' | 'pricier'
}

export function buildMythbustSummary(entry: MythbustEntry): MythbustSummary {
  const claim = `TikTok บอก ${entry.viral_price.toLocaleString('th-TH')} บาท`
  const couponStr =
    entry.coupons_applied.length > 0
      ? `กดคูปอง ${entry.coupons_applied.length} ชั้น (${entry.coupons_applied.join(' + ')}) → `
      : ''
  const reality = `จริงๆ ${couponStr}เหลือแค่ ${entry.actual_net.toLocaleString('th-TH')} บาท`

  const verdict =
    entry.saving_vs_viral > 0 ? 'cheaper'
    : entry.actual_net > entry.viral_price ? 'pricier'
    : 'same'

  return { claim, reality, verdict }
}
