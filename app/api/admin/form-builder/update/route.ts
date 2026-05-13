// PATCH /api/admin/form-builder/update — EF-6 edit mode
import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { getAdminUser } from '@/lib/admin-auth'
import { generateFormHtml } from '@/lib/engine-form'
import type { FormEngineData } from '@/lib/engine-form-types'
import { db } from '@/lib/db'

const TIER_PRICE: Record<string, number> = {
  free: 0, standard: 20, premium: 50, ultra: 100,
}

export async function PATCH(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: {
    templateId: string
    fields: FormEngineData['fields']
    sampleData: FormEngineData['sampleData']
    title: string
    tier: string
    categoryId?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { templateId, fields, sampleData, title, tier, categoryId } = body
  if (!templateId || !fields?.length || !title?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Verify template exists and is form type
  const [existing] = await db<{ id: string; slug: string }[]>`
    SELECT id, slug FROM templates WHERE id = ${templateId} AND engine_type = 'form' LIMIT 1
  `
  if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 })

  const engineData: FormEngineData = { schemaVersion: '1.0', title, fields, sampleData }

  let html: string
  try {
    html = generateFormHtml(engineData)
  } catch (err) {
    return NextResponse.json({ error: `HTML build failed: ${String(err)}` }, { status: 500 })
  }

  // Setup puppeteer
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

  const ts = Date.now()
  const pdfFilename = `${existing.slug}-form-${ts}.pdf`
  const pdfPath     = `/uploads/templates/${pdfFilename}`

  // Step 1: PDF — sparticuz chromium
  let browser = null
  try {
    browser = await puppeteer.launch({ executablePath, args, headless: true })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
    })
    await writeFile(path.join(uploadBase, pdfFilename), Buffer.from(pdf))
  } catch (err) {
    return NextResponse.json({ error: `PDF generate failed: ${String(err)}` }, { status: 500 })
  } finally {
    if (browser) await (browser as { close(): Promise<void> }).close().catch(() => {})
  }

  // Step 2: Multi-page screenshots — non-fatal
  let previewPath: string | null = null
  const previewPages: string[] = []
  let browser2 = null
  try {
    const sysChromium = process.env.SYSTEM_CHROMIUM_PATH ?? '/usr/bin/chromium-browser'
    browser2 = await puppeteer.launch({
      executablePath: sysChromium,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'],
      headless: true,
      defaultViewport: { width: 560, height: 3200 },
    })
    const page2 = await browser2.newPage()
    await page2.setContent(html, { waitUntil: 'networkidle0' })
    await page2.evaluate(() => document.fonts.ready)
    const totalH = await page2.evaluate(() => Math.ceil(document.body.scrollHeight))
    const pageH = 792
    const nPages = Math.min(4, Math.ceil(totalH / pageH))
    for (let i = 0; i < nPages; i++) {
      const y = i * pageH
      const h = Math.min(pageH, totalH - y)
      if (h < 20) break
      const fname = `${existing.slug}-form-p${i + 1}-${ts}.jpg`
      const shot = await page2.screenshot({ type: 'jpeg', quality: 85, clip: { x: 0, y, width: 560, height: h } })
      await writeFile(path.join(uploadBase, fname), shot as Buffer)
      const imgPath = `/api/preview/${fname}`
      previewPages.push(imgPath)
      if (i === 0) previewPath = imgPath
    }
  } catch (screenshotErr) {
    console.error('Form preview screenshot failed:', String(screenshotErr))
  } finally {
    if (browser2) await (browser2 as { close(): Promise<void> }).close().catch(() => {})
  }

  const safeTier = TIER_PRICE[tier] !== undefined ? tier : 'standard'
  const priceBaht = TIER_PRICE[safeTier]

  try {
    await db`
      UPDATE templates SET
        title          = ${title},
        tier           = ${safeTier},
        price_baht     = ${priceBaht},
        pdf_path       = ${pdfPath},
        preview_path   = ${previewPath},
        thumbnail_path = COALESCE(${previewPath}, thumbnail_path),
        preview_pages  = ${JSON.stringify(previewPages)},
        engine_data    = ${JSON.stringify(engineData)},
        document_type  = 'form',
        updated_at     = NOW()
      WHERE id = ${templateId}
    `

    // Sync category link
    await db`DELETE FROM template_category_links WHERE template_id = ${templateId}`
    if (categoryId) {
      await db`
        INSERT INTO template_category_links (template_id, category_id)
        VALUES (${templateId}, ${categoryId})
        ON CONFLICT DO NOTHING
      `
    }
  } catch (err) {
    return NextResponse.json({ error: `DB update failed: ${String(err)}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, templateId, slug: existing.slug, pdfPath, previewPath })
}
