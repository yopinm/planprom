// lib/engine-form.ts — Engine Form HTML generator (EF-1)
import type { FormEngineData, FormField } from './engine-form-types'

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ── Field renderers ────────────────────────────────────────────────────────

function renderFieldFilled(f: FormField, value: string | string[]): string {
  const val = Array.isArray(value) ? value : [value]
  const v = val[0] ?? ''

  switch (f.type) {
    case 'section_header':
      return `<div class="sec-hdr">${esc(f.label)}</div>`

    case 'divider':
      return `<div class="divider"></div>`

    case 'page_break':
      return `<div class="page-break"></div>`

    case 'logo':
      return `<div class="logo-box"><div class="logo-placeholder">[ โลโก้ / ตราองค์กร ]</div></div>`

    case 'multiline':
      return fieldWrap(f, `<div class="field-value multiline">${esc(v) || '—'}</div>`)

    case 'checkbox': {
      const checked = Array.isArray(value) ? value : [value]
      const opts = (f.options ?? []).map(o =>
        `<span class="opt">${checked.includes(o) ? '☑' : '☐'} ${esc(o)}</span>`
      ).join('')
      return fieldWrap(f, `<div class="opts">${opts}</div>`)
    }

    case 'radio':
    case 'dropdown': {
      const opts = (f.options ?? []).map(o =>
        `<span class="opt">${o === v ? '◉' : '○'} ${esc(o)}</span>`
      ).join('')
      return fieldWrap(f, `<div class="opts">${opts}</div>`)
    }

    case 'signature':
      return fieldWrap(f, `<div class="sig-box-filled"><div class="sig-line"></div><div class="sig-label">ลายเซ็น</div></div>`)

    case 'table': {
      const cols = f.tableColumns ?? ['รายการ', 'จำนวน', 'หมายเหตุ']
      const rows = f.tableRows ?? 3
      const header = cols.map(c => `<th>${esc(c)}</th>`).join('')
      const body = Array.from({ length: rows }, () =>
        `<tr>${cols.map(() => '<td>&nbsp;</td>').join('')}</tr>`
      ).join('')
      return fieldWrap(f, `<table class="data-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`)
    }

    default:
      return fieldWrap(f, `<div class="field-value">${esc(v) || '—'}</div>`)
  }
}

function renderFieldBlank(f: FormField): string {
  switch (f.type) {
    case 'section_header':
      return `<div class="sec-hdr">${esc(f.label)}</div>`

    case 'divider':
      return `<div class="divider"></div>`

    case 'page_break':
      return `<div class="page-break"></div>`

    case 'logo':
      return `<div class="logo-box"><div class="logo-placeholder">[ โลโก้ / ตราองค์กร ]</div></div>`

    case 'multiline':
      return fieldWrap(f, `<div class="blank-lines"><div class="blank-line"></div><div class="blank-line"></div><div class="blank-line"></div></div>`)

    case 'checkbox': {
      const opts = (f.options ?? []).map(o =>
        `<span class="opt">☐ ${esc(o)}</span>`
      ).join('')
      return fieldWrap(f, `<div class="opts">${opts}</div>`)
    }

    case 'radio':
    case 'dropdown': {
      const opts = (f.options ?? []).map(o =>
        `<span class="opt">○ ${esc(o)}</span>`
      ).join('')
      return fieldWrap(f, `<div class="opts">${opts}</div>`)
    }

    case 'signature':
      return fieldWrap(f, `<div class="sig-box"><div class="sig-line"></div><div class="sig-label">ลายเซ็น / วันที่</div></div>`)

    case 'table': {
      const cols = f.tableColumns ?? ['รายการ', 'จำนวน', 'หมายเหตุ']
      const rows = f.tableRows ?? 3
      const header = cols.map(c => `<th>${esc(c)}</th>`).join('')
      const body = Array.from({ length: rows }, () =>
        `<tr>${cols.map(() => '<td>&nbsp;</td>').join('')}</tr>`
      ).join('')
      return fieldWrap(f, `<table class="data-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table>`)
    }

    default:
      return fieldWrap(f, `<div class="blank-line"></div>`)
  }
}

function fieldWrap(f: FormField, inner: string): string {
  const half = f.width === 'half' ? ' half' : ''
  return `<div class="field${half}"><div class="field-label">${esc(f.label)}${f.required ? ' <span class="req">*</span>' : ''}</div>${inner}</div>`
}

// ── Main generator ─────────────────────────────────────────────────────────

