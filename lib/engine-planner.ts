// lib/engine-planner.ts — Planner Engine HTML generator (DC-6 + DC-15 v2)
import type { PlannerEngineData, PlannerEngineDataV2 } from './engine-types'

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const lines = (n: number, h = '26px') =>
  Array.from({length: n}).map(() =>
    `<div style="border-bottom:1px solid #d1d5db;height:${h};margin-bottom:4px"></div>`
  ).join('')

const PERIOD: Record<string, string> = { yearly:'รายปี', quarterly:'รายไตรมาส', monthly:'รายเดือน', weekly:'รายสัปดาห์' }
const FRAMEWORK: Record<string, string> = { SMART:'SMART Goals', OKR:'OKR', both:'SMART + OKR', none:'' }

export function generatePlannerHtml(data: PlannerEngineData, watermarkText?: string): string {
  const { p1, p2, p3, p4 } = data
  const wm = (watermarkText ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const validGoals = p1.yearlyGoals.filter(g => g.trim())
  const validThemes = p1.quarterlyThemes.filter(t => t.quarter.trim() || t.theme.trim())
  const validRocks  = p1.bigRocks.filter(r => r.trim())
  const validHabits = p3.habitNames.filter(h => h.trim())
  const validFinance= p3.financeCategories.filter(c => c.trim())
  const validReview = p3.reviewQuestions.filter(q => q.trim())
  const validProjects = p4.projectAreas.filter(a => a.trim())
  const validGratitude = p4.gratitudePrompts.filter(p => p.trim())

  // ── Pillar 1 HTML ──────────────────────────────────────────────────────────
  const goalsHtml = validGoals.map((g, i) => `
    <div style="border:1px solid #e9d5ff;border-radius:6px;padding:10px;margin-bottom:8px;page-break-inside:avoid">
      <div style="font-size:8pt;font-weight:700;color:#9ca3af;text-transform:uppercase;margin-bottom:3px">เป้าหมายที่ ${i+1}</div>
      <div style="font-size:11pt;font-weight:700;color:#374151">${esc(g)}</div>
      ${p1.framework !== 'none' ? `<div style="margin-top:6px;padding-top:6px;border-top:1px dashed #e9d5ff;font-size:9pt;color:#9ca3af">KPI / วัดผล: ________________________________</div>` : ''}
    </div>`).join('')

  const themesHtml = validThemes.map(t => `
    <div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:8px;page-break-inside:avoid">
      <div style="font-size:9pt;font-weight:700;color:#7c3aed">${esc(t.quarter)}</div>
      <div style="font-size:11pt;font-weight:700;color:#374151;margin:4px 0">${esc(t.theme)}</div>
      ${t.keyActions.trim() ? t.keyActions.split('\n').filter(a=>a.trim()).map(a=>
        `<div style="font-size:9pt;color:#6b7280;padding-left:12px">→ ${esc(a.trim())}</div>`
      ).join('') : ''}
    </div>`).join('')

  const rocksHtml = validRocks.map(r => `
    <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f3f4f6">
      <span style="font-size:11pt;flex-shrink:0">🏔</span>
      <span style="font-size:10pt;color:#374151;font-weight:700">${esc(r)}</span>
    </div>`).join('')

  // ── Pillar 2 HTML ──────────────────────────────────────────────────────────
  const DAYS_TH = ['จันทร์','อังคาร','พุธ','พฤหัส','ศุกร์','เสาร์','อาทิตย์']

  const monthlyHtml = p2.views.includes('monthly') ? `
    <div style="margin-bottom:14px">
      <div style="font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">มุมมองรายเดือน (Monthly Overview)</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:6px">
        ${['จ','อ','พ','พฤ','ศ','ส','อา'].map(d=>`<div style="text-align:center;font-size:8pt;font-weight:700;color:#374151;padding:3px 0">${d}</div>`).join('')}
        ${Array.from({length:35}).map(()=>`<div style="height:24px;border:1px solid #e5e7eb;border-radius:3px"></div>`).join('')}
      </div>
    </div>` : ''

  const weeklyHtml = p2.views.includes('weekly') ? `
    <div style="margin-bottom:14px">
      <div style="font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">ตารางรายสัปดาห์ (Weekly Layout)</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
        ${DAYS_TH.map(d=>`
          <div style="border:1px solid #e5e7eb;border-radius:6px;padding:6px;min-height:80px">
            <div style="font-size:8pt;font-weight:700;color:#374151;margin-bottom:4px">วัน${d}</div>
            ${lines(4,'18px')}
          </div>`).join('')}
      </div>
    </div>` : ''

  const daysN = Math.max(1, Math.min(p2.daysPerPage || 7, 31))
  const dailyHtml = p2.views.includes('daily') ? `
    <div style="margin-bottom:14px">
      <div style="font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">ตารางรายวัน (${daysN} วัน/หน้า)</div>
      ${Array.from({length:daysN}).map(()=>`
        <div style="border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:8px;page-break-inside:avoid">
          <div style="font-size:9pt;font-weight:700;color:#374151;margin-bottom:4px">วันที่ ___ / เดือน ___ / ปี ___</div>
          ${p2.focusAreas.filter(a=>a.trim()).length > 0 ? `
            <div style="font-size:8pt;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">Focus: ${p2.focusAreas.filter(a=>a.trim()).map(a=>esc(a)).join(' · ')}</div>
            ${lines(1,'22px')}` : ''}
          ${lines(5,'22px')}
        </div>`).join('')}
    </div>` : ''

  const eisenhowerHtml = p2.includeEisenhower ? `
    <div style="margin-bottom:14px;page-break-inside:avoid">
      <div style="font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Eisenhower Matrix — จัดลำดับงาน</div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed">
        <tr>
          <td style="width:80px"></td>
          <td style="text-align:center;font-size:8pt;font-weight:700;color:#ef4444;padding:4px">⚡ เร่งด่วน</td>
          <td style="text-align:center;font-size:8pt;font-weight:700;color:#9ca3af;padding:4px">ไม่เร่งด่วน</td>
        </tr>
        <tr>
          <td style="text-align:right;font-size:8pt;font-weight:700;color:#ef4444;padding:4px;vertical-align:middle">⭐ สำคัญ</td>
          <td style="border:2px solid #ef4444;border-radius:4px;padding:8px;height:80px;vertical-align:top">
            <div style="font-size:7pt;font-weight:700;color:#ef4444;margin-bottom:4px">DO — ทำเดี๋ยวนี้</div>${lines(3,'18px')}
          </td>
          <td style="border:2px solid #3b82f6;border-radius:4px;padding:8px;height:80px;vertical-align:top">
            <div style="font-size:7pt;font-weight:700;color:#3b82f6;margin-bottom:4px">PLAN — วางแผน</div>${lines(3,'18px')}
          </td>
        </tr>
        <tr>
          <td style="text-align:right;font-size:8pt;font-weight:700;color:#9ca3af;padding:4px;vertical-align:middle">ไม่สำคัญ</td>
          <td style="border:2px solid #f59e0b;border-radius:4px;padding:8px;height:80px;vertical-align:top">
            <div style="font-size:7pt;font-weight:700;color:#f59e0b;margin-bottom:4px">DELEGATE — มอบหมาย</div>${lines(3,'18px')}
          </td>
          <td style="border:2px solid #d1d5db;border-radius:4px;padding:8px;height:80px;vertical-align:top">
            <div style="font-size:7pt;font-weight:700;color:#9ca3af;margin-bottom:4px">DELETE — ตัดทิ้ง</div>${lines(3,'18px')}
          </td>
        </tr>
      </table>
    </div>` : ''

  // ── Pillar 3 HTML ──────────────────────────────────────────────────────────
  const habitGrid = validHabits.length > 0
    ? `<table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:7pt">
        <colgroup><col style="width:120px">${Array.from({length:31}).map(()=>'<col>').join('')}</colgroup>
        <tr style="background:#f5f3ff">
          <td style="padding:2px 4px;border:1px solid #e5e7eb"></td>
          ${Array.from({length:31}).map((_,i)=>`<td style="padding:2px 1px;border:1px solid #e5e7eb;text-align:center;font-size:6pt;font-weight:700;color:#7c3aed">${i+1}</td>`).join('')}
        </tr>
        ${validHabits.map(h=>`<tr>
          <td style="padding:3px 4px;border:1px solid #e5e7eb;font-size:8.5pt;font-weight:700;color:#374151;white-space:nowrap;overflow:hidden">${esc(h)}</td>
          ${Array.from({length:31}).map(()=>`<td style="border:1px solid #e5e7eb;height:18px"></td>`).join('')}
        </tr>`).join('')}
      </table>`
    : ''

  const moodHtml = p3.includeMoodTracker ? `
    <div style="margin-bottom:12px">
      <div style="font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Mood Tracker</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        ${['😊 ดีมาก','😌 ดี','😐 ปกติ','😔 ไม่ดี','😞 แย่'].map(m=>
          `<div style="border:1px solid #e5e7eb;border-radius:20px;padding:3px 10px;font-size:9pt;color:#6b7280">${m}</div>`
        ).join('')}
      </div>
      ${lines(3,'22px')}
    </div>` : ''

  const financeHtml = validFinance.length > 0 ? `
    <div style="margin-bottom:12px">
      <div style="font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Finance Tracker</div>
      <table style="width:100%;border-collapse:collapse;font-size:9pt">
        <tr>
          <th style="background:#f0fdf4;padding:5px 8px;border:1px solid #d1fae5;text-align:left;color:#065f46">หมวดหมู่</th>
          <th style="background:#f0fdf4;padding:5px 8px;border:1px solid #d1fae5;text-align:right;color:#065f46">จำนวน (฿)</th>
          <th style="background:#f0fdf4;padding:5px 8px;border:1px solid #d1fae5;color:#065f46">หมายเหตุ</th>
        </tr>
        ${validFinance.map(c=>`
          <tr>
            <td style="padding:5px 8px;border:1px solid #e5e7eb">${esc(c)}</td>
            <td style="padding:5px 8px;border:1px solid #e5e7eb"></td>
            <td style="padding:5px 8px;border:1px solid #e5e7eb"></td>
          </tr>`).join('')}
      </table>
    </div>` : ''

  const reviewHtml = validReview.length > 0 ? `
    <div>
      <div style="font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Review &amp; Reflection (${p3.reviewCycle === 'both' ? 'รายสัปดาห์ + รายเดือน' : p3.reviewCycle === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'})</div>
      ${validReview.map(q=>`
        <div style="margin-bottom:8px">
          <div style="font-size:10pt;font-weight:700;color:#374151;margin-bottom:2px">• ${esc(q)}</div>
          ${lines(2,'22px')}
        </div>`).join('')}
    </div>` : ''

  // ── Pillar 4 HTML ──────────────────────────────────────────────────────────
  const projectsHtml = validProjects.map(a => `
    <div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:8px;page-break-inside:avoid">
      <div style="font-size:10pt;font-weight:700;color:#374151;margin-bottom:6px">📁 ${esc(a)}</div>
      ${lines(4,'22px')}
    </div>`).join('')

  const gratitudeHtml = p4.includeGratitudeJournal && validGratitude.length > 0 ? `
    <div style="margin-bottom:12px">
      <div style="font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Gratitude Journal</div>
      ${validGratitude.map(p=>`
        <div style="margin-bottom:8px">
          <div style="font-size:10pt;color:#374151;margin-bottom:2px">🙏 ${esc(p)}</div>
          ${lines(2,'22px')}
        </div>`).join('')}
    </div>` : ''

  const notesContent = p4.notesStyle === 'dotgrid'
    ? `<div style="display:grid;grid-template-columns:repeat(52,10px);gap:8px;padding:8px">
        ${Array.from({length:390}).map(()=>'<span style="width:2px;height:2px;background:#d1d5db;border-radius:50%;display:block"></span>').join('')}
      </div>`
    : p4.notesStyle === 'lined' ? lines(18)
    : '<div style="height:180px;background:#fafafa;border:1px dashed #d1d5db;border-radius:6px"></div>'

  const brainDumpHtml = Array.from({length: Math.max(1, p4.brainDumpPages || 1)}).map((_, i) => `
    <div style="margin-bottom:12px;page-break-inside:avoid">
      <div style="font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">
        Brain Dump${p4.brainDumpPages > 1 ? ` (หน้า ${i+1})` : ''}
      </div>
      ${notesContent}
    </div>`).join('')

  // ── Full HTML ──────────────────────────────────────────────────────────────
  const fw = FRAMEWORK[p1.framework]

  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,700;1,400&display=block&subset=thai" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a}
${wm ? `body::before{content:"${wm}";position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:70pt;font-weight:900;color:rgba(0,0,0,0.04);white-space:nowrap;z-index:0;pointer-events:none}` : ''}
.hdr{border-bottom:3px solid #7c3aed;padding-bottom:10px;margin-bottom:14px}
.hdr-title{font-size:15pt;font-weight:700;color:#5b21b6}
.hdr-meta{display:flex;gap:18px;margin-top:5px;font-size:9pt;color:#6b7280;flex-wrap:wrap}
.footer{position:fixed;bottom:0;left:0;right:0;z-index:10;background:#fff;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af;padding:3px 0;border-top:1px solid #f3f4f6}
.sec{margin-bottom:16px;page-break-inside:avoid}
.sec-hdr{background:#f5f3ff;border-left:4px solid #7c3aed;padding:5px 10px;font-weight:700;font-size:10pt;color:#5b21b6;margin-bottom:8px}
.sub{font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
</style></head><body>

<div class="hdr">
  <div class="hdr-title">${esc(p1.plannerTitle)}</div>
  <div class="hdr-meta">
    <span>📅 ${PERIOD[p1.period] ?? p1.period}</span>
    ${fw ? `<span>🎯 ${fw}</span>` : ''}
    <span style="margin-left:auto">www.planprom.com</span>
  </div>
  ${p1.description.trim() ? `<p style="font-size:10pt;color:#6b7280;margin-top:5px">${esc(p1.description)}</p>` : ''}
</div>

<div class="sec">
  <div class="sec-hdr">แกนที่ 1 — เป้าหมายและวิสัยทัศน์ (Goal &amp; Vision)</div>
  ${validGoals.length > 0 ? `<div class="sub">เป้าหมายประจำปี</div>${goalsHtml}` : ''}
  ${validThemes.length > 0 ? `<div class="sub" style="margin-top:10px">ภาพรวมรายไตรมาส</div>${themesHtml}` : ''}
  ${validRocks.length > 0 ? `<div class="sub" style="margin-top:10px">Big Rocks — งานสำคัญที่สุด</div>${rocksHtml}` : ''}
</div>

<div class="sec" style="page-break-before:auto">
  <div class="sec-hdr">แกนที่ 2 — การบริหารเวลาและภารกิจ (Execution)</div>
  ${monthlyHtml}${weeklyHtml}${dailyHtml}${eisenhowerHtml}
</div>

<div class="sec" style="page-break-before:auto">
  <div class="sec-hdr">แกนที่ 3 — ติดตามพฤติกรรมและดูแลตัวเอง (Tracking &amp; Self-care)</div>
  ${validHabits.length > 0 ? `<div class="sub">Habit Tracker</div>${habitGrid}` : ''}
  ${moodHtml}${financeHtml}${reviewHtml}
</div>

<div class="sec" style="page-break-before:auto">
  <div class="sec-hdr">แกนที่ 4 — บันทึกความคิดและทรัพยากร (Idea &amp; Resource)</div>
  ${validProjects.length > 0 ? `<div class="sub">Project Planning</div>${projectsHtml}` : ''}
  ${gratitudeHtml}
  ${brainDumpHtml}
</div>

<div class="footer">
  <span>แพลนพร้อม · www.planprom.com</span>
  <span>${esc(p1.plannerTitle)} · ${PERIOD[p1.period] ?? ''}</span>
</div>
</body></html>`
}

// ── Planner Engine v2 ──────────────────────────────────────────────────────

const PLACEHOLDER_RE = [/^เพิ่ม/u, /^ทดสอบ/u, /^test/i]

export function validatePlannerV2(data: PlannerEngineDataV2): void {
  const check = (s: string, field: string) => {
    if (s.trim() && PLACEHOLDER_RE.some(re => re.test(s.trim()))) {
      throw new Error(`Field "${field}" ยังมีค่า placeholder: "${s.trim()}"`)
    }
  }
  check(data.meta.displayTitle, 'displayTitle')
  data.axis1.goalItems.forEach((g, i) => check(g, `goalItems[${i}]`))
  data.axis1.bigRocks.forEach((r, i) => check(r, `bigRocks[${i}]`))
  data.axis1.roadmap.forEach((s, i) => { if (s.theme) check(s.theme, `roadmap[${i}].theme`) })
  if (data.axis3) {
    data.axis3.habitTracker.habits.forEach((h, i) => check(h, `habits[${i}]`))
  }
}

type ThemeColors = { accent: string; light: string; border: string; dark: string }

const THEMES: Record<string, ThemeColors> = {
  violet:  { accent: '#7c3aed', light: '#f5f3ff', border: '#e9d5ff', dark: '#5b21b6' },
  indigo:  { accent: '#4f46e5', light: '#eef2ff', border: '#c7d2fe', dark: '#3730a3' },
  emerald: { accent: '#059669', light: '#f0fdf4', border: '#a7f3d0', dark: '#065f46' },
  rose:    { accent: '#e11d48', light: '#fff1f2', border: '#fecdd3', dark: '#9f1239' },
  amber:   { accent: '#d97706', light: '#fffbeb', border: '#fde68a', dark: '#92400e' },
}

const HORIZON_TH: Record<string, string> = {
  year: 'แผนรายปี', month: 'แผนรายเดือน', week: 'แผนรายสัปดาห์', day: 'แผนรายวัน',
}
const REVIEW_TH: Record<string, string> = {
  daily: 'ทุกวัน', weekly: 'รายสัปดาห์', monthly: 'รายเดือน',
}

export function generatePlannerHtmlV2(data: PlannerEngineDataV2, watermarkText?: string): string {
  const { meta, axis1, axis2, axis3, axis4, axis5 } = data
  const t = THEMES[meta.colorTheme] ?? THEMES.violet
  const wm = (watermarkText ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  // ── Roadmap ──
  const cols = Math.min(axis1.roadmap.length, 4)
  const roadmapHtml = axis1.roadmap.length > 0 ? `
    <div class="sec">
      <div class="sec-hdr">แผนงานภาพรวม</div>
      <div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px">
        ${axis1.roadmap.map(s => `
          <div style="border:1px solid ${t.border};border-radius:6px;padding:10px;background:${t.light}">
            <div style="font-size:9pt;font-weight:900;color:${t.dark};margin-bottom:4px">${esc(s.label)}</div>
            ${s.theme.trim()
              ? `<div style="font-size:10pt;font-weight:700;color:#374151;margin-bottom:4px">${esc(s.theme)}</div>`
              : `<div style="height:18px;border-bottom:1px solid #e5e7eb;margin-bottom:4px"></div>`}
            ${s.keyActions.trim()
              ? s.keyActions.split('\n').filter(a=>a.trim()).map(a=>`<div style="font-size:8pt;color:#6b7280">→ ${esc(a.trim())}</div>`).join('')
              : `<div style="height:14px;border-bottom:1px dashed #e5e7eb"></div><div style="height:14px;border-bottom:1px dashed #e5e7eb;margin-top:4px"></div>`}
          </div>`).join('')}
      </div>
    </div>` : ''

  // ── Axis 1 ──
  const validGoals = axis1.goalItems.filter(g=>g.trim())
  const goalsHtml = validGoals.length > 0 ? `
    <div class="sub">เป้าหมายหลัก</div>
    ${validGoals.map((g,i)=>`
      <div style="border:1px solid ${t.border};border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-size:8pt;font-weight:700;color:#9ca3af;margin-bottom:2px">${i+1}.</div>
        <div style="font-size:11pt;font-weight:700;color:#374151">${esc(g)}</div>
        ${axis1.showKpiLine ? `<div style="margin-top:6px;border-top:1px dashed #e5e7eb;padding-top:4px;font-size:9pt;color:#9ca3af">ตัวชี้วัด / วิธีวัดผล: ________________________________</div>` : ''}
      </div>`).join('')}` : ''

  const validRocks = axis1.bigRocks.filter(r=>r.trim())
  const rocksHtml = validRocks.length > 0 ? `
    <div class="sub" style="margin-top:10px">สิ่งสำคัญที่ต้องทำให้ได้ก่อน</div>
    ${validRocks.map(r=>`
      <div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f3f4f6">
        <span style="font-size:11pt">🏔</span>
        <span style="font-size:10pt;color:#374151;font-weight:700">${esc(r)}</span>
      </div>`).join('')}` : ''

  const axis1Html = (goalsHtml || rocksHtml) ? `
    <div class="sec">
      <div class="sec-hdr">เป้าหมายและสิ่งสำคัญ</div>
      ${goalsHtml}${rocksHtml}
    </div>` : ''

  // ── Axis 2 (optional) ──
  let axis2Html = ''
  if (axis2) {
    const decisionsHtml = axis2.decisions.filter(d=>d.question.trim()).map(d=>`
      <div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:8px">
        <div style="font-weight:700;font-size:10pt;color:#374151;margin-bottom:6px">❓ ${esc(d.question)}</div>
        ${d.options.filter(o=>o.trim()).map(o=>`<div style="padding:4px 0;border-bottom:1px dashed #f3f4f6;font-size:9pt;color:#6b7280">□ ${esc(o)}</div>`).join('')}
        <div style="margin-top:6px;font-size:9pt;color:#9ca3af">เลือก: ________________________________</div>
      </div>`).join('')
    const extraRocksHtml = axis2.extraBigRocks.filter(r=>r.trim()).map(r=>`
      <div style="padding:5px 0;border-bottom:1px solid #f3f4f6;font-size:10pt;color:#374151">□ ${esc(r)}</div>`).join('')
    if (decisionsHtml || extraRocksHtml) {
      axis2Html = `
        <div class="sec" style="page-break-before:auto">
          <div class="sec-hdr">ตารางช่วยตัดสินใจ</div>
          ${decisionsHtml}
          ${extraRocksHtml ? `<div class="sub" style="margin-top:10px">รายการเพิ่มเติม</div>${extraRocksHtml}` : ''}
        </div>`
    }
  }

  // ── Axis 3 (optional) ──
  let axis3Html = ''
  if (axis3) {
    const { days } = axis3.habitTracker
    const validHabits = axis3.habitTracker.habits.filter(h=>h.trim())
    const nameColW = days <= 7 ? '100px' : '80px'
    const habitHtml = validHabits.length > 0 && days > 0 ? `
      <div class="sub">ตารางติดตามนิสัย (${days <= 7 ? 'รายสัปดาห์' : 'รายเดือน'})</div>
      <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:7pt;margin-bottom:12px">
        <colgroup><col style="width:${nameColW}">${Array.from({length:days}).map(()=>'<col>').join('')}</colgroup>
        <tr style="background:${t.light}">
          <td style="padding:2px 4px;border:1px solid #e5e7eb"></td>
          ${Array.from({length:days}).map((_,i)=>`<td style="padding:2px 1px;border:1px solid #e5e7eb;text-align:center;font-size:6pt;font-weight:700;color:${t.accent}">${i+1}</td>`).join('')}
        </tr>
        ${validHabits.map(h=>`<tr>
          <td style="padding:3px 4px;border:1px solid #e5e7eb;font-size:8pt;font-weight:700;color:#374151;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(h)}</td>
          ${Array.from({length:days}).map(()=>`<td style="border:1px solid #e5e7eb;height:22px"></td>`).join('')}
        </tr>`).join('')}
      </table>` : ''

    const moodHtml = axis3.includeMoodTracker ? `
      <div class="sub">บันทึกอารมณ์</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        ${['😊 ดีมาก','😌 ดี','😐 ปกติ','😔 ไม่ดี','😞 แย่'].map(m=>`<div style="border:1px solid #e5e7eb;border-radius:20px;padding:3px 10px;font-size:9pt;color:#6b7280">${m}</div>`).join('')}
      </div>
      ${lines(2,'22px')}` : ''

    const validCats = axis3.financeTracker.categories.filter(c=>c.name.trim())
    const financeHtml = validCats.length > 0 ? `
      <div class="sub" style="margin-top:10px">บันทึกรายรับ-รายจ่าย</div>
      <table style="width:100%;border-collapse:collapse;font-size:9pt;margin-bottom:12px">
        <tr>
          <th style="background:#f0fdf4;padding:5px 8px;border:1px solid #d1fae5;text-align:left;color:#065f46">รายการ</th>
          <th style="background:#f0fdf4;padding:5px 8px;border:1px solid #d1fae5;color:#065f46">ประเภท</th>
          <th style="background:#f0fdf4;padding:5px 8px;border:1px solid #d1fae5;text-align:right;color:#065f46">จำนวน (฿)</th>
        </tr>
        ${validCats.map(c=>`<tr>
          <td style="padding:5px 8px;border:1px solid #e5e7eb">${esc(c.name)}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb;color:${c.type==='income'?'#059669':'#dc2626'}">${c.type==='income'?'รายรับ':'รายจ่าย'}</td>
          <td style="padding:5px 8px;border:1px solid #e5e7eb"></td>
        </tr>`).join('')}
      </table>` : ''

    const validRQs = axis3.reviewQuestions.filter(q=>q.trim())
    const reviewHtml = validRQs.length > 0 ? `
      <div class="sub" style="margin-top:10px">ทบทวนตัวเอง (${REVIEW_TH[axis3.reviewCycle] ?? axis3.reviewCycle})</div>
      ${validRQs.map(q=>`
        <div style="margin-bottom:8px">
          <div style="font-size:10pt;font-weight:700;color:#374151;margin-bottom:2px">• ${esc(q)}</div>
          ${lines(2,'22px')}
        </div>`).join('')}` : ''

    if (habitHtml || moodHtml || financeHtml || reviewHtml) {
      axis3Html = `
        <div class="sec" style="page-break-before:auto">
          <div class="sec-hdr">ติดตามและดูแลตัวเอง</div>
          ${habitHtml}${moodHtml}${financeHtml}${reviewHtml}
        </div>`
    }
  }

  // ── Axis 4 (optional) ──
  let axis4Html = ''
  if (axis4) {
    const checklistHtml = axis4.checklist.filter(p=>p.phase.trim()&&p.items.filter(i=>i.trim()).length>0).map(p=>`
      <div style="margin-bottom:12px">
        <div style="font-size:10pt;font-weight:900;color:${t.dark};margin-bottom:4px">📋 ${esc(p.phase)}</div>
        ${p.items.filter(i=>i.trim()).map(item=>`
          <div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;border-bottom:1px solid #f3f4f6">
            <span style="width:14px;height:14px;border:2px solid ${t.border};border-radius:3px;display:inline-block;flex-shrink:0;margin-top:2px"></span>
            <span style="font-size:9pt;color:#374151">${esc(item.trim())}</span>
          </div>`).join('')}
      </div>`).join('')

    const packingHtml = axis4.packingList.filter(p=>p.category.trim()&&p.items.filter(i=>i.trim()).length>0).map(p=>`
      <div style="margin-bottom:12px">
        <div style="font-size:10pt;font-weight:900;color:${t.dark};margin-bottom:4px">${esc(p.category)}</div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px">
          ${p.items.filter(i=>i.trim()).map(item=>`
            <div style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:9pt;color:#374151">
              <span style="width:12px;height:12px;border:1px solid ${t.border};border-radius:2px;display:inline-block;flex-shrink:0"></span>
              ${esc(item.trim())}
            </div>`).join('')}
        </div>
      </div>`).join('')

    const ideaBoardHtml = axis4.ideaBoard ? `
      <div class="sub" style="margin-top:10px">บอร์ดไอเดีย</div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
        ${Array.from({length:4}).map((_,i)=>`
          <div style="border:1px solid ${t.border};border-radius:6px;padding:10px;min-height:80px">
            <div style="font-size:8pt;font-weight:700;color:${t.accent};margin-bottom:6px">ไอเดียที่ ${i+1}</div>
            ${lines(3,'20px')}
          </div>`).join('')}
      </div>` : ''

    if (checklistHtml || packingHtml || ideaBoardHtml) {
      axis4Html = `
        <div class="sec" style="page-break-before:auto">
          <div class="sec-hdr">เช็คลิสต์และรายการเตรียมตัว</div>
          ${checklistHtml}${packingHtml}${ideaBoardHtml}
        </div>`
    }
  }

  // ── Axis 5 ──
  const diaryHtml = axis5.dailyDiary.enabled && axis5.dailyDiary.days > 0 ? `
    <div class="sub">บันทึกประจำวัน</div>
    ${Array.from({length:axis5.dailyDiary.days}).map(()=>`
      <div style="border:1px solid #e5e7eb;border-radius:6px;padding:8px;margin-bottom:8px;page-break-inside:avoid">
        <div style="font-size:9pt;font-weight:700;color:#374151;margin-bottom:4px">วันที่ ___ เดือน ____________ ปี _______</div>
        ${lines(5,'22px')}
      </div>`).join('')}` : ''

  const notesContent = axis5.notesStyle === 'dotgrid'
    ? `<div style="display:grid;grid-template-columns:repeat(40,1fr);gap:10px;padding:8px">
        ${Array.from({length:400}).map(()=>'<span style="width:2px;height:2px;background:#d1d5db;border-radius:50%;display:block"></span>').join('')}
      </div>`
    : axis5.notesStyle === 'lined' ? lines(18)
    : '<div style="height:180px;background:#fafafa;border:1px dashed #d1d5db;border-radius:6px"></div>'

  const notesHtml = axis5.notesPages > 0 ? Array.from({length:axis5.notesPages}).map((_,i)=>`
    <div style="margin-bottom:12px;page-break-inside:avoid">
      <div class="sub">${axis5.notesPages > 1 ? `หน้าจดบันทึก (${i+1}/${axis5.notesPages})` : 'หน้าจดบันทึก'}</div>
      ${notesContent}
    </div>`).join('') : ''

  const validGratitude = axis5.gratitudePrompts.filter(p=>p.trim())
  const gratitudeHtml = axis5.includeGratitudeJournal && validGratitude.length > 0 ? `
    <div class="sub" style="margin-top:10px">บันทึกสิ่งดีๆ</div>
    ${validGratitude.map(p=>`
      <div style="margin-bottom:8px">
        <div style="font-size:10pt;color:#374151;margin-bottom:2px">🙏 ${esc(p)}</div>
        ${lines(2,'22px')}
      </div>`).join('')}` : ''

  const validRQs5 = axis5.reviewQuestions.filter(q=>q.trim())
  const reviewQsHtml = validRQs5.length > 0 ? `
    <div class="sub" style="margin-top:10px">ทบทวนบทเรียน</div>
    ${validRQs5.map(q=>`
      <div style="margin-bottom:8px">
        <div style="font-size:10pt;font-weight:700;color:#374151;margin-bottom:2px">• ${esc(q)}</div>
        ${lines(2,'22px')}
      </div>`).join('')}` : ''

  const axis5Html = (diaryHtml || notesHtml || gratitudeHtml || reviewQsHtml) ? `
    <div class="sec" style="page-break-before:auto">
      <div class="sec-hdr">บันทึกและทบทวน</div>
      ${diaryHtml}${notesHtml}${gratitudeHtml}${reviewQsHtml}
    </div>` : ''

  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,700;1,400&display=block&subset=thai" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a}
${wm ? `body::before{content:"${wm}";position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:70pt;font-weight:900;color:rgba(0,0,0,0.04);white-space:nowrap;z-index:0;pointer-events:none}` : ''}
.hdr{border-bottom:3px solid ${t.accent};padding-bottom:10px;margin-bottom:14px}
.hdr-title{font-size:15pt;font-weight:700;color:${t.dark}}
.hdr-meta{display:flex;gap:18px;margin-top:5px;font-size:9pt;color:#6b7280;flex-wrap:wrap}
.footer{position:fixed;bottom:0;left:0;right:0;z-index:10;background:#fff;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af;padding:3px 0;border-top:1px solid #f3f4f6}
.sec{margin-bottom:16px;page-break-inside:avoid}
.sec-hdr{background:${t.light};border-left:4px solid ${t.accent};padding:5px 10px;font-weight:700;font-size:10pt;color:${t.dark};margin-bottom:8px}
.sub{font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
</style></head><body>

<div class="hdr">
  <div class="hdr-title">${esc(meta.displayTitle)}</div>
  <div class="hdr-meta">
    <span>📅 ${HORIZON_TH[meta.planningHorizon] ?? meta.planningHorizon}</span>
    <span style="margin-left:auto">www.planprom.com</span>
  </div>
</div>

${roadmapHtml}
${axis1Html}
${axis2Html}
${axis3Html}
${axis4Html}
${axis5Html}

<div class="footer">
  <span>แพลนพร้อม · www.planprom.com</span>
  <span>${esc(meta.displayTitle)}</span>
</div>
</body></html>`
}
