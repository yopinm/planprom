// campaign-context.ts — Shared Campaign Calendar Logic
// Used by: TASK 1.15 (UI headline) + TASK 2.5.3 (Post Score)
//          + TASK 3.6 (generateMetadata) + TASK 3.7 (H1)
//
// Rules (from CLAUDE.md):
//   Double Date  : day === month (1/1, 2/2, … 12/12)
//   Payday       : day 25–31
//   Month Start  : day 1–5
//   Normal       : everything else

export type CampaignType = 'double_date' | 'payday' | 'month_start' | 'peak_traffic' | 'normal'

export interface CampaignContext {
  type: CampaignType
  label: string
  month: string
}

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.',
  'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.',
  'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

/** e.g. 11/11 → "11.11 คุ้มสุดแห่งปี" */
function doubleLabel(day: number): string {
  const d = String(day).padStart(2, '0')
  const special: Record<number, string> = {
    11: `${d}.${d} คุ้มสุดแห่งปี`,
    12: `${d}.${d} ส่งท้ายปี`,
  }
  return special[day] ?? `${d}.${d} ดีลพิเศษ`
}

export function getCampaignContext(date: Date = new Date()): CampaignContext {
  const day   = date.getDate()        // 1–31
  const month = date.getMonth() + 1   // 1–12
  const monthLabel = THAI_MONTHS[date.getMonth()]

  // Double Date: day === month (1/1, 5/5, 11/11, 12/12, …)
  if (day === month) {
    return {
      type:  'double_date',
      label: doubleLabel(day),
      month: monthLabel,
    }
  }

  // Payday: day 25–31
  if (day >= 25) {
    return {
      type:  'payday',
      label: 'วันเงินเดือน — โปรพิเศษรอคุณอยู่',
      month: monthLabel,
    }
  }

  // Month Start: day 1–5
  if (day <= 5) {
    return {
      type:  'month_start',
      label: 'ต้นเดือน — ดีลใหม่มาแล้ว',
      month: monthLabel,
    }
  }

  // Normal
  return {
    type:  'normal',
    label: 'คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน',
    month: monthLabel,
  }
}
