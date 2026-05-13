// lib/engine-form.ts — Engine Form HTML generator (EF-1)
import type { FormEngineData, FormField } from './engine-form-types'

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// ── Page 1: filled card-style renderer ────────────────────────────────────

function renderFieldFilled(f: FormField, value: string | string[]): string {
  const val = Array.isArray(value) ? value : [value]
  const v = val[0] ?? ''

  switch (f.type) {
    case 'section_header':
      return `<div class="sec-hdr" style="width:100%">${esc(f.label)}</div>`
    case 'divider':
      return `<div class="divider" style="width:100%"></div>`
    case 'row_break':
      return `<div class="row-break"></div>`
    case 'page_break':
      return `<div class="page-break" style="width:100%"></div>`
    case 'logo':
      return `<div class="logo-box" style="width:100%"><div class="logo-placeholder">[ โลโก้ / ตราองค์กร ]</div></div>`
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
    case 'inspection': {
      const opts = f.options ?? ['ผ่าน', 'ไม่ผ่าน', 'แก้ไข']
      const symbols = ['✅', '❌', '⚠️']
      const cls = ['insp-pass', 'insp-fail', 'insp-fix']
      const items = opts.map((o, i) =>
        o === v
          ? `<span class="insp-opt ${cls[i] ?? 'insp-pass'}">${symbols[i] ?? '✅'} ${esc(o)}</span>`
          : `<span class="insp-opt-off">○ ${esc(o)}</span>`
      ).join('')
      return fieldWrap(f, `<div class="insp-row">${items}</div>`)
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
    case 'number':
      return fieldWrap(f, `<div class="field-value mono">${esc(v) || '0'}</div>`)
    case 'currency':
      return fieldWrap(f, `<div class="field-value mono">฿ ${esc(v) || '0.00'}</div>`)
    case 'id_card':
      return fieldWrap(f, `<div class="field-value mono">${esc(v) || '- - - - - - - - - - - - -'}</div>`)
    case 'barcode':
      return fieldWrap(f, `<div class="barcode-box">▐▌▌▐▌▐▐▌▌▐ &nbsp; ${esc(v) || 'BARCODE'}</div>`)
    case 'photo_upload':
      return fieldWrap(f, `<div class="photo-box">📷 [ รูปภาพ / หลักฐาน ]</div>`)
    case 'gps': {
      const [lat, lng] = String(v).split(',').map(s => s.trim())
      return fieldWrap(f, `<div class="gps-row"><span class="gps-item">📍 Lat: ${esc(lat ?? '—')}</span><span class="gps-item">Lng: ${esc(lng ?? '—')}</span></div>`)
    }
    case 'dimension':
      return fieldWrap(f, `<div class="field-value mono">${esc(v) || '— × — × —'}</div>`)
    case 'weight_height': {
      const [wt, ht] = String(v).split('/').map(s => s.trim())
      return fieldWrap(f, `<div class="wh-row"><div class="wh-item"><div class="wh-label">น้ำหนัก</div><div class="wh-val">${esc(wt ?? '—')}</div></div><div class="wh-item"><div class="wh-label">ส่วนสูง</div><div class="wh-val">${esc(ht ?? '—')}</div></div></div>`)
    }
    default:
      return fieldWrap(f, `<div class="field-value">${esc(v) || '—'}</div>`)
  }
}

function fieldWrap(f: FormField, inner: string): string {
  const w = f.width ?? 100
  const pr = w < 100 ? `padding-right:10px;` : ''
  return `<div class="field" style="width:${w}%;${pr}"><div class="field-label">${esc(f.label)}${f.required ? ' <span class="req">*</span>' : ''}</div>${inner}</div>`
}

// ── Page 2: inline document-style renderer (พร้อมพิมพ์ใช้จริง) ──────────

function renderFieldInline(f: FormField): string {
  // structural types always full width
  const alwaysFull = ['section_header', 'divider', 'page_break', 'logo', 'signature', 'multiline', 'table', 'photo_upload']
  const w   = alwaysFull.includes(f.type) ? 100 : (f.width ?? 100)
  const pr  = w < 100 ? 'padding-right:14px;' : ''
  const ws  = `width:${w}%;box-sizing:border-box;${pr}`
  const req = f.required ? '<span class="if-req">*</span>' : ''
  const lbl = `<span class="if-lbl">${esc(f.label)}${req}</span>`

  switch (f.type) {
    case 'section_header':
      return `<div class="if-shdr" style="${ws}">${esc(f.label)}</div>`

    case 'divider':
      return `<div class="if-div" style="${ws}"></div>`

    case 'row_break':
      return `<div class="row-break"></div>`

    case 'page_break':
      return `<div class="page-break" style="width:100%"></div>`

    case 'logo':
      return `<div class="if-logo" style="${ws}">[ โลโก้ / ตราองค์กร ]</div>`

    case 'signature':
      return `<div class="if-sig-block" style="${ws}">
  <div class="if-sig-row"><span class="if-lbl">ลงชื่อ</span><div class="if-line"></div></div>
  <div class="if-sig-row if-sig-indent"><span class="if-lbl">(</span><div class="if-line"></div><span class="if-lbl">)</span></div>
  <div class="if-sig-name">${esc(f.label)}</div>
</div>`

    case 'multiline':
      return `<div class="if-ml" style="${ws}">
  <div class="if-ml-lbl">${esc(f.label)}${req}</div>
  <div class="if-line"></div><div class="if-line"></div><div class="if-line"></div>
</div>`

    case 'checkbox': {
      const opts = (f.options ?? []).map(o => `<span class="if-opt">□ ${esc(o)}</span>`).join('')
      return `<div class="if" style="${ws}">${lbl}<div class="if-opts">${opts}</div></div>`
    }

    case 'radio':
    case 'dropdown': {
      const opts = (f.options ?? []).map(o => `<span class="if-opt">○ ${esc(o)}</span>`).join('')
      return `<div class="if" style="${ws}">${lbl}<div class="if-opts">${opts}</div></div>`
    }

    case 'inspection': {
      const opts = (f.options ?? ['ผ่าน', 'ไม่ผ่าน', 'แก้ไข'])
        .map(o => `<span class="if-opt">□ ${esc(o)}</span>`).join('')
      return `<div class="if" style="${ws}">${lbl}<div class="if-opts">${opts}</div></div>`
    }

    case 'table': {
      const cols = f.tableColumns ?? ['รายการ', 'จำนวน', 'หมายเหตุ']
      const rows = f.tableRows ?? 3
      const header = cols.map(c => `<th>${esc(c)}</th>`).join('')
      const body = Array.from({ length: rows }, () =>
        `<tr>${cols.map(() => '<td>&nbsp;</td>').join('')}</tr>`
      ).join('')
      return `<div class="if-tbl" style="${ws}"><div class="if-tbl-lbl">${esc(f.label)}</div><table class="data-table"><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`
    }

    case 'photo_upload':
      return `<div class="if-photo" style="${ws}">📷 ${esc(f.label)}</div>`

    case 'currency':
      return `<div class="if" style="${ws}"><span class="if-lbl">${esc(f.label)}${req}&nbsp;฿</span><div class="if-line"></div></div>`

    case 'id_card':
      return `<div class="if" style="${ws}">${lbl}<div class="if-line"></div><span class="if-sub">(13 หลัก)</span></div>`

    case 'weight_height':
      return `<div class="if" style="${ws}">${lbl}<span class="if-sub">น.ห.</span><div class="if-fixed w55"></div><span class="if-sub">กก. / ส่วนสูง</span><div class="if-fixed w55"></div><span class="if-sub">ซม.</span></div>`

    case 'gps':
      return `<div class="if" style="${ws}">${lbl}<span class="if-sub">Lat</span><div class="if-fixed w80"></div><span class="if-sub">Lng</span><div class="if-fixed w80"></div></div>`

    case 'dimension':
      return `<div class="if" style="${ws}">${lbl}<div class="if-fixed w55"></div><span class="if-sep">×</span><div class="if-fixed w55"></div><span class="if-sep">×</span><div class="if-fixed w55"></div></div>`

    case 'barcode':
      return `<div class="if" style="${ws}">${lbl}<div class="if-line"></div></div>`

    default:
      return `<div class="if" style="${ws}">${lbl}<div class="if-line"></div></div>`
  }
}

// ── Main generator ─────────────────────────────────────────────────────────

export function generateFormHtml(data: FormEngineData): string {
  const { title, fields, sampleData } = data

  const filledFields = fields.map(f => renderFieldFilled(f, sampleData[f.id] ?? '')).join('\n')
  const inlineFields = fields.map(f => renderFieldInline(f)).join('\n')

  const css = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a}

/* ── Page 1 header (ไม่มีเส้นขั้น) ── */
.hdr{padding-bottom:8px;margin-bottom:16px}
.hdr-title{font-size:14pt;font-weight:700;color:#1a1a1a}
.hdr-meta{display:flex;gap:16px;margin-top:4px;font-size:8.5pt;color:#6b7280}
.hdr-badge{background:#f3f4f6;color:#374151;font-size:8pt;font-weight:700;padding:2px 8px;border-radius:4px;border:1px solid #d1d5db}
.footer{display:flex;justify-content:space-between;font-size:8pt;color:#9ca3af;padding:8px 0;border-top:1px solid #e5e7eb;margin-top:20px}
.page{padding:0 0 28px 0}
.page-break{break-after:page;height:1px}
.row-break{width:100%;height:0}

/* ── Page 1 card fields ── */
.row-wrap{display:flex;flex-wrap:wrap;align-items:flex-start}
.sec-hdr{background:#f3f4f6;border-left:4px solid #1a1a1a;padding:5px 10px;font-weight:700;font-size:10pt;color:#1a1a1a;margin:12px 0 8px}
.divider{border-top:1px solid #1a1a1a;margin:10px 0}
.field{margin-bottom:10px;box-sizing:border-box;vertical-align:top}
.field-label{font-size:8pt;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}
.req{color:#1a1a1a;font-weight:900}
.field-value{font-size:10pt;color:#111827;background:#fafafa;border:1px solid #d1d5db;border-radius:4px;padding:5px 8px;min-height:28px}
.field-value.multiline{min-height:56px;white-space:pre-wrap}
.opts{display:flex;flex-wrap:wrap;gap:6px 14px;padding:4px 0}
.opt{font-size:10pt;color:#1a1a1a}
.sig-box-filled{border:1px solid #d1d5db;border-radius:4px;padding:8px;height:60px;display:flex;flex-direction:column;justify-content:flex-end;background:#fafafa}
.sig-line{border-bottom:1.5px solid #1a1a1a;flex:1;max-height:30px}
.sig-label{font-size:8pt;color:#6b7280;margin-top:4px}
.logo-box{margin-bottom:10px}
.logo-placeholder{border:1.5px dashed #374151;border-radius:4px;padding:10px 16px;color:#6b7280;font-size:9pt;display:inline-block}
table.data-table{width:100%;border-collapse:collapse;font-size:9.5pt;margin-top:4px}
table.data-table th{background:#374151;color:#fff;padding:5px 8px;text-align:left;font-size:9pt}
table.data-table td{padding:5px 8px;border:1px solid #e5e7eb;min-height:24px}
table.data-table tr:nth-child(even) td{background:#fafafa}
.mono{font-family:'Courier New',monospace;letter-spacing:.06em}
.photo-box{border:1.5px dashed #9ca3af;border-radius:4px;padding:14px;text-align:center;color:#9ca3af;font-size:9pt;min-height:64px;display:flex;align-items:center;justify-content:center;background:#fafafa}
.barcode-box{border:1.5px dashed #9ca3af;border-radius:4px;padding:8px 12px;text-align:center;color:#374151;font-size:9pt;font-family:monospace;background:#fafafa}
.gps-row{display:flex;gap:10px}
.gps-item{flex:1;font-size:9.5pt;font-family:monospace;background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:4px 8px}
.wh-row{display:flex;gap:12px}
.wh-item{flex:1}
.wh-label{font-size:8pt;color:#6b7280;margin-bottom:2px}
.wh-val{background:#fafafa;border:1px solid #e5e7eb;border-radius:4px;padding:4px 8px;font-size:10pt}
.insp-row{display:flex;gap:10px;padding:4px 0;flex-wrap:wrap}
.insp-opt{font-size:10pt;font-weight:600;padding:3px 10px;border-radius:4px}
.insp-opt-off{font-size:10pt;color:#6b7280;padding:3px 10px}
.insp-pass{color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0}
.insp-fail{color:#dc2626;background:#fef2f2;border:1px solid #fecaca}
.insp-fix{color:#d97706;background:#fffbeb;border:1px solid #fde68a}

/* ── Page 2 title ── */
.p2-title{font-size:14pt;font-weight:700;color:#1a1a1a;text-align:center;text-decoration:underline;margin-bottom:20px}

/* ── Page 2 inline fields ── */
.if{display:flex;align-items:flex-end;gap:5px;margin-bottom:22px;break-inside:avoid;box-sizing:border-box;vertical-align:bottom}
.if-lbl{font-size:10pt;color:#1a1a1a;white-space:nowrap;flex-shrink:0}
.if-req{color:#1a1a1a;font-weight:900}
.if-line{flex:1;border-bottom:1.5px solid #1a1a1a;min-width:40px;height:16px;align-self:flex-end}
.if-fixed{border-bottom:1.5px solid #1a1a1a;height:16px;flex-shrink:0;align-self:flex-end}
.w55{width:55px}.w80{width:80px}
.if-sub{font-size:9.5pt;color:#1a1a1a;white-space:nowrap;flex-shrink:0;padding:0 3px}
.if-sep{font-weight:700;color:#1a1a1a;padding:0 4px;flex-shrink:0;align-self:flex-end}
.if-opts{display:inline-flex;gap:12px;flex-wrap:wrap;align-items:center;flex-shrink:0;padding-left:6px}
.if-opt{font-size:10pt;color:#1a1a1a;white-space:nowrap}
.if-shdr{font-size:10.5pt;font-weight:700;text-decoration:underline;color:#1a1a1a;margin:14px 0 7px;break-after:avoid}
.if-div{border-top:1px solid #1a1a1a;margin:8px 0}
.if-logo{border:1px dashed #374151;padding:8px 14px;display:inline-block;color:#6b7280;font-size:9pt;margin-bottom:10px}
.if-ml{margin-bottom:0}
.if-ml-lbl{font-size:10pt;color:#1a1a1a;margin-bottom:8px}
.if-ml .if-line{display:block;width:100%;height:16px;margin-bottom:22px;border-bottom:1.5px solid #1a1a1a}
.if-tbl{margin-bottom:12px;break-inside:avoid}
.if-tbl-lbl{font-size:10pt;font-weight:600;margin-bottom:4px;color:#1a1a1a}
.if-photo{border:1px dashed #374151;padding:12px;text-align:center;color:#6b7280;font-size:9pt;margin-bottom:10px;min-height:50px;display:flex;align-items:center;justify-content:center}
.if-sig-block{margin:20px 0 12px}
.if-sig-row{display:flex;align-items:flex-end;gap:5px;margin-bottom:6px}
.if-sig-indent{padding-left:44px}
.if-sig-name{font-size:9.5pt;color:#1a1a1a;padding-left:44px;margin-top:2px}
`

  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap" rel="stylesheet">
<style>${css}</style></head><body>

<!-- PAGE 1: ตัวอย่างที่กรอกแล้ว -->
<div class="page">
  <div class="hdr">
    <div class="hdr-title">${esc(title)}</div>
    <div class="hdr-meta">
      <span class="hdr-badge">ตัวอย่างที่กรอกแล้ว</span>
      <span style="margin-left:auto">www.planprom.com</span>
    </div>
  </div>
  <div class="row-wrap">${filledFields}</div>
  <div class="footer">
    <span>${esc(title)}</span>
    <span>planprom.com</span>
  </div>
</div>

<!-- PAGE 2: ฟอร์มเปล่า พร้อมพิมพ์ใช้จริง -->
<div class="page-break"></div>
<div class="page">
  <div class="p2-title">${esc(title)}</div>
  <div class="row-wrap">${inlineFields}</div>
</div>

</body></html>`
}
