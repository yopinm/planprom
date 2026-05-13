// POST /api/admin/form-builder/save â€” EF-4
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

export async function POST(req: NextRequest) {
  const adminId = await getAdminUser()
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  let body: {
    fields: FormEngineData['fields']
    sampleData: FormEngineData['sampleData']
    title: string
    slug: string
    tier: string
    categoryId?: string
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { fields, sampleData, title, slug, tier, categoryId } = body
  if (!fields?.length || !title?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!safeSlug) return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })

  // Check slug uniqueness
  const [existing] = await db<{ id: string }[]>`SELECT id FROM templates WHERE slug = ${safeSlug} LIMIT 1`
  if (existing) return NextResponse.json({ error: `Slug "${safeSlug}" à¸–à¸¹à¸à¹ƒà¸Šà¹‰à¹à¸¥à¹‰à¸§` }, { status: 409 })

  // Build engine_data
  const engineData: FormEngineData = { schemaVersion: '1.0', title, fields, sampleData }

  // Generate HTML + PDF
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
  const pdfFilename = `${safeSlug}-form-${ts}.pdf`
  const pdfPath     = `/uploads/templates/${pdfFilename}`

  // Step 1: PDF â€” sparticuz chromium
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
    const totalH = await page2.evaluate(() => Math.ceil(document.body.scrollHeight))
    const pageH = 792
    const nPages = Math.min(2, Math.ceil(totalH / pageH))
    for (let i = 0; i < nPages; i++) {
      const y = i * pageH
      const h = Math.min(pageH, totalH - y)
      if (h < 20) break
      const fname = `${safeSlug}-form-p${i + 1}-${ts}.jpg`
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

  // INSERT template
  const safeTier = TIER_PRICE[tier] !== undefined ? tier : 'standard'
  const priceBaht = TIER_PRICE[safeTier]

  let templateId: string
  try {
    const [row] = await db<{ id: string }[]>`
      INSERT INTO templates
        (slug, title, tier, price_baht, pdf_path, preview_path, thumbnail_path,
         preview_pages, engine_type, engine_data, document_type, page_count, status)
      VALUES (
        ${safeSlug}, ${title}, ${safeTier}, ${priceBaht}, ${pdfPath}, ${previewPath}, ${previewPath},
        ${JSON.stringify(previewPages)}::jsonb, 'form', ${JSON.stringify(engineData)}, 'form', 2, 'draft'
      )
      RETURNING id
    `
    templateId = row.id

    if (categoryId) {
      await db`
        INSERT INTO template_category_links (template_id, category_id)
        VALUES (${templateId}, ${categoryId})
        ON CONFLICT DO NOTHING
      `
    }
  } catch (err) {
    return NextResponse.json({ error: `DB save failed: ${String(err)}` }, { status: 500 })
  }

  return NextResponse.json({ success: true, templateId, slug: safeSlug, pdfPath, previewPath })
}
