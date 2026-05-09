import { describe, it, expect } from 'vitest'
import { getCampaignContext } from '../campaign-context'

// Helper: new Date(year, month-1, day)
function d(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day)
}

// =============================================================
// Double Date — day === month (1/1, 2/2, … 12/12)
// =============================================================
describe('getCampaignContext — Double Date', () => {
  it('1/1 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 1, 1))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('01.01 ดีลพิเศษ')
    expect(ctx.month).toBe('ม.ค.')
  })

  it('2/2 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 2, 2))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('02.02 ดีลพิเศษ')
    expect(ctx.month).toBe('ก.พ.')
  })

  it('3/3 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 3, 3))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('03.03 ดีลพิเศษ')
    expect(ctx.month).toBe('มี.ค.')
  })

  it('4/4 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 4, 4))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('04.04 ดีลพิเศษ')
    expect(ctx.month).toBe('เม.ย.')
  })

  it('5/5 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 5, 5))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('05.05 ดีลพิเศษ')
    expect(ctx.month).toBe('พ.ค.')
  })

  it('6/6 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 6, 6))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('06.06 ดีลพิเศษ')
    expect(ctx.month).toBe('มิ.ย.')
  })

  it('7/7 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 7, 7))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('07.07 ดีลพิเศษ')
    expect(ctx.month).toBe('ก.ค.')
  })

  it('8/8 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 8, 8))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('08.08 ดีลพิเศษ')
    expect(ctx.month).toBe('ส.ค.')
  })

  it('9/9 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 9, 9))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('09.09 ดีลพิเศษ')
    expect(ctx.month).toBe('ก.ย.')
  })

  it('10/10 → double_date', () => {
    const ctx = getCampaignContext(d(2026, 10, 10))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('10.10 ดีลพิเศษ')
    expect(ctx.month).toBe('ต.ค.')
  })

  it('11/11 → double_date — special label "คุ้มสุดแห่งปี"', () => {
    const ctx = getCampaignContext(d(2026, 11, 11))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('11.11 คุ้มสุดแห่งปี')
    expect(ctx.month).toBe('พ.ย.')
  })

  it('12/12 → double_date — special label "ส่งท้ายปี"', () => {
    const ctx = getCampaignContext(d(2026, 12, 12))
    expect(ctx.type).toBe('double_date')
    expect(ctx.label).toBe('12.12 ส่งท้ายปี')
    expect(ctx.month).toBe('ธ.ค.')
  })
})

// =============================================================
// Payday — day 25–31 (day !== month)
// =============================================================
describe('getCampaignContext — Payday', () => {
  it('day 25 → payday', () => {
    const ctx = getCampaignContext(d(2026, 1, 25))
    expect(ctx.type).toBe('payday')
    expect(ctx.label).toBe('วันเงินเดือน — โปรพิเศษรอคุณอยู่')
    expect(ctx.month).toBe('ม.ค.')
  })

  it('day 26 → payday', () => {
    expect(getCampaignContext(d(2026, 3, 26)).type).toBe('payday')
  })

  it('day 27 → payday', () => {
    expect(getCampaignContext(d(2026, 3, 27)).type).toBe('payday')
  })

  it('day 28 → payday', () => {
    expect(getCampaignContext(d(2026, 3, 28)).type).toBe('payday')
  })

  it('day 29 → payday', () => {
    expect(getCampaignContext(d(2026, 3, 29)).type).toBe('payday')
  })

  it('day 30 → payday', () => {
    expect(getCampaignContext(d(2026, 3, 30)).type).toBe('payday')
  })

  it('day 31 → payday', () => {
    expect(getCampaignContext(d(2026, 1, 31)).type).toBe('payday')
  })

  it('payday in December (day 28, not 12/12) → payday', () => {
    const ctx = getCampaignContext(d(2026, 12, 28))
    expect(ctx.type).toBe('payday')
    expect(ctx.month).toBe('ธ.ค.')
  })
})

// =============================================================
// Month Start — day 1–5 (day !== month)
// =============================================================
describe('getCampaignContext — Month Start', () => {
  it('day 1 in Feb → month_start', () => {
    const ctx = getCampaignContext(d(2026, 2, 1))
    expect(ctx.type).toBe('month_start')
    expect(ctx.label).toBe('ต้นเดือน — ดีลใหม่มาแล้ว')
    expect(ctx.month).toBe('ก.พ.')
  })

  it('day 2 in Jan → month_start', () => {
    expect(getCampaignContext(d(2026, 1, 2)).type).toBe('month_start')
  })

  it('day 3 in Jan → month_start', () => {
    expect(getCampaignContext(d(2026, 1, 3)).type).toBe('month_start')
  })

  it('day 4 in Jan → month_start', () => {
    expect(getCampaignContext(d(2026, 1, 4)).type).toBe('month_start')
  })

  it('day 5 in Jan → month_start', () => {
    expect(getCampaignContext(d(2026, 1, 5)).type).toBe('month_start')
  })

  it('day 5 in Jun → month_start (day 5 ≠ month 6)', () => {
    expect(getCampaignContext(d(2026, 6, 5)).type).toBe('month_start')
  })
})

