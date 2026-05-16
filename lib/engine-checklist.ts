// lib/engine-checklist.ts — Checklist Engine HTML generator (DC-5)
import type { ChecklistEngineData } from './engine-types'

const esc = (s: string) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function generateChecklistHtml(data: ChecklistEngineData, watermarkText?: string, categoryName?: string): string {
  const { s1, s2, s3, s4, s5 } = data
  const wm = (watermarkText ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const validItems = s3.items.filter(i => i.trim())

  const itemRows = validItems.map((item, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="item">${esc(item)}</td>
      <td class="sc"><span class="cb">☐</span></td>
      <td class="sc"><span class="cb">☐</span></td>
      <td class="sc"><span class="cb">☐</span></td>
    </tr>`).join('')

  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',Arial,sans-serif;font-size:11pt;line-height:1.6;color:#1a1a1a}
${wm ? `body::before{content:"${wm}";position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:70pt;font-weight:900;color:rgba(0,0,0,0.04);white-space:nowrap;z-index:0;pointer-events:none}` : ''}
.hdr{border-bottom:3px solid #059669;padding-bottom:10px;margin-bottom:14px}
.hdr-title{font-size:15pt;font-weight:700;color:#065f46}
.hdr-meta{display:flex;gap:20px;margin-top:5px;font-size:9pt;color:#6b7280;flex-wrap:wrap}
.hdr-meta strong{color:#374151}
.sec{margin-bottom:14px;page-break-inside:avoid}
.sec-hdr{background:#f0fdf4;border-left:4px solid #059669;padding:5px 10px;font-weight:700;font-size:10pt;color:#065f46;margin-bottom:8px}
.mg{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.mf{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px}
.ml{font-size:8pt;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px}
.mv{font-size:10pt;font-weight:700;color:#111827}
.pf{border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-bottom:6px}
.pl{font-size:8pt;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
.pv{font-size:10pt;color:#374151;white-space:pre-wrap}
table{width:100%;border-collapse:collapse;font-size:10pt}
th{background:#065f46;color:#fff;padding:6px 8px;text-align:left;font-size:9pt}
th.c{text-align:center}
td{padding:6px 8px;border-bottom:1px solid #f3f4f6;vertical-align:middle}
tr:nth-child(even) td{background:#f9fafb}
.num{width:30px;text-align:center;color:#9ca3af;font-size:9pt}
.sc{text-align:center;width:56px}
.cb{font-size:13pt;display:block;line-height:1}
.cl{font-size:7pt;color:#9ca3af;display:block}
.rl{border-bottom:1px solid #d1d5db;height:28px;margin-bottom:4px}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:6px}
.sb{border:1px solid #d1d5db;border-radius:6px;padding:10px}
.sr{font-size:9pt;font-weight:700;color:#374151;margin-bottom:4px}
.sl{border-bottom:1px solid #374151;height:38px;margin-bottom:5px}
.slb{font-size:8pt;color:#9ca3af}
.rb{margin-top:10px;border:2px solid #d1d5db;border-radius:6px;padding:10px;display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.rl2{font-weight:700;font-size:10pt;color:#374151}
.ro{display:flex;align-items:center;gap:6px;font-size:10pt}
</style></head><body>

<div class="hdr">
  <div class="hdr-title">${esc(s1.title)}</div>
  <div class="hdr-meta">
    ${categoryName ? `<span><strong>หมวดหมู่:</strong> ${esc(categoryName)}</span>` : ''}
    <span><strong>วันที่:</strong> ${esc(s1.createdDate)}</span>
    <span style="margin-left:auto">www.planprom.com</span>
  </div>
</div>

<div class="sec">
  <div class="sec-hdr">ส่วนที่ 1 — ส่วนหัวและข้อมูลพื้นฐาน</div>
  <div class="mg">
    <div class="mf"><div class="ml">ชื่อเช็คลิสต์</div><div class="mv">${esc(s1.title)}</div></div>
    <div class="mf"><div class="ml">หมวดหมู่</div><div class="mv">${esc(categoryName || '-')}</div></div>
    <div class="mf"><div class="ml">วันที่จัดทำ</div><div class="mv">${esc(s1.createdDate)}</div></div>
    <div class="mf"><div class="ml">ผู้จัดทำ / ผู้รับผิดชอบ</div><div style="border-bottom:1px solid #d1d5db;height:22px;margin-top:6px;"></div></div>
  </div>
</div>

<div class="sec">
  <div class="sec-hdr">ส่วนที่ 2 — วัตถุประสงค์และข้อมูลทั่วไป</div>
  <div class="pf"><div class="pl">วัตถุประสงค์</div><div class="pv">${esc(s2.purpose)}</div></div>
  ${s2.context.trim() ? `<div class="pf"><div class="pl">บริบทการใช้งาน (โครงการ / หน่วยงาน / สถานที่)</div><div class="pv">${esc(s2.context)}</div></div>` : ''}
  ${s2.prerequisites.trim() ? `<div class="pf"><div class="pl">เงื่อนไข / อุปกรณ์ที่ต้องเตรียมก่อนเริ่ม</div><div class="pv">${esc(s2.prerequisites)}</div></div>` : ''}
</div>

<div class="sec">
  <div class="sec-hdr">ส่วนที่ 3 — รายการตรวจสอบ (${validItems.length} รายการ)</div>
  <table>
    <thead><tr>
      <th class="c">#</th><th>รายการตรวจสอบ</th>
      <th class="c">ผ่าน</th><th class="c">ไม่ผ่าน</th><th class="c">N/A</th>
    </tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
</div>

<div style="page-break-after:always;height:0;margin:0;padding:0"></div>
<div class="sec">
  <div class="sec-hdr">ส่วนที่ 4 — หมายเหตุและข้อสังเกต</div>
  ${s4?.remarks?.trim() ? `<div class="pf" style="margin-bottom:10px"><div class="pl">หมายเหตุทั่วไป</div><div class="pv">${esc(s4.remarks)}</div></div>` : ''}
  ${Array.from({length:8}).map(()=>'<div class="rl"></div>').join('')}
</div>

<div class="sec">
  <div class="sec-hdr">ส่วนที่ 5 — การยืนยันและอนุมัติ</div>
  <div class="sg">
    <div class="sb">
      <div class="sr">${esc(s5.executorRole || 'ผู้ปฏิบัติงาน')}</div>
      <div class="sl"></div>
      <div class="slb">ลายเซ็น · วันที่ _______________</div>
    </div>
    <div class="sb">
      <div class="sr">${esc(s5.reviewerRole || 'ผู้ตรวจสอบ / หัวหน้างาน')}</div>
      <div class="sl"></div>
      <div class="slb">ลายเซ็น · วันที่ _______________</div>
    </div>
  </div>
  <div class="rb">
    <span class="rl2">ผลสรุป:</span>
    <span class="ro">☐ <strong>ผ่าน</strong> (Pass)</span>
    <span class="ro">☐ <strong>ไม่ผ่าน</strong> (Fail)</span>
    <span class="ro">☐ <strong>ต้องแก้ไข</strong> (Revision Required)</span>
  </div>
</div>

</body></html>`
}
