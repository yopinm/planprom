// POST /api/admin/templates/generate-engine — DC-5/DC-6 text-to-PDF engine
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

  // Auto-generate document code from DB sequence
  const prefix = engine_type === 'checklist' ? 'CK' : 'TP'
  const bkkNow = new Date(Date.now() + 7 * 60 * 60 * 1000)
  const dateStr = bkkNow.toISOString().slice(0, 10).replace(/-/g, '')
  const [{ count }] = await db<{ count: string }[]>`
    SELECT COUNT(*)::text AS count FROM templates WHERE engine_type = ${engine_type}
  `
  const docCode = `${prefix}-${dateStr}-${String(Number(count) + 1).padStart(4, '0')}`

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

  const uploadBase = process.env.UPLOAD_DIR
    ? path.join(process.env.UPLOAD_DIR, 'templates')
    : path.join(process.cwd(), 'uploads', 'templates')
  await mkdir(uploadBase, { recursive: true })

  const safeSlug = slug.replace(/[^a-z0-9-]/g, '') || 'template'
  const ts = Date.now()
  const pdfFilename = `${safeSlug}-${engine_type}-${ts}.pdf`

  // ── Step 1: PDF (uses chromium.args as-is, known to work) ───────────────
  let browser1 = null
  try {
    browser1 = await puppeteer.launch({ executablePath, args, headless: true })
    const page = await browser1.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '28mm', left: '20mm' },
    })
    await writeFile(path.join(uploadBase, pdfFilename), pdf)
  } catch (err) {
    return NextResponse.json({ error: `PDF generate failed: ${String(err)}` }, { status: 500 })
  } finally {
    if (browser1) await (browser1 as { close(): Promise<void> }).close()
  }

  // ── Step 2: Screenshot — system chromium (has full rasterization libs) ────
  // @sparticuz/chromium is Lambda-only; system chromium handles screenshot
  // pixel rendering correctly on AlmaLinux 9.
  let previewPath: string | null = null
  let browser2 = null
  try {
    const sysChromium = process.env.SYSTEM_CHROMIUM_PATH ?? '/usr/bin/chromium-browser'
    browser2 = await puppeteer.launch({
      executablePath: sysChromium,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
      headless: true,
      defaultViewport: { width: 560, height: 1123 },
    })
    const page2 = await browser2.newPage()
    await page2.setContent(html, { waitUntil: 'networkidle0' })
    await page2.evaluate(() => document.fonts.ready)
    if (page2.isClosed()) throw new Error('page closed before screenshot')
    // Clip to bottom of 2nd .sec (S1+S2 only — "ชิม" preview)
    const clipHeight = await page2.evaluate(() => {
      const secs = document.querySelectorAll('.sec')
      if (secs.length >= 2) return Math.ceil(secs[1].getBoundingClientRect().bottom) + 16
      return 560
    })
    const previewFilename = `${safeSlug}-${engine_type}-preview-${ts}.jpg`
    const shot = await page2.screenshot({
      type: 'jpeg', quality: 85,
      clip: { x: 0, y: 0, width: 560, height: clipHeight },
    })
    await writeFile(path.join(uploadBase, previewFilename), shot as Buffer)
    previewPath = `/api/preview/${previewFilename}`
  } catch (screenshotErr) {
    console.error('Preview screenshot failed:', String(screenshotErr))
  } finally {
    if (browser2) await (browser2 as { close(): Promise<void> }).close().catch(() => {})
  }

  return NextResponse.json({
    path:         `/uploads/templates/${pdfFilename}`,
    preview_path: previewPath,
    doc_code:     docCode,
  })
}