// =============================================================
// Normal — day 6–24 (day !== month)
// =============================================================
describe('getCampaignContext — Normal', () => {
  it('day 6 in Jan → normal', () => {
    const ctx = getCampaignContext(d(2026, 1, 6))
    expect(ctx.type).toBe('normal')
    expect(ctx.label).toBe('คุ้มทุกการใช้จ่าย · ง่ายทุกการวางแผน')
  })

  it('day 15 in Mar → normal', () => {
    expect(getCampaignContext(d(2026, 3, 15)).type).toBe('normal')
  })

  it('day 24 in Aug → normal (boundary)', () => {
    expect(getCampaignContext(d(2026, 8, 24)).type).toBe('normal')
  })

  it('day 13 in Apr → normal', () => {
    // today's date in session (2026-04-13): day=13, month=4, day≠month, 6≤13≤24
    const ctx = getCampaignContext(d(2026, 4, 13))
    expect(ctx.type).toBe('normal')
    expect(ctx.month).toBe('เม.ย.')
  })
})

// =============================================================
// Priority / Edge Cases — double_date beats month_start
// =============================================================
describe('getCampaignContext — Priority (double_date > payday > month_start)', () => {
  it('1/1 is double_date NOT month_start (day=1, month=1)', () => {
    expect(getCampaignContext(d(2026, 1, 1)).type).toBe('double_date')
  })

  it('2/2 is double_date NOT month_start (day=2, month=2)', () => {
    expect(getCampaignContext(d(2026, 2, 2)).type).toBe('double_date')
  })

  it('3/3 is double_date NOT month_start (day=3, month=3)', () => {
    expect(getCampaignContext(d(2026, 3, 3)).type).toBe('double_date')
  })

  it('4/4 is double_date NOT month_start (day=4, month=4)', () => {
    expect(getCampaignContext(d(2026, 4, 4)).type).toBe('double_date')
  })

  it('5/5 is double_date NOT month_start (day=5, month=5)', () => {
    expect(getCampaignContext(d(2026, 5, 5)).type).toBe('double_date')
  })

  it('25/1 (payday zone) but day≠month → payday NOT double_date', () => {
    expect(getCampaignContext(d(2026, 1, 25)).type).toBe('payday')
  })

  it('day 24 (boundary) → normal, not payday', () => {
    expect(getCampaignContext(d(2026, 1, 24)).type).toBe('normal')
  })

  it('day 6 (boundary) → normal, not month_start', () => {
    expect(getCampaignContext(d(2026, 1, 6)).type).toBe('normal')
  })
})

// =============================================================
// Month label (Thai) — ตรวจ month string ทั้ง 12 เดือน
// =============================================================
describe('getCampaignContext — Thai month labels', () => {
  const cases: [number, string][] = [
    [1,  'ม.ค.'],
    [2,  'ก.พ.'],
    [3,  'มี.ค.'],
    [4,  'เม.ย.'],
    [5,  'พ.ค.'],
    [6,  'มิ.ย.'],
    [7,  'ก.ค.'],
    [8,  'ส.ค.'],
    [9,  'ก.ย.'],
    [10, 'ต.ค.'],
    [11, 'พ.ย.'],
    [12, 'ธ.ค.'],
  ]

  for (const [month, expected] of cases) {
    it(`month ${month} → "${expected}"`, () => {
      // ใช้ day 15 (normal zone, ไม่ซ้อนกับ double_date ยกเว้น month 15 ซึ่งไม่มี)
      const ctx = getCampaignContext(d(2026, month, 15))
      expect(ctx.month).toBe(expected)
    })
  }
})

// =============================================================
// Default date — ไม่ส่ง argument ต้องไม่ throw
// =============================================================
describe('getCampaignContext — default date', () => {
  it('called without argument returns a valid CampaignContext', () => {
    const ctx = getCampaignContext()
    expect(['double_date', 'payday', 'month_start', 'normal']).toContain(ctx.type)
    expect(typeof ctx.label).toBe('string')
    expect(ctx.label.length).toBeGreaterThan(0)
    expect(typeof ctx.month).toBe('string')
    expect(ctx.month.length).toBeGreaterThan(0)
  })
})
