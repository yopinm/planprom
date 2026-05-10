// POST /api/admin/templates/generate-engine — DC-5/DC-6 text-to-PDF engine
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'
import { generateChecklistHtml } from '@/lib/engine-checklist'
import { generatePlannerHtml } from '@/lib/engine-planner'
import type { ChecklistEngineData, PlannerEngineData } from '@/lib/engine-types'

export async function POST(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: {
    engine_type: 'checklist' | 'planner'
    engine_data: ChecklistEngineData | PlannerEngineData
    slug: string
    watermark_text?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { engine_type, engine_data, slug, watermark_text } = body
  if (!engine_type || !engine_data || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  let html: string
  try {
    if (engine_type === 'checklist') {
      html = generateChecklistHtml(engine_data as ChecklistEngineData, watermark_text)
    } else if (engine_type === 'planner') {
      html = generatePlannerHtml(engine_data as PlannerEngineData, watermark_text)
    } else {
      return NextResponse.json({ error: 'Unknown engine_type' }, { status: 400 })
    }
  } catch (err) {
    return NextResponse.json({ error: `HTML build failed: ${String(err)}` }, { status: 500 })
  }

  let browser = null
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

    const uploadBase = process.env.UPLOAD_DIR
      ? path.join(process.env.UPLOAD_DIR, 'templates')
      : path.join(process.cwd(), 'uploads', 'templates')
    await mkdir(uploadBase, { recursive: true })

    const safeSlug = slug.replace(/[^a-z0-9-]/g, '') || 'template'
    const filename = `${safeSlug}-${engine_type}-${Date.now()}.pdf`
    await writeFile(path.join(uploadBase, filename), pdf)

    return NextResponse.json({ path: `/uploads/templates/${filename}` })
  } catch (err) {
    return NextResponse.json({ error: `PDF generate failed: ${String(err)}` }, { status: 500 })
  } finally {
    if (browser) await (browser as { close(): Promise<void> }).close()
  }
}
