// DIST-03: Community Outreach Engine — Template Library
// 4 community-friendly caption formats, sub-ID builder, cooldown helper
// Pure functions — no DB, no HTTP, fully testable

export const OUTREACH_FORMATS = {
  value_share: {
    name: 'แบ่งปันดีล',
    emoji: '🛍️',
    desc: 'เจอดีลมาแบ่งปัน — เป็นธรรมชาติ ไม่กดดัน',
    template: `เจอดีล {name} มาแบ่งปันให้เพื่อนๆ ในกลุ่มนะคะ 😊

💰 ราคาปกติ {original} บาท → เหลือ {net} บาท
🏷️ โค้ดส่วนลด: {coupon}
✅ ประหยัดได้ {save} บาท!

ดูรายละเอียดเพิ่มเติม: {url}

#คูปอง #ประหยัด #ดีล`,
  },
  question: {
    name: 'ถามชุมชน',
    emoji: '❓',
    desc: 'ถามก่อน ให้ข้อมูล — engagement สูง',
    template: `ใครตามหา {name} อยู่บ้างคะ? 🙋

เจอราคาดีมาก {net} บาท (จาก {original} บาท)
โค้ด: {coupon} ลดได้อีก — ประหยัดรวม {save} บาท

ลิงก์เช็คราคาและรับโค้ด: {url}

ใครซื้อแล้วรีวิวให้ด้วยนะคะ 💬`,
  },
  tip: {
    name: 'เทคนิคช้อป',
    emoji: '💡',
    desc: 'ให้ความรู้ + แนบดีล — ผ่าน anti-spam ได้ดี',
    template: `💡 เทคนิคช้อป {name} ประหยัดสุด

📌 วิธีได้ราคา {net} บาท (จาก {original} บาท):
1. กดลิงก์ด้านล่าง
2. คัดลอกโค้ด: {coupon}
3. วางโค้ดตอน checkout → ลดทันที {save} บาท

รับโค้ดและดูรายละเอียด: {url}

⏰ โค้ดมีจำนวนจำกัด`,
  },
  compare: {
    name: 'เปรียบราคา',
    emoji: '📊',
    desc: 'Net Price รวมทุกส่วนลด — ตัวเลขชัดเจน',
    template: `📊 สรุปราคาสุทธิ {name}

❌ ราคาปกติ: {original} บาท
🏷️ โค้ดลด: {coupon}
✅ ราคาสุทธิ: {net} บาท

ประหยัดไปเลย {save} บาท 🎉
ดูรายละเอียด: {url}

#netprice #คูปองคุ้ม`,
  },
} as const

export type OutreachFormatKey = keyof typeof OUTREACH_FORMATS
export const OUTREACH_FORMAT_KEYS = Object.keys(OUTREACH_FORMATS) as OutreachFormatKey[]

export interface OutreachCaptionVars {
  name: string
  original: string
  net: string
  save: string
  coupon: string
  url: string
}

export function renderOutreachCaption(format: OutreachFormatKey, vars: OutreachCaptionVars): string {
  let text: string = OUTREACH_FORMATS[format].template
  for (const [k, v] of Object.entries(vars)) {
    text = text.replaceAll(`{${k}}`, v)
  }
  return text
}

/** Builds sub_id: fb_group_{short_id}_YYYYMMDD */
export function buildOutreachSubId(shortId: string, nowIct?: Date): string {
  const d = nowIct ?? new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }))
  const yyyymmdd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  return `fb_group_${shortId}_${yyyymmdd}`
}

/**
 * Returns days remaining on cooldown (0 = ready to post).
 * weekly_limit=1 → must wait 7 days between posts.
 */
export function cooldownDaysRemaining(lastPostedAt: Date | null, weeklyLimit = 1): number {
  if (!lastPostedAt) return 0
  const cooldownDays = Math.ceil(7 / weeklyLimit)
  const daysSince = (Date.now() - lastPostedAt.getTime()) / (1000 * 60 * 60 * 24)
  const remaining = cooldownDays - daysSince
  return remaining > 0 ? Math.ceil(remaining) : 0
}
