// lib/pdf-generator.ts — DC-1 Standard PDF Generator (.docx → A4 PDF)
import mammoth from 'mammoth'
import type { Browser } from 'puppeteer-core'
import type { TocItem } from './pdf-types'

export type { TocItem }

export async function extractToc(buffer: Buffer): Promise<TocItem[]> {
  const { value: html } = await mammoth.convertToHtml({ buffer })
  const items: TocItem[] = []
  const re = /<h([123])[^>]*>([\s\S]*?)<\/h\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, '').trim()
    if (text) items.push({ level: parseInt(m[1]), title: text })
  }
  return items
}

export async function generatePdf(opts: {
  buffer: Buffer
  title: string
  documentType: string
  watermarkText?: string
}): Promise<Buffer> {
  const { value: bodyHtml } = await mammoth.convertToHtml({ buffer: opts.buffer })
  const html = buildHtml(bodyHtml, opts.title, opts.documentType, opts.watermarkText)

  let browser: Browser | null = null
  try {
    const { default: puppeteer } = await import('puppeteer-core')

    let executablePath: string
    let args: string[]

    if (process.platform === 'linux') {
      const { default: chromium } = await import('@sparticuz/chromium')
      executablePath = await chromium.executablePath()
      args = chromium.args
    } else {
      executablePath = process.env.CHROMIUM_PATH ??
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    }

    browser = await puppeteer.launch({ executablePath, args, headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    await page.evaluateHandle(() => document.fonts.ready)
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '28mm', left: '20mm' },
    })
    return Buffer.from(pdf)
  } finally {
    await browser?.close()
  }
}

function buildHtml(body: string, title: string, docType: string, watermarkText?: string): string {
  const safeMark = (watermarkText ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Sarabun', Arial, sans-serif;
  font-size: 12pt;
  line-height: 1.7;
  color: #1a1a1a;
  padding-bottom: 10mm;
  position: relative;
}
${safeMark ? `body::before {
  content: "${safeMark}";
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-45deg);
  font-size: 80pt;
  font-weight: 900;
  color: rgba(0,0,0,0.04);
  white-space: nowrap;
  z-index: 0;
  pointer-events: none;
}` : ''}
.doc-header {
  border-bottom: 2px solid #059669;
  padding-bottom: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.doc-header-title { font-size: 14pt; font-weight: 700; color: #059669; }
.doc-header-brand { font-size: 9pt; color: #9ca3af; }
.doc-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: white;
  display: flex;
  justify-content: space-between;
  font-size: 8pt;
  color: #9ca3af;
  padding-top: 3px;
}
h1 { font-size: 13pt; font-weight: 700; color: #065f46; margin: 16px 0 8px; page-break-after: avoid; break-after: avoid; }
h2 { font-size: 11pt; font-weight: 700; color: #374151; margin: 12px 0 6px; page-break-after: avoid; break-after: avoid; }
h3 { font-size: 10pt; font-weight: 700; color: #6b7280; margin: 8px 0 4px; page-break-after: avoid; break-after: avoid; }
p { margin-bottom: 6px; orphans: 3; widows: 3; }
${docType === 'checklist' ? `
ul, ol { list-style: none; padding: 0; }
li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid #f3f4f6;
  page-break-inside: avoid;
  break-inside: avoid;
}
li::before {
  content: "☐";
  font-size: 13pt;
  flex-shrink: 0;
  color: #374151;
  line-height: 1.4;
}` : `
li {
  page-break-inside: avoid;
  break-inside: avoid;
}`}
${docType === 'planner' ? `
h2 {
  border-left: 3px solid #7c3aed;
  padding-left: 8px;
  color: #5b21b6;
}
p {
  border-bottom: 1px solid #ede9fe;
  padding: 8px 0;
  min-height: 32px;
}` : ''}
</style>
</head>
<body>
<div class="doc-header">
  <span class="doc-header-title">${title.replace(/</g, '&lt;')}</span>
  <span class="doc-header-brand">www.planprom.com</span>
</div>
${body}
<div class="doc-footer">
  <span>แพลนพร้อม · www.planprom.com</span>
  <span></span>
</div>
</body>
</html>`
}
