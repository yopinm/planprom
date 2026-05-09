// POSTLIVE-27: Social Proof Aggregate Counter strip
// Server component — data fetched once per 1h cache window.
// Hidden when estimatedSavings = 0 (no click data yet).

import { getSocialProofData } from '@/lib/social-proof'
import { getCampaignContext } from '@/lib/campaign-context'

export async function SocialProofStrip() {
  let data
  try {
    data = await getSocialProofData()
  } catch {
    return null
  }

  if (data.estimatedSavings <= 0) return null

  const campaign = getCampaignContext()
  const savings  = data.estimatedSavings.toLocaleString('th-TH')

  const CAMPAIGN_BADGE: Partial<Record<string, string>> = {
    double_date: campaign.label,
    payday:      '🎉 วันเงินเดือน',
    month_start: '✨ ต้นเดือนใหม่',
  }
  const badge = CAMPAIGN_BADGE[campaign.type]

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-2.5 text-sm">
      <span className="font-black text-green-700">✓ ประหยัดไปแล้วรวมกัน ≈ {savings} บาท</span>
      {badge && (
        <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
          {badge}
        </span>
      )}
    </div>
  )
}
