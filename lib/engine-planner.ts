// lib/engine-planner.ts — Planner Engine HTML generator (DC-6)
import type { PlannerEngineData } from './engine-types'

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
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap" rel="stylesheet">
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
