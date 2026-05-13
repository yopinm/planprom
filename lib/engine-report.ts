// lib/engine-report.ts — Report Engine HTML generator (RE-1)
import type { ReportEngineData } from './engine-report-types'

const esc = (s: string) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

const CONF_LABEL: Record<string, string> = {
  public: '🌐 Public',
  internal: '🔵 Internal',
  confidential: '🔒 Confidential',
  strictly_confidential: '🔴 Strictly Confidential',
}

export function generateReportHtml(
  data: ReportEngineData,
  reportCode: string,
  createdDate: string,
  validUntil: string,
  watermarkText?: string,
): string {
  const { s1, s3, s4, s5, s6, s7, s8 } = data
  const wm = (watermarkText ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const confLabel = CONF_LABEL[s1.confidentialLevel] ?? '🔒 Confidential'

  // ── KPI boxes ────────────────────────────────────────────────────────────
  const kpiBoxes = (s3.kpis ?? []).slice(0, 4).map(k => `
    <div class="kpi-box">
      <div class="kpi-label">${esc(k.label)}</div>
      <div class="kpi-value">${esc(k.value)}</div>
      <div class="kpi-unit">${esc(k.unit)}</div>
    </div>`).join('')

  // ── Findings bullets ─────────────────────────────────────────────────────
  const findingsBullets = (s3.keyFindings ?? []).filter(f => f.trim()).map(f =>
    `<li>${esc(f)}</li>`).join('')

  const s6FindingsBullets = (s6.findings ?? []).filter(f => f.trim()).map(f =>
    `<li>${esc(f)}</li>`).join('')

  // ── Core content tables ──────────────────────────────────────────────────
  const tables = (s5.tables ?? []).filter(t => t.title || t.headers?.length).map(t => {
    const headerRow = (t.headers ?? []).map(h => `<th>${esc(h)}</th>`).join('')
    const bodyRows = (t.rows ?? []).map(row =>
      `<tr>${(row ?? []).map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`
    ).join('')
    return `
      <div class="content-block">
        ${t.title ? `<div class="block-title">📊 ${esc(t.title)}</div>` : ''}
        <table><thead><tr>${headerRow}</tr></thead><tbody>${bodyRows}</tbody></table>
      </div>`
  }).join('')

  const textBlocks = (s5.textBlocks ?? []).filter(b => b.body.trim()).map(b => `
    <div class="content-block">
      ${b.title ? `<div class="block-title">📝 ${esc(b.title)}</div>` : ''}
      <div class="text-body">${esc(b.body)}</div>
    </div>`).join('')

  // ── S4 fields ────────────────────────────────────────────────────────────
  const s4Fields = [
    { label: 'วัตถุประสงค์', val: s4.objective },
    { label: 'ขอบเขตข้อมูล', val: s4.scope },
    { label: 'แหล่งข้อมูล', val: s4.dataSource },
    { label: 'ช่วงเวลาข้อมูล', val: s4.dataPeriod },
    { label: 'วิธีการวิเคราะห์ (Methodology)', val: s4.methodology },
    { label: 'ข้อจำกัด', val: s4.limitations },
  ].filter(f => f.val?.trim()).map(f => `
    <div class="pf"><div class="pl">${esc(f.label)}</div><div class="pv">${esc(f.val)}</div></div>`).join('')

  // ── S7 fields ────────────────────────────────────────────────────────────
  const s7Fields = [
    { label: 'ข้อมูลดิบ / Raw Data', val: s7.rawData },
    { label: 'แหล่งอ้างอิง (References)', val: s7.references },
    { label: 'คำนิยาม (Glossary)', val: s7.glossary },
    { label: 'ประวัติผู้จัดทำ', val: s7.analystProfile },
  ].filter(f => f.val?.trim()).map(f => `
    <div class="pf"><div class="pl">${esc(f.label)}</div><div class="pv">${esc(f.val)}</div></div>`).join('')

  return `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700;900&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',Arial,sans-serif;font-size:10.5pt;line-height:1.65;color:#1e293b}
${wm ? `body::before{content:"${wm}";position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);font-size:65pt;font-weight:900;color:rgba(0,0,0,0.035);white-space:nowrap;z-index:0;pointer-events:none}` : ''}

/* ── Cover ─────────────────────────────────────────────── */
.cover{min-height:100vh;display:flex;flex-direction:column;page-break-after:always;background:linear-gradient(160deg,#f0f9ff 0%,#e0f2fe 50%,#bae6fd 100%)}
.cover-brand{padding:18px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #bae6fd}
.cover-brand-name{font-size:13pt;font-weight:900;color:#0369a1}
.cover-conf{font-size:9pt;font-weight:700;color:#dc2626;background:#fef2f2;padding:3px 10px;border-radius:20px;border:1px solid #fca5a5}
.cover-body{flex:1;display:flex;flex-direction:column;justify-content:center;padding:32px 36px}
.cover-tag{display:inline-flex;align-items:center;gap:6px;background:#0284c7;color:#fff;font-size:9pt;font-weight:700;padding:4px 14px;border-radius:20px;margin-bottom:18px}
.cover-title{font-size:22pt;font-weight:900;color:#0c4a6e;line-height:1.25;margin-bottom:10px}
.cover-subtitle{font-size:12pt;font-weight:500;color:#0369a1;margin-bottom:28px}
.cover-divider{width:56px;height:4px;background:#0284c7;border-radius:2px;margin-bottom:24px}
.cover-meta-table{width:100%;border-collapse:collapse;max-width:420px}
.cover-meta-table td{padding:7px 0;font-size:10pt;border-bottom:1px solid #e0f2fe}
.cover-meta-table td:first-child{font-weight:700;color:#475569;width:130px}
.cover-meta-table td:last-child{color:#0c4a6e;font-weight:600}
.cover-footer{padding:16px 36px;border-top:1px solid #bae6fd;display:flex;align-items:center;justify-content:space-between}
.cover-footer-brand{font-size:8.5pt;color:#64748b}
.cover-footer-id{font-family:monospace;font-size:9pt;font-weight:700;color:#0284c7;background:#e0f2fe;padding:3px 10px;border-radius:6px}

/* ── Sections ──────────────────────────────────────────── */
.section{page-break-before:always;padding-bottom:8px}
.sec-hdr{background:linear-gradient(90deg,#0284c7,#0ea5e9);color:#fff;padding:8px 14px;font-weight:900;font-size:11pt;margin-bottom:14px;border-radius:0 6px 6px 0;border-left:none}
.sec-sub{font-size:9pt;color:#64748b;margin-bottom:12px;margin-left:2px}

/* ── TOC ───────────────────────────────────────────────── */
.toc-list{list-style:none;padding:0;margin:0}
.toc-list li{display:flex;align-items:baseline;gap:4px;padding:8px 0;border-bottom:1px dashed #e2e8f0;font-size:10.5pt}
.toc-list li a{color:#0284c7;text-decoration:none;font-weight:600;flex:1}
.toc-list li a:hover{text-decoration:underline}
.toc-num{font-weight:900;color:#94a3b8;width:24px;flex-shrink:0}

/* ── KPI ───────────────────────────────────────────────── */
.kpi-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px}
.kpi-box{background:#f0f9ff;border:2px solid #bae6fd;border-radius:10px;padding:12px 14px;text-align:center}
.kpi-label{font-size:8.5pt;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}
.kpi-value{font-size:20pt;font-weight:900;color:#0c4a6e;line-height:1.1}
.kpi-unit{font-size:8pt;color:#94a3b8;margin-top:2px}

/* ── Content blocks ────────────────────────────────────── */
.pf{border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;margin-bottom:8px;background:#fff}
.pl{font-size:8pt;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px}
.pv{font-size:10pt;color:#334155;white-space:pre-wrap}
.content-block{margin-bottom:16px}
.block-title{font-size:10pt;font-weight:900;color:#0369a1;margin-bottom:6px}
.text-body{font-size:10pt;color:#334155;white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px}

/* ── Tables ────────────────────────────────────────────── */
table{width:100%;border-collapse:collapse;font-size:9.5pt;margin-top:4px}
th{background:#0284c7;color:#fff;padding:7px 9px;text-align:left;font-size:9pt;font-weight:700}
td{padding:6px 9px;border-bottom:1px solid #f1f5f9;color:#334155}
tr:nth-child(even) td{background:#f0f9ff}

/* ── Bullet lists ──────────────────────────────────────── */
.bullet-list{margin:0;padding-left:18px}
.bullet-list li{margin-bottom:5px;font-size:10pt;color:#334155}

/* ── Signature / Back page ─────────────────────────────── */
.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}
.sig-box{border:1px solid #cbd5e1;border-radius:8px;padding:14px}
.sig-name{font-weight:700;color:#1e293b;margin-bottom:3px}
.sig-title{font-size:9pt;color:#64748b;margin-bottom:12px}
.sig-line{border-bottom:1.5px solid #0284c7;height:36px;margin-bottom:5px}
.sig-label{font-size:8pt;color:#94a3b8}
.qr-box{border:2px dashed #bae6fd;border-radius:10px;padding:16px 20px;text-align:center;background:#f0f9ff;display:inline-block;min-width:120px}
.qr-code-text{font-size:9pt;font-weight:700;color:#0369a1;letter-spacing:.03em;margin-top:6px}
.qr-label{font-size:7.5pt;color:#94a3b8;margin-top:2px}
.disclaimer-box{border:1px solid #fed7aa;background:#fff7ed;border-radius:8px;padding:12px;font-size:8.5pt;color:#9a3412;margin-top:14px}
.copyright-bar{margin-top:14px;padding:10px 0;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:8.5pt;color:#94a3b8}
</style></head><body>

<!-- ── S1 Cover Page ─────────────────────────────────────────────────────── -->
<div class="cover">
  <div class="cover-brand">
    <span class="cover-brand-name">📊 แพลนพร้อม</span>
    <span class="cover-conf">${confLabel}</span>
  </div>
  <div class="cover-body">
    <div class="cover-tag">📄 รายงาน · Report</div>
    <h1 class="cover-title">${esc(s1.reportTitle)}</h1>
    ${s1.subtitle?.trim() ? `<p class="cover-subtitle">${esc(s1.subtitle)}</p>` : ''}
    <div class="cover-divider"></div>
    <table class="cover-meta-table">
      <tr><td>จัดทำโดย</td><td>${esc(s1.organization || '-')}</td></tr>
      <tr><td>จัดทำให้</td><td>[ชื่อผู้ซื้อ]</td></tr>
      <tr><td>Report ID</td><td style="font-family:monospace;font-weight:900;color:#0284c7">${esc(reportCode)}</td></tr>
      <tr><td>วันที่จัดทำ</td><td>${esc(createdDate)}</td></tr>
      <tr><td>ใช้ได้ถึง</td><td>${esc(validUntil)}</td></tr>
      <tr><td>ระดับ</td><td>${confLabel}</td></tr>
    </table>
  </div>
  <div class="cover-footer">
    <span class="cover-footer-brand">www.planprom.com</span>
    <span class="cover-footer-id">${esc(reportCode)}</span>
  </div>
</div>

<!-- ── S2 Table of Contents ──────────────────────────────────────────────── -->
<div id="toc" class="section">
  <div class="sec-hdr">สารบัญ (Table of Contents)</div>
  <ol class="toc-list">
    <li><span class="toc-num">1.</span><a href="#s3">สรุปผู้บริหาร (Executive Summary)</a></li>
    <li><span class="toc-num">2.</span><a href="#s4">บทนำและขอบเขต (Introduction &amp; Scope)</a></li>
    <li><span class="toc-num">3.</span><a href="#s5">เนื้อหาและการวิเคราะห์ (Core Content &amp; Analysis)</a></li>
    <li><span class="toc-num">4.</span><a href="#s6">บทสรุปและข้อเสนอแนะ (Conclusion &amp; Recommendations)</a></li>
    <li><span class="toc-num">5.</span><a href="#s7">ภาคผนวกและอ้างอิง (Appendix &amp; References)</a></li>
    <li><span class="toc-num">6.</span><a href="#s8">ลายเซ็นและข้อมูลผู้จัดทำ (Back Page)</a></li>
  </ol>
</div>

<!-- ── S3 Executive Summary ──────────────────────────────────────────────── -->
<div id="s3" class="section">
  <div class="sec-hdr">ส่วนที่ 1 — สรุปผู้บริหาร (Executive Summary)</div>
  ${kpiBoxes ? `<div class="kpi-grid">${kpiBoxes}</div>` : ''}
  ${s3.summaryText?.trim() ? `<div class="pf"><div class="pl">สรุปย่อ</div><div class="pv">${esc(s3.summaryText)}</div></div>` : ''}
  ${findingsBullets ? `<div class="pf"><div class="pl">ข้อค้นพบสำคัญ</div><ul class="bullet-list">${findingsBullets}</ul></div>` : ''}
  ${s3.urgentRecommendations?.trim() ? `<div class="pf"><div class="pl">ข้อเสนอแนะเร่งด่วน</div><div class="pv">${esc(s3.urgentRecommendations)}</div></div>` : ''}
</div>

<!-- ── S4 Introduction & Scope ───────────────────────────────────────────── -->
<div id="s4" class="section">
  <div class="sec-hdr">ส่วนที่ 2 — บทนำและขอบเขต (Introduction &amp; Scope)</div>
  ${s4Fields || '<p style="color:#94a3b8;font-size:10pt">— ไม่มีข้อมูล —</p>'}
</div>

<!-- ── S5 Core Content ───────────────────────────────────────────────────── -->
<div id="s5" class="section">
  <div class="sec-hdr">ส่วนที่ 3 — เนื้อหาและการวิเคราะห์ (Core Content &amp; Analysis)</div>
  ${tables}
  ${textBlocks}
  ${!tables && !textBlocks ? '<p style="color:#94a3b8;font-size:10pt">— ไม่มีเนื้อหา —</p>' : ''}
</div>

<!-- ── S6 Conclusion ─────────────────────────────────────────────────────── -->
<div id="s6" class="section">
  <div class="sec-hdr">ส่วนที่ 4 — บทสรุปและข้อเสนอแนะ (Conclusion &amp; Recommendations)</div>
  ${s6.conclusion?.trim() ? `<div class="pf"><div class="pl">บทสรุป</div><div class="pv">${esc(s6.conclusion)}</div></div>` : ''}
  ${s6FindingsBullets ? `<div class="pf"><div class="pl">ข้อค้นพบ</div><ul class="bullet-list">${s6FindingsBullets}</ul></div>` : ''}
  ${s6.recommendations?.trim() ? `<div class="pf"><div class="pl">ข้อเสนอแนะ (Next Steps)</div><div class="pv">${esc(s6.recommendations)}</div></div>` : ''}
  ${s6.risks?.trim() ? `<div class="pf"><div class="pl">ความเสี่ยงที่ต้องระวัง</div><div class="pv">${esc(s6.risks)}</div></div>` : ''}
  ${s6.forecast?.trim() ? `<div class="pf"><div class="pl">การคาดการณ์แนวโน้ม</div><div class="pv">${esc(s6.forecast)}</div></div>` : ''}
  ${s6.scoreRating?.trim() ? `<div class="pf"><div class="pl">คะแนนสรุป / Rating</div><div class="pv" style="font-size:13pt;font-weight:900;color:#0284c7">${esc(s6.scoreRating)}</div></div>` : ''}
</div>

<!-- ── S7 Appendix ───────────────────────────────────────────────────────── -->
<div id="s7" class="section">
  <div class="sec-hdr">ส่วนที่ 5 — ภาคผนวกและอ้างอิง (Appendix &amp; References)</div>
  ${s7Fields || '<p style="color:#94a3b8;font-size:10pt">— ไม่มีภาคผนวก —</p>'}
</div>

<!-- ── S8 Back Page ──────────────────────────────────────────────────────── -->
<div id="s8" class="section">
  <div class="sec-hdr">ส่วนที่ 6 — ลายเซ็นและข้อมูลผู้จัดทำ</div>
  <div class="sig-grid">
    <div class="sig-box">
      <div class="sig-name">${esc(s8.analystName || 'ผู้จัดทำ / Analyst')}</div>
      <div class="sig-title">${esc(s8.analystTitle || 'ตำแหน่ง')}</div>
      <div class="sig-line"></div>
      <div class="sig-label">ลายเซ็น · วันที่ _______________</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">
      <div class="qr-box">
        <div style="font-size:28pt;color:#bae6fd">▣</div>
        <div class="qr-code-text">${esc(reportCode)}</div>
        <div class="qr-label">สแกนยืนยันความถูกต้อง</div>
      </div>
    </div>
  </div>

  ${s8.disclaimer?.trim() ? `<div class="disclaimer-box"><strong>Disclaimer:</strong> ${esc(s8.disclaimer)}</div>` : `
  <div class="disclaimer-box"><strong>Disclaimer:</strong> รายงานฉบับนี้จัดทำขึ้นเพื่อวัตถุประสงค์ที่ระบุไว้เท่านั้น ห้ามนำไปเผยแพร่หรือใช้งานโดยไม่ได้รับอนุญาต</div>`}

  <div class="copyright-bar">
    <span>© ${new Date().getFullYear()} ${esc(s8.companyName || s1.organization || 'แพลนพร้อม')}</span>
    <span>${[s8.contactEmail, s8.contactPhone, s8.contactWebsite].filter(Boolean).map(v => esc(v)).join(' · ') || 'www.planprom.com'}</span>
    <span>All Rights Reserved</span>
  </div>
</div>

</body></html>`
}
