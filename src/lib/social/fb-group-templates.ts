// DIST-03B: Facebook VIP Group — Template Library
// 7 content pillars, sub-ID builder, caption renderer
// Pure functions — no DB, no HTTP, fully testable

export const PILLARS = {
  early_bird: { name: 'ดีลเช้า',       emoji: '🌅', pct: 30, desc: 'ดีลก่อนใคร ตอนเช้า' },
  group_only: { name: 'VIP เท่านั้น',  emoji: '🔒', pct: 20, desc: 'โค้ดพิเศษสำหรับสมาชิก VIP' },
  tip:        { name: 'เทคนิค',        emoji: '💡', pct: 15, desc: 'เทคนิคช้อปถูก / วิธีใช้คูปอง' },
  compare:    { name: 'เปรียบราคา',    emoji: '📊', pct: 15, desc: 'Net Price รวมคูปองแล้ว' },
  poll:       { name: 'โหวต',          emoji: '🗳️', pct: 10, desc: 'ถามความเห็นสมาชิก' },
  ugc:        { name: 'UGC',           emoji: '💬', pct:  5, desc: 'แชร์ประสบการณ์สมาชิก' },
  giveaway:   { name: 'แจกของ',        emoji: '🎁', pct:  5, desc: 'กิจกรรม / ลุ้นรับของรางวัล' },
} as const

export type PillarKey = keyof typeof PILLARS

export const PILLAR_KEYS = Object.keys(PILLARS) as PillarKey[]

export interface GroupCaptionVars {
  name:     string
  original: string
  net:      string
  save:     string
  coupon:   string
  url:      string
}

/** Replaces placeholders {name} {original} {net} {save} {coupon} {url} */
export function renderGroupCaption(template: string, vars: GroupCaptionVars): string {
  let text: string = template
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, v)
  }
  return text
}

/** Builds sub_id: fb_group_vip_{pillar}_YYYYMMDD_{seq} */
export function buildGroupSubId(pillar: PillarKey, seq: number, nowIct?: Date): string {
  const d = nowIct ?? new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `fb_group_vip_${pillar}_${yyyymmdd}_${seq}`
}

/** Pillar balance: given post counts, returns actual % and delta from target */
export function computePillarBalance(
  counts: Partial<Record<PillarKey, number>>
): Array<{ key: PillarKey; count: number; actualPct: number; targetPct: number; over: boolean }> {
  const total = PILLAR_KEYS.reduce((s, k) => s + (counts[k] ?? 0), 0)
  return PILLAR_KEYS.map(key => {
    const count = counts[key] ?? 0
    const actualPct = total > 0 ? Math.round((count / total) * 100) : 0
    const targetPct = PILLARS[key].pct
    return { key, count, actualPct, targetPct, over: actualPct > targetPct + 10 }
  })
}