export function generateFormHtml(data: FormEngineData): string {
  const { title, fields, sampleData } = data

  const filledFields = fields.map(f => renderFieldFilled(f, sampleData[f.id] ?? '')).join('\n')
  const blankFields = fields.map(f => renderFieldBlank(f)).join('\n')

  const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a}
.hdr{border-bottom:3px solid #d97706;padding-bottom:10px;margin-bottom:16px}
.hdr-title{font-size:15pt;font-weight:700;color:#92400e}
.hdr-meta{display:flex;gap:20px;margin-top:5px;font-size:9pt;color:#6b7280}
.hdr-badge{background:#fef3c7;color:#92400e;font-size:8pt;font-weight:700;padding:2px 8px;border-radius:99px;border:1px solid #fcd34d}
.footer{position:fixed;bottom:0;left:0;right:0;z-index:10;background:#fff;display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af;padding:3px 0;border-top:1px solid #f3f4f6}
.page{padding:0 0 24px 0}
.page-break{break-after:page;height:1px}
.sec-hdr{background:#fffbeb;border-left:4px solid #d97706;padding:5px 10px;font-weight:700;font-size:10pt;color:#92400e;margin:12px 0 8px}
.divider{border-top:1px solid #e5e7eb;margin:10px 0}
.field{margin-bottom:10px}
.field.half{display:inline-block;width:48%;margin-right:2%}
.field-label{font-size:8pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
.req{color:#ef4444}
.field-value{font-size:10pt;color:#111827;background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:5px 8px;min-height:28px}
.field-value.multiline{min-height:56px;white-space:pre-wrap}
.blank-line{border-bottom:1.5px solid #374151;height:26px;margin-bottom:4px}
.blank-lines .blank-line{margin-bottom:6px}
.opts{display:flex;flex-wrap:wrap;gap:6px 16px;padding:4px 0}
.opt{font-size:10pt;color:#374151}
.sig-box{border:1px dashed #9ca3af;border-radius:4px;padding:8px;height:60px;display:flex;flex-direction:column;justify-content:flex-end}
.sig-box-filled{border:1px solid #e5e7eb;border-radius:4px;padding:8px;height:60px;display:flex;flex-direction:column;justify-content:flex-end;background:#fafafa}
.sig-line{border-bottom:1.5px solid #374151;flex:1;max-height:30px}
.sig-label{font-size:8pt;color:#9ca3af;margin-top:4px}
.logo-box{margin-bottom:10px}
.logo-placeholder{border:1.5px dashed #d1d5db;border-radius:4px;padding:10px 16px;color:#9ca3af;font-size:9pt;display:inline-block}
table.data-table{width:100%;border-collapse:collapse;font-size:9.5pt;margin-top:4px}
table.data-table th{background:#d97706;color:#fff;padding:5px 8px;text-align:left;font-size:9pt}
table.data-table td{padding:5px 8px;border-bottom:1px solid #f3f4f6;min-height:24px}
table.data-table tr:nth-child(even) td{background:#fafafa}
.page2-banner{background:#fef3c7;border:1.5px solid #fcd34d;border-radius:6px;padding:8px 14px;margin-bottom:14px;font-size:9pt;color:#92400e;font-weight:700}
`

  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap" rel="stylesheet">
<style>${css}</style></head><body>

<!-- PAGE 1: ตัวอย่างที่กรอกแล้ว -->
<div class="page">
  <div class="hdr">
    <div class="hdr-title">${esc(title)}</div>
    <div class="hdr-meta">
      <span class="hdr-badge">หน้า 1 — ตัวอย่างที่กรอกแล้ว</span>
      <span style="margin-left:auto">www.planprom.com</span>
    </div>
  </div>
  ${filledFields}
</div>

<div class="footer">
  <span>${esc(title)}</span>
  <span>planprom.com</span>
</div>

<!-- PAGE 2: ฟอร์มเปล่าสำหรับกรอกจริง -->
<div class="page-break"></div>
<div class="page">
  <div class="hdr">
    <div class="hdr-title">${esc(title)}</div>
    <div class="hdr-meta">
      <span class="hdr-badge">หน้า 2 — ฟอร์มเปล่า พร้อมกรอก</span>
      <span style="margin-left:auto">www.planprom.com</span>
    </div>
  </div>
  <div class="page2-banner">📋 กรอกข้อมูลของคุณลงในช่องด้านล่างได้เลย</div>
  ${blankFields}
</div>

<div class="footer">
  <span>${esc(title)}</span>
  <span>planprom.com</span>
</div>

</body></html>`
}
