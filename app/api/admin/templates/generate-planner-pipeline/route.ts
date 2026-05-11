// POST /api/admin/templates/generate-planner-pipeline — DC-16 Pipeline v3
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'
import { generatePlannerPipelineHtml, validatePlannerPipeline } from '@/lib/engine-planner-pipeline'
import { db } from '@/lib/db'
import type { PlannerPipelineData } from '@/lib/engine-types'

export async function POST(req: NextRequest) {
  let adminId: string | null = null
  try {
    adminId = await getAdminUser()
  } catch {
    return NextResponse.json({ error: 'Auth check failed' }, { status: 500 })
  }
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: { engine_data: PlannerPipelineData; slug: string; watermark_text?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { engine_data, slug, watermark_text } = body
  if (!engine_data || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let planCode = ''
  try {
    const bkkNow = new Date(Date.now() + 7 * 60 * 60 * 1000)
    const dateStr = bkkNow.toISOString().slice(0, 10).replace(/-/g, '')
    const [{ count }] = await db<{ count: string }[]>`
      SELECT COUNT(*)::text AS count FROM templates WHERE engine_type = 'pipeline'
    `
    planCode = `TP3-${dateStr}-${String(Number(count) + 1).padStart(4, '0')}`
  } catch (err) {
    return NextResponse.json({ error: `PlanCode generate failed: ${String(err)}` }, { status: 500 })
  }

  let html: string
  try {
    validatePlannerPipeline(engine_data)
    html = generatePlannerPipelineHtml(engine_data, watermark_text)
  } catch (err) {
    return NextResponse.json({ error: `HTML build failed: ${String(err)}` }, { status: 500 })
  }

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

  const safeSlug = slug.replace(/[^a-z0-9-]/g, '') || 'pipeline'
  const ts = Date.now()
  const pdfFilename = `${safeSlug}-pipeline-${ts}.pdf`

  // Step 1: PDF
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
    if (browser1) await (browser1 as { close(): Promise<void> }).close().catch(() => {})
  }

  // Step 2: Screenshot — non-fatal
  let previewPath: string | null = null
  let browser2 = null
  try {
    const sysChromium = process.env.SYSTEM_CHROMIUM_PATH ?? '/usr/bin/chromium-browser'
    browser2 = await puppeteer.launch({
      executablePath: sysChromium,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
      headless: true,
      defaultViewport: { width: 560, height: 1123 },
    })
    const page2 = await browser2.newPage()
    await page2.setContent(html, { waitUntil: 'networkidle0' })
    await page2.evaluate(() => document.fonts.ready)
    if (page2.isClosed()) throw new Error('page closed before screenshot')
    const clipHeight = await page2.evaluate(() => {
      const secs = document.querySelectorAll('.sec')
      if (secs.length >= 2) return Math.ceil(secs[1].getBoundingClientRect().bottom) + 16
      return 560
    })
    const previewFilename = `${safeSlug}-pipeline-preview-${ts}.jpg`
    const shot = await page2.screenshot({
      type: 'jpeg', quality: 85,
      clip: { x: 0, y: 0, width: 560, height: clipHeight },
    })
    await writeFile(path.join(uploadBase, previewFilename), shot as Buffer)
    previewPath = `/api/preview/${previewFilename}`
  } catch (screenshotErr) {
    console.error('Pipeline preview screenshot failed:', String(screenshotErr))
  } finally {
    if (browser2) await (browser2 as { close(): Promise<void> }).close().catch(() => {})
  }

  return NextResponse.json({
    path:         `/uploads/templates/${pdfFilename}`,
    preview_path: previewPath,
    plan_code:    planCode,
  })
}
