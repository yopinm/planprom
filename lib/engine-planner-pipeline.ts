// lib/engine-planner-pipeline.ts — Pipeline Planner v3 HTML generator (DC-16)
import type { PlannerPipelineData } from './engine-types'

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const lines = (n: number, h = '24px') =>
  Array.from({length: n}).map(() =>
    `<div style="border-bottom:1px solid #d1d5db;height:${h};margin-bottom:4px"></div>`
  ).join('')

const FREQ: Record<string, string> = { daily: 'ทุกวัน', weekly: 'ทุกสัปดาห์', monthly: 'ทุกเดือน' }

export function validatePlannerPipeline(data: PlannerPipelineData): void {
  if (!data.stage1_goal.bigGoal.trim()) throw new Error('เป้าหมายหลัก (bigGoal) ว่าง')
  if (!data.stage1_goal.deadline.trim()) throw new Error('กำหนดเสร็จ (deadline) ว่าง')
  if (data.stage2_plan.phases.filter(p => p.name.trim()).length === 0)
    throw new Error('ต้องมีอย่างน้อย 1 ช่วง (phase) ที่มีชื่อ')
}

export function generatePlannerPipelineHtml(data: PlannerPipelineData, watermarkText?: string): string {
  const { meta, stage1_goal: s1, stage2_plan: s2, stage3_track: s3, notes } = data
  const wm = (watermarkText ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const COLORS: Record<string, { accent: string; light: string; text: string }> = {
    violet:  { accent: '#7c3aed', light: '#f5f3ff', text: '#5b21b6' },
    rose:    { accent: '#e11d48', light: '#fff1f2', text: '#be123c' },
    emerald: { accent: '#059669', light: '#ecfdf5', text: '#047857' },
    amber:   { accent: '#d97706', light: '#fffbeb', text: '#92400e' },
    sky:     { accent: '#0284c7', light: '#e0f2fe', text: '#0369a1' },
  }
  const c = COLORS[meta.colorTheme] ?? COLORS.violet

  // ── Stage 1 ──────────────────────────────────────────────────────────────
  const criteriaHtml = s1.successCriteria.filter(x => x.trim()).map(x =>
    `<div style="padding:4px 0;border-bottom:1px solid #f3f4f6;font-size:9.5pt;color:#374151">
      <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${c.accent};margin-right:6px;vertical-align:middle;flex-shrink:0"></span>${esc(x)}
    </div>`
  ).join('')

  const constraintRows = [
    s1.constraints.budget     ? `<tr><td style="font-size:9pt;font-weight:700;color:#6b7280;padding:4px 0;border-bottom:1px dashed #e5e7eb;white-space:nowrap;padding-right:12px">งบจำกัด</td><td style="font-size:9.5pt;color:#374151;padding:4px 0;border-bottom:1px dashed #e5e7eb">${esc(s1.constraints.budget)}</td></tr>` : '',
    s1.constraints.timeLimit  ? `<tr><td style="font-size:9pt;font-weight:700;color:#6b7280;padding:4px 0;border-bottom:1px dashed #e5e7eb;white-space:nowrap;padding-right:12px">เวลาจำกัด</td><td style="font-size:9.5pt;color:#374151;padding:4px 0;border-bottom:1px dashed #e5e7eb">${esc(s1.constraints.timeLimit)}</td></tr>` : '',
    ...(s1.constraints.others ?? []).filter(x => x.trim()).map(x =>
      `<tr><td></td><td style="font-size:9.5pt;color:#374151;padding:2px 0">• ${esc(x)}</td></tr>`
    ),
  ].join('')

  const s1Html = `
    <div style="border:1px solid ${c.accent};border-radius:6px;padding:12px 16px;margin-bottom:10px;background:${c.light}">
      <div style="font-size:8pt;font-weight:700;color:${c.text};text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">เป้าหมายหลัก</div>
      <div style="font-size:13pt;font-weight:700;color:#1a1a1a;line-height:1.4;word-break:break-word;overflow-wrap:anywhere">${esc(s1.bigGoal)}</div>
    </div>
    <table style="border-collapse:collapse;margin-bottom:10px">
      <tr>
        <td style="font-size:9pt;font-weight:700;color:#6b7280;padding:4px 0;border-bottom:1px dashed #e5e7eb;white-space:nowrap;padding-right:12px">กำหนดเสร็จ</td>
        <td style="font-size:9.5pt;color:#374151;padding:4px 0;border-bottom:1px dashed #e5e7eb">${esc(s1.deadline)}</td>
      </tr>
      ${s1.why.trim() ? `<tr><td style="font-size:9pt;font-weight:700;color:#6b7280;padding:4px 0;border-bottom:1px dashed #e5e7eb;white-space:nowrap;padding-right:12px">ทำไมสำคัญ</td><td style="font-size:9.5pt;color:#374151;padding:4px 0;border-bottom:1px dashed #e5e7eb;word-break:break-word;overflow-wrap:anywhere">${esc(s1.why)}</td></tr>` : ''}
      ${constraintRows}
    </table>
    ${criteriaHtml ? `<div class="sub">รู้ว่าสำเร็จเมื่อ</div>${criteriaHtml}` : ''}`

  // ── Stage 2 ──────────────────────────────────────────────────────────────
  const phasesHtml = s2.phases.filter(p => p.name.trim()).map((p, i) =>
    `<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;margin-bottom:8px;page-break-inside:avoid">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:10pt;font-weight:700;color:${c.text}">ช่วงที่ ${i+1}: ${esc(p.name)}</div>
        ${p.timeRange.trim() ? `<div style="font-size:8.5pt;color:#6b7280">${esc(p.timeRange)}</div>` : ''}
      </div>
      ${p.tasks.filter(t => t.trim()).map(t =>
        `<div style="font-size:9.5pt;color:#374151;padding:2px 0 2px 12px;border-bottom:1px dotted #f3f4f6">→ ${esc(t)}</div>`
      ).join('')}
      ${p.budget?.trim() ? `<div style="font-size:8.5pt;color:#be123c;font-weight:700;margin-top:6px;padding-top:4px;border-top:1px dashed #e5e7eb">งบ: ${esc(p.budget)}</div>` : ''}
    </div>`
  ).join('')

  const bigRocksHtml = s2.bigRocks.filter(r => r.task.trim()).map(r =>
    `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f3f4f6">
      <span style="display:inline-block;width:8px;height:8px;background:${c.accent};border-radius:2px;flex-shrink:0;margin-top:4px"></span>
      <span style="font-size:9.5pt;color:#374151;font-weight:600;flex:1;word-break:break-word;overflow-wrap:anywhere">${esc(r.task)}</span>
      ${r.deadline.trim() ? `<span style="font-size:8.5pt;color:#be123c;font-weight:700;white-space:nowrap;margin-left:6px">${esc(r.deadline)}</span>` : ''}
    </div>`
  ).join('')

  // ── Stage 3 — Habits ──────────────────────────────────────────────────────
  const habits = s3.habits.filter(h => h.trim())
  const habitGrid = habits.length > 0 ? (() => {
    const days = 31
    const nums = Array.from({length: days}, (_, i) => i + 1)
    const cellW = 16
    return `
      <table style="width:100%;border-collapse:collapse;font-size:7.5pt;table-layout:fixed">
        <colgroup>
          <col style="width:110px">
          ${nums.map(() => `<col style="width:${cellW}px">`).join('')}
        </colgroup>
        <tr>
          <th style="border:1px solid #e5e7eb;padding:3px 4px;background:${c.light};color:${c.text};text-align:left;font-size:7pt">นิสัย / วัน</th>
          ${nums.map(d =>
            `<th style="border:1px solid #e5e7eb;padding:2px;background:${c.light};color:${c.text};text-align:center${d % 7 === 0 ? ';border-right:2px solid ' + c.accent : ''}">${d}</th>`
          ).join('')}
        </tr>
        ${habits.map(h =>
          `<tr>
            <td style="border:1px solid #e5e7eb;padding:3px 4px;font-size:7.5pt;font-weight:600;color:#374151;word-break:break-all;overflow-wrap:anywhere">${esc(h)}</td>
            ${nums.map(d =>
              `<td style="border:1px solid #e5e7eb${d % 7 === 0 ? ';border-right:2px solid ' + c.accent : ''}"></td>`
            ).join('')}
          </tr>`
        ).join('')}
      </table>`
  })() : ''

  const metricsHtml = s3.metrics.filter(m => m.name.trim()).length > 0 ? `
    <table style="width:100%;border-collapse:collapse;font-size:9.5pt;margin:4px 0">
      <tr>
        <th style="border:1px solid #e5e7eb;padding:5px 8px;background:${c.light};color:${c.text};text-align:left">วัดอะไร</th>
        <th style="border:1px solid #e5e7eb;padding:5px 8px;background:${c.light};color:${c.text};text-align:left">เป้า</th>
        <th style="border:1px solid #e5e7eb;padding:5px 8px;background:${c.light};color:${c.text};text-align:left">ความถี่</th>
      </tr>
      ${s3.metrics.filter(m => m.name.trim()).map(m =>
        `<tr>
          <td style="border:1px solid #e5e7eb;padding:5px 8px;color:#374151">${esc(m.name)}</td>
          <td style="border:1px solid #e5e7eb;padding:5px 8px;color:#be123c;font-weight:700">${esc(m.target)}</td>
          <td style="border:1px solid #e5e7eb;padding:5px 8px;color:#6b7280">${FREQ[m.frequency] ?? m.frequency}</td>
        </tr>`
      ).join('')}
    </table>` : ''

  const reviewQsHtml = s3.reviewQuestions.filter(q => q.trim()).map((q, i) =>
    `<div style="padding:8px 0;border-bottom:1px dashed #e5e7eb">
      <div style="font-size:9.5pt;font-weight:700;color:#374151;margin-bottom:4px">${i+1}. ${esc(q)}</div>
      <div style="border-bottom:1px solid #d1d5db;height:20px;margin-bottom:3px"></div>
      <div style="border-bottom:1px solid #d1d5db;height:20px"></div>
    </div>`
  ).join('')

  const adjHtml = (s3.adjustmentRules ?? []).filter(r => r.trim()).map(r =>
    `<div style="background:${c.light};border-left:3px solid ${c.accent};padding:6px 10px;margin:4px 0;font-size:9pt;color:#374151;border-radius:3px;word-break:break-word;overflow-wrap:anywhere">${esc(r)}</div>`
  ).join('')

  // ── Notes ────────────────────────────────────────────────────────────────
  const notesHtml = notes && (notes.diaryDays > 0 || notes.notesPages > 0) ? `
    <div class="sec" style="page-break-before:auto">
      <div class="sec-hdr">บันทึก</div>
      ${notes.diaryDays > 0 ? Array.from({length: notes.diaryDays}).map(() =>
        `<div style="margin-bottom:8px;page-break-inside:avoid">
          <div style="font-size:8pt;font-weight:700;color:#6b7280;margin-bottom:4px">วันที่ ___ / ___ / _____</div>
          ${lines(4)}
        </div>`
      ).join('') : ''}
      ${notes.notesPages > 0 ? Array.from({length: notes.notesPages}).map(() =>
        `<div style="margin-bottom:12px;page-break-inside:avoid">
          ${notes.notesStyle === 'dotgrid'
            ? `<div style="display:grid;grid-template-columns:repeat(40,12px);gap:8px;padding:8px">${Array.from({length:300}).map(()=>'<span style="width:2px;height:2px;background:#d1d5db;border-radius:50%;display:block"></span>').join('')}</div>`
            : notes.notesStyle === 'blank'
            ? '<div style="height:200px;background:#fafafa;border:1px dashed #d1d5db;border-radius:6px"></div>'
            : lines(20)}
        </div>`
      ).join('') : ''}
    </div>` : ''

  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,700;1,400&display=block&subset=thai" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a}
${wm ? `body::before{content:"${wm}";position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:70pt;font-weight:900;color:rgba(0,0,0,0.04);white-space:nowrap;z-index:0;pointer-events:none}` : ''}
.hdr{border-bottom:3px solid ${c.accent};padding-bottom:10px;margin-bottom:14px}
.hdr-title{font-size:15pt;font-weight:700;color:${c.text}}
.hdr-sub{font-size:9pt;color:#6b7280;margin-top:3px}
.footer{position:fixed;bottom:0;left:0;right:0;z-index:10;background:#fff;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af;padding:3px 0;border-top:1px solid #f3f4f6}
.sec{margin-bottom:16px;page-break-inside:avoid}
.sec-hdr{background:${c.light};border-left:4px solid ${c.accent};padding:5px 10px;font-weight:700;font-size:10pt;color:${c.text};margin-bottom:8px}
.sub{font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
</style></head><body>

<div class="hdr">
  <div class="hdr-title">${esc(meta.title)}</div>
  ${meta.description.trim() ? `<div class="hdr-sub">${esc(meta.description)}</div>` : ''}
  <div class="hdr-sub" style="text-align:right">www.planprom.com</div>
</div>

<div class="sec">
  <div class="sec-hdr">ขั้นที่ 1 — ตั้งเป้า</div>
  ${s1Html}
</div>

<div class="sec" style="page-break-before:auto">
  <div class="sec-hdr">ขั้นที่ 2 — ลงมือทำ</div>
  ${phasesHtml}
  ${bigRocksHtml ? `<div class="sub" style="margin-top:10px">งานสำคัญที่ต้องทำให้ได้</div>${bigRocksHtml}` : ''}
</div>

<div class="sec" style="page-break-before:auto">
  <div class="sec-hdr">ขั้นที่ 3 — ติดตาม</div>
  ${habitGrid ? `<div class="sub">นิสัยรายวัน</div>${habitGrid}` : ''}
  ${metricsHtml ? `<div class="sub" style="margin-top:12px">ตัววัดผล</div>${metricsHtml}` : ''}
  ${reviewQsHtml ? `<div class="sub" style="margin-top:12px">คำถามทบทวน (${FREQ[s3.reviewCycle] ?? s3.reviewCycle})</div>${reviewQsHtml}` : ''}
  ${adjHtml ? `<div class="sub" style="margin-top:12px">ปรับแผนเมื่อ</div>${adjHtml}` : ''}
</div>

${notesHtml}

<div class="footer">
  <span>${esc(meta.title)}</span>
  <span>www.planprom.com</span>
</div>

</body></html>`
}
