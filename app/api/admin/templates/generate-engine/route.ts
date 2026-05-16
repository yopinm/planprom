// POST /api/admin/templates/generate-engine â€” DC-5/DC-6 text-to-PDF engine
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'
import { generateChecklistHtml } from '@/lib/engine-checklist'
import { generatePlannerHtml } from '@/lib/engine-planner'
import { db } from '@/lib/db'
import type { ChecklistEngineData, PlannerEngineData } from '@/lib/engine-types'

export async function POST(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: {
    engine_type: 'checklist' | 'planner'
    engine_data: ChecklistEngineData | PlannerEngineData
    slug: string
    watermark_text?: string
    category_name?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { engine_type, engine_data, slug, watermark_text, category_name } = body
  if (!engine_type || !engine_data || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Auto-generate document code â€” wrapped so DB crash returns JSON not HTML
  let docCode = ''
  try {
    const prefix = engine_type === 'checklist' ? 'CK' : 'TP'
    const bkkNow = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const dateStr = bkkNow.toISOString().slice(0, 10).replace(/-/g, '')
    const [{ count }] = await db<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM templates WHERE engine_type = ${engine_type}
    `
    docCode = `${prefix}-${dateStr}-${String(Number(count) + 1).padStart(4, '0')}`
  } catch (err) {
    return NextResponse.json({ error: `DocCode generate failed: ${String(err)}` }, { status: 500 })
  }

  let html: string
  try {
    if (engine_type === 'checklist') {
      const d = engine_data as ChecklistEngineData
      const enriched: ChecklistEngineData = { ...d, s1: { ...d.s1, docCode } }
      html = generateChecklistHtml(enriched, watermark_text, category_name)
    } else if (engine_type === 'planner') {
      html = generatePlannerHtml(engine_data as PlannerEngineData, watermark_text)
    } else {
      return NextResponse.json({ error: 'Unknown engine_type' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: `HTML build failed: ${String(err)}` }, { status: 500 })
  }

  // Setup puppeteer + paths â€” wrapped so import/executablePath crash returns JSON not HTML
  let puppeteer: Awaited<typeof import('puppeteer-core')>['default']
  let executablePath: string
  let args: string[]
  let uploadBase: string
  try {
    const mod = await import('puppeteer-core')
    puppeteer = mod.default
    if (process.platform === 'linux') {
      const { default: chromium } = await import('@sparticuz/chromium')
      executablePath = await chromium.executablePath()
      args = chromium.args
    } else {
      executablePath = process.env.CHROMIUM_PATH ??
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    }
    uploadBase = process.env.UPLOAD_DIR
      ? path.join(process.env.UPLOAD_DIR, 'templates')
      : path.join(process.cwd(), 'uploads', 'templates')
    await mkdir(uploadBase, { recursive: true })
  } catch (err) {
    return NextResponse.json({ error: `Engine setup failed: ${String(err)}` }, { status: 500 })
  }

  const safeSlug = slug.replace(/[^a-z0-9-]/g, '') || 'template'
  const ts = Date.now()
  const pdfFilename = `${safeSlug}-${engine_type}-${ts}.pdf`

  // â”€â”€ Step 1: PDF â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let browser1 = null
  try {
    browser1 = await puppeteer.launch({ executablePath, args, headless: true })
    const page = await browser1.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdfOpts: Parameters<typeof page.pdf>[0] = {
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '8mm', left: '20mm' },
    }
    if (engine_type === 'checklist') {
      const d = engine_data as ChecklistEngineData
      const ftTitle = d.s1?.title ?? ''
      const ftCat = category_name ?? ''
      const ftRight = [ftTitle, ftCat].filter(Boolean).join(' · ')
      const ftEsc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      pdfOpts.margin = { top: '20mm', right: '20mm', bottom: '18mm', left: '20mm' }
      pdfOpts.displayHeaderFooter = true
      pdfOpts.headerTemplate = '<span></span>'
      pdfOpts.footerTemplate = `<div style="width:100%;font-size:8pt;color:#9ca3af;display:flex;justify-content:space-between;padding:0 20mm;box-sizing:border-box;font-family:'Noto Sans Thai',sans-serif"><span>แพลนพร้อม · www.planprom.com</span><span>${ftEsc(ftRight)}</span></div>`
    }
    const pdf = await page.pdf(pdfOpts)
    await writeFile(path.join(uploadBase, pdfFilename), pdf)
  } catch (err) {
    return NextResponse.json({ error: `PDF generate failed: ${String(err)}` }, { status: 500 })
  } finally {
    if (browser1) await (browser1 as { close(): Promise<void> }).close().catch(() => {})
  }

  // â”€â”€ Step 2: Multi-page screenshots â€” non-fatal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let previewPath: string | null = null
  const previewPages: string[] = []
  let browser2 = null
  try {
    const sysChromium = process.env.SYSTEM_CHROMIUM_PATH ?? '/usr/bin/chromium-browser'
    browser2 = await puppeteer.launch({
      executablePath: sysChromium,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
      headless: true,
      defaultViewport: { width: 560, height: 792 },
    })
    const page2 = await browser2.newPage()
    await page2.setContent(html, { waitUntil: 'networkidle0' })
    await page2.evaluate(() => document.fonts.ready)
    if (page2.isClosed()) throw new Error('page closed before screenshot')
    const totalH = await page2.evaluate(() => Math.ceil(document.body.scrollHeight))
    const pageH = 792
    const nPages = Math.min(2, Math.ceil(totalH / pageH))
    for (let i = 0; i < nPages; i++) {
      const y = i * pageH
      const h = Math.min(pageH, totalH - y)
      if (h < 20) break
      const fname = `${safeSlug}-${engine_type}-p${i + 1}-${ts}.jpg`
      const shot = await page2.screenshot({ type: 'jpeg', quality: 85, clip: { x: 0, y, width: 560, height: h } })
      await writeFile(path.join(uploadBase, fname), shot as Buffer)
      const imgPath = `/api/preview/${fname}`
      previewPages.push(imgPath)
      if (i === 0) previewPath = imgPath
    }
  } catch (screenshotErr) {
    console.error('Preview screenshot failed:', String(screenshotErr))
  } finally {
    if (browser2) await (browser2 as { close(): Promise<void> }).close().catch(() => {})
  }

  return NextResponse.json({
    path:          `/uploads/templates/${pdfFilename}`,
    preview_path:  previewPath,
    preview_pages: previewPages,
    doc_code:      docCode,
  })
}
