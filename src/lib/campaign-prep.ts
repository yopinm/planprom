// POSTLIVE-31: Pre-Campaign Cookie Dropping
// Detects the next Double Date campaign within a 10-day window and
// generates the campaign sub_id for affiliate pre-click tracking.
//
// Strategy: user visits /deals/campaign-prep 7-10 days before 5.5/6.6/9.9/11.11/12.12
// → affiliate link injects sub_id=campaign_prep_MMDD
// → last-click cookie survives until campaign day if user purchases

export interface UpcomingCampaign {
  label: string
  date: Date
  daysUntil: number
  subId: string   // e.g. "campaign_prep_0505"
  mmdd: string    // e.g. "0505"
}

// Only these double dates are campaign-scale events worth pre-dropping
const CAMPAIGN_DOUBLE_DATES = [5, 6, 9, 11, 12] // months where day === month

export function getNextDoubleDateCampaign(
  now: Date = new Date(),
  windowDays = 10,
): UpcomingCampaign | null {
  const year  = now.getFullYear()
  const month = now.getMonth() + 1 // 1–12
  const day   = now.getDate()

  for (const m of CAMPAIGN_DOUBLE_DATES) {
    // Current year candidate
    const candidate = new Date(year, m - 1, m) // month m, day m
    const diff = Math.ceil(
      (candidate.getTime() - new Date(year, month - 1, day).getTime()) / (1000 * 60 * 60 * 24),
    )
    if (diff > 0 && diff <= windowDays) {
      const mm = String(m).padStart(2, '0')
      const dd = mm
      return {
        label: `${mm}.${dd}`,
        date: candidate,
        daysUntil: diff,
        subId: `campaign_prep_${mm}${dd}`,
        mmdd: `${mm}${dd}`,
      }
    }
  }

  // Check next year Jan (1.1) if within window at end of December
  const jan1 = new Date(year + 1, 0, 1)
  const diffJan = Math.ceil(
    (jan1.getTime() - new Date(year, month - 1, day).getTime()) / (1000 * 60 * 60 * 24),
  )
  if (diffJan > 0 && diffJan <= windowDays) {
    return {
      label: '01.01',
      date: jan1,
      daysUntil: diffJan,
      subId: 'campaign_prep_0101',
      mmdd: '0101',
    }
  }

  return null
}

export const CAMPAIGN_PREP_COOKIE = 'ck_campaign_prep'
export const CAMPAIGN_PREP_COOKIE_MAX_AGE = 14 * 24 * 60 * 60 // 14 days
