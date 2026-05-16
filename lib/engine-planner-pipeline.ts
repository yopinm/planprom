// lib/engine-planner-pipeline.ts — Pipeline Planner v3/v4 HTML generator (DC-16)
import type { PlannerPipelineData, PlannerPipelineDataV4, PipelinePhase, PipelineBigRock } from './engine-types'

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
    black:   { accent: '#111827', light: '#f9fafb', text: '#374151' },
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
    `<div style="background:${c.light};padding:6px 10px;margin:4px 0;font-size:9pt;color:#374151;border-radius:3px;word-break:break-word;overflow-wrap:anywhere">${esc(r)}</div>`
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
<link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,700;1,400&display=block&subset=thai,latin" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a}
${wm ? `body::before{content:"${wm}";position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:70pt;font-weight:900;color:rgba(0,0,0,0.04);white-space:nowrap;z-index:0;pointer-events:none}` : ''}
.hdr{border-bottom:3px solid ${c.accent};padding-bottom:10px;margin-bottom:14px}
.hdr-title{font-size:15pt;font-weight:700;color:${c.text}}
.hdr-sub{font-size:9pt;color:#6b7280;margin-top:3px}
.footer{position:fixed;bottom:0;left:0;right:0;z-index:10;background:#fff;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af;padding:3px 0;border-top:1px solid #f3f4f6}
.sec{margin-bottom:16px;page-break-inside:avoid}
.sec-hdr{background:${c.light};padding:5px 10px;font-weight:700;font-size:10pt;color:${c.text};margin-bottom:8px}
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

// ── Pipeline v4 ──────────────────────────────────────────────────────────────

export function validatePlannerPipelineV4(data: PlannerPipelineDataV4): void {
  if (!data.s1_goal.goal.trim()) throw new Error('เป้าหมาย (goal) ว่าง')
  if (!data.s1_goal.deadline.trim()) throw new Error('กำหนดเสร็จ (deadline) ว่าง')
  if (data.s1_goal.horizon === 'project') {
    const phases = data.s2_timeplan.phases ?? []
    if (phases.filter(p => p.name.trim()).length === 0)
      throw new Error('ต้องมีอย่างน้อย 1 ช่วง (phase) ที่มีชื่อ')
  }
}

export function generatePlannerPipelineHtmlV4(data: PlannerPipelineDataV4, watermarkText?: string): string {
  const { meta, s1_goal: s1, s2_timeplan: s2, s3_weekly: s3, s3_content: s3c, s4_daily: s4, s4_content: s4c, s5_review: s5 } = data
  const wm = (watermarkText ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')

  const COLORS: Record<string, { accent: string; light: string; text: string }> = {
    violet:  { accent: '#7c3aed', light: '#f5f3ff', text: '#5b21b6' },
    rose:    { accent: '#e11d48', light: '#fff1f2', text: '#be123c' },
    emerald: { accent: '#059669', light: '#ecfdf5', text: '#047857' },
    amber:   { accent: '#d97706', light: '#fffbeb', text: '#92400e' },
    sky:     { accent: '#0284c7', light: '#e0f2fe', text: '#0369a1' },
    black:   { accent: '#111827', light: '#f9fafb', text: '#374151' },
  }
  const c = COLORS[meta.colorTheme] ?? COLORS.violet

  const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  const CYCLE_LABEL: Record<string, string> = { daily: 'ทุกวัน', weekly: 'ทุกสัปดาห์', monthly: 'ทุกเดือน' }

  const blankLines = (n: number, h = '28px') =>
    Array.from({length: n}).map(() =>
      `<div style="border-bottom:1px solid #d1d5db;height:${h};margin-bottom:6px"></div>`
    ).join('')

  // ── Section 1: เป้าหมาย ─────────────────────────────────────────────────
  const s1Html = `
    <div class="sec">
      <div class="sec-hdr">เป้าหมายของฉัน</div>
      <div style="border:2px solid ${c.accent};border-radius:8px;padding:14px 18px;margin-bottom:12px;background:${c.light}">
        <div style="font-size:14pt;font-weight:700;color:#1a1a1a;line-height:1.5;word-break:break-word;overflow-wrap:anywhere">${esc(s1.goal)}</div>
      </div>
      <table style="border-collapse:collapse;width:100%;margin-bottom:12px">
        <tr>
          <td style="font-size:9pt;font-weight:700;color:#6b7280;padding:5px 0;border-bottom:1px dashed #e5e7eb;white-space:nowrap;padding-right:16px;width:130px">ต้องเสร็จภายใน</td>
          <td style="font-size:10pt;font-weight:700;color:${c.text};padding:5px 0;border-bottom:1px dashed #e5e7eb">${esc(s1.deadline)}</td>
        </tr>
        ${s1.why.trim() ? `<tr>
          <td style="font-size:9pt;font-weight:700;color:#6b7280;padding:5px 0;border-bottom:1px dashed #e5e7eb;white-space:nowrap;padding-right:16px">ทำไมถึงสำคัญ</td>
          <td style="font-size:9.5pt;color:#374151;padding:5px 0;border-bottom:1px dashed #e5e7eb;word-break:break-word;overflow-wrap:anywhere">${esc(s1.why)}</td>
        </tr>` : ''}
      </table>
    </div>`

  // ── Section 2: ภาพรวม (horizon-driven) ──────────────────────────────────
  let s2Html = ''

  if (s1.horizon === 'yearly') {
    const yearLabel = s1.horizonValue.trim()
    const fromM = (s2.fromMonth ?? 1) - 1
    const toM   = (s2.toMonth   ?? 12) - 1
    const monthSlice = THAI_MONTHS.slice(fromM, toM + 1)

    if (s3c?.monthlyPlans?.length) {
      // content-first: s3 handles the monthly pages, s2 shows just a timeline summary
      const monthGoalRows = s3c.monthlyPlans
        .filter(mp => mp.goal.trim())
        .map(mp => `
          <tr>
            <td style="font-size:9pt;font-weight:700;color:${c.text};padding:5px 8px;border:1px solid #e5e7eb;background:${c.light};white-space:nowrap;width:48px;vertical-align:top">${esc(mp.monthLabel)}</td>
            <td style="font-size:9.5pt;color:#374151;padding:5px 10px;border:1px solid #e5e7eb;word-break:break-word;overflow-wrap:anywhere">${esc(mp.goal)}</td>
          </tr>`).join('')
      s2Html = `
        <div class="sec">
          <div class="sec-hdr">ภาพรวมรายปี${yearLabel ? ` ${yearLabel}` : ''}</div>
          ${s2.summary?.trim() ? `<div style="font-size:10pt;color:#374151;line-height:1.6;margin-bottom:8px;word-break:break-word">${esc(s2.summary)}</div>` : ''}
          <div style="font-size:9pt;color:#6b7280;margin-bottom:4px">ช่วงเวลา: ${THAI_MONTHS[fromM]} – ${THAI_MONTHS[toM]}${yearLabel ? ` ${yearLabel}` : ''}</div>
          ${monthGoalRows ? `
          <table style="width:100%;border-collapse:collapse;margin-top:12px">
            ${monthGoalRows}
          </table>` : ''}
        </div>`
    } else {
      // fallback: blank monthly pages
      s2Html = monthSlice.map((month, i) => `
        <div class="sec" style="page-break-before:${i === 0 ? 'auto' : 'always'}">
          <div class="sec-hdr">แผนเดือน ${month}${yearLabel ? ` ${yearLabel}` : ''}</div>
          <div class="sub">เป้าหมายของเดือนนี้</div>
          ${blankLines(2)}
          <div class="sub" style="margin-top:10px">วันสำคัญ / นัดหมาย</div>
          ${blankLines(3)}
          <div class="sub" style="margin-top:10px">งานหลักอย่างน้อย 3 อย่างที่ต้องทำ</div>
          ${[1,2,3].map(n => `
            <div style="display:flex;gap:8px;align-items:center;padding:4px 0">
              <span style="font-weight:900;color:${c.accent};font-size:13pt;line-height:1;flex-shrink:0">${n}</span>
              <div style="flex:1;border-bottom:1px solid #d1d5db;height:28px"></div>
            </div>`).join('')}
        </div>`).join('')
    }

  } else if (s1.horizon === 'monthly') {
    const monthLabel = s1.horizonValue.trim()
    const wc = s2.monthlyWeekCount ?? 4

    if (s3c?.weeklyPlans?.length) {
      // content-first: s3 handles the weekly pages, s2 shows just a summary
      s2Html = `
        <div class="sec">
          <div class="sec-hdr">ภาพรวม${monthLabel ? ` — ${monthLabel}` : ''}</div>
          ${s2.summary?.trim() ? `<div style="font-size:10pt;color:#374151;line-height:1.6;margin-bottom:8px;word-break:break-word">${esc(s2.summary)}</div>` : ''}
          <div style="font-size:9pt;color:#6b7280">${wc} สัปดาห์ · แผนละเอียดอยู่ในส่วนถัดไป</div>
        </div>`
    } else {
      // fallback: blank weekly pages
      s2Html = Array.from({length: wc}, (_, i) => `
        <div class="sec" style="page-break-before:${i === 0 ? 'auto' : 'always'}">
          <div class="sec-hdr">แผนสัปดาห์ที่ ${i + 1}${monthLabel ? ` — ${monthLabel}` : ''}</div>
          <div class="sub">เป้าหมายสัปดาห์นี้</div>
          ${blankLines(2)}
          <div class="sub" style="margin-top:10px">งานที่ต้องทำ</div>
          ${blankLines(5)}
        </div>`).join('')
    }

  } else {
    // project — phases + bigRocks
    const phases = (s2.phases ?? []) as PipelinePhase[]
    const bigRocks = (s2.bigRocks ?? []) as PipelineBigRock[]
    const phasesHtml = phases.filter(p => p.name.trim()).map((p, i) =>
      `<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px 12px;margin-bottom:8px;page-break-inside:avoid">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div style="font-size:10pt;font-weight:700;color:${c.text}">ช่วงที่ ${i+1}: ${esc(p.name)}</div>
          ${p.timeRange.trim() ? `<div style="font-size:8.5pt;color:#6b7280">${esc(p.timeRange)}</div>` : ''}
        </div>
        ${p.tasks.filter(t => t.trim()).map(t =>
          `<div style="font-size:9.5pt;color:#374151;padding:2px 0 2px 12px;border-bottom:1px dotted #f3f4f6">→ ${esc(t)}</div>`
        ).join('')}
      </div>`
    ).join('')
    const bigRocksHtml = bigRocks.filter(r => r.task.trim()).map(r =>
      `<div style="display:flex;align-items:flex-start;gap:8px;padding:6px 0;border-bottom:1px solid #f3f4f6">
        <span style="display:inline-block;width:8px;height:8px;background:${c.accent};border-radius:2px;flex-shrink:0;margin-top:4px"></span>
        <span style="font-size:9.5pt;color:#374151;font-weight:600;flex:1;word-break:break-word">${esc(r.task)}</span>
        ${r.deadline.trim() ? `<span style="font-size:8.5pt;color:#be123c;font-weight:700;white-space:nowrap;margin-left:6px">${esc(r.deadline)}</span>` : ''}
      </div>`
    ).join('')
    s2Html = `
      <div class="sec">
        <div class="sec-hdr">แผนดำเนินการ</div>
        ${s2.summary?.trim() ? `<div style="font-size:10pt;color:#374151;line-height:1.6;margin-bottom:8px;word-break:break-word">${esc(s2.summary)}</div>` : ''}
        ${phasesHtml || '<p style="color:#9ca3af;font-size:9pt">ยังไม่มีช่วงดำเนินการ</p>'}
        ${bigRocksHtml ? `<div class="sub" style="margin-top:10px">งานสำคัญที่ต้องทำให้ได้</div>${bigRocksHtml}` : ''}
      </div>`
  }

  // helper: render a 1-3-5 weekly task block from WeeklyTaskItem
  function renderWeeklyTaskBlock(wt: { weekLabel: string; goal: string; main1: string; secondary: string[]; small: string[] }, idx: number, breakBefore = true): string {
    return `
      <div class="sec" style="page-break-before:${breakBefore ? 'always' : 'auto'}">
        <div class="sec-hdr">${wt.weekLabel.trim() ? esc(wt.weekLabel) : `สัปดาห์ที่ ${idx + 1}`}</div>
        ${wt.goal.trim() ? `<div style="font-size:9pt;color:#6b7280;margin-bottom:8px;padding-left:8px">เป้า: ${esc(wt.goal)}</div>` : ''}
        <div style="margin-bottom:10px">
          <div style="font-size:9pt;font-weight:700;color:${c.text};margin-bottom:4px">งานหลัก 1 อย่าง — ต้องทำให้ได้</div>
          <div style="border:2px solid ${c.accent};border-radius:6px;padding:8px 12px;font-size:10pt;font-weight:700;color:#1a1a1a;word-break:break-word;min-height:36px">${wt.main1.trim() ? esc(wt.main1) : '&nbsp;'}</div>
        </div>
        <div style="margin-bottom:10px">
          <div style="font-size:9pt;font-weight:700;color:#374151;margin-bottom:4px">งานรอง 3 อย่าง — พยายามทำ</div>
          ${wt.secondary.slice(0,3).map((s, n) => `
            <div style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid #f3f4f6">
              <span style="color:${c.text};font-weight:900;font-size:10pt;flex-shrink:0">${n+1}</span>
              <span style="font-size:9.5pt;color:#374151;flex:1;word-break:break-word">${s.trim() ? esc(s) : '—'}</span>
            </div>`).join('')}
        </div>
        <div>
          <div style="font-size:9pt;font-weight:700;color:#9ca3af;margin-bottom:4px">งานเล็ก 5 อย่าง (อย่างน้อยถ้ามีเวลา)</div>
          <div style="display:flex;flex-direction:column;gap:4px">
            ${wt.small.slice(0,5).map((s, n) => `
              <div style="display:flex;gap:6px;align-items:center;font-size:8.5pt;color:#6b7280;padding:3px 0;border-bottom:1px dotted #f3f4f6">
                <span style="font-weight:700;color:#9ca3af">${n+1}.</span>
                <span>${s.trim() ? esc(s) : '—'}</span>
              </div>`).join('')}
          </div>
        </div>
      </div>`
  }

  // ── Section 3: content-first or blank fallback ───────────────────────────
  let weekPages = ''

  if (s3c?.monthlyPlans?.length) {
    // yearly + content: filled monthly plan pages
    weekPages = s3c.monthlyPlans.map((mp, i) => `
      <div class="sec" style="page-break-before:always">
        <div class="sec-hdr">แผนเดือน ${esc(mp.monthLabel)}</div>
        ${mp.goal.trim() ? `
          <div style="border:2px solid ${c.accent};border-radius:6px;padding:10px 14px;margin-bottom:12px;background:${c.light}">
            <div style="font-size:7.5pt;font-weight:700;color:${c.text};text-transform:uppercase;margin-bottom:3px">เป้าหมายเดือนนี้</div>
            <div style="font-size:11pt;font-weight:700;color:#1a1a1a;word-break:break-word">${esc(mp.goal)}</div>
          </div>` : `
          <div style="margin-bottom:12px">
            <div class="sub">เป้าหมายเดือนนี้</div>
            ${blankLines(2)}
          </div>`}
        ${mp.keyDates.trim() ? `<div style="font-size:9pt;color:#6b7280;margin-bottom:10px;padding:5px 10px;background:#f9fafb;border-radius:4px">📅 ${esc(mp.keyDates)}</div>` : `
          <div style="margin-bottom:10px">
            <div class="sub">วันสำคัญ / นัดหมาย</div>
            ${blankLines(2)}
          </div>`}
        <div class="sub">งานหลักอย่างน้อย 3 อย่าง</div>
        ${mp.mainTasks.slice(0,3).map((t) => `
          <div style="padding:5px 0;border-bottom:1px solid #f3f4f6">
            <span style="font-size:10pt;color:#374151;word-break:break-word">${t.trim() ? esc(t) : '—'}</span>
          </div>`).join('')}
        <div style="margin-top:10px">
          <div class="sub">บันทึก</div>
          ${blankLines(3)}
        </div>
      </div>`).join('')

  } else if (s3c?.weeklyPlans?.length) {
    // monthly + content: filled weekly plan pages (1-3-5)
    weekPages = s3c.weeklyPlans.map((wp, i) => renderWeeklyTaskBlock(wp, i)).join('')

  } else if (s3c?.flexItems?.length) {
    // project + content: flexible task pages
    weekPages = s3c.flexItems.filter(f => f.label.trim() || f.tasks.some(t => t.trim())).map((f, i) => `
      <div class="sec" style="page-break-before:always">
        <div class="sec-hdr">${f.label.trim() ? esc(f.label) : `ช่วงที่ ${i+1}`}</div>
        ${f.tasks.filter(t => t.trim()).map(t => `
          <div style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid #f3f4f6">
            <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c.accent};flex-shrink:0"></span>
            <span style="font-size:9.5pt;color:#374151;flex:1;word-break:break-word">${esc(t)}</span>
          </div>`).join('')}
        <div style="margin-top:10px">
          <div class="sub">บันทึก</div>
          ${blankLines(3)}
        </div>
      </div>`).join('')

  } else if (s3 && s3.weekCount > 0) {
    // legacy fallback: blank weekly pages
    weekPages = Array.from({length: s3.weekCount}, (_, wi) => {
      let content = ''
      if (s3.layout === '135rule') {
        content = `
          <div style="margin-bottom:10px">
            <div style="font-size:9pt;font-weight:700;color:${c.text};margin-bottom:4px">งานหลัก 1 อย่าง — ต้องทำให้ได้</div>
            ${blankLines(1, '32px')}
          </div>
          <div style="margin-bottom:10px">
            <div style="font-size:9pt;font-weight:700;color:#374151;margin-bottom:4px">งานรอง 3 อย่าง — พยายามทำ</div>
            ${blankLines(3)}
          </div>
          <div>
            <div style="font-size:9pt;font-weight:700;color:#9ca3af;margin-bottom:4px">งานเล็ก 5 อย่าง — ถ้ามีเวลา</div>
            ${blankLines(5)}
          </div>`
      } else if (s3.layout === 'timeblock') {
        const DAY_MAP: Record<string, string> = { mon:'จ.', tue:'อ.', wed:'พ.', thu:'พฤ.', fri:'ศ.', sat:'ส.', sun:'อา.' }
        const DAY_ORDER = ['mon','tue','wed','thu','fri','sat','sun']
        const startIdx = DAY_ORDER.indexOf(s3.startDay ?? 'mon')
        const days = [...DAY_ORDER.slice(startIdx), ...DAY_ORDER.slice(0, startIdx)].map(d => DAY_MAP[d])
        content = `
          <table style="width:100%;border-collapse:collapse;font-size:8.5pt;table-layout:fixed">
            <colgroup><col style="width:36px"><col><col><col></colgroup>
            <tr>
              <th style="border:1px solid #e5e7eb;padding:4px 6px;background:${c.light};color:${c.text}">วัน</th>
              <th style="border:1px solid #e5e7eb;padding:4px 6px;background:${c.light};color:${c.text}">เช้า</th>
              <th style="border:1px solid #e5e7eb;padding:4px 6px;background:${c.light};color:${c.text}">กลางวัน</th>
              <th style="border:1px solid #e5e7eb;padding:4px 6px;background:${c.light};color:${c.text}">เย็น/ค่ำ</th>
            </tr>
            ${days.map(d => `
              <tr>
                <td style="border:1px solid #e5e7eb;padding:6px;font-weight:700;color:#374151;text-align:center">${d}</td>
                <td style="border:1px solid #e5e7eb;padding:6px;height:36px"></td>
                <td style="border:1px solid #e5e7eb;padding:6px;height:36px"></td>
                <td style="border:1px solid #e5e7eb;padding:6px;height:36px"></td>
              </tr>`).join('')}
          </table>`
      } else {
        content = `
          <div class="sub">เป้าหมายสัปดาห์นี้</div>
          ${blankLines(2)}
          <div class="sub" style="margin-top:10px">สิ่งที่จะทำสัปดาห์นี้</div>
          ${blankLines(5)}`
      }
      return `
        <div class="sec" style="page-break-before:always">
          <div class="sec-hdr">แผนสัปดาห์ที่ ${wi + 1}</div>
          ${content}
        </div>`
    }).join('')
  }

  // ── Section 4: content-first or blank fallback ───────────────────────────
  const HOURS = ['06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00']
  let dayPages = ''

  if (s4c?.weeklyTasks?.length) {
    // yearly + content: filled weekly task blocks (1-3-5, admin-specified weeks)
    dayPages = s4c.weeklyTasks.map((wt, i) => renderWeeklyTaskBlock(wt, i)).join('')

  } else if (s4c?.dailyRoutines?.length) {
    // monthly/project + content: routine table
    const routines = s4c.dailyRoutines.filter(r => r.time.trim() || r.activity.trim())
    if (routines.length > 0) {
      dayPages = `
        <div class="sec" style="page-break-before:always">
          <div class="sec-hdr">ตารางประจำวัน</div>
          <table style="width:100%;border-collapse:collapse;font-size:9.5pt">
            <tr>
              <th style="border:1px solid #e5e7eb;padding:5px 8px;background:${c.light};color:${c.text};text-align:left;width:90px">เวลา</th>
              <th style="border:1px solid #e5e7eb;padding:5px 8px;background:${c.light};color:${c.text};text-align:left">กิจกรรม</th>
            </tr>
            ${routines.map(r => `
              <tr>
                <td style="border:1px solid #e5e7eb;padding:5px 8px;color:${c.text};font-weight:700">${esc(r.time)}</td>
                <td style="border:1px solid #e5e7eb;padding:5px 8px;color:#374151">${esc(r.activity)}</td>
              </tr>`).join('')}
          </table>
        </div>`
    }

  } else if (s4 && s4.dayCount > 0) {
    // legacy fallback: blank daily pages
    dayPages = Array.from({length: s4.dayCount}, (_, di) => {
      let content = ''
      if (s4.layout === 'timeblock') {
        content = `
          <table style="width:100%;border-collapse:collapse;font-size:8.5pt;table-layout:fixed">
            <colgroup><col style="width:52px"><col></colgroup>
            ${HOURS.map(h => `
              <tr>
                <td style="border:1px solid #e5e7eb;padding:3px 8px;background:${c.light};color:${c.text};font-weight:700">${h}</td>
                <td style="border:1px solid #e5e7eb;padding:3px 8px;height:28px"></td>
              </tr>`).join('')}
          </table>`
      } else if (s4.layout === 'combined') {
        content = `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <div class="sub">เวลา</div>
              <table style="width:100%;border-collapse:collapse;font-size:8pt;table-layout:fixed">
                <colgroup><col style="width:46px"><col></colgroup>
                ${HOURS.slice(0,16).map(h => `
                  <tr>
                    <td style="border:1px solid #e5e7eb;padding:2px 6px;background:${c.light};color:${c.text};font-weight:700">${h}</td>
                    <td style="border:1px solid #e5e7eb;padding:2px 6px;height:24px"></td>
                  </tr>`).join('')}
              </table>
            </div>
            <div>
              <div class="sub">งานวันนี้</div>
              <div style="font-size:8.5pt;font-weight:700;color:${c.text};margin:6px 0 3px">ต้องทำ (1)</div>
              ${blankLines(1, '28px')}
              <div style="font-size:8.5pt;font-weight:700;color:#374151;margin:8px 0 3px">ควรทำ (3)</div>
              ${blankLines(3, '24px')}
              <div style="font-size:8.5pt;font-weight:700;color:#9ca3af;margin:8px 0 3px">ถ้ามีเวลา (5)</div>
              ${blankLines(5, '22px')}
              <div style="font-size:8.5pt;font-weight:700;color:#6b7280;margin:8px 0 3px">โน้ต</div>
              ${blankLines(3, '22px')}
            </div>
          </div>`
      } else {
        content = `
          <div style="margin-bottom:12px">
            <div style="font-size:10pt;font-weight:700;color:${c.text};margin-bottom:6px">ต้องทำวันนี้ (1 อย่าง)</div>
            <div style="border:2px solid ${c.accent};border-radius:6px;height:38px;padding:4px 8px"></div>
          </div>
          <div style="margin-bottom:12px">
            <div style="font-size:9pt;font-weight:700;color:#374151;margin-bottom:6px">ควรทำ (3 อย่าง)</div>
            ${blankLines(3, '30px')}
          </div>
          <div style="margin-bottom:12px">
            <div style="font-size:9pt;font-weight:700;color:#9ca3af;margin-bottom:6px">ถ้ามีเวลา (5 อย่าง)</div>
            ${blankLines(5)}
          </div>
          <div>
            <div style="font-size:9pt;font-weight:700;color:#6b7280;margin-bottom:6px">โน้ต / ไอเดีย</div>
            ${blankLines(3)}
          </div>`
      }
      return `
        <div class="sec" style="page-break-before:always">
          <div class="sec-hdr">แผนวันที่ <span style="font-weight:900;color:${c.text}">___</span> / <span style="font-weight:900;color:${c.text}">___</span> / <span style="font-weight:900;color:${c.text}">_____</span><span style="font-size:8pt;font-weight:400;color:#9ca3af;margin-left:8px">(${di + 1})</span></div>
          ${content}
        </div>`
    }).join('')
  }

  // ── Section 5: รีวิว ─────────────────────────────────────────────────────
  const reviewQsHtml = s5.reviewQuestions.filter(q => q.trim()).map((q, i) =>
    `<div style="padding:8px 0;border-bottom:1px dashed #e5e7eb">
      <div style="font-size:9.5pt;font-weight:700;color:#374151;margin-bottom:4px">${i+1}. ${esc(q)}</div>
      ${blankLines(2, '24px')}
    </div>`
  ).join('')

  const s5Html = `
    <div class="sec" style="page-break-before:always">
      <div class="sec-hdr">ทบทวนตัวเอง <span style="font-size:8pt;font-weight:400;color:#9ca3af">(${CYCLE_LABEL[s5.reviewCycle] ?? s5.reviewCycle})</span></div>
      ${reviewQsHtml}
      <div style="margin-top:12px;padding:10px 12px;border-radius:6px;background:${c.light};border:1px solid ${c.accent}">
        <div style="font-size:9pt;font-weight:700;color:#374151;margin-bottom:8px">ทำไปแล้ว _____%</div>
        <div style="font-size:9pt;font-weight:700;color:#374151;margin-bottom:4px">สิ่งที่ติดขัด</div>
        ${blankLines(2, '24px')}
        <div style="font-size:9pt;font-weight:700;color:#374151;margin:8px 0 4px">แผนครั้งถัดไป</div>
        ${blankLines(2, '24px')}
      </div>
    </div>`

  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,700;1,400&display=block&subset=thai,latin" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a}
${wm ? `body::before{content:"${wm}";position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:70pt;font-weight:900;color:rgba(0,0,0,0.04);white-space:nowrap;z-index:0;pointer-events:none}` : ''}
.hdr{border-bottom:3px solid ${c.accent};padding-bottom:10px;margin-bottom:14px}
.hdr-title{font-size:15pt;font-weight:700;color:${c.text}}
.hdr-sub{font-size:9pt;color:#6b7280;margin-top:3px}
.footer{position:fixed;bottom:0;left:0;right:0;z-index:10;background:#fff;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af;padding:3px 0;border-top:1px solid #f3f4f6}
.sec{margin-bottom:16px;page-break-inside:avoid}
.sec-hdr{background:${c.light};padding:5px 10px;font-weight:700;font-size:10pt;color:${c.text};margin-bottom:8px}
.sub{font-size:9pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
</style></head><body>

<div class="hdr">
  <div class="hdr-title">${esc(meta.title)}</div>
  ${meta.description.trim() ? `<div class="hdr-sub">${esc(meta.description)}</div>` : ''}
  <div class="hdr-sub" style="text-align:right">www.planprom.com</div>
</div>

${s1Html}
${s2Html}
${weekPages}
${dayPages}
${s5Html}

<div class="footer">
  <span>${esc(meta.title)}</span>
  <span>www.planprom.com</span>
</div>

</body></html>`
}
