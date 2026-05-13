// POST /api/admin/templates/generate-revision â€” DC-8
// Same pipeline as generate-engine/generate-planner but preserves docCode (no re-generation)
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'
import { generateChecklistHtml } from '@/lib/engine-checklist'
import { generatePlannerHtml, generatePlannerHtmlV2, validatePlannerV2 } from '@/lib/engine-planner'
import {
  generatePlannerPipelineHtml, validatePlannerPipeline,
  generatePlannerPipelineHtmlV4, validatePlannerPipelineV4,
} from '@/lib/engine-planner-pipeline'
import { generateReportHtml } from '@/lib/engine-report'
import type { ChecklistEngineData, PlannerEngineData, PlannerEngineDataV2, PlannerPipelineData, PlannerPipelineDataV4 } from '@/lib/engine-types'
import type { ReportEngineData } from '@/lib/engine-report-types'
import { db } from '@/lib/db'

function bkkNow() { return new Date(Date.now() + 7 * 60 * 60 * 1000) }
function formatThaiDate(d: Date): string {
  const m = ['à¸¡.à¸„.','à¸.à¸ž.','à¸¡à¸µ.à¸„.','à¹€à¸¡.à¸¢.','à¸ž.à¸„.','à¸¡à¸´.à¸¢.','à¸.à¸„.','à¸ª.à¸„.','à¸.à¸¢.','à¸•.à¸„.','à¸ž.à¸¢.','à¸˜.à¸„.']
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]} ${d.getUTCFullYear() + 543}`
}
function addMonths(d: Date, n: number): Date { const r = new Date(d); r.setUTCMonth(r.getUTCMonth() + n); return r }

export async function POST(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: {
    engine_type: 'checklist' | 'planner' | 'pipeline' | 'report'
    engine_data: ChecklistEngineData | PlannerEngineData | PlannerEngineDataV2 | PlannerPipelineData | PlannerPipelineDataV4 | ReportEngineData
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

  let html: string
  try {
    if (engine_type === 'checklist') {
      // docCode preserved as-is from engine_data.s1.docCode â€” no re-generation
      html = generateChecklistHtml(engine_data as ChecklistEngineData, watermark_text, category_name)
    } else if (engine_type === 'planner') {
      const isV2 = (engine_data as Record<string, unknown>).meta !== undefined &&
        (engine_data as PlannerEngineDataV2).meta?.schemaVersion === '2.0'
      if (isV2) {
        validatePlannerV2(engine_data as PlannerEngineDataV2)
        html = generatePlannerHtmlV2(engine_data as PlannerEngineDataV2, watermark_text)
      } else {
        html = generatePlannerHtml(engine_data as PlannerEngineData, watermark_text)
      }
    } else if (engine_type === 'pipeline') {
      const isV4 = ((engine_data as unknown as PlannerPipelineDataV4).meta as Record<string, unknown>)?.schemaVersion === '4.0'
      if (isV4) {
        validatePlannerPipelineV4(engine_data as unknown as PlannerPipelineDataV4)
        html = generatePlannerPipelineHtmlV4(engine_data as unknown as PlannerPipelineDataV4, watermark_text)
      } else {
        validatePlannerPipeline(engine_data as PlannerPipelineData)
        html = generatePlannerPipelineHtml(engine_data as PlannerPipelineData, watermark_text)
      }
    } else if (engine_type === 'report') {
      const now = bkkNow()
      const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '')
      const [{ count }] = await db<{ count: string }[]>`
        SELECT COUNT(*)::text AS count FROM templates WHERE engine_type = 'report'
      `
      const reportCode = `RPT-${dateStr}-${String(Number(count) + 1).padStart(4, '0')}`
      const validMonths = (engine_data as ReportEngineData).s1?.validityMonths ?? 12
      html = generateReportHtml(
        engine_data as ReportEngineData, reportCode,
        formatThaiDate(now), formatThaiDate(addMonths(now, validMonths)),
        watermark_text,
      )
    } else {
      return NextResponse.json({ error: 'Unknown engine_type' }, { status: 400 })
    }
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

  const safeSlug = slug.replace(/[^a-z0-9-]/g, '') || 'template'
  const ts = Date.now()
  const pdfFilename = `${safeSlug}-${engine_type}-rev-${ts}.pdf`

  // Step 1: PDF
  let browser1 = null
  try {
    browser1 = await puppeteer.launch({ executablePath, args, headless: true })
    const page = await browser1.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const isReport = engine_type === 'report'
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      ...(isReport ? {
        displayHeaderFooter: true,
        headerTemplate: `<div></div>`,
        footerTemplate: `<div style="font-family:Arial,sans-serif;font-size:8px;padding:0 20mm;width:100%;display:flex;justify-content:flex-end;color:#94a3b8"><span>Page <span class="pageNumber"></span>/<span class="totalPages"></span></span></div>`,
        margin: { top: '16mm', right: '20mm', bottom: '14mm', left: '20mm' },
      } : {
        margin: { top: '20mm', right: '20mm', bottom: '28mm', left: '20mm' },
      }),
    })
    await writeFile(path.join(uploadBase, pdfFilename), pdf)
  } catch (err) {
    return NextResponse.json({ error: `PDF generate failed: ${String(err)}` }, { status: 500 })
  } finally {
    if (browser1) await (browser1 as { close(): Promise<void> }).close().catch(() => {})
  }

  // Step 2: Multi-page screenshots â€” non-fatal
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
    const nPages = Math.min(4, Math.ceil(totalH / pageH))
    for (let i = 0; i < nPages; i++) {
      const y = i * pageH
      const h = Math.min(pageH, totalH - y)
      if (h < 20) break
      const fname = `${safeSlug}-${engine_type}-rev-p${i + 1}-${ts}.jpg`
      const shot = await page2.screenshot({ type: 'jpeg', quality: 85, clip: { x: 0, y, width: 560, height: h } })
      await writeFile(path.join(uploadBase, fname), shot as Buffer)
      const imgPath = `/api/preview/${fname}`
      previewPages.push(imgPath)
      if (i === 0) previewPath = imgPath
    }
  } catch (err) {
    console.error('Revision preview screenshot failed:', String(err))
  } finally {
    if (browser2) await (browser2 as { close(): Promise<void> }).close().catch(() => {})
  }

  return NextResponse.json({
    path:          `/uploads/templates/${pdfFilename}`,
    preview_path:  previewPath,
    preview_pages: previewPages,
  })
}
